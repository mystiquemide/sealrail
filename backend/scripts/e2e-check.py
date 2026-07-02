#!/usr/bin/env python3
"""End-to-end lifecycle check against a running local backend.

bootstrap key -> listing -> paid task -> agent run (real LLM) -> verify -> anchor -> unlock

Writes only to the local dev database. Exits non-zero on the first failed step
and prints the raw response so failures are diagnosable.

Usage: python3 scripts/e2e-check.py [api_base_url]
"""

import json
import sys
import urllib.request

API = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3001"


def call(method: str, path: str, body: dict | None = None, key: str | None = None) -> dict:
    req = urllib.request.Request(f"{API}{path}", method=method)
    req.add_header("Content-Type", "application/json")
    if key:
        req.add_header("Authorization", f"Bearer {key}")
    data = json.dumps(body).encode() if body is not None else None
    try:
        with urllib.request.urlopen(req, data=data) as res:
            return json.load(res)
    except urllib.error.HTTPError as e:
        payload = e.read().decode()
        print(f"FAIL {method} {path} -> HTTP {e.code}: {payload[:500]}")
        sys.exit(1)


# 1. Bootstrap a full-scope key
res = call("POST", "/api/api-keys", {
    "name": "e2e-check",
    "owner_address": "01groqe2etester",
    "scopes": ["tasks:write", "payments:write", "agents:write", "marketplace:write"],
})
key = res["secret"]
print(f"key: {key[:10]}...")

# 2. Seeded listing — prefer the invoice-risk listing; dev DBs may hold junk rows
listings = call("GET", "/api/marketplace")["listings"]
if not listings:
    print("FAIL: no marketplace listings — run `npm run seed` first")
    sys.exit(1)
listing = next((l for l in listings if "invoice" in l["title"].lower()), listings[0])
listing_id = listing["id"]
print(f"listing: {listing_id} ({listing['title']})")

# 3. Paid task from the listing
res = call("POST", f"/api/marketplace/{listing_id}/tasks", {
    "buyer_address": "01groqe2etester",
    "input": {
        "invoice_id": "INV-2042",
        "vendor": "Acme Metals Ltd",
        "buyer": "Northgate Logistics",
        "amount_usd": 48500,
        "currency": "USD",
        "due_days": 45,
        "line_items": ["steel coil x12", "freight surcharge"],
    },
}, key)
task = res.get("task") or res
task_id = task["id"]
print(f"task: {task_id} status={task['status']}")

# 4. Run the agent — the real LLM call happens here
res = call("POST", f"/api/tasks/{task_id}/run", {}, key)
print(f"run: agent_executed={res.get('agent_executed')} status={res.get('task', {}).get('status')}")

# 5. Structured agent output
out = call("GET", f"/api/tasks/{task_id}/output")["output"]
result = out["result"] if "result" in out else out
print(f"output: risk_score={result.get('risk_score')} decision={result.get('decision')} flags={result.get('flags')}")

# 6. Verify, anchor, unlock
for step in ("verify", "anchor", "unlock-payment"):
    res = call("POST", f"/api/tasks/{task_id}/{step}", {}, key)
    status = res.get("task", {}).get("status") or res.get("status") or json.dumps(res)[:200]
    print(f"{step}: {status}")

print("\nE2E complete.")
