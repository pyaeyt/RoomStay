"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/icon";
import { useMockAuth } from "@/lib/mock-auth";
import { lastMockMessageForConversation, mockMessagesChangedEvent, readMockConversationsForPartner, unreadMockMessageCountForPartner, } from "@/lib/mock-messages";
import { findPublicProperty } from "@/lib/published-listings";
import { mockListingsChangedEvent } from "@/lib/mock-listings";
const rentFormatter = new Intl.NumberFormat("en-US");
function formatTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime()))
        return value;
    return new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(date);
}
export function PartnerMessagesList() {
    const router = useRouter();
    const { user, isReady } = useMockAuth();
    const [rows, setRows] = useState(null);
    useEffect(() => {
        if (!isReady)
            return undefined;
        if (!user) {
            router.replace(`/login?returnTo=${encodeURIComponent("/partner/messages")}`);
            return undefined;
        }
        if (!user.isPartner)
            return undefined;
        const currentUser = user;
        function loadConversations() {
            setRows(readMockConversationsForPartner(currentUser.id).map((conversation) => {
                const lastMessage = lastMockMessageForConversation(conversation.id);
                return {
                    conversation,
                    property: findPublicProperty(conversation.propertyId),
                    preview: lastMessage ? lastMessage.text : "No messages yet.",
                    time: lastMessage ? lastMessage.createdAt : null,
                    unread: unreadMockMessageCountForPartner(conversation.id),
                };
            }));
        }
        const timeout = window.setTimeout(loadConversations, 0);
        window.addEventListener(mockMessagesChangedEvent, loadConversations);
        window.addEventListener(mockListingsChangedEvent, loadConversations);
        window.addEventListener("storage", loadConversations);
        return () => {
            window.clearTimeout(timeout);
            window.removeEventListener(mockMessagesChangedEvent, loadConversations);
            window.removeEventListener(mockListingsChangedEvent, loadConversations);
            window.removeEventListener("storage", loadConversations);
        };
    }, [isReady, router, user]);
    if (!isReady) {
        return (<div className="rounded-2xl border border-line bg-white p-5 text-sm text-ink-secondary">
        Loading messages...
      </div>);
    }
    if (!user) {
        return (<div className="rounded-2xl border border-line bg-white p-5 text-sm text-ink-secondary">
        Redirecting to login...
      </div>);
    }
    if (!user.isPartner) {
        return (<section className="rounded-2xl border border-line bg-white px-5 py-14 text-center shadow-sm shadow-ink/5">
        <p className="text-sm font-semibold text-primary">Partner access required</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-[-0.025em]">Messages are for approved Partners</h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-secondary">Apply and wait for approval before using the Partner Portal.</p>
        <Link href="/become-a-partner" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-white btn-primary">Become a Partner</Link>
      </section>);
    }
    if (rows === null) {
        return (<div className="rounded-2xl border border-line bg-white p-5 text-sm text-ink-secondary">
        Loading messages...
      </div>);
    }
    if (rows.length === 0) {
        return (<section>
        <div className="rounded-2xl border border-line bg-white p-5 shadow-sm shadow-ink/5 md:p-7">
          <p className="text-sm font-semibold text-primary">Partner Portal</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-[-0.04em]">Messages</h1>
          <p className="mt-2 text-sm leading-6 text-ink-secondary">Reply to renters asking about your properties.</p>
        </div>
        <div className="mt-4 rounded-2xl border border-line bg-white px-5 py-14 text-center shadow-sm shadow-ink/5">
          <Icon name="messages" size={32} className="mx-auto text-primary"/>
          <h2 className="mt-4 text-2xl font-semibold tracking-[-0.025em]">No messages yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-secondary">
            When renters message you about your rooms, the conversations will appear here.
          </p>
          <Link href="/partner/listings" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-white btn-primary">
            View My Listings
          </Link>
        </div>
      </section>);
    }
    return (<section>
      <div className="rounded-2xl border border-line bg-white p-5 shadow-sm shadow-ink/5 md:p-7">
        <p className="text-sm font-semibold text-primary">Partner Portal</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-[-0.04em]">Messages</h1>
        <p className="mt-2 text-sm leading-6 text-ink-secondary">Reply to renters asking about your properties.</p>
      </div>
      <ul className="mt-4 grid gap-3">
        {rows.map(({ conversation, property, preview, time, unread }) => {
            const renterName = conversation.renterName ?? "Renter";
            const propertyTitle = property?.title ?? "RoomStay property";
            return (<li key={conversation.id}>
              <Link href={`/partner/messages/${encodeURIComponent(conversation.id)}`} className="flex items-center gap-4 rounded-2xl border border-line bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-px hover:border-primary/50 hover:shadow-md hover:shadow-ink/5">
                <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-tint text-sm font-semibold text-primary ring-1 ring-inset ring-primary/15">
                  {renterName.charAt(0).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-ink">{renterName}</span>
                    {unread > 0 && (<span className="inline-flex size-2.5 shrink-0 rounded-full bg-primary" aria-label={`${unread} unread message${unread === 1 ? "" : "s"}`}/>)}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-ink-secondary">{propertyTitle}</span>
                  <span className="mt-1 block truncate text-[13px] leading-5 text-ink-secondary">{preview}</span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1">
                  {time && <span className="text-xs font-medium text-ink-secondary">{formatTime(time)}</span>}
                  {property && (<span className="text-xs font-medium text-ink">฿{rentFormatter.format(property.price)} / mo</span>)}
                </span>
              </Link>
            </li>);
        })}
      </ul>
    </section>);
}
