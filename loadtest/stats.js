// Lab 7: GET /lab/stats?mode=broken|naive|fixed&ttl=TTL
import { doublingTraffic, get, MODE } from "./lib.js";

export const options = doublingTraffic(10);
const ttl = __ENV.TTL || 5;

export default function () {
  get(`/lab/stats?mode=${MODE}&ttl=${ttl}`);
}
