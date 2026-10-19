import { http } from './http.js';

export const roomsApi = {
  create: (language) => http('/rooms', { method: 'POST', body: { language } }),
  mine: () => http('/rooms/mine'),
  get: (id) => http(`/rooms/${id}`),
  claim: (id) => http(`/rooms/${id}/claim`, { method: 'POST', body: {} }),
  rename: (id, title) => http(`/rooms/${id}`, { method: 'PATCH', body: { title } }),
  remove: (id) => http(`/rooms/${id}`, { method: 'DELETE' }),
};
