# Deployment & environments

| Environment | Frontend | Backend | Database | Branch |
|---|---|---|---|---|
| Local dev | `npm run dev` (Vite :5173) | Express :5000 | local Mongo or Atlas free | any |
| Staging | Vercel preview | Render service #2 | Atlas cluster / DB `codeshare_staging` | `develop` |
| Production | Vercel production | Render service #1 | Atlas cluster / DB `codeshare` | `main` |

Keep a **separate database and SESSION_SECRET for each environment**.

## 1. MongoDB Atlas
Create a cluster, a database user, and allow Render's outbound IPs (or `0.0.0.0/0` while testing).
Copy the connection string into `MONGODB_URI`.

## 2. Backend on Render
Use `render.yaml` (New → Blueprint) or create a Web Service manually:
root dir `server`, build `npm ci --omit=dev`, start `node src/server.js`, health check `/api/health`.
Env vars: `NODE_ENV=production`, `MONGODB_URI`, `SESSION_SECRET` (long random), `CLIENT_URL` (your Vercel URL, no trailing slash), `COOKIE_SAMESITE=none`.
Render's free plan sleeps and breaks long-lived WebSockets; use a paid instance for real use.

## 3. Frontend on Vercel
Import the repo, set **Root Directory = client**, framework Vite.
Env vars: `VITE_API_URL=https://<your-render-service>.onrender.com`.
`vercel.json` already rewrites all routes to `index.html`.

## 4. Cookies across domains
Vercel and Render are different sites, so the session cookie is third-party. It needs `SameSite=None; Secure` (set via
`COOKIE_SAMESITE=none`), and some browsers still block third-party cookies. The robust fix is a custom domain for both,
e.g. `app.example.com` and `api.example.com`, then `COOKIE_SAMESITE=lax`.

## 5. Single-host option (Docker)
`docker compose up --build` runs Mongo + API + nginx (UI and proxy on one origin, so cookies are first-party). Put it behind HTTPS
(Caddy, Traefik, or a cloud load balancer) and remove `COOKIE_SECURE: "false"`.

## Release checklist
- [ ] Unique `SESSION_SECRET` per environment
- [ ] `CLIENT_URL` exactly matches the frontend origin
- [ ] HTTPS everywhere
- [ ] Atlas backups on, IP access list restricted
- [ ] CI green on `main`
- [ ] `/api/health` monitored (UptimeRobot, Better Stack, etc.)
