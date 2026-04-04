# Migration playbook

How to replace custom or one-off components with standardized design system components. This is the process for bringing existing UI into compliance with the system.

For net-new components and ongoing DS work, see **workflows.md**. This playbook focuses on **replacing** what already exists.

---

## When to migrate

Migration makes sense when:

- A custom component duplicates something the design system already provides
- Multiple screens use the same pattern implemented differently
- A component uses hardcoded values that should be tokens
- A visual refresh or rebrand requires touching components anyway (migrate while you're in there)

Migration does not make sense when:

- The custom component is genuinely unique and won't repeat
- The design system component doesn't yet handle the use case (extend the system first, then migrate)
- The feature is being deprecated or removed soon

---

## The process

### 1. Inventory

Before migrating anything, inventory what exists.

- List every instance of the component being replaced (every screen, every context)
- Note any variations between instances (different props, different styling, different behavior)
- Identify which variations the design system component already handles and which it doesn't

This inventory becomes your migration scope. No surprises mid-migration.

### 2. Gap analysis

Compare the custom component against the design system component.

- **Props:** does the system component expose all the props the custom one uses?
- **States:** does it handle all the same states?
- **Visual:** does it match the expected look in every context?
- **Behavior:** does it handle the same interactions?

If there are gaps, decide:

- **Extend the system component** to handle the missing case (preferred, if the case is general enough)
- **Use a composition pattern** where the system component wraps or is wrapped by additional logic
- **Flag as a Known Gap** and migrate everything else first

### 3. Build the replacement

If the system component needs to be extended or created:

1. Follow the component build workflow (see workflows.md)
2. Run the full review checklist (see review-checklist.md)
3. Mark design-complete before starting the migration swap

Never migrate to a component that isn't design-complete. You'll just create a different kind of debt.

### 4. Swap

Replace custom implementations with the system component one screen at a time.

- Start with the simplest instance (fewest variations, least complexity)
- Verify visually after each swap (does it look right in context?)
- Run the token audit after each swap (did the migration introduce any hardcoded values?)
- Don't batch too many swaps into one commit. Small, verifiable steps.

Prefer **vertical slices** (one user flow end-to-end) when that makes acceptance clearer; otherwise go screen-by-screen as above.

### 5. Clean up

After all instances are swapped:

- Delete the old custom component file
- Remove any orphaned tokens that only the custom component used
- Update any documentation that referenced the old component
- Run `/update-spec` on the system component (the migration may have surfaced new usage patterns worth documenting)

### 6. Verify

- Check every screen where the migration happened
- Run a full audit on the migrated component
- Confirm the spec is current
- Confirm playground/storybook coverage includes any new patterns discovered during migration

---

## Migration order

When migrating a large codebase, prioritize by impact:

1. **Foundation tokens first.** If components are using hardcoded values instead of tokens, fix that before anything else. Everything downstream depends on the token layer being correct.
2. **High-frequency components next.** Components that appear on the most screens give you the most consistency gain per migration.
3. **Compound components after their children.** Don't migrate a card component before migrating the button and text components it contains. Work from the leaves inward.
4. **Low-frequency or isolated components last.** One-off components on a single screen can wait.

Align token work with **Token change workflow** in workflows.md (`/audit-cascade` before edits, specs updated after).

---

## Common mistakes

**Migrating before the system component is ready.** If you have to hack the system component to make it work, the system component isn't done. Go back and extend it properly.

**Changing behavior during migration.** Migration should be a visual and structural swap, not a feature change. If you notice a behavior that should change, file it separately and address it after the migration is stable.

**Skipping the inventory.** You think you know where a component is used. You don't. Search the codebase. Every instance. Missing one means a screen silently breaks or stays inconsistent.

**Migrating everything at once.** One screen at a time. One commit at a time. Verify at each step. Big-bang migrations are where regressions hide.

---

## Communication and tracking

Operational habits that keep migrations shippable:

- Tell engineering **what “done” means** per slice (screenshots, story links, acceptance bullets).
- Document **intentional visual deltas** (spacing, radius policy, copy changes) in the spec or Known Gaps so they are not confused with regressions.
- Track **remaining debt** in tickets or Known Gaps—not only in chat or Slack.