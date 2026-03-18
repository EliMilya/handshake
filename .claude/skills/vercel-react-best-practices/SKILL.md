---
name: vercel-react-best-practices
description: Apply Vercel and React best practices when building, reviewing, or refactoring frontend code — performance, patterns, deployment, and project structure.
user-invocable: true
allowed-tools: Read, Write, Edit, Grep, Glob, Bash, Agent
argument-hint: [task-or-area-to-review]
---

# Vercel + React Best Practices

Apply modern Vercel and React ecosystem best practices when building or reviewing code.

## Project Structure

```
src/
├── app/                  # Pages / routes
├── components/
│   ├── ui/               # shadcn/ui primitives
│   └── ...               # Shared components
├── features/             # Feature-based modules
│   └── <feature>/
│       ├── components/
│       ├── hooks/
│       ├── utils/
│       └── types.ts
├── hooks/                # Shared hooks
├── lib/                  # Utilities, API clients, configs
├── styles/               # Global styles
└── types/                # Shared types
```

## React Patterns

### Components
- **Functional components only** — no class components
- **Single responsibility** — one component, one job
- **Colocate related code** — keep hook, component, types, and styles together in feature folders
- **Prefer composition** — pass children/render props over deeply nested config objects
- **Avoid prop drilling** — use context or state management for deeply shared state

### Hooks
- Extract reusable logic into custom hooks (`use` prefix)
- Keep hooks focused — one concern per hook
- Memoize expensive computations with `useMemo`
- Stabilize callbacks with `useCallback` only when passed to memoized children
- Avoid premature optimization — don't wrap everything in `memo`/`useMemo`/`useCallback`

### State Management
- **Local state first** — `useState` / `useReducer` for component-scoped state
- **URL state** — use search params for filterable/shareable UI state
- **Server state** — use TanStack Query or SWR for async data (cache, revalidation, deduplication)
- **Global state** — Zustand or Context for truly app-wide state, keep it minimal

## Performance

### Code Splitting
- Lazy load routes and heavy components with `React.lazy()` + `Suspense`
- Dynamic imports for large dependencies: `const lib = await import('heavy-lib')`
- Split vendor chunks in Vite config when beneficial

### Rendering
- Avoid unnecessary re-renders — lift state down, not up
- Use `key` prop correctly — stable, unique identifiers, never array indices for dynamic lists
- Virtualize long lists with `@tanstack/react-virtual`
- Debounce expensive event handlers (search inputs, resize, scroll)

### Assets & Loading
- Use optimized image formats (WebP/AVIF) with proper `width`/`height`
- Preload critical assets, lazy load below-the-fold content
- Font optimization: `font-display: swap`, subset fonts, preload

## Vite Configuration

- Use path aliases: `@/` → `src/`
- Enable gzip/brotli compression for production
- Configure proper chunk splitting for vendor libraries
- Use environment variables via `import.meta.env` (prefix with `VITE_` for client-side)

## Vercel Deployment

- **Environment variables** — set via Vercel dashboard, never commit secrets
- **Preview deployments** — every PR gets a preview URL automatically
- **Edge functions** — use for middleware, redirects, geolocation logic
- **Headers & caching** — configure in `vercel.json`:
  - Immutable assets: `Cache-Control: public, max-age=31536000, immutable`
  - HTML/API: `Cache-Control: public, max-age=0, must-revalidate`
- **Web Vitals** — monitor LCP, FID, CLS via Vercel Analytics

## TypeScript

- **Strict mode** — always `"strict": true`
- **No `any`** — use `unknown` and narrow, or define proper types
- **Interface for objects, type for unions/intersections**
- **Infer when obvious** — don't annotate return types the compiler already knows
- **Discriminated unions** for state machines and API responses

## Error Handling

- **Error boundaries** for component-level crash recovery
- **Graceful fallbacks** — show skeleton/placeholder UI while loading
- **User-friendly errors** — never expose raw error messages to users
- **Log errors** to monitoring service (Sentry, Vercel Log Drain)

## Accessibility

- Semantic HTML: `<button>`, `<nav>`, `<main>`, `<article>` — not `<div onClick>`
- All interactive elements keyboard-accessible
- ARIA labels on icon-only buttons
- Color contrast ≥ 4.5:1 for text
- Focus management for modals and dynamic content

## When invoked

1. Read $ARGUMENTS to understand the task or area to review
2. Examine the relevant code in the codebase
3. Apply the best practices above — build new code or refactor existing code
4. Verify TypeScript types, performance patterns, and accessibility