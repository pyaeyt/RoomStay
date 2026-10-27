import { api } from "@/lib/api";
import { liveEnabled, readLive, writeLive } from "@/lib/live-store";
import { findMockListingById } from "@/lib/mock-listings";
export const mockConversationsKey = "roomstay.mockConversations";
export const mockMessagesKey = "roomstay.mockMessages";
export const mockMessagesChangedEvent = "roomstay:messages-changed";
// Deterministic mock partner identifier for a property. Only the id is
// stored; display names come from the shared property data at render time.
export function partnerIdForProperty(propertyId) {
    return `mock-partner-${propertyId}`;
}
function createId(prefix) {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        return `${prefix}-${crypto.randomUUID()}`;
    }
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
}
function normalizeConversation(value) {
    if (!value || typeof value !== "object")
        return null;
    const conversation = value;
    if (typeof conversation.id !== "string"
        || typeof conversation.propertyId !== "string"
        || typeof conversation.renterUserId !== "string"
        || typeof conversation.partnerUserId !== "string"
        || typeof conversation.createdAt !== "string"
        || typeof conversation.updatedAt !== "string") {
        return null;
    }
    return {
        id: conversation.id,
        propertyId: conversation.propertyId,
        renterUserId: conversation.renterUserId,
        renterName: typeof conversation.renterName === "string" ? conversation.renterName : undefined,
        partnerUserId: conversation.partnerUserId,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
    };
}
function normalizeMessage(value) {
    if (!value || typeof value !== "object")
        return null;
    const message = value;
    if (typeof message.id !== "string"
        || typeof message.conversationId !== "string"
        || typeof message.senderId !== "string"
        || typeof message.text !== "string"
        || typeof message.createdAt !== "string") {
        return null;
    }
    return {
        id: message.id,
        conversationId: message.conversationId,
        senderId: message.senderId,
        senderType: message.senderType === "PARTNER" ? "PARTNER" : "RENTER",
        text: message.text,
        createdAt: message.createdAt,
        read: message.read === true,
    };
}
export function readMockConversations() {
    if (liveEnabled())
        return readLive("conversations");
    if (typeof window === "undefined")
        return [];
    try {
        const stored = window.localStorage.getItem(mockConversationsKey);
        const parsed = stored ? JSON.parse(stored) : [];
        return Array.isArray(parsed)
            ? parsed.map(normalizeConversation).filter((conversation) => Boolean(conversation))
            : [];
    }
    catch {
        return [];
    }
}
export function readMockMessages() {
    if (liveEnabled())
        return readLive("messages");
    if (typeof window === "undefined")
        return [];
    try {
        const stored = window.localStorage.getItem(mockMessagesKey);
        const parsed = stored ? JSON.parse(stored) : [];
        return Array.isArray(parsed)
            ? parsed.map(normalizeMessage).filter((message) => Boolean(message))
            : [];
    }
    catch {
        return [];
    }
}
function writeMockConversations(conversations) {
    window.localStorage.setItem(mockConversationsKey, JSON.stringify(conversations));
    window.dispatchEvent(new Event(mockMessagesChangedEvent));
}
function writeMockMessages(messages) {
    window.localStorage.setItem(mockMessagesKey, JSON.stringify(messages));
    window.dispatchEvent(new Event(mockMessagesChangedEvent));
}
export function readMockConversationsForUser(renterUserId) {
    return readMockConversations()
        .filter((conversation) => conversation.renterUserId === renterUserId)
        .sort((first, second) => new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime());
}
export function findMockConversation(conversationId) {
    return readMockConversations().find((conversation) => conversation.id === conversationId) ?? null;
}
export function readMockMessagesForConversation(conversationId) {
    return readMockMessages()
        .filter((message) => message.conversationId === conversationId)
        .sort((first, second) => new Date(first.createdAt).getTime() - new Date(second.createdAt).getTime());
}
// One renter + one property reuses the same conversation instead of
// creating duplicates. The optional renterName is display metadata for the
// Partner inbox; it never affects renter scoping or message behavior.
export function getOrCreateMockConversation(renterUserId, propertyId, renterName) {
    const conversations = readMockConversations();
    const existing = conversations.find((conversation) => conversation.renterUserId === renterUserId && conversation.propertyId === propertyId);
    if (existing) {
        if (renterName && existing.renterName !== renterName) {
            const backfilled = { ...existing, renterName };
            writeMockConversations(conversations.map((item) => item.id === existing.id ? backfilled : item));
            return backfilled;
        }
        return existing;
    }
    const now = new Date().toISOString();
    const conversation = {
        id: createId("mock-conversation"),
        propertyId,
        renterUserId,
        renterName: renterName || undefined,
        // Prefer the real listing owner when the ownership mapping exists;
        // otherwise keep the deterministic placeholder for static properties.
        partnerUserId: findMockListingById(propertyId)?.partnerUserId ?? partnerIdForProperty(propertyId),
        createdAt: now,
        updatedAt: now,
    };
    writeMockConversations([...conversations, conversation]);
    return conversation;
}
export function sendMockMessage(conversationId, senderId, text) {
    const trimmed = text.trim();
    if (!trimmed)
        return null;
    const conversations = readMockConversations();
    const conversation = conversations.find((item) => item.id === conversationId);
    if (!conversation)
        return null;
    const now = new Date().toISOString();
    const message = {
        id: createId("mock-message"),
        conversationId,
        senderId,
        senderType: "RENTER",
        text: trimmed,
        createdAt: now,
        // Unread for the Partner until the Partner opens the conversation.
        // Renter flows only consume the read flag on PARTNER messages, so this
        // does not change any renter-visible behavior.
        read: false,
    };
    writeMockMessages([...readMockMessages(), message]);
    writeMockConversations(conversations.map((item) => item.id === conversationId ? { ...item, updatedAt: now } : item));
    return message;
}
export function lastMockMessageForConversation(conversationId) {
    const messages = readMockMessagesForConversation(conversationId);
    return messages.length > 0 ? messages[messages.length - 1] : null;
}
export function unreadMockMessageCount(conversationId) {
    return readMockMessagesForConversation(conversationId).filter((message) => message.senderType === "PARTNER" && !message.read).length;
}
export function markMockConversationReadForRenter(conversationId, renterUserId) {
    if (liveEnabled()) {
        writeLive("messages", readMockMessages().map((message) => message.conversationId === conversationId && message.senderType === "PARTNER" ? { ...message, read: true } : message));
        void api(`/api/conversations/${conversationId}/read`, { method: "POST" }).catch(() => undefined);
        window.dispatchEvent(new Event(mockMessagesChangedEvent));
        return;
    }
    const conversation = findMockConversation(conversationId);
    if (!conversation || conversation.renterUserId !== renterUserId)
        return;
    const messages = readMockMessages();
    const hasUnread = messages.some((message) => message.conversationId === conversationId && message.senderType === "PARTNER" && !message.read);
    if (!hasUnread)
        return;
    writeMockMessages(messages.map((message) => message.conversationId === conversationId && message.senderType === "PARTNER"
        ? { ...message, read: true }
        : message));
}
// A conversation belongs to a Partner either by direct partnerUserId match
// or via the mock-listings ownership mapping for its property.
export function partnerOwnsConversation(conversation, partnerUserId) {
    if (conversation.partnerUserId === partnerUserId)
        return true;
    return findMockListingById(conversation.propertyId)?.partnerUserId === partnerUserId;
}
export function readMockConversationsForPartner(partnerUserId) {
    return readMockConversations()
        .filter((conversation) => partnerOwnsConversation(conversation, partnerUserId))
        .sort((first, second) => new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime());
}
export function findMockConversationForPartner(conversationId, partnerUserId) {
    const conversation = findMockConversation(conversationId);
    if (!conversation || !partnerOwnsConversation(conversation, partnerUserId))
        return null;
    return conversation;
}
// Partner replies reuse the same conversations, messages, keys, and change
// event as renter messages. Partner-sent messages start unread so the
// renter's existing unread indicator picks them up.
export function sendMockMessageAsPartner(conversationId, senderId, text) {
    const trimmed = text.trim();
    if (!trimmed)
        return null;
    const conversations = readMockConversations();
    const conversation = conversations.find((item) => item.id === conversationId);
    if (!conversation || !partnerOwnsConversation(conversation, senderId))
        return null;
    const now = new Date().toISOString();
    const message = {
        id: createId("mock-message"),
        conversationId,
        senderId,
        senderType: "PARTNER",
        text: trimmed,
        createdAt: now,
        read: false,
    };
    writeMockMessages([...readMockMessages(), message]);
    writeMockConversations(conversations.map((item) => item.id === conversationId ? { ...item, updatedAt: now } : item));
    return message;
}
export function unreadMockMessageCountForPartner(conversationId) {
    return readMockMessagesForConversation(conversationId).filter((message) => message.senderType === "RENTER" && !message.read).length;
}
export function markMockConversationReadForPartner(conversationId, partnerUserId) {
    if (liveEnabled()) {
        writeLive("messages", readMockMessages().map((message) => message.conversationId === conversationId && message.senderType === "RENTER" ? { ...message, read: true } : message));
        void api(`/api/conversations/${conversationId}/read`, { method: "POST" }).catch(() => undefined);
        window.dispatchEvent(new Event(mockMessagesChangedEvent));
        return;
    }
    const conversation = findMockConversation(conversationId);
    if (!conversation || !partnerOwnsConversation(conversation, partnerUserId))
        return;
    const messages = readMockMessages();
    const hasUnread = messages.some((message) => message.conversationId === conversationId && message.senderType === "RENTER" && !message.read);
    if (!hasUnread)
        return;
    writeMockMessages(messages.map((message) => message.conversationId === conversationId && message.senderType === "RENTER"
        ? { ...message, read: true }
        : message));
}
