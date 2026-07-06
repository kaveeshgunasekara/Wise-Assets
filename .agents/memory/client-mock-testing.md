---
name: Client-mock multi-user testing
description: How to correctly e2e-test multi-user flows against a purely client-side, in-memory mock API layer.
---

When an app's data layer (e.g. `services/api.ts`) is a module-scoped in-memory
mock with no real backend, that state lives independently in each browser
tab/profile's JS runtime. It is NOT shared across separate Playwright
`[New Context]` calls — those behave like separate browser profiles/devices
with their own storage and JS heap.

**Why:** A two-user test (e.g. "user A requests a call with user B") will
reliably fail with "no matches found" / "empty state" if each user is created
in a different browser context, even though the app logic is correct. This
looks exactly like a matching/data bug but is actually a test design issue.

**How to apply:** For any multi-user interaction test against a client-only
mock backend, create both accounts sequentially within a SINGLE browser
context/tab (sign up user A, sign out, sign up user B in the same tab), so
they land in the same in-memory store. Only use separate contexts once a real
shared backend (DB) exists.
