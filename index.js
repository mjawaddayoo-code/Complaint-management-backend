const API_URL = (
    import.meta.env.VITE_API_URL || 'http://localhost:3000'
).replace(/\/+$/, '');

/**
 * Thin wrapper around fetch: always sends the session cookie, always sends
 * JSON, and always returns parsed JSON. Throws an ApiError with the
 * response's `errors` (field-level) or `error` (general) payload attached
 * so callers can render validation messages without extra plumbing.
 */
async function request(path, { method = 'GET', body } = {}) {
    const cleanPath = `/${path}`.replace(/\/+/g, '/');

    const res = await fetch(`${API_URL}${cleanPath}`, {
        method,
        credentials: 'include',
        headers: body
            ? { 'Content-Type': 'application/json' }
            : undefined,
        body: body ? JSON.stringify(body) : undefined
    });

    let data = null;

    try {
        data = await res.json();
    } catch {
        // No JSON body — data stays null.
    }

    if (!res.ok) {
        const err = new Error(
            (data && (data.error || 'Request failed')) ||
            `Request failed (${res.status})`
        );

        err.status = res.status;
        err.errors = data && data.errors ? data.errors : null;

        throw err;
    }

    return data;
}

export const api = {
    get: (path) => request(path),
    post: (path, body) => request(path, {
        method: 'POST',
        body
    })
};

