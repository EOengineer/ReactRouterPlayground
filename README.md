# ReactRouterPlayground

Dockerized monorepo: Rails 8 API + React Router 8 SPA.

## Architecture

Two apps talk over HTTP. The React SPA runs in the browser and calls the Rails API at `VITE_API_URL`. Docker Compose wires the supporting services (Postgres, Redis, Sidekiq) so local development matches a typical production topology without requiring them on the host.

```
Browser ──► frontend (:5173) ──HTTP──► api (:3000)
                                          │
                          ┌───────────────┼───────────────┐
                          ▼               ▼               ▼
                        db (:5432)    redis (:6379)   sidekiq
                                      (cache + jobs)
```

| Service    | Host URL                         | Role |
|------------|----------------------------------|------|
| Frontend   | http://localhost:5173/           | React Router 8 SPA (Vite HMR) |
| Rails API  | http://localhost:3000/up         | JSON API + health check |
| Sidekiq UI | http://localhost:3000/sidekiq    | Job dashboard (development only) |
| Postgres   | localhost:5432                   | Primary datastore |
| Redis      | localhost:6379                   | Cache store + Sidekiq broker |

Compose service names (`db`, `redis`, `api`, …) are used for container-to-container networking. The browser always hits host-mapped ports (`localhost:3000`, `localhost:5173`), which is why `VITE_API_URL` points at the host, not the `api` Docker hostname.

## Design decisions

| Decision | Why |
|----------|-----|
| **Monorepo + Compose** | One `docker compose up` brings up API, SPA, DB, Redis, and workers with shared env and volumes. |
| **Rails API-only** | Backend is JSON-only (`config.api_only = true`); the SPA owns UI. CORS is allowed from `CORS_ORIGINS` (default `http://localhost:5173`). |
| **SPA mode (`ssr: false`)** | Frontend is a client-rendered React Router app—simpler local Docker story and a clear API boundary. |
| **Separate Sidekiq service** | Background jobs run in their own container sharing the Rails image/code, so the web process stays free for requests. |
| **Redis for cache + jobs** | One Redis instance backs `redis_cache_store` and Sidekiq; fine for local/dev, easy to split later. |
| **Active Storage on disk** | Local disk in development (`storage/`); S3/GCS can be plugged in via `storage.yml` later. |
| **Bootstrap + reactstrap** | Lightweight UI kit for playground pages without a heavy design system. |
| **Typed frontend tooling** | Strict TypeScript, type-aware ESLint, and Vitest keep the SPA maintainable as routes grow. |

## Quick start

```bash
cp .env.example .env
docker compose up --build
```

(`dc` is an alias for `docker compose` if configured.)

## Auth

Cookie sessions between the SPA and Rails API (`POST /session`, `GET /me`, etc.). See **[docs/auth.md](docs/auth.md)** for endpoints, the SPA login flow, and seed credentials.

## Backend (Rails)

Includes **Active Storage** (local disk in development), Redis cache, and Sidekiq.

```bash
docker compose exec api bundle exec rspec
docker compose exec api bundle exec rubocop
```

## Frontend (React Router)

```bash
docker compose exec frontend npm run typecheck
docker compose exec frontend npm run lint
docker compose exec frontend npm test -- --run
```

## Stack

- **API**: Rails 8.1 (API-only + Active Storage), Postgres 16, Redis 7 (cache + Sidekiq), RSpec, FactoryBot, RuboCop
- **SPA**: React Router 8, TypeScript (strict), ESLint (type-aware), Vitest, Bootstrap 5 + reactstrap
