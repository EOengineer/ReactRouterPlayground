import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  layout("routes/authenticated-layout.tsx", [index("routes/_index.tsx")]),
  layout("routes/guest-layout.tsx", [
    route("login", "routes/login.tsx"),
    route("register", "routes/register.tsx"),
  ]),
] satisfies RouteConfig;
