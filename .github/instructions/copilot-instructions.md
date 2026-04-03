# Orca — AI Agent Style Instructions

> These instructions apply to all AI-assisted code generation in this repository.
> Follow them precisely when creating or modifying any frontend component.

---

## Stack

- **Runtime**: Wails v2 (Go backend + React frontend)
- **UI**: React 18 + TypeScript (strict)
- **Styling**: Tailwind CSS v3 (utility-first, no custom CSS files unless unavoidable)
- **Icons**: `lucide-react` — always prefer `h-4 w-4` for inline icons, `h-3 w-3` inside buttons
- **Linting**: ESLint with no-nested-ternary rule active

---

## Global Font Settings

User-configurable font settings (family, size, weight) are applied **application-wide** via CSS custom properties on `:root`:

```css
:root {
  --font-family: 'JetBrains Mono', monospace;
  --font-size: 13px;
  --font-weight: 400;
}
body, #root {
  font-family: var(--font-family);
  font-size: var(--font-size);
  font-weight: var(--font-weight);
}
```

- All fonts are **bundled via `@fontsource/*`** packages — never rely on OS-installed fonts.
- Available bundled fonts: JetBrains Mono, Fira Code, Source Code Pro, Roboto Mono (imported via CSS `@import` in `style.css` for weights 300–600).
- Do **not** add OS font fallback chains (e.g. `'Consolas', 'Menlo'`) to dropdown options — bundled fonts are always available.
- The CSS variables are set at startup and updated live in `applyFontSettings()` in `App.tsx`.
- Every new UI component automatically inherits these settings — do **not** hardcode font families in individual components.

---

## File & Folder Conventions

```
frontend/src/
  components/
    ui/                  ← shared primitive components (one component per file)
      index.ts           ← barrel re-export — always update when adding a new ui file
      Badge.tsx          ← StatusBadge, CountBadge
      Button.tsx         ← IconButton, OpenButton, StartButton, StopButton
      NavItem.tsx        ← NavItem (sidebar navigation item)
      EmptyState.tsx
      PageHeader.tsx
      ScrollBody.tsx
      Spinner.tsx
      StateDot.tsx
    ContainerList.tsx    ← feature component
    ImagesPanel.tsx
    SidebarTree.tsx
    ...
```

- One **React component per file** inside `ui/`.
- Feature components (panels, lists, detail views) live directly in `components/`.
- **Always import shared primitives from `./ui`** — never duplicate them inline.
- Do **not** create markdown files to document changes unless explicitly asked.

---

## Component Rules

### Props
- Always use `interface` (not `type`) for prop shapes.
- All props must be `readonly`. Use `Readonly<PropsInterface>` on the component signature.
- Prefer explicit named props over spreading objects.

```tsx
// ✅ correct
interface MyProps {
  readonly label: string;
  readonly onClick: () => void;
}
function MyComponent({ label, onClick }: Readonly<MyProps>) { ... }

// ❌ wrong — no readonly, generic naming
function MyComponent(props: any) { ... }
```

### Async event handlers
- Wrap async calls in `void` when used as event handlers to avoid floating promises:

```tsx
onClick={() => { void handleAsync(); }}
```

### Error feedback
- Always use `toast.error(formatError(caughtError))` for user-facing errors inside async handlers.
- **Never** use `globalThis.alert` or `window.alert` — they block the UI thread.
- Import toast from `./Toast` (feature components) or `../components/Toast` (from subdirectories).

### Conditionals in JSX
- **Never** use nested ternaries in JSX — the linter will reject them.
- Use multiple `{condition && <El />}` expressions instead:

```tsx
// ✅
{busy && <Spinner />}
{!busy && isRunning && <Square className="h-3 w-3" />}
{!busy && !isRunning && <Play className="h-3 w-3" />}

// ❌ nested ternary
{busy ? <Spinner /> : isRunning ? <Square /> : <Play />}
```

---

## Tailwind Design Tokens

