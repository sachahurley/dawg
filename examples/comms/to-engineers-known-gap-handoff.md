# Example: handoff to engineering (Known Gap + ask)

**Audience:** Engineering owner of the feature  
**Channel:** Slack or ticket comment  
**When to use:** You are design-complete on the happy path; one edge case is explicitly deferred.

---

We’re **design-complete** on **[Component]** for **[flow/screen]** per spec **[link]**.

**Known Gap (intentional for this slice):**  
[Describe the edge case — e.g. offline error banner layout, RTL, extreme long translation]  
Tracked as **[ticket ID]** — not blocking this release.

**Ask:** Please implement against the **spec**, not my reference branch only; reference is for comparison. Ping me if the spec is ambiguous — I’ll update the doc, not leave it in thread.

**Acceptance I’ll verify in Storybook/build:**  
- [ ] States in spec table (default / disabled / loading / error as listed)  
- [ ] Token names match spec; no new hardcoded colors/spacing without a Known Gap note  

Thanks — happy to pair on API naming if useful.
