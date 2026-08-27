# Authentication

Cookie-based session auth between the React SPA and the Rails API.

## Model

- **User** — email/password (`has_secure_password`), `first_name`, `last_name`, `admin`
- **Session** — DB-backed row per login (`user_id`, optional `ip_address` / `user_agent`)
- Browser holds a signed **httpOnly** cookie `session_id` pointing at that row

CORS allows the SPA origin (`CORS_ORIGINS`, default `http://localhost:5173`) with **`credentials: true`**. The SPA must call the API with `credentials: "include"` so the cookie is sent cross-origin (`localhost:5173` → `localhost:3000`).

## API endpoints

| Method | Path | Auth | Success | Failure |
|--------|------|------|---------|---------|
| `POST` | `/registration` | no | `201` + user JSON + set cookie | `422` `{ errors: string[] }` |
| `POST` | `/session` | no | `201` + user JSON + set cookie | `401` `{ error: string }` |
| `DELETE` | `/session` | yes | `204` + clear cookie | `401` `{ error: "Unauthorized" }` |
| `GET` | `/me` | yes | `200` + user JSON | `401` `{ error: "Unauthorized" }` |

### User JSON

Matches `UserSerializer` and the frontend `User` type in `frontend/app/types/user.ts`:

```json
{
  "id": 1,
  "email": "eoengineer@gmail.com",
  "first_name": "Eric",
  "last_name": "Oligney",
  "admin": true
}
```

`admin` cannot be set via registration params.

## SPA flow

The **cookie** is the session. SPA loaders resolve the current user with `GET /me` (via `loadCurrentUser()`). Concurrent loader calls share one in-flight request; there is no sticky in-memory user cache.

1. Root `clientLoader` calls `loadCurrentUser()` and exposes `{ user }` to the navbar. In SPA mode, root revalidates when navigation crosses the guest/auth boundary (`/login`, `/register` ↔ everything else).
2. Authenticated routes sit under `authenticated-layout`, whose `clientLoader` redirects to `/login` when there is no user.
3. Guest routes (`/login`, `/register`) sit under `guest-layout`, whose `clientLoader` redirects to `/` when a user is already signed in.
4. Navbar link sets are mutually exclusive: guests see **Login** / **Register**; signed-in users see **Log out** only.
5. Login (`POST /session`) / register (`POST /registration`) set the cookie, then navigate to `/` (one loader wave → `/me`).
6. Logout calls `DELETE /session`, then navigates to `/login` (one loader wave → `/me`, expected `401` → guest UI).
7. On failure, login shows the API `error` (`401`); register shows joined `errors` (`422`).

Typed helpers live in `frontend/app/lib/api.ts`. Shared DTOs live in `frontend/app/types/`.

## Dev seed user

`backend/db/seeds.rb` creates 10 users. The sole admin:

- **Email:** `eoengineer@gmail.com`
- **Password:** `password1234!`
