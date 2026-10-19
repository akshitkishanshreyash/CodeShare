// Keep in sync with client/src/lib/languages.js
export const LANGUAGES = [
  'plaintext', 'javascript', 'typescript', 'python', 'java', 'cpp', 'csharp', 'go',
  'rust', 'php', 'ruby', 'html', 'css', 'json', 'sql', 'markdown', 'yaml', 'shell',
];
export const isValidLanguage = (l) => LANGUAGES.includes(l);
