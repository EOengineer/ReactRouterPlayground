// Lab 5: GET /lab/cpu?ms=MS -- every request burns MS of pure-Ruby CPU.
import { doublingTraffic, get } from "./lib.js";

export const options = doublingTraffic(10);
const ms = __ENV.MS || 50;

export default function () {
  get(`/lab/cpu?ms=${ms}`);
}
