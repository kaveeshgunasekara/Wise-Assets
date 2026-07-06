---
name: Onboarding role/flag state gotcha
description: A value only ever set via one entry link's onClick breaks silently when a later step is reached by a different path.
---

Setting shared state (e.g. a role/mode flag) only inside the `onClick` of one
specific entry-point link (e.g. a landing page's "sign up as X" button) is
fragile: any user who reaches a later step in the flow through a different
path — resuming after sign-out, browser back/forward, or a second pass through
onboarding in the same session — arrives with that value unset (null/undefined).

**Why:** Downstream code often guards on that value with a silent early
return (`if (!role) return;`), so the UI just looks stuck (e.g. a "Continue"
button that does nothing) with no console error and no visible feedback,
which is easy to misdiagnose as a data/matching bug instead of a state bug.

**How to apply:** For any required piece of state gathered during a multi-step
flow, give it a real, revisitable input on the step's own form (not just a
one-time link-click side effect elsewhere), and make the failure path visible
(inline error message) instead of a bare early return, so it fails loudly if
it's ever missing.
