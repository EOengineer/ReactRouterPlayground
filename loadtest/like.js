// Lab 9: POST /lab/like?mode=broken|fixed -- everyone likes the same post.
import { doublingTraffic, post, MODE } from "./lib.js";

export const options = doublingTraffic(10);

export default function () {
  post(`/lab/like?mode=${MODE}`);
}
