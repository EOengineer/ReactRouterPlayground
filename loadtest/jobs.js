// Lab 8: enqueue a burst of slow jobs plus one critical job, then watch the queues drain.
//   CRITICAL_QUEUE=default (broken) | critical (fixed)
import http from "k6/http";
import { sleep } from "k6";
import { BASE_URL } from "./lib.js";

export const options = { vus: 1, iterations: 1 };

const count = __ENV.COUNT || 500;
const ms = __ENV.MS || 200;
const criticalQueue = __ENV.CRITICAL_QUEUE || "default";

export default function () {
  const res = http.post(`${BASE_URL}/lab/enqueue?count=${count}&ms=${ms}&critical_queue=${criticalQueue}`);
  console.log(`enqueue: ${res.status} ${res.body}`);

  for (let i = 0; i < 60; i++) {
    const stats = JSON.parse(http.get(`${BASE_URL}/lab/queues`).body);
    const queues = stats.queues.map((q) => `${q.name}=${q.size} (${q.latency_s}s)`).join("  ");
    console.log(`t=${i * 2}s  ${queues}  busy=${stats.busy}  last_critical_wait_ms=${stats.last_critical_wait_ms}`);
    if (stats.queues.every((q) => q.size === 0) && stats.busy === 0) break;
    sleep(2);
  }
}
