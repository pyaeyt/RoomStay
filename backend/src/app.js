import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import fs from "node:fs";
import multer from "multer";
import { clearAuthCookie, requireAdmin, requireUser, setAuthCookie, signToken } from "./auth.js";
import { prisma } from "./db.js";
import { sendError } from "./http.js";
import { asyncRoute } from "./http.js";
import {
  changePartnerAccess,
  loginUser,
  registerUser,
  reviewPartnerApplication,
  submitPartnerApplication,
  updateProfile,
} from "./services/accounts.js";
import {
  approveBooking,
  cancelBooking,
  completeRental,
  declineBooking,
  getBookingForPartner,
  getBookingForRenter,
  leaveReview,
  listBookingsForPartner,
  listBookingsForRenter,
  recordRefund,
  rejectEvidence,
  requestBooking,
  startRental,
  uploadEvidence,
  verifyEvidence,
} from "./services/bookings.js";
import { searchProperties, toggleFavorite } from "./services/catalog.js";
import {
  createListing,
  reviewListing,
  setListingAvailability,
  submitListing,
  suspendListing,
  updateListing,
} from "./services/listings.js";
import { getConversation, listConversations, markRead, sendMessage, startConversation } from "./services/messages.js";
import {
  getAdminPaymentChat,
  getPartnerPaymentChat,
  getRenterPaymentChat,
  listAdminPaymentChats,
  listPartnerPaymentChats,
  sendAdminPaymentMessage,
  sendPartnerPaymentMessage,
  sendRenterPaymentMessage,
} from "./services/payment-chat.js";
import { getUser, listUsers, moderateReview, reviewReport, submitReport } from "./services/moderation.js";
import { getViewingForUser, listViewingsForPartner, listViewingsForUser, requestViewing, reviewViewing } from "./services/viewings.js";
import { assertVisibleProperty, currentCapability } from "./services/shared.js";
import {
  applicationJson,
  auditJson,
  bookingJson,
  conversationJson,
  listingJson,
  messageJson,
  notificationJson,
  paymentInquiryJson,
  publicProperty,
  publicUser,
  reportJson,
  reviewJson,
  viewingJson,
} from "./serialize.js";

fs.mkdirSync("uploads", { recursive: true });
const upload = multer({
  storage: multer.diskStorage({
    destination: "uploads/",
    filename: (_req, file, cb) => {
      const ext = file.mimetype === "image/png" ? ".png" : file.mimetype === "image/jpeg" ? ".jpg" : "";
      cb(null, `${Date.now().toString(36)}-${Math.random().toString(16).slice(2)}${ext}`);
    },
  }),
  limits: { fileSize: 8 * 1024 * 1024 },
});

function maybeUpload(uploader) {
  return (req, res, next) => {
    const type = req.get("content-type") || "";
    if (type.includes("multipart/form-data")) return uploader(req, res, next);
    next();
  };
}

function tokenResponse(res, result) {
  const token = signToken(result.user);
  setAuthCookie(res, token);
  return { token, user: publicUser(result.user, result.capability) };
}

function evidenceInput(req) {
  return {
    fileName: req.file?.originalname || req.body.fileName,
    fileType: req.file?.mimetype || req.body.fileType,
    storedPath: req.file?.path,
    note: req.body.note,
  };
}

function listingBody(req) {
  const files = req.files ?? [];
  if (files.length > 0) {
    return {
      ...req.body,
      photos: files.map((file) => ({ name: file.originalname, type: file.mimetype, src: `/${file.path}` })),
    };
  }
  return req.body;
}

