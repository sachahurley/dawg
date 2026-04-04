# Component review checklist

Use with **`/review-component`** or manual review. Adapt labels to the **active project** (Flutter vs React).

## Tokens and styling

- [ ] No forbidden raw values (hex, arbitrary spacing, ad-hoc radius) per project rules.
- [ ] Semantic tokens used for UI meaning (primary, danger, surface), not raw palette steps in components.
- [ ] Focus and disabled states defined and visible.

## Structure and API

- [ ] Props/params align with spec; variants match Storybook or doc table.
- [ ] Naming matches project conventions (prefix, package, file layout).

## Documentation

- [ ] Storybook (or equivalent) page follows required doc structure for that repo.
- [ ] Examples show **recommended** usage, not only edge cases.

## Accessibility

- [ ] Keyboard operability for interactive components.
- [ ] Roles/labels where needed; contrast called out if token choices are borderline.

## Migration (if replacing legacy UI)

- [ ] List of call sites or feature flag plan.
- [ ] Visual parity or intentional deltas documented.
