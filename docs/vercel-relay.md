# Vercel frontend, local backend

The public URL remains `https://tiktok-vip-six.vercel.app`. Vercel serves the UI
and forwards API requests to a route handler. The handler exchanges encrypted,
short-lived messages with the company machine through the project's existing
managed Redis instance. The machine only makes outbound connections. No router
changes, additional tunnel account, or public database ports are needed.

All application data, auth accounts, sessions, plans and reports use local
PostgreSQL. Analysis jobs use local Redis and the existing analysis worker.
The managed Redis instance is only a message transport for the HTTP relay.

## Configuration

The private `.env.relay` file on the company machine contains:

- `BACKEND_RELAY_REDIS_URL`: the existing managed Redis connection string.
- `BACKEND_RELAY_SECRET`: a random 32-byte key encoded as 64 hex characters.
- `BACKEND_RELAY_PREFIX`: `tiktok:http-relay:v1` (must match Vercel).
- `BACKEND_RELAY_UPSTREAM`: `http://127.0.0.1:3000`.
- `PUBLIC_APP_ORIGIN`: `https://tiktok-vip-six.vercel.app`.

Vercel Production has the same first three values plus
`BACKEND_RELAY_ENABLED=true`. Never use a `NEXT_PUBLIC_` prefix for a Redis URL or
the relay key. Local web must **not** enable relay mode, or requests would loop.
Its `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` point to the public Vercel URL so
auth cookies are secure and belong to the public site.

Start services:

```bash
docker compose --env-file .env.production \
  -f docker-compose.prod.yml -f docker-compose.relay.yml up -d --no-build
```

The relay uses the worker image's Node/tsx runtime and mounts the current `src`
read-only. Rebuild the worker image when dependencies change. Docker restarts
the services on boot. The machine and internet connection must remain available.

## Message security and expiry

AES-256-GCM protects HTTP bodies and headers, including passwords and session
cookies. Fresh nonces and authenticated request-ID/direction context reject
modified or swapped messages. Credentials and request bodies are not logged.
Request and response keys expire after 45 seconds; successful calls delete them
immediately. Queue entries have a bounded length and expiry. A signed heartbeat
expires after 15 seconds, allowing the frontend to return 503 when the backend
is offline. Requests time out after 25 seconds and are never automatically
re-executed. Short-lived claim keys reject duplicate execution within a request's
validity period.

Prefer `rediss://` transport wherever supported. The existing managed endpoint
currently only supports `redis://`: application messages are still encrypted,
but the Redis connection credential itself is not protected by TLS. Enabling
provider TLS and rotating that credential is a remaining transport-hardening
step; do not describe the Redis TCP transport as TLS-encrypted.

The HTTP bridge buffers bounded request/response bodies (up to 8 MiB internally;
Vercel's platform limits still apply). It is for the application's HTTP APIs,
not WebSockets or indefinite streaming. A shared Redis client avoids one socket
per browser request; the local consumer has a separate blocking connection and
up to eight concurrent requests. Polling consumes managed Redis operations.

## Verify

Check `/api/health` on the Vercel URL, then use a browser to verify login,
session persistence, logout, signup and admin permissions. Verify an invalid
password and unauthenticated admin access are rejected. Check that responses do
not expose internal routing headers or the relay key. Stop only the relay to
verify 503 after its heartbeat expires, then restart it.

The former Neon database has not been migrated. The administrator on the local
database is a separate account with the credentials stored privately in
`backups/self-hosted-cutover/admin-credentials.txt`.

## Recovery

Keep the private configuration and database backup. They must not enter Git or
Vercel uploads. Restore the same relay secret on both sides after a reinstall.
Deployments without relay mode return to the former database, which remains
unavailable while its quota is exceeded. To return to local browser access,
restore the previous local auth URLs from the private backup and recreate web.
