// Lab 6: GET /lab/vendor?mode=broken|fixed|async&delay=DELAY (vendor response time in seconds)
import { doublingTraffic, get, MODE } from "./lib.js";

export const options = doublingTraffic(5);
const delay = __ENV.DELAY || 2;

export default function () {
  get(`/lab/vendor?mode=${MODE}&delay=${delay}`);
}
