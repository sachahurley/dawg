# Flutter patterns (working notes)

Applies to **Flutter** product and design-system work (e.g. Aura). Prefer the **product repo’s** conventions when they conflict with generic advice.

## Composition

- Prefer **small widgets** with clear responsibilities; push styling to theme/token layers.
- Avoid **massive `build` methods**; extract subtrees when state or layout branches multiply.

## Theming

- **No hardcoded colors or text styles** in feature widgets when DS tokens exist.
- Use **ThemeExtension** or project-standard token accessors consistently.

## State

- Follow the **team’s** chosen approach (Bloc, Riverpod, Provider, etc.); do not introduce a second pattern in one feature without a decision log.

## Documentation

- Screens that showcase DS usage should **dogfood** components; if a component is awkward to use, fix the API or document the escape hatch.

## Handoff with design

- Specs should name **widget or token** targets, not only Figma hex values.
