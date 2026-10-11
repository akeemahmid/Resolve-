# Resolve backend

The remediation engine lives in `remediation/`. See the [project README](../README.md) for architecture, execution policies, development commands, and the browser walkthrough.

Public functions:

- `remediation/graphs:createDemo` creates an owned Emergency Lighting Failure demonstration.
- `remediation/graphs:overview` returns the authenticated user's graphs and workflow metrics.
- `remediation/graphs:detail` returns one owned graph, its nodes/dependencies, and recent audit events.
- `remediation/nodes:completeHuman` completes an eligible HUMAN node as its authenticated owner.
- `remediation/nodes:simulateDemo` simulates eligible SYSTEM/EXTERNAL work on an explicitly marked, owned demo graph.

`remediation/nodes:completeSystem` is internal. It cannot complete human nodes. No public function accepts a user/actor identity or arbitrary workflow events.

`auth.ts`, `auth.config.ts`, and `http.ts` retain the existing Convex Auth implementation. Preserve `...authTables` in the schema. Read `_generated/ai/guidelines.md` before changing Convex code.

Run `npm test` for the engine suite in `remediation.test.ts`.
