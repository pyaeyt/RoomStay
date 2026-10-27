"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/icon";
import { useMockAuth } from "@/lib/mock-auth";
import { lastMockMessageForConversation, mockMessagesChangedEvent, readMockConversationsForUser, unreadMockMessageCount, } from "@/lib/mock-messages";
import { findPublicProperty } from "@/lib/published-listings";
import { mockListingsChangedEvent } from "@/lib/mock-listings";
const rentFormatter = new Intl.NumberFormat("en-US");
function formatTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime()))
        return value;
    return new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(date);
}
export function MessagesList() {
    const router = useRouter();
    const { user, isReady } = useMockAuth();
    const [rows, setRows] = useState(null);
    useEffect(() => {
        if (!isReady)
            return undefined;
        if (!user) {
            router.replace(`/login?returnTo=${encodeURIComponent("/messages")}`);
            return undefined;
        }
        if (user.role === "ADMIN") {
            router.replace("/admin/payment-chats");
            return undefined;
        }
        if (user.isPartner) {
            router.replace("/partner/messages");
            return undefined;
        }
        const currentUser = user;
        function loadConversations() {
            setRows(readMockConversationsForUser(currentUser.id).map((conversation) => {
                const lastMessage = lastMockMessageForConversation(conversation.id);
                return {
                    conversation,
                    property: findPublicProperty(conversation.propertyId),
                    preview: lastMessage ? lastMessage.text : "No messages yet. Say hello to the owner.",
                    time: lastMessage ? lastMessage.createdAt : null,
                    unread: unreadMockMessageCount(conversation.id),
                };
            }));
        }
        const timeout = window.setTimeout(loadConversations, 0);
        window.addEventListener(mockMessagesChangedEvent, loadConversations);
        window.addEventListener(mockListingsChangedEvent, loadConversations);
        return () => {
            window.clearTimeout(timeout);
            window.removeEventListener(mockMessagesChangedEvent, loadConversations);
            window.removeEventListener(mockListingsChangedEvent, loadConversations);
        };
    }, [isReady, router, user]);
    if (!isReady || rows === null) {
        return (<div className="rounded-xl border border-line bg-white p-5 text-sm text-ink-secondary">
        Loading messages...
      </div>);
    }
    if (!user) {
        return (<div className="rounded-xl border border-line bg-white p-5 text-sm text-ink-secondary">
        Redirecting to login...
      </div>);
    }
    if (rows.length === 0) {
        return (<section className="rounded-xl border border-line bg-white px-5 py-14 text-center motion-safe:animate-fade-up">
        <Icon name="messages" size={32} className="mx-auto text-primary"/>
        <h1 className="mt-4 text-2xl font-semibold tracking-[-0.025em]">No messages yet</h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-secondary">
          When you message an owner about a room, your conversations will appear here.
        </p>
        <Link href="/search" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-white btn-primary">
          Browse Rooms
        </Link>
      </section>);
    }
    return (<section>
      <div className="mb-5">
        <p className="text-sm font-semibold text-primary">RoomStay inbox</p>
        <h1 className="mt-1 text-3xl font-bold tracking-[-0.035em] text-[#171044]">Messages</h1>
        <p className="mt-2 text-sm text-ink-secondary">Your conversations with property owners.</p>
      </div>
      <ul className="grid gap-3">
        {rows.map(({ conversation, property, preview, time, unread }) => {
            const ownerName = property?.owner.name ?? "Property owner";
            const propertyTitle = property?.title ?? "RoomStay property";
            return (<li key={conversation.id}>
              <Link href={`/messages/${encodeURIComponent(conversation.id)}`} className={`grid gap-3 rounded-2xl border p-3.5 shadow-sm transition-all duration-200 hover:-translate-y-px hover:border-[#c8bbf5] hover:shadow-md hover:shadow-[#20104a14] sm:grid-cols-[88px_minmax(0,1fr)_auto] sm:items-center ${unread > 0 ? "border-primary/35 bg-[#f7f3ff] shadow-primary/10" : "border-[#e6e1f2] bg-white shadow-[#20104a08]"}`}>
                <span aria-hidden="true" className="relative block aspect-[16/11] overflow-hidden rounded-xl bg-primary-tint sm:size-[88px]">
                  {property ? (<Image src={property.image} alt="" fill sizes="88px" className="object-cover"/>) : (<span className="flex h-full w-full items-center justify-center text-sm font-semibold text-primary ring-1 ring-inset ring-primary/15">
                      {ownerName.charAt(0).toUpperCase()}
                    </span>)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="truncate text-base font-bold text-[#171044]">{ownerName}</span>
                    {unread > 0 && (<span className="inline-flex shrink-0 rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-white" aria-label={`${unread} unread message${unread === 1 ? "" : "s"}`}>
                        {unread}
                      </span>)}
                  </span>
                  <span className="mt-0.5 block truncate text-sm font-semibold text-primary">{propertyTitle}</span>
                  <span className={`mt-1 block truncate text-sm leading-5 ${unread > 0 ? "font-semibold text-ink" : "text-ink-secondary"}`}>{preview}</span>
                </span>
                <span className="flex shrink-0 flex-row items-center justify-between gap-2 sm:flex-col sm:items-end">
                  {time && <span className="text-xs font-semibold text-ink-secondary">{formatTime(time)}</span>}
                  {property && (<span className="rounded-full bg-[#efeaff] px-2.5 py-1 text-xs font-semibold text-primary">฿{rentFormatter.format(property.price)} / mo</span>)}
                </span>
              </Link>
            </li>);
        })}
      </ul>
    </section>);
}
