"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icon";
import { useMockAuth } from "@/lib/mock-auth";
import { liveSendMessage } from "@/lib/live-actions";
import { liveEnabled } from "@/lib/live-store";
import { findMockConversation, markMockConversationReadForRenter, mockMessagesChangedEvent, readMockMessagesForConversation, sendMockMessage, } from "@/lib/mock-messages";
import { usePublicProperties } from "@/lib/published-listings";
const rentFormatter = new Intl.NumberFormat("en-US");
function formatTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime()))
        return value;
    return new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(date);
}
export function ConversationView({ conversationId }) {
    const router = useRouter();
    const { user, isReady } = useMockAuth();
    const { properties: publicProperties } = usePublicProperties();
    const [conversation, setConversation] = useState(undefined);
    const [messages, setMessages] = useState([]);
    const [draft, setDraft] = useState("");
    const historyRef = useRef(null);
    useEffect(() => {
        if (!isReady)
            return undefined;
        if (!user) {
            router.replace(`/login?returnTo=${encodeURIComponent(`/messages/${conversationId}`)}`);
            return undefined;
        }
        if (user.isPartner) {
            router.replace(`/partner/messages/${conversationId}`);
            return undefined;
        }
        if (user.role === "ADMIN") {
            router.replace("/admin/payment-chats");
            return undefined;
        }
        const currentUser = user;
        function loadConversation() {
            const found = findMockConversation(conversationId);
            if (!found || found.renterUserId !== currentUser.id) {
                setConversation(null);
                return;
            }
            setConversation(found);
            setMessages(readMockMessagesForConversation(conversationId));
            markMockConversationReadForRenter(conversationId, currentUser.id);
        }
        const timeout = window.setTimeout(loadConversation, 0);
        window.addEventListener(mockMessagesChangedEvent, loadConversation);
        return () => {
            window.clearTimeout(timeout);
            window.removeEventListener(mockMessagesChangedEvent, loadConversation);
        };
    }, [conversationId, isReady, router, user]);
    useEffect(() => {
        historyRef.current?.scrollTo({ top: historyRef.current.scrollHeight });
    }, [messages.length]);
    if (!isReady || conversation === undefined) {
        return (<div className="rounded-xl border border-line bg-white p-5 text-sm text-ink-secondary">
        Loading conversation...
      </div>);
    }
    if (!user) {
        return (<div className="rounded-xl border border-line bg-white p-5 text-sm text-ink-secondary">
        Redirecting to login...
      </div>);
    }
    if (conversation === null) {
        return (<section className="rounded-xl border border-line bg-white px-5 py-14 text-center">
        <Icon name="messages" size={32} className="mx-auto text-primary"/>
        <h1 className="mt-4 text-2xl font-semibold tracking-[-0.025em]">Conversation not found</h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-secondary">
          This conversation does not exist or belongs to a different account.
        </p>
        <Link href="/messages" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-white">
          Back to Messages
        </Link>
      </section>);
    }
    const property = publicProperties.find((item) => item.id === conversation.propertyId);
    const ownerName = property?.owner.name ?? "Property owner";
    const propertyTitle = property?.title ?? "RoomStay property";
    async function submit(event) {
        event.preventDefault();
        if (!draft.trim() || !user)
            return;
        if (liveEnabled()) {
            await liveSendMessage(conversationId, draft.trim());
            setMessages(readMockMessagesForConversation(conversationId));
            setDraft("");
            return;
        }
        const sent = sendMockMessage(conversationId, user.id, draft);
        if (sent) {
            setMessages(readMockMessagesForConversation(conversationId));
            setDraft("");
        }
    }
    return (<section>
      <Link href="/messages" className="inline-flex min-h-11 items-center gap-1.5 rounded-lg text-sm font-medium text-primary">
        <span aria-hidden="true">‹</span> Back to messages
      </Link>

      <div className="mt-3 rounded-xl border border-line bg-white shadow-sm">
        <div className="flex items-center gap-3 rounded-t-xl border-b border-line bg-primary-tint/30 p-4">
          <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-tint text-sm font-semibold text-primary ring-1 ring-inset ring-primary/15">
            {ownerName.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-semibold tracking-[-0.025em]">{ownerName}</h1>
            <p className="truncate text-xs text-ink-secondary">{propertyTitle}</p>
          </div>
          {property && (<Link href={`/properties/${property.id}`} className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg border border-line bg-white px-3 text-sm font-semibold text-ink btn-secondary">
              View Room
            </Link>)}
        </div>

        {property && (<p className="border-b border-line bg-primary-tint/40 px-4 py-2.5 text-xs text-ink-secondary">
            {propertyTitle} · {property.location} · <span className="font-medium text-ink">฿{rentFormatter.format(property.price)} / month</span>
          </p>)}

        <div ref={historyRef} aria-live="polite" aria-label="Message history" className="max-h-[50vh] min-h-48 overflow-y-auto p-4">
          {messages.length === 0 ? (<p className="rounded-lg bg-canvas px-3 py-2 text-center text-sm text-ink-secondary">
              No messages yet. Say hello to {ownerName} about {propertyTitle}.
            </p>) : (<ul className="grid gap-2.5">
              {messages.map((message) => {
                const isRenter = message.senderType === "RENTER";
                return (<li key={message.id} className={`flex ${isRenter ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] px-3.5 py-2.5 shadow-sm ${isRenter ? "rounded-2xl rounded-br-md bg-primary text-white" : "rounded-2xl rounded-bl-md bg-canvas text-ink"}`}>
                      <p className="text-sm leading-6 break-words">{message.text}</p>
                      <p className={`mt-1 text-[11px] ${isRenter ? "text-white/80" : "text-ink-secondary"}`}>
                        {isRenter ? "You" : ownerName} · {formatTime(message.createdAt)}
                      </p>
                    </div>
                  </li>);
            })}
            </ul>)}
        </div>

        <form onSubmit={submit} className="flex gap-2 border-t border-line p-4">
          <label htmlFor="message-input" className="sr-only">Type a message</label>
          <input id="message-input" type="text" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={`Message ${ownerName}...`} autoComplete="off" className="h-11 min-w-0 flex-1 rounded-lg border border-line bg-white px-3 text-sm text-ink outline-none placeholder:text-ink-secondary focus:border-primary focus:ring-2 focus:ring-primary/15"/>
          <button type="submit" disabled={!draft.trim()} className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-white btn-primary disabled:cursor-not-allowed disabled:bg-canvas disabled:text-ink-secondary">
            Send
          </button>
        </form>
      </div>
    </section>);
}
