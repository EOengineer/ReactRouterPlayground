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

1. Unauthenticated visit to `/` runs a `clientLoader` that calls `GET /me`.
2. On `401`, React Router redirects to `/login`.
3. Login form posts `POST /session` with email/password.
4. On `201`, the cookie is set and the app navigates to `/`.
5. On `401`, the form shows the API `error` message.

Typed helpers live in `frontend/app/lib/api.ts`. Shared DTOs live in `frontend/app/types/`.

## Dev seed user

`backend/db/seeds.rb` creates 10 users. The sole admin:

- **Email:** `eoengineer@gmail.com`
- **Password:** `password1234!`
