# Architecture

```
Browser (React + Vite + Tailwind)
 ├─ Monaco Editor  ──binding (y-monaco)──┐
 ├─ Yjs Y.Doc  <─────────────────────────┘
 └─ SocketIOProvider ── Socket.IO ───────────────┐
                                                 ▼
                          Node.js + Express (server/)
                           ├─ REST  /api/auth, /api/rooms, /api/health
                           ├─ Socket.IO  (shares the Express session)
                           └─ yjs.service  (in-memory Y.Doc per active room)
                                                 ▼
                                          MongoDB (users, rooms, sessions)
```

## How real-time editing works
1. User opens `/r/:roomId`. The client creates an empty `Y.Doc` and joins the room over Socket.IO (`room:join`).
2. The server loads the room's saved Yjs state from MongoDB (or creates the room), returns the full state in the ack, and the client merges it.
3. Every local edit becomes a small Yjs update → `yjs:update` → server applies it to its copy and relays to the others.
4. Yjs is a CRDT, so concurrent edits merge without conflicts, and offline edits merge on reconnect.
5. Cursors/names use the Yjs *awareness* protocol (`awareness:update`).
6. The server saves the doc to MongoDB 2 s after the last edit, and again when the last person leaves.

## Socket events
| Event | Direction | Payload |
|---|---|---|
| `room:join` | client → server (ack) | `{ roomId }` → `{ ok, state, language, title }` |
| `yjs:update` | both | `{ update: Uint8Array }` |
| `awareness:update` | both | `{ update: Uint8Array }` |
| `awareness:request` | server → client | newcomer asks peers to re-send cursors |
| `room:language` | both | `{ language }` |
| `room:presence` | server → client | `{ count }` |

## REST API
| Method & path | Auth | Purpose |
|---|---|---|
| `GET /api/health` | no | liveness + DB status |
| `POST /api/auth/register` `login` `logout`, `GET /api/auth/me` | — | cookie session |
| `POST /api/rooms` | optional | create a room |
| `GET /api/rooms/:id` | no | room metadata |
| `GET /api/rooms/mine` | yes | my saved snippets |
| `POST /api/rooms/:id/claim` | yes | save an anonymous room to my account |
| `PATCH /api/rooms/:id` / `DELETE` | owner | rename / delete |

## Security choices
- Passwords: bcrypt (cost 12). Sessions: `httpOnly` cookie, `Secure` in production, id regenerated on login.
- `helmet`, CORS locked to `CLIENT_URL`, `Origin` check on non-GET requests, rate limits (stricter on auth).
- Inputs validated with Zod. Socket room id comes from the server-side join, never from later client messages.
- Update size capped (512 KB). Anonymous rooms auto-delete after 30 idle days (MongoDB TTL index).
- Anyone with a room link can edit (like codeshare.io). Add per-room access control before storing sensitive code.

## Scaling notes
Active docs live in one server process's memory. To run several instances: add the Socket.IO Redis adapter,
use sticky sessions, and route each room to one instance or move doc state to Redis.
