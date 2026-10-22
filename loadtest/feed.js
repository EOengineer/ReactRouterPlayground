// Lab 3: GET /lab/feed?mode=broken|fixed
import { doublingTraffic, get, MODE } from "./lib.js";

export const options = doublingTraffic(10);

export default function () {
  get(`/lab/feed?mode=${MODE}`);
}
