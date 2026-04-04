# Before / after: component spec tightening

## Before (too vague)

> The button should look good in all themes and support loading.

## After (usable)

> **Button / primary**  
> **Variants:** default, disabled, loading, destructive (links to Figma).  
> **Tokens:** `color.action.primary.bg`, `color.action.primary.fg`, `color.action.primary.border`; loading uses `spinner` slot + `opacity.disabled` on label.  
> **Behavior:** Loading disables pointer events; `onPressed` not fired while loading.  
> **A11y:** Role `button`, `aria-busy` when loading, focus ring uses `focus.ring`.  
> **Stories:** Default, loading, disabled, destructive, long label wrap.

## Why it matters

Engineering can implement and QA can verify; vague “looks good” creates rework.
