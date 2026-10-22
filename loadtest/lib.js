import http from "k6/http";
import { Trend } from "k6/metrics";

export const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";
export const MODE = __ENV.MODE || "broken";

const queueMs = new Trend("server_queue_ms", true);
const appMs = new Trend("server_app_ms", true);
const sqlMs = new Trend("server_sql_ms", true);
const queries = new Trend("server_query_count");

// Open model: requests keep arriving at RATE/s whether or not the server keeps up,
// like real users. (A closed model -- N looping VUs -- slows down with the server
// and hides queueing.) Baseline traffic, then it doubles and stays doubled.
export function doublingTraffic(defaultRate) {
  const rate = Number(__ENV.RATE || defaultRate);
  return {
    scenarios: {
      traffic: {
        executor: "ramping-arrival-rate",
        startRate: rate,
        timeUnit: "1s",
        preAllocatedVUs: Math.min(rate * 4, 200),
        maxVUs: Number(__ENV.MAX_VUS || 1000),
        stages: [
          { target: rate, duration: __ENV.BASELINE || "20s" },
          { target: rate * 2, duration: "5s" },
          { target: rate * 2, duration: __ENV.DOUBLED || "40s" },
        ],
      },
    },
    thresholds: {
      http_req_failed: ["rate<0.01"],
      http_req_duration: ["p(95)<500"],
    },
    summaryTrendStats: ["avg", "p(50)", "p(95)", "p(99)", "max"],
  };
}

// X-Request-Start is what a load balancer would add; Rails turns it into queue time.
export function request(method, path, body = null) {
  const res = http.request(method, `${BASE_URL}${path}`, body, {
    headers: { "X-Request-Start": `t=${Date.now()}`, "Content-Type": "application/json" },
    timeout: "30s",
    tags: { name: path.split("?")[0] },
  });
  recordServerTiming(res);
  return res;
}

export const get = (path) => request("GET", path);
export const post = (path, body = null) => request("POST", path, body);

function recordServerTiming(res) {
  const header = res.headers["Server-Timing"];
  if (header) {
    for (const part of header.split(",")) {
      const [name, ...attrs] = part.trim().split(";");
      const dur = attrs.find((a) => a.startsWith("dur="));
      if (!dur) continue;
      const value = Number(dur.slice(4));
      if (name === "queue") queueMs.add(value);
      if (name === "app") appMs.add(value);
      if (name === "sql.active_record") sqlMs.add(value);
    }
  }
  const count = res.headers["X-Query-Count"];
  if (count !== undefined) queries.add(Number(count));
}
