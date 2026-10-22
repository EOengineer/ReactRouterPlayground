// Lab 2: GET /lab/slow_query (a user's 20 most recent posts)
import { doublingTraffic, get } from "./lib.js";

export const options = doublingTraffic(1);

export default function () {
  get("/lab/slow_query");
}
