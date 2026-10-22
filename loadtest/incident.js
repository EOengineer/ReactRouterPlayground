// Lab 1: GET /lab/incident -- something is wrong. Find out what.
import { doublingTraffic, get } from "./lib.js";

export const options = doublingTraffic(8);

export default function () {
  get("/lab/incident");
}
