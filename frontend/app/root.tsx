import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  type ShouldRevalidateFunctionArgs,
} from "react-router";
import type { JSX } from "react";

import type { Route } from "./+types/root";
import AppNavbar from "~/components/AppNavbar";
import { loadCurrentUser } from "~/lib/api";
import type { RootLoaderData } from "~/types/root";
import "bootstrap/dist/css/bootstrap.min.css";

export type { RootLoaderData };

const guestPaths = new Set(["/login", "/register"]);

function isGuestPath(pathname: string): boolean {
  return guestPaths.has(pathname);
}

export async function clientLoader(): Promise<RootLoaderData> {
  return { user: await loadCurrentUser() };
}

clientLoader.hydrate = true as const;

/** SPA mode skips parent revalidation on GET nav; refresh user when crossing auth boundary. */
export function shouldRevalidate({
  currentUrl,
  nextUrl,
}: ShouldRevalidateFunctionArgs): boolean {
  return isGuestPath(currentUrl.pathname) !== isGuestPath(nextUrl.pathname);
}

export function Layout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App(): JSX.Element {
  const { user } = useLoaderData<typeof clientLoader>();

  return (
    <>
      <AppNavbar user={user} />
      <Outlet />
    </>
  );
}

export function HydrateFallback(): JSX.Element {
  return (
    <main className="container py-5">
      <p className="mb-0">Loading…</p>
    </main>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps): JSX.Element {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="container py-5">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack ? (
        <pre className="w-100 p-3 overflow-auto">
          <code>{stack}</code>
        </pre>
      ) : null}
    </main>
  );
}
