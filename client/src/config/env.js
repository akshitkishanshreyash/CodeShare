const noTrailingSlash = (url) => (url ? url.replace(/\/+$/, '') : url);

export const API_URL = noTrailingSlash(import.meta.env.VITE_API_URL ?? '');
export const SOCKET_URL = noTrailingSlash(import.meta.env.VITE_SOCKET_URL) || API_URL || undefined;
