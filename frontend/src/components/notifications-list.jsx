"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/icon";
import { useMockAuth } from "@/lib/mock-auth";
import { markAllMockNotificationsRead, markMockNotificationRead, mockNotificationsChangedEvent, readMockNotificationsForUser, } from "@/lib/mock-notifications";
function notificationTone(type) {
    if (type === "BOOKING_APPROVED")
        return { icon: "room", iconClass: "bg-[#efeaff] text-primary ring-primary/20", label: "Booking" };
    if (type === "BOOKING_DECLINED")
        return { icon: "close", iconClass: "bg-red-50 text-alert ring-red-100", label: "Booking" };
    if (type === "PAYMENT_VERIFIED")
        return { icon: "star", iconClass: "bg-[#e7f6ee] text-[#1d7a3f] ring-[#c9e9d4]", label: "Payment" };
    if (type === "PAYMENT_REJECTED")
        return { icon: "close", iconClass: "bg-[#fff0db] text-[#8a5a00] ring-[#f0d49a]", label: "Payment" };
    if (type === "VIEWING_UPDATE")
        return { icon: "room", iconClass: "bg-[#e8edff] text-[#3b4fd8] ring-[#d3dbff]", label: "Viewing" };
    if (type === "NEW_MESSAGE")
        return { icon: "messages", iconClass: "bg-[#efeaff] text-primary ring-primary/20", label: "Message" };
    return { icon: "bell", iconClass: "bg-canvas text-ink-secondary ring-line", label: "Update" };
}
function formatDateTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime()))
        return value;
    return new Intl.DateTimeFormat("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    }).format(date);
}
export function NotificationsList() {
    const router = useRouter();
    const { user, isReady } = useMockAuth();
    const [notifications, setNotifications] = useState(null);
    useEffect(() => {
        if (!isReady)
            return undefined;
        if (!user) {
            router.replace(`/login?returnTo=${encodeURIComponent("/notifications")}`);
            return undefined;
        }
        const currentUser = user;
        function loadNotifications() {
            setNotifications(readMockNotificationsForUser(currentUser.id));
        }
        const timeout = window.setTimeout(loadNotifications, 0);
        window.addEventListener(mockNotificationsChangedEvent, loadNotifications);
        return () => {
            window.clearTimeout(timeout);
            window.removeEventListener(mockNotificationsChangedEvent, loadNotifications);
        };
    }, [isReady, router, user]);
    if (!isReady || notifications === null) {
        return (<div className="rounded-xl border border-line bg-white p-5 text-sm text-ink-secondary">
        Loading notifications...
      </div>);
    }
    if (!user) {
        return (<div className="rounded-xl border border-line bg-white p-5 text-sm text-ink-secondary">
        Redirecting to login...
      </div>);
    }
    const unreadCount = notifications.filter((notification) => !notification.read).length;
    if (notifications.length === 0) {
        return (<section className="rounded-xl border border-line bg-white px-5 py-14 text-center motion-safe:animate-fade-up">
        <Icon name="bell" size={32} className="mx-auto text-primary"/>
        <h1 className="mt-4 text-2xl font-semibold tracking-[-0.025em]">No notifications yet</h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-secondary">
          Updates about your bookings, viewings, and payments will appear here.
        </p>
        <Link href="/search" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-white btn-primary">
          Browse Rooms
        </Link>
      </section>);
    }
    return (<section>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-primary">RoomStay updates</p>
          <h1 className="mt-1 text-3xl font-bold tracking-[-0.035em] text-[#171044]">Notifications</h1>
          <p className="mt-2 text-sm text-ink-secondary">
            {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}.` : "You are all caught up."}
          </p>
        </div>
        {unreadCount > 0 && (<button type="button" onClick={() => markAllMockNotificationsRead(user.id)} className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[#dcd5f5] bg-white px-4 text-sm font-semibold text-primary shadow-sm shadow-[#20104a08] hover:bg-[#f7f3ff]">
            Mark all as read
          </button>)}
      </div>

      <ul className="grid gap-3">
        {notifications.map((notification) => {
            const tone = notificationTone(notification.type);
            return (<li key={notification.id} className={`rounded-2xl border p-4 shadow-sm transition-colors duration-200 ${notification.read ? "border-[#e6e1f2] bg-white shadow-[#20104a08]" : "border-primary/35 bg-[#f7f3ff] shadow-primary/10"}`}>
            <div className="flex items-start gap-3">
              <span aria-hidden="true" className={`mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ${tone.iconClass}`}>
                <Icon name={tone.icon} size={18}/>
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-primary ring-1 ring-inset ring-[#e6e1f2]">{tone.label}</span>
                    <h2 className="text-sm font-bold text-[#171044]">{notification.title}</h2>
                  </div>
                  {!notification.read && (<span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-white">Unread</span>)}
                </div>
                <p className="mt-1 text-sm leading-6 text-ink-secondary">{notification.message}</p>
                <p className="mt-1.5 text-xs font-medium text-ink-secondary">{formatDateTime(notification.createdAt)}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {notification.relatedBookingId && (<Link href={`/bookings/${encodeURIComponent(notification.relatedBookingId)}`} className="inline-flex min-h-9 items-center justify-center rounded-lg border border-[#dcd5f5] bg-white px-3 text-xs font-semibold text-primary hover:bg-[#f7f3ff]">
                      View Booking
                    </Link>)}
                  {notification.relatedViewingId && (<Link href={`/viewings/${encodeURIComponent(notification.relatedViewingId)}`} className="inline-flex min-h-9 items-center justify-center rounded-lg border border-[#dcd5f5] bg-white px-3 text-xs font-semibold text-primary hover:bg-[#f7f3ff]">
                      View Viewing
                    </Link>)}
                  {!notification.read && (<button type="button" onClick={() => markMockNotificationRead(notification.id, user.id)} className="inline-flex min-h-9 items-center justify-center rounded-lg border border-[#dcd5f5] bg-white px-3 text-xs font-semibold text-ink-secondary hover:bg-[#f7f3ff] hover:text-primary">
                      Mark as read
                    </button>)}
                </div>
              </div>
            </div>
          </li>);
        })}
      </ul>
    </section>);
}
