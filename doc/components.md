# UI Component Library

All reusable UI primitives live in `frontend/components/ui/` and are exported from the barrel:

```ts
import { Button, Card, Input, Select, Badge, Modal, ModalBody, Chip, IconButton } from "@/components/ui";
```

**Rule:** Every page must use these base components. Do not re-implement buttons, modals, chips, or icon buttons inline.

---

## Button

`frontend/components/ui/Button.tsx`

```tsx
<Button variant="primary" size="md">Label</Button>
```

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `variant` | `"primary" \| "secondary" \| "ghost" \| "danger"` | `"primary"` | Visual style |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | Height + padding |
| `style` | `CSSProperties` | — | Merged after variant styles |

- `primary` — filled with accent gradient, black text
- `secondary` — dim glass fill, foreground text
- `ghost` — transparent, hover reveals subtle bg
- `danger` — red-tinted glass

---

## IconButton

`frontend/components/ui/IconButton.tsx`

Square button for single-character actions (×, ★, ⋯) on cards and in modals.

```tsx
<IconButton variant="ghost" size="sm">×</IconButton>
<IconButton variant="accent" size="sm">★</IconButton>
<IconButton variant="danger" size="xs">✕</IconButton>
```

| Prop | Type | Default |
|------|------|---------|
| `variant` | `"ghost" \| "danger" \| "accent"` | `"ghost"` |
| `size` | `"xs" \| "sm" \| "md"` | `"sm"` |

Sizes: `xs`=22px, `sm`=28px, `md`=34px.

---

## Chip

`frontend/components/ui/Chip.tsx`

Pill-shaped toggle for category filters and multi-select tags.

```tsx
<Chip active={selected} color={accent} onClick={toggle}>Top Roll</Chip>
```

| Prop | Type | Notes |
|------|------|-------|
| `active` | `boolean` | Highlighted state |
| `color` | `string` | Accent hex override (defaults to `var(--accent)`) |

Used for: focus tags in training sessions, category filters in pickers.

---

## Modal

`frontend/components/ui/Modal.tsx`

Handles backdrop, Escape key, and two layout variants.

```tsx
<Modal open={show} onClose={() => setShow(false)} title="Title" size="md">
  <ModalBody>…content…</ModalBody>
</Modal>

{/* Bottom sheet */}
<Modal open={show} onClose={() => setShow(false)} title="Pick" variant="sheet" size="lg">
  <ModalBody pad={false}>…</ModalBody>
</Modal>
```

| Prop | Type | Default |
|------|------|---------|
| `open` | `boolean` | required |
| `onClose` | `() => void` | required |
| `title` | `string` | — (no header rendered if omitted) |
| `variant` | `"center" \| "sheet"` | `"center"` |
| `size` | `"sm" \| "md" \| "lg" \| "xl" \| "full"` | `"md"` |
| `maxWidth` | `number \| string` | overrides size |

- `center` — vertically centered dialog, rounded corners
- `sheet` — slides up from bottom (mobile drawer style), top-rounded

`ModalBody` adds standard padding (`pad={false}` for custom inset content).

**Sticky content within a sheet modal:** use `position: sticky; top: 0; background: rgba(14,16,20,0.99)` on search/filter rows so they stay pinned while the list scrolls.

---

## Card

`frontend/components/ui/Card.tsx`

Standard dark glass card container.

---

## Input

`frontend/components/ui/Input.tsx`

Styled text input with label and error state.

---

## Select

`frontend/components/ui/Select.tsx`

Styled `<select>` dropdown.

---

## Badge

`frontend/components/ui/Badge.tsx`

Small inline label — status, tier rank, muscle group.

---

## Where each component is used

| Component | Pages |
|-----------|-------|
| `Button` | All pages — header actions, form submits, CompletedScreen |
| `IconButton` | ExerciseCard (★ key / ✕ remove), set rows |
| `Chip` | Training session focus chips, ExercisePicker category filter |
| `Modal` (center) | PostWorkoutModal |
| `Modal` (sheet) | ExercisePicker |
| `Card` | Dashboard, almanac |
| `Badge` | Exercise tier rank, muscle group, period labels |
