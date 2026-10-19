// Keep in sync with server/src/utils/languages.js
export const LANGUAGES = [{ id: 'plaintext', label: 'Plain text' }];
export const languageLabel = (id) => LANGUAGES.find((l) => l.id === id)?.label ?? 'Plain text';