export function createApp() {
  const app = express();
  app.use(cors({ origin: true, credentials: true }));
  app.use(cookieParser());
  app.use(express.json({ limit: "1mb" }));
  app.use("/uploads", express.static("uploads"));

  app.get("/api/health", asyncRoute(async (_req, res) => {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, service: "roomstay-api" });
  }));

  app.post("/api/auth/register", asyncRoute(async (req, res) => {
    res.status(201).json(tokenResponse(res, await registerUser(prisma, req.body)));
  }));

  app.post("/api/auth/login", asyncRoute(async (req, res) => {
    res.json(tokenResponse(res, await loginUser(prisma, req.body)));
  }));

  app.post("/api/auth/logout", (_req, res) => {
    clearAuthCookie(res);
    res.json({ ok: true });
  });

  app.get("/api/me", requireUser, asyncRoute(async (req, res) => {
    const capability = await currentCapability(prisma, req.user.id);
    res.json({ user: publicUser(req.user, capability), partnerApplication: applicationJson(capability) });
  }));

  app.patch("/api/me", requireUser, asyncRoute(async (req, res) => {
    const result = await updateProfile(prisma, req.user.id, req.body);
    res.json({ user: publicUser(result.user, result.capability) });
  }));

  app.post("/api/partner-applications", requireUser, maybeUpload(upload.fields([
    { name: "idDocument", maxCount: 1 },
    { name: "ownershipDocument", maxCount: 1 },
  ])), asyncRoute(async (req, res) => {
    const idFile = req.files?.idDocument?.[0];
    const ownershipFile = req.files?.ownershipDocument?.[0];
    const application = await submitPartnerApplication(prisma, req.user, {
      ...req.body,
      idDocumentName: idFile?.originalname || req.body.idDocumentName,
      idDocumentType: idFile?.mimetype || req.body.idDocumentType,
      ownershipDocumentName: ownershipFile?.originalname || req.body.ownershipDocumentName,
      ownershipDocumentType: ownershipFile?.mimetype || req.body.ownershipDocumentType,
    });
    res.status(201).json({ application: applicationJson(application) });
  }));

  app.get("/api/partner-applications/me", requireUser, asyncRoute(async (req, res) => {
    const applications = await prisma.partnerApplication.findMany({
      where: { userId: req.user.id },
      orderBy: { submittedAt: "desc" },
    });
    res.json({ applications: applications.map(applicationJson) });
  }));

  app.get("/api/properties", asyncRoute(async (req, res) => {
    const properties = await searchProperties(prisma, req.query);
    res.json({ properties: properties.map((property) => publicProperty(property, { reviews: property.reviews })) });
  }));

  app.get("/api/properties/:id", asyncRoute(async (req, res) => {
    const property = await assertVisibleProperty(prisma, req.params.id);
    const reviews = await prisma.review.findMany({
      where: { status: { not: "HIDDEN" }, booking: { propertyId: property.id } },
      orderBy: { createdAt: "desc" },
    });
    res.json({ property: publicProperty(property, { reviews }) });
  }));

  app.get("/api/favorites", requireUser, asyncRoute(async (req, res) => {
    const favorites = await prisma.favorite.findMany({
      where: { userId: req.user.id },
      include: { property: { include: { photos: { orderBy: { sortOrder: "asc" } }, partner: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json({ favorites: favorites.map((favorite) => ({ id: favorite.id, property: publicProperty(favorite.property) })) });
  }));

  app.post("/api/favorites/:propertyId", requireUser, asyncRoute(async (req, res) => {
    res.json(await toggleFavorite(prisma, req.user.id, req.params.propertyId));
  }));

  app.post("/api/conversations", requireUser, asyncRoute(async (req, res) => {
    const conversation = await startConversation(prisma, req.user, req.body);
    res.status(201).json({
      conversation: conversationJson(conversation, req.user.id),
      messages: conversation.messages.map(messageJson),
    });
  }));

  app.get("/api/conversations", requireUser, asyncRoute(async (req, res) => {
    const conversations = await listConversations(prisma, req.user.id);
    res.json({ conversations: conversations.map((conversation) => conversationJson(conversation, req.user.id)) });
  }));

  app.get("/api/conversations/:id", requireUser, asyncRoute(async (req, res) => {
    const conversation = await getConversation(prisma, req.user.id, req.params.id);
    res.json({
      conversation: conversationJson(conversation, req.user.id),
      messages: conversation.messages.map(messageJson),
    });
  }));

  app.post("/api/conversations/:id/messages", requireUser, asyncRoute(async (req, res) => {
    const conversation = await getConversation(prisma, req.user.id, req.params.id);
    const senderType = conversation.partnerUserId === req.user.id ? "PARTNER" : "RENTER";
    const message = await sendMessage(prisma, req.user, req.params.id, req.body.text, senderType);
    res.status(201).json({ message: messageJson(message) });
  }));

  app.post("/api/conversations/:id/read", requireUser, asyncRoute(async (req, res) => {
    const conversation = await markRead(prisma, req.user.id, req.params.id);
    res.json({ conversation: conversationJson(conversation, req.user.id) });
  }));

  app.post("/api/viewings", requireUser, asyncRoute(async (req, res) => {
    const viewing = await requestViewing(prisma, req.user, req.body);
    res.status(201).json({ viewing: viewingJson(viewing) });
  }));

  app.get("/api/viewings", requireUser, asyncRoute(async (req, res) => {
    const viewings = await listViewingsForUser(prisma, req.user.id);
    res.json({ viewings: viewings.map(viewingJson) });
  }));

  app.get("/api/viewings/:id", requireUser, asyncRoute(async (req, res) => {
    res.json({ viewing: viewingJson(await getViewingForUser(prisma, req.user.id, req.params.id)) });
  }));

  app.post("/api/bookings", requireUser, asyncRoute(async (req, res) => {
    const booking = await requestBooking(prisma, req.user, req.body);
    res.status(201).json({ booking: bookingJson(booking) });
  }));

  app.get("/api/bookings", requireUser, asyncRoute(async (req, res) => {
    const bookings = await listBookingsForRenter(prisma, req.user.id);
    res.json({ bookings: bookings.map(bookingJson) });
  }));

  app.get("/api/bookings/:id", requireUser, asyncRoute(async (req, res) => {
    res.json({ booking: bookingJson(await getBookingForRenter(prisma, req.user.id, req.params.id)) });
  }));

  app.post("/api/bookings/:id/evidence", requireUser, maybeUpload(upload.single("file")), asyncRoute(async (req, res) => {
    if (req.file && !["image/jpeg", "image/png"].includes(req.file.mimetype)) {
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({ error: "Upload a JPG or PNG image." });
    }
    const booking = await uploadEvidence(prisma, req.user, req.params.id, evidenceInput(req));
    res.json({ booking: bookingJson(booking) });
  }));

  app.post("/api/bookings/:id/cancel", requireUser, asyncRoute(async (req, res) => {
    res.json({ booking: bookingJson(await cancelBooking(prisma, req.user, req.params.id)) });
  }));

  app.post("/api/bookings/:id/review", requireUser, asyncRoute(async (req, res) => {
    res.status(201).json({ booking: bookingJson(await leaveReview(prisma, req.user, req.params.id, req.body)) });
  }));

  app.post("/api/reports", requireUser, asyncRoute(async (req, res) => {
    res.status(201).json({ report: reportJson(await submitReport(prisma, req.user, req.body)) });
  }));

  app.get("/api/notifications", requireUser, asyncRoute(async (req, res) => {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
    });
    res.json({
      notifications: notifications.map(notificationJson),
      unread: notifications.filter((notification) => !notification.read).length,
    });
  }));

  app.post("/api/notifications/:id/read", requireUser, asyncRoute(async (req, res) => {
    const existing = await prisma.notification.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.user.id) return res.status(404).json({ error: "Notification not found." });
    const notification = await prisma.notification.update({ where: { id: existing.id }, data: { read: true } });
    res.json({ notification: notificationJson(notification) });
  }));

  app.get("/api/partner/listings", requireUser, asyncRoute(async (req, res) => {
    const listings = await prisma.property.findMany({
      where: { partnerUserId: req.user.id },
      include: { photos: { orderBy: { sortOrder: "asc" } } },
      orderBy: { createdAt: "desc" },
    });
    res.json({ listings: listings.map(listingJson) });
  }));

  app.post("/api/partner/listings", requireUser, maybeUpload(upload.array("photos", 8)), asyncRoute(async (req, res) => {
    const listing = await createListing(prisma, req.user, listingBody(req));
    res.status(201).json({ listing: listingJson(listing) });
  }));

  app.patch("/api/partner/listings/:id", requireUser, maybeUpload(upload.array("photos", 8)), asyncRoute(async (req, res) => {
    res.json({ listing: listingJson(await updateListing(prisma, req.user, req.params.id, listingBody(req))) });
  }));

  app.post("/api/partner/listings/:id/submit", requireUser, asyncRoute(async (req, res) => {
    res.json({ listing: listingJson(await submitListing(prisma, req.user, req.params.id)) });
  }));

  app.patch("/api/partner/listings/:id/availability", requireUser, asyncRoute(async (req, res) => {
    res.json({ listing: listingJson(await setListingAvailability(prisma, req.user, req.params.id, req.body.roomStatus)) });
  }));

  app.get("/api/partner/viewings", requireUser, asyncRoute(async (req, res) => {
    const viewings = await listViewingsForPartner(prisma, req.user.id);
    res.json({ viewings: viewings.map(viewingJson) });
  }));

  app.post("/api/partner/viewings/:id/decision", requireUser, asyncRoute(async (req, res) => {
    res.json({ viewing: viewingJson(await reviewViewing(prisma, req.user, req.params.id, req.body)) });
  }));

  app.get("/api/partner/bookings", requireUser, asyncRoute(async (req, res) => {
    const bookings = await listBookingsForPartner(prisma, req.user.id);
    res.json({ bookings: bookings.map(bookingJson) });
  }));

  app.get("/api/partner/bookings/:id", requireUser, asyncRoute(async (req, res) => {
    res.json({ booking: bookingJson(await getBookingForPartner(prisma, req.user.id, req.params.id)) });
  }));

  app.post("/api/partner/bookings/:id/approve", requireUser, asyncRoute(async (req, res) => {
    res.json({ booking: bookingJson(await approveBooking(prisma, req.user, req.params.id, req.body)) });
  }));

  app.post("/api/partner/bookings/:id/decline", requireUser, asyncRoute(async (req, res) => {
    res.json({ booking: bookingJson(await declineBooking(prisma, req.user, req.params.id, req.body)) });
  }));

  app.post("/api/partner/bookings/:id/verify-evidence", requireUser, asyncRoute(async (req, res) => {
    res.json({ booking: bookingJson(await verifyEvidence(prisma, req.user, req.params.id)) });
  }));

  app.post("/api/partner/bookings/:id/reject-evidence", requireUser, asyncRoute(async (req, res) => {
    res.json({ booking: bookingJson(await rejectEvidence(prisma, req.user, req.params.id, req.body)) });
  }));

  app.post("/api/partner/bookings/:id/start", requireUser, asyncRoute(async (req, res) => {
    res.json({ booking: bookingJson(await startRental(prisma, req.user, req.params.id)) });
  }));

  app.post("/api/partner/bookings/:id/complete", requireUser, asyncRoute(async (req, res) => {
    res.json({ booking: bookingJson(await completeRental(prisma, req.user, req.params.id)) });
  }));

  app.post("/api/partner/bookings/:id/cancel", requireUser, asyncRoute(async (req, res) => {
    res.json({ booking: bookingJson(await cancelBooking(prisma, req.user, req.params.id)) });
  }));

  app.post("/api/partner/bookings/:id/refund", requireUser, asyncRoute(async (req, res) => {
    res.json({ booking: bookingJson(await recordRefund(prisma, req.user, req.params.id, req.body)) });
  }));

  app.get("/api/admin/partner-applications", requireAdmin, asyncRoute(async (_req, res) => {
    const applications = await prisma.partnerApplication.findMany({ orderBy: { submittedAt: "desc" } });
    res.json({ applications: applications.map(applicationJson) });
  }));

  app.get("/api/admin/partner-applications/:id", requireAdmin, asyncRoute(async (req, res) => {
    const application = await prisma.partnerApplication.findUnique({ where: { id: req.params.id } });
    if (!application) return res.status(404).json({ error: "Application not found." });
    res.json({ application: applicationJson(application) });
  }));

  app.post("/api/admin/partner-applications/:id/review", requireAdmin, asyncRoute(async (req, res) => {
    const application = await reviewPartnerApplication(prisma, req.user, req.params.id, req.body);
    res.json({ application: applicationJson(application) });
  }));

  app.post("/api/admin/partners/:userId/suspend", requireAdmin, asyncRoute(async (req, res) => {
    const application = await changePartnerAccess(prisma, req.user, req.params.userId, { status: "SUSPENDED", reason: req.body.reason });
    res.json({ application: applicationJson(application) });
  }));

  app.post("/api/admin/partners/:userId/restore", requireAdmin, asyncRoute(async (req, res) => {
    const application = await changePartnerAccess(prisma, req.user, req.params.userId, { status: "APPROVED" });
    res.json({ application: applicationJson(application) });
  }));

  app.get("/api/admin/listings", requireAdmin, asyncRoute(async (_req, res) => {
    const listings = await prisma.property.findMany({ include: { photos: { orderBy: { sortOrder: "asc" } } }, orderBy: { updatedAt: "desc" } });
    res.json({ listings: listings.map(listingJson) });
  }));

  app.post("/api/admin/listings/:id/review", requireAdmin, asyncRoute(async (req, res) => {
    res.json({ listing: listingJson(await reviewListing(prisma, req.user, req.params.id, req.body)) });
  }));

  app.post("/api/admin/listings/:id/suspend", requireAdmin, asyncRoute(async (req, res) => {
    res.json({ listing: listingJson(await suspendListing(prisma, req.user, req.params.id)) });
  }));

  app.get("/api/admin/users", requireAdmin, asyncRoute(async (_req, res) => {
    res.json({ users: await listUsers(prisma) });
  }));

  app.get("/api/admin/users/:id", requireAdmin, asyncRoute(async (req, res) => {
    const user = await getUser(prisma, req.params.id);
    if (!user) return res.status(404).json({ error: "User not found." });
    res.json({ user });
  }));

  app.get("/api/admin/reviews", requireAdmin, asyncRoute(async (_req, res) => {
    const reviews = await prisma.review.findMany({ orderBy: { createdAt: "desc" } });
    res.json({ reviews: reviews.map(reviewJson) });
  }));

  app.post("/api/admin/reviews/:id/moderate", requireAdmin, asyncRoute(async (req, res) => {
    res.json({ review: reviewJson(await moderateReview(prisma, req.user, req.params.id, req.body.status)) });
  }));

  app.get("/api/admin/reports", requireAdmin, asyncRoute(async (_req, res) => {
    const reports = await prisma.report.findMany({ include: { reporter: true }, orderBy: { createdAt: "desc" } });
    res.json({ reports: reports.map(reportJson) });
  }));

  app.post("/api/admin/reports/:id/review", requireAdmin, asyncRoute(async (req, res) => {
    res.json({ report: reportJson(await reviewReport(prisma, req.user, req.params.id, req.body)) });
  }));

  app.get("/api/partner/payment-chats", requireUser, asyncRoute(async (req, res) => {
    const inquiries = await listPartnerPaymentChats(prisma, req.user);
    res.json({ inquiries: inquiries.map(paymentInquiryJson) });
  }));

  app.get("/api/partner/bookings/:id/payment-chat", requireUser, asyncRoute(async (req, res) => {
    const inquiry = await getPartnerPaymentChat(prisma, req.user, req.params.id);
    res.json({ inquiry: paymentInquiryJson(inquiry) });
  }));

  app.post("/api/partner/bookings/:id/payment-chat", requireUser, asyncRoute(async (req, res) => {
    const inquiry = await sendPartnerPaymentMessage(prisma, req.user, req.params.id, req.body.text);
    res.status(201).json({ inquiry: paymentInquiryJson(inquiry) });
  }));

  app.get("/api/bookings/:id/payment-chat", requireUser, asyncRoute(async (req, res) => {
    const inquiry = await getRenterPaymentChat(prisma, req.user, req.params.id);
    res.json({ inquiry: paymentInquiryJson(inquiry) });
  }));

  app.post("/api/bookings/:id/payment-chat", requireUser, asyncRoute(async (req, res) => {
    const inquiry = await sendRenterPaymentMessage(prisma, req.user, req.params.id, req.body.text);
    res.status(201).json({ inquiry: paymentInquiryJson(inquiry) });
  }));

  app.get("/api/admin/payment-chats", requireAdmin, asyncRoute(async (_req, res) => {
    const inquiries = await listAdminPaymentChats(prisma);
    res.json({ inquiries: inquiries.map(paymentInquiryJson) });
  }));

  app.get("/api/admin/payment-chats/:id", requireAdmin, asyncRoute(async (req, res) => {
    res.json({ inquiry: paymentInquiryJson(await getAdminPaymentChat(prisma, req.params.id)) });
  }));

  app.post("/api/admin/payment-chats/:id/messages", requireAdmin, asyncRoute(async (req, res) => {
    res.status(201).json({ inquiry: paymentInquiryJson(await sendAdminPaymentMessage(prisma, req.user, req.params.id, req.body.text)) });
  }));

  app.get("/api/admin/audit-logs", requireAdmin, asyncRoute(async (_req, res) => {
    const logs = await prisma.auditLog.findMany({ orderBy: { timestamp: "desc" } });
    res.json({ auditLogs: logs.map(auditJson) });
  }));

  app.use((error, _req, res, _next) => {
    sendError(error, res);
  });

  return app;
}
