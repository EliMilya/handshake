---
name: typescript-lsp
description: Diagnose and fix TypeScript errors, type issues, and LSP diagnostics. Use when dealing with type errors, red squiggles, tsconfig issues, or when the user shares TypeScript compiler/LSP output.
user-invocable: true
allowed-tools: Read, Write, Edit, Grep, Glob, Bash, mcp__ide__getDiagnostics
argument-hint: [file-or-error-description]
---

# TypeScript LSP — Diagnose & Fix

You are a TypeScript type system expert. Diagnose and resolve type errors, compiler issues, and LSP diagnostics.

## Workflow

1. **Gather diagnostics** — check IDE diagnostics via `getDiagnostics` and/or run `npx tsc --noEmit` to get full error list
2. **Read the problematic code** — understand the context around each error
3. **Diagnose root cause** — identify the actual type issue, not just the symptom
4. **Fix precisely** — minimal changes that resolve the error correctly

## Diagnosis Principles

### Read errors bottom-up
- TypeScript error chains show the deepest mismatch last — start there
- `Type 'X' is not assignable to type 'Y'` — compare X and Y carefully, the difference is often subtle (optional vs required, union member mismatch, readonly)

### Common Error Patterns

| Error | Likely Cause | Fix |
|-------|-------------|-----|
| `TS2322` Type not assignable | Shape mismatch, missing/extra props | Align types or add proper narrowing |
| `TS2339` Property does not exist | Accessing field on wrong type, missing union narrowing | Add type guard or check |
| `TS2345` Argument not assignable | Function called with wrong param type | Fix call site or widen parameter type |
| `TS2532` Object possibly undefined | Missing null check | Add optional chaining, nullish coalescing, or guard |
| `TS2556` Spread not assignable | Tuple/array spread mismatch | Use `as const` or explicit typing |
| `TS2769` No overload matches | Wrong combination of arguments | Check function signature, fix args |
| `TS7006` Implicit any | Missing type annotation | Add explicit type |
| `TS18046` Unknown type | Using `unknown` without narrowing | Add type guard before use |
| `TS2307` Cannot find module | Missing package, wrong path, missing declaration | Install package, fix import path, add `.d.ts` |
| `TS6133` Declared but never used | Unused variable/import | Remove or prefix with `_` |

### Type Narrowing Strategies
- **`typeof`** for primitives: `typeof x === 'string'`
- **`in`** for object shapes: `'field' in obj`
- **`instanceof`** for class instances
- **Discriminated unions** — check literal discriminant field: `if (result.status === 'error')`
- **Custom type guards** — `function isUser(x: unknown): x is User`
- **`satisfies`** — validate type without widening: `const config = { ... } satisfies Config`

## tsconfig.json Issues

- **Path aliases not resolving** — ensure `baseUrl` and `paths` match Vite's `resolve.alias`
- **Strict mode errors after enabling** — fix systematically: `strictNullChecks` first, then `noImplicitAny`
- **Module resolution** — use `"moduleResolution": "bundler"` for Vite projects
- **JSX** — use `"jsx": "react-jsx"` (no import React needed)
- **Target** — `"target": "ES2022"` or later for modern features

## Fix Guidelines

- **Fix the type, not the symptom** — avoid `as any`, `@ts-ignore`, `!` assertions unless truly justified
- **Prefer narrowing over casting** — type guards > type assertions
- **Don't over-type** — let TypeScript infer where it can
- **Generic constraints** — use `extends` to constrain, not `any`
- **`satisfies` over `as`** — preserves the narrowed type while validating
- **When `as` is justified** — API boundaries where you know more than TS (e.g., parsing JSON with known shape)

## When invoked

1. Read $ARGUMENTS — file path, error message, or area of concern
2. Run `getDiagnostics` and/or `npx tsc --noEmit` to collect all errors
3. Read the relevant source files
4. Diagnose each error — explain the root cause briefly
5. Apply minimal, correct fixes
6. Re-check diagnostics to confirm resolution