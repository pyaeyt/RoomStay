"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icon";
import { liveSendMessage } from "@/lib/live-actions";
import { liveEnabled } from "@/lib/live-store";
import { useMockAuth } from "@/lib/mock-auth";
import { findMockConversationForPartner, markMockConversationReadForPartner, mockMessagesChangedEvent, readMockMessagesForConversation, sendMockMessageAsPartner, } from "@/lib/mock-messages";
import { findPublicProperty } from "@/lib/published-listings";
import { mockListingsChangedEvent } from "@/lib/mock-listings";
const rentFormatter = new Intl.NumberFormat("en-US");
function formatTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime()))
        return value;
    return new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(date);
}
export function PartnerConversationView({ conversationId }) {
    const router = useRouter();
    const { user, isReady } = useMockAuth();
    const [conversation, setConversation] = useState(undefined);
    const [messages, setMessages] = useState([]);
    const [property, setProperty] = useState(undefined);
    const [draft, setDraft] = useState("");
    const [sendError, setSendError] = useState("");
    const historyRef = useRef(null);
    useEffect(() => {
        if (!isReady)
            return undefined;
        if (!user) {
            router.replace(`/login?returnTo=${encodeURIComponent(`/partner/messages/${conversationId}`)}`);
            return undefined;
        }
        if (!user.isPartner)
            return undefined;
        const currentUser = user;
        function loadConversation() {
            const found = findMockConversationForPartner(conversationId, currentUser.id);
            if (!found) {
                setConversation(null);
                return;
            }
            setConversation(found);
            setProperty(findPublicProperty(found.propertyId));
            setMessages(readMockMessagesForConversation(conversationId));
            markMockConversationReadForPartner(conversationId, currentUser.id);
        }
        const timeout = window.setTimeout(loadConversation, 0);
        window.addEventListener(mockMessagesChangedEvent, loadConversation);
        window.addEventListener(mockListingsChangedEvent, loadConversation);
        window.addEventListener("storage", loadConversation);
        return () => {
            window.clearTimeout(timeout);
            window.removeEventListener(mockMessagesChangedEvent, loadConversation);
            window.removeEventListener(mockListingsChangedEvent, loadConversation);
            window.removeEventListener("storage", loadConversation);
        };
    }, [conversationId, isReady, router, user]);
    useEffect(() => {
        historyRef.current?.scrollTo({ top: historyRef.current.scrollHeight });
    }, [messages.length]);
    if (!isReady) {
        return (<div className="rounded-2xl border border-line bg-white p-5 text-sm text-ink-secondary">
        Loading conversation...
      </div>);
    }
    if (!user) {
        return (<div className="rounded-2xl border border-line bg-white p-5 text-sm text-ink-secondary">
        Redirecting to login...
      </div>);
    }
    if (!user.isPartner || conversation === null) {
        return (<section className="rounded-2xl border border-line bg-white px-5 py-14 text-center shadow-sm shadow-ink/5">
        <Icon name="messages" size={32} className="mx-auto text-primary"/>
        <h1 className="mt-4 text-2xl font-semibold tracking-[-0.025em]">Conversation not found</h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-secondary">
          This conversation does not exist or is not associated with your properties.
        </p>
        <Link href="/partner/messages" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-white btn-primary">
          Back to Messages
        </Link>
      </section>);
    }
    if (conversation === undefined) {
        return (<div className="rounded-2xl border border-line bg-white p-5 text-sm text-ink-secondary">
        Loading conversation...
      </div>);
    }
    const renterName = conversation.renterName ?? "Renter";
    const propertyTitle = property?.title ?? "RoomStay property";
    async function submit(event) {
        event.preventDefault();
        if (!draft.trim() || !user)
            return;
        if (liveEnabled()) {
            try {
                await liveSendMessage(conversationId, draft.trim());
                setMessages(readMockMessagesForConversation(conversationId));
                setDraft("");
                setSendError("");
            }
            catch (error) {
                setSendError(error instanceof Error ? error.message : "The reply could not be sent.");
            }
            return;
        }
        const sent = sendMockMessageAsPartner(conversationId, user.id, draft);
        if (sent) {
            setMessages(readMockMessagesForConversation(conversationId));
            setDraft("");
        }
    }
    return (<section>
      <Link href="/partner/messages" className="inline-flex min-h-11 items-center gap-1.5 rounded-lg text-sm font-medium text-primary">
        <span aria-hidden="true">‹</span> Back to messages
      </Link>

      <div className="mt-3 rounded-2xl border border-line bg-white shadow-sm shadow-ink/5">
        <div className="flex items-center gap-3 rounded-t-2xl border-b border-line bg-primary-tint/30 p-4">
          <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-tint text-sm font-semibold text-primary ring-1 ring-inset ring-primary/15">
            {renterName.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-semibold tracking-[-0.025em]">{renterName}</h1>
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
              No messages yet. Reply to {renterName} about {propertyTitle} below.
            </p>) : (<ul className="grid gap-2.5">
              {messages.map((message) => {
                const isPartner = message.senderType === "PARTNER";
                return (<li key={message.id} className={`flex ${isPartner ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] px-3.5 py-2.5 shadow-sm ${isPartner ? "rounded-2xl rounded-br-md bg-primary text-white" : "rounded-2xl rounded-bl-md bg-canvas text-ink"}`}>
                      <p className="text-sm leading-6 break-words">{message.text}</p>
                      <p className={`mt-1 text-[11px] ${isPartner ? "text-white/80" : "text-ink-secondary"}`}>
                        {isPartner ? "You" : renterName} · {formatTime(message.createdAt)}
                      </p>
                    </div>
                  </li>);
            })}
            </ul>)}
        </div>

        {sendError && <p className="border-t border-line px-4 pt-3 text-sm text-alert">{sendError}</p>}
        <form onSubmit={submit} className="flex gap-2 border-t border-line p-4">
          <label htmlFor="partner-message-input" className="sr-only">Type a message</label>
          <input id="partner-message-input" type="text" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={`Message ${renterName}...`} autoComplete="off" className="h-11 min-w-0 flex-1 rounded-lg border border-line bg-white px-3 text-sm text-ink outline-none placeholder:text-ink-secondary focus:border-primary focus:ring-2 focus:ring-primary/15"/>
          <button type="submit" disabled={!draft.trim()} className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-white btn-primary disabled:cursor-not-allowed disabled:bg-canvas disabled:text-ink-secondary">
            Send
          </button>
        </form>
      </div>
    </section>);
}
