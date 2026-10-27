import { HttpError } from "../http.js";
import { requireApprovedPartner } from "./shared.js";

const openStatuses = new Set(["DEPOSIT_PENDING", "VERIFICATION_PENDING", "CONFIRMED", "ACTIVE"]);

const include = {
  booking: {
    include: {
      property: { include: { partner: true } },
      evidence: { orderBy: { uploadedAt: "desc" }, take: 1 },
    },
  },
  renter: true,
  messages: { orderBy: { createdAt: "asc" }, include: { sender: true } },
};

function assertOpen(booking) {
  if (!openStatuses.has(booking.status)) {
    throw new HttpError(409, "Payment chat is available while a deposit is being checked or the rental is active.");
  }
}

async function loadInquiry(db, id) {
  return db.paymentInquiry.findUnique({ where: { id }, include });
}

async function loadPartnerBooking(db, user, bookingId) {
  await requireApprovedPartner(db, user.id);
  const booking = await db.booking.findUnique({ where: { id: bookingId }, include: { property: true } });
  if (!booking || booking.property.partnerUserId !== user.id) throw new HttpError(404, "Booking not found.");
  assertOpen(booking);
  return booking;
}

async function notifyAdmins(db, inquiry, user, propertyTitle) {
  const admins = await db.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
  if (admins.length === 0) return;
  await db.notification.createMany({
    data: admins.map((admin) => ({
      userId: admin.id,
      type: "NEW_MESSAGE",
      title: "Payment verification message",
      message: `${user.fullName} asked about the payment for ${propertyTitle}.`,
      link: `/admin/payment-chats/${inquiry.id}`,
    })),
  });
}

export async function getRenterPaymentChat(db, user, bookingId) {
  const booking = await db.booking.findUnique({ where: { id: bookingId } });
  if (!booking || booking.renterUserId !== user.id) throw new HttpError(404, "Booking not found.");
  assertOpen(booking);
  const inquiry = await db.paymentInquiry.findUnique({ where: { bookingId }, include });
  return inquiry;
}

export async function sendRenterPaymentMessage(db, user, bookingId, text) {
  const booking = await db.booking.findUnique({ where: { id: bookingId }, include: { property: true } });
  if (!booking || booking.renterUserId !== user.id) throw new HttpError(404, "Booking not found.");
  assertOpen(booking);
  const message = text?.trim() ?? "";
  if (!message) throw new HttpError(400, "Message text is required.");
  const inquiry = await db.paymentInquiry.upsert({
    where: { bookingId },
    update: { updatedAt: new Date() },
    create: { bookingId, renterUserId: user.id },
  });
  await db.paymentMessage.create({
    data: { inquiryId: inquiry.id, senderId: user.id, senderRole: "RENTER", text: message },
  });
  await notifyAdmins(db, inquiry, user, booking.property.title);
  return loadInquiry(db, inquiry.id);
}

export async function listPartnerPaymentChats(db, user) {
  await requireApprovedPartner(db, user.id);
  return db.paymentInquiry.findMany({
    where: { booking: { property: { partnerUserId: user.id } } },
    include,
    orderBy: { updatedAt: "desc" },
  });
}

export async function getPartnerPaymentChat(db, user, bookingId) {
  await loadPartnerBooking(db, user, bookingId);
  return db.paymentInquiry.findUnique({ where: { bookingId }, include });
}

export async function sendPartnerPaymentMessage(db, user, bookingId, text) {
  const booking = await loadPartnerBooking(db, user, bookingId);
  const message = text?.trim() ?? "";
  if (!message) throw new HttpError(400, "Message text is required.");
  const inquiry = await db.paymentInquiry.upsert({
    where: { bookingId },
    update: { updatedAt: new Date() },
    create: { bookingId, renterUserId: booking.renterUserId },
  });
  await db.paymentMessage.create({
    data: { inquiryId: inquiry.id, senderId: user.id, senderRole: "PARTNER", text: message },
  });
  await notifyAdmins(db, inquiry, user, booking.property.title);
  return loadInquiry(db, inquiry.id);
}

export async function listAdminPaymentChats(db) {
  return db.paymentInquiry.findMany({ include, orderBy: { updatedAt: "desc" } });
}

export async function getAdminPaymentChat(db, id) {
  const inquiry = await loadInquiry(db, id);
  if (!inquiry) throw new HttpError(404, "Payment chat not found.");
  await db.paymentMessage.updateMany({
    where: { inquiryId: id, senderRole: { in: ["RENTER", "PARTNER"] }, read: false },
    data: { read: true },
  });
  return loadInquiry(db, id);
}

export async function sendAdminPaymentMessage(db, admin, id, text) {
  const inquiry = await loadInquiry(db, id);
  if (!inquiry) throw new HttpError(404, "Payment chat not found.");
  assertOpen(inquiry.booking);
  const message = text?.trim() ?? "";
  if (!message) throw new HttpError(400, "Message text is required.");
  await db.paymentMessage.create({
    data: { inquiryId: id, senderId: admin.id, senderRole: "ADMIN", text: message },
  });
  await db.paymentInquiry.update({ where: { id }, data: { updatedAt: new Date() } });
  const title = inquiry.booking.property.title;
  const notices = [
    {
      userId: inquiry.booking.property.partnerUserId,
      type: "NEW_MESSAGE",
      title: "Payment verification reply",
      message: `RoomStay Admin replied about the payment for ${title}.`,
      link: `/partner/bookings/${inquiry.bookingId}/payment-chat`,
    },
  ];
  const renterSpoke = inquiry.messages.some((message) => message.senderRole === "RENTER");
  if (renterSpoke && inquiry.renterUserId && inquiry.renterUserId !== inquiry.booking.property.partnerUserId) {
    notices.push({
      userId: inquiry.renterUserId,
      type: "NEW_MESSAGE",
      title: "Payment verification reply",
      message: `RoomStay Admin replied about the payment for ${title}.`,
      link: `/bookings/${inquiry.bookingId}/payment-chat`,
    });
  }
  await db.notification.createMany({ data: notices });
  return loadInquiry(db, id);
}
