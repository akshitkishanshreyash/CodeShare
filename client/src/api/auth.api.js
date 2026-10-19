import { http } from './http.js';

export const authApi = {
  me: () => http('/auth/me'),
  register: (body) => http('/auth/register', { method: 'POST', body }),
  login: (body) => http('/auth/login', { method: 'POST', body }),
  logout: () => http('/auth/logout', { method: 'POST' }),
};
