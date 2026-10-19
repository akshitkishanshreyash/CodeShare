# CodeShare Pro

A real-time collaborative code editor: open a link, edit the same file together, see each other's cursors.
Built with React + Vite + Tailwind, Monaco, Yjs, Socket.IO, Express and MongoDB.

## Folder structure
```
codeshare-pro/
├── client/                  React app (Vite)
│   └── src/
│       ├── api/             fetch wrapper + auth/rooms calls
│       ├── components/      Navbar, Toolbar, CodeEditor, AuthForm, ProtectedRoute
│       ├── context/         AuthContext (cookie session state)
│       ├── hooks/           useCollabRoom (doc + socket + provider lifecycle)
│       ├── lib/             SocketIOProvider (Yjs <-> Socket.IO), monaco setup, languages, identity
│       ├── pages/           Home, Room, Login, Register, Dashboard, NotFound
│       └── config/          env access
├── server/                  Node + Express + Socket.IO
│   ├── src/
│   │   ├── config/          env validation, MongoDB, session
│   │   ├── models/          User, Room
│   │   ├── controllers/     auth, room
│   │   ├── routes/          /api routes
│   │   ├── middleware/      errors, auth guard, origin check, rate limits
│   │   ├── services/        room.service (DB), yjs.service (live docs + persistence)
│   │   ├── sockets/         Socket.IO events
│   │   └── utils/
│   └── tests/               node:test (unit + real-time sync)
├── docs/                    ARCHITECTURE.md, DEPLOYMENT.md
├── .github/workflows/       CI
├── docker-compose.yml       Mongo + API + nginx
└── render.yaml              Render blueprint
```

## Run locally
Requirements: Node 20+, MongoDB running locally (or an Atlas URI).

```bash
npm install                       # root (installs concurrently)
npm run install:all               # server + client
cp server/.env.example server/.env   # edit SESSION_SECRET (and MONGODB_URI if needed)
npm run dev
```
Open http://localhost:5173, click **Start a session**, then open the same link in a second window.

## Run with Docker
```bash
cp .env.example .env     # set SESSION_SECRET
docker compose up --build
```
Open http://localhost:8080.

## Tests
`npm test` runs the server tests (room-id validation, API smoke test, and a two-client real-time sync test).

## Deploy
See `docs/DEPLOYMENT.md` (Vercel + Render + MongoDB Atlas, with staging and production).
