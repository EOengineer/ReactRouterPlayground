// Lab 4: GET /lab/db_work?ms=MS -- every request holds a DB connection for MS milliseconds.
import { doublingTraffic, get } from "./lib.js";

export const options = doublingTraffic(20);
const ms = __ENV.MS || 100;

export default function () {
  get(`/lab/db_work?ms=${ms}`);
}
