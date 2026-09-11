import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  layout("routes/authenticated-layout.tsx", [index("routes/_index.tsx")]),
  layout("routes/guest-layout.tsx", [
    route("login", "routes/login.tsx"),
    route("register", "routes/register.tsx"),
  ]),
  layout("routes/admin/layout.tsx", [
    route("admin", "routes/admin/_index.tsx"),
    route("admin/users", "routes/admin/users/index.tsx"),
    route("admin/users/:id", "routes/admin/users/show.tsx"),
    route("admin/sessions", "routes/admin/sessions/index.tsx"),
  ]),
] satisfies RouteConfig;