### Colour palette (zinc-based neutral, blue accent)
| Role | Light | Dark |
|------|-------|------|
| Page background | `bg-zinc-50` | `dark:bg-zinc-950` |
| Panel / card bg | `bg-white/70` | `dark:bg-zinc-950/40` |
| Surface hover | `hover:bg-zinc-100/80` | `dark:hover:bg-zinc-800/40` |
| Border | `border-zinc-200/70` | `dark:border-zinc-800/70` |
| Primary text | `text-zinc-900` | `dark:text-zinc-100` |
| Secondary text | `text-zinc-500` | `dark:text-zinc-400` |
| Muted / meta text | `text-zinc-400` | `dark:text-zinc-500` |
| Active accent | `bg-blue-600 text-white` | same |
| Success / running | `text-emerald-600` / `bg-emerald-500` | `dark:text-emerald-400` |
| Error / stopped | `text-red-600` / `bg-red-500` | `dark:text-red-400` |

### Typography scale
| Usage | Class |
|-------|-------|
| Eyebrow label | `text-[11px] font-semibold uppercase tracking-[0.3em] text-zinc-400` |
| Panel subtitle | `text-sm text-zinc-500` |
| Row primary text | `text-sm font-medium text-zinc-800 dark:text-zinc-200` |
| Row meta / mono | `text-xs font-mono text-zinc-400 dark:text-zinc-500` |
| Group header | `text-sm font-semibold text-zinc-800 dark:text-zinc-100` |
| Badge / pill | `text-xs font-semibold` |
| Section divider label | `text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400` |

### Spacing & shape
- Row padding: `py-1.5 pr-2` (tree rows), `px-2.5 py-2` (nav items)
- Panel header: `px-6 py-4`
- Rounded corners: `rounded-lg` for interactive rows/buttons, `rounded-full` for pills/badges
- Gap between rows: `gap-0.5` (flat lists) or `gap-1` (tree groups)

---

## Shared UI Primitives — When to Use What

| Component | Import | Use case |
|-----------|--------|----------|
| `NavItem` | `./ui` | Sidebar nav item with icon, label, and count badge (collapsed-aware) |
| `Spinner` | `./ui` | Loading state inside buttons |
| `StateDot` | `./ui` | Animated/static state indicator dot |
| `StatusBadge` | `./ui` | Coloured pill for container/resource state |
| `CountBadge` | `./ui` | Neutral zinc pill showing counts |
| `IconButton` | `./ui` | Square icon-only button (`variant: 'start'│'stop'│'accent'`) |
| `OpenButton` | `./ui` | Arrow right icon button to open detail view |
| `StartButton` | `./ui` | Labelled start action for groups |
| `StopButton` | `./ui` | Labelled stop action for groups |
| `PageHeader` | `./ui` | Eyebrow + subtitle panel top bar |
| `EmptyState` | `./ui` | Centred empty-list placeholder |
| `ScrollBody` | `./ui` | Standard scrollable panel content area |

**Adding a new primitive**: create `ui/MyComponent.tsx`, export from `ui/index.ts`.  
**Never** copy-paste button/badge/spinner code into a feature file.

---

## Panel Structure Pattern

Every main panel follows this exact structure:

```tsx
<div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
  <PageHeader eyebrow="Section Name" subtitle="descriptive summary string" />
  <ScrollBody>
    {items.length > 0 ? (
      <div className="flex flex-col gap-1">
        {items.map((item) => <ItemRow key={item.id} ... />)}
      </div>
    ) : (
      <EmptyState icon={<Icon className="h-12 w-12" />} title="..." description="..." />
    )}
  </ScrollBody>
</div>
```

---

## Tree-List Row Pattern

Container and resource rows use this layout:

```
[ StateDot ]  [ name (truncate) ] [ meta chips ]  [ StatusBadge ]  [ actions ]
```

- Name area is a `<button>` that opens the detail view.
- Running resources show meta details (ports, image, size) as a second line.
- Non-running resources show the short ID inline on the same line as the name.
- Actions (`IconButton`, `OpenButton`) are always visible (not hover-gated).

---

## Navigator (SidebarTree) Pattern

```
[ Section label (collapsed: hidden) ]
[ NavItem: icon + label + count badge ]
---
[ Collapse toggle button ]
```

- Active item: `bg-blue-600 text-white`
- Inactive item: zinc text with `hover:bg-zinc-100/80` / `dark:hover:bg-zinc-800/60`
- Icons: `h-4 w-4 shrink-0`
- Count badge: `rounded-full px-1.5 py-px text-[11px] font-semibold tabular-nums`
- Active count badge: `bg-white/20 text-white`
- Inactive count badge: `bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400`
