// Lab 5 (bonus): POST /session -- bcrypt password checks are deliberately CPU-expensive.
import { doublingTraffic, request } from "./lib.js";

export const options = doublingTraffic(4);

export default function () {
  const n = Math.floor(Math.random() * 10000);
  request("POST", "/session", JSON.stringify({ email: `lab-user-${n}@example.com`, password: "password1234!" }));
}
