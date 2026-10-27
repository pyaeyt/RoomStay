export class ApiError extends Error {
    status;
    constructor(status, message) {
        super(message);
        this.name = "ApiError";
        this.status = status;
    }
}
export const tokenStorageKey = "roomstay.token";
export function apiBase() {
    return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
}
export function authToken() {
    if (typeof window === "undefined")
        return null;
    return window.localStorage.getItem(tokenStorageKey);
}
export function storeAuthToken(token) {
    if (typeof window === "undefined")
        return;
    if (token)
        window.localStorage.setItem(tokenStorageKey, token);
    else
        window.localStorage.removeItem(tokenStorageKey);
}
export async function api(path, init = {}) {
    const headers = new Headers(init.headers);
    const token = authToken();
    if (token)
        headers.set("authorization", `Bearer ${token}`);
    if (init.body && !(init.body instanceof FormData) && !headers.has("content-type")) {
        headers.set("content-type", "application/json");
    }
    const response = await fetch(`${apiBase()}${path}`, { ...init, headers });
    const text = await response.text();
    const data = text ? JSON.parse(text) : {};
    if (!response.ok)
        throw new ApiError(response.status, data.error ?? "Request failed.");
    return data;
}
