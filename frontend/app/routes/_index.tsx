import type { JSX } from "react";
import { Navigate } from "react-router";

export default function Index(): JSX.Element {
  return <Navigate to="/home" replace />;
}
