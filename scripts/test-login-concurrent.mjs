import { createHash } from "node:crypto";

const origin = "http://127.0.0.1:5173";
const email = "team360-concurrency-probe-5b731@example.invalid";
const password = "not-a-real-password";

const body = JSON.stringify({ email, password });
const url = `${origin}/api/auth/login`;

const results = await Promise.all(
  Array.from({ length: 10 }, async (_, i) => {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Origin: origin,
          "Content-Type": "application/json"
        },
        body,
        signal: AbortSignal.timeout(20000)
      });

      return { request: i + 1, status: response.status };
    } catch (error) {
      return {
        request: i + 1,
        status: "ERROR",
        detail: error instanceof Error ? error.message : String(error)
      };
    }
  })
);

console.table(results);

const counts = Object.groupBy(results, r => String(r.status));

console.log("HTTP 401:", counts["401"]?.length ?? 0);
console.log("HTTP 429:", counts["429"]?.length ?? 0);
console.log("OTHER:", results.filter(r => ![401, 429].includes(r.status)).length);

const key = createHash("sha256").update(email).digest("hex");
console.log("TEST ACCOUNT HASH:", key);

if (
  counts["401"]?.length === 5 &&
  counts["429"]?.length === 5
) {
  console.log("PASS: Concurrent HTTP limit respected");
} else {
  console.log("CHECK: Unexpected HTTP results; investigate before retrying");
}
