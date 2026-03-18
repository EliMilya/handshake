# Handshake — Implementation Plan

## Context
Hackathon project: a micro-contract app where two people discuss terms in real-time and "seal" the deal by simultaneously holding a button for 3 seconds. Built from scratch.

**Repository:** https://github.com/EliMilya/handshake.git

---

## Phase 1: Project Scaffolding ✅

### 1.1 Vite + React + TypeScript
- `bun create vite . --template react-ts`
- `bun install`

### 1.2 Convex Setup
- `bun add convex`
- `bunx convex init` → creates `convex/` directory
- `VITE_CONVEX_URL` in `.env.local`

### 1.3 Clerk Setup
- `bun add @clerk/clerk-react`
- `VITE_CLERK_PUBLISHABLE_KEY` in `.env.local`
- Clerk dashboard: enable Convex JWT template
- Convex dashboard: add Clerk issuer URL

### 1.4 shadcn/ui
- `bun add tailwindcss @tailwindcss/vite`
- `bunx shadcn@latest init`
- Components: button, card, textarea, badge, separator

### 1.5 React Router
- `bun add react-router-dom`

### 1.6 Providers in `src/main.tsx`
```
ClerkProvider
  └─ ConvexProviderWithClerk
       └─ BrowserRouter
            └─ App
```

---

## Phase 2: Convex Schema & Backend ✅

### 2.1 Schema — `convex/schema.ts`

**Table `contracts`:**
- `status`: "negotiating" | "sealed"
- `creatorId`, `creatorName`: string
- `counterpartyId`, `counterpartyName`: optional string
- `terms`: string (current draft)
- `sealedAt`: optional number
- `sealedTerms`: optional string (frozen copy)
- Indexes: `by_creator`, `by_counterparty`

**Table `negotiation_log`:**
- `contractId`, `authorId`, `authorName`, `proposedTerms`, `createdAt`
- Index: `by_contract`

**Table `seal_intents`:**
- `contractId`, `userId`, `holdStartedAt`
- Indexes: `by_contract`, `by_contract_user`

### 2.2 Contracts — `convex/contracts.ts`

**Queries:**
- `get({ contractId })` — public, for shareable links
- `getMyContracts()` — current user's contracts

**Mutations:**
- `create({ terms })` — create contract
- `joinAsCounterparty({ contractId })` — join as second party
- `updateTerms({ contractId, newTerms })` — update terms + log entry

**Immutability guard:** every mutation checks `contract.status !== "sealed"`.

### 2.3 Negotiation Log — `convex/negotiation.ts`
- `getLog({ contractId })` — all entries for contract
- Append-only: no delete/update mutations

### 2.4 Seal Mechanics — `convex/seal.ts`

**Queries:**
- `getIntents({ contractId })` — active seal intents

**Mutations:**
- `startHold({ contractId })` — insert seal_intent with upsert logic
- `releaseHold({ contractId })` — delete intent on release
- `checkAndSeal({ contractId })` — **internalMutation**, called via `ctx.scheduler.runAfter(3000)`

**Sealing algorithm:**
1. `startHold` — user presses button, intent is created
2. If 2 intents exist after insert — schedule `checkAndSeal` in 3 sec
3. `checkAndSeal` verifies: both intents present + both > 3 sec → seal
4. On seal: `status = "sealed"`, `sealedTerms = terms`, `sealedAt = now`, delete all intents

**Edge cases:**
- One releases → `releaseHold` deletes intent → `checkAndSeal` won't seal
- Disconnect → stale intent won't cause false seal (need BOTH intents)
- Race condition → Convex mutations are transactional

---

## Phase 3: Frontend ✅

### 3.1 Routing — `src/App.tsx`
```
/                 → Home.tsx
/contract/:id     → Contract.tsx (handles both states)
```

### 3.2 Home Page — `src/pages/Home.tsx`
- Not signed in: hero + sign in button (Clerk `<SignInButton>`)
- Signed in: "Create Contract" + list of own contracts

### 3.3 Contract Page — `src/pages/Contract.tsx`
- Subscription to `api.contracts.get` for real-time data
- If `negotiating`: TermsEditor + NegotiationLog + SealButton
- If `sealed`: ContractReceipt
- Auto-join counterparty on first visit

### 3.4 Components

**TermsEditor** (`src/components/TermsEditor.tsx`):
- Textarea + "Propose Changes" button
- Local draft → discrete proposals (no CRDT)
- Disabled if not signatory or sealed

**NegotiationLog** (`src/components/NegotiationLog.tsx`):
- Real-time log subscription
- List: author + proposed terms + timestamp
- Auto-scroll to new entries

**SealButton** (`src/components/SealButton.tsx`):
- `onPointerDown` → `startHold` mutation + local progress timer
- `onPointerUp/Leave/Cancel` → `releaseHold` + reset
- `beforeunload` listener for cleanup
- Progress visualization for both users (0-3 sec)
- Partner progress from `holdStartedAt` via `requestAnimationFrame`

**ContractReceipt** (`src/components/ContractReceipt.tsx`):
- Read-only: sealedTerms, party names, date
- "Copy Link" button

---

## Phase 4: Access Control ✅

| Action | Creator | Counterparty | Anyone |
|--------|---------|-------------|--------|
| View | ✅ | ✅ | ✅ |
| Edit | ✅ (if negotiating) | ✅ (if negotiating) | ❌ |
| Seal | ✅ (if negotiating) | ✅ (if negotiating) | ❌ |

- View queries — no auth check (shareable links)
- All mutations — server-side `ctx.auth.getUserIdentity()` check
- UI hides controls for non-signatories (convenience, not security)

---

## Phase 5: Styling & Polish ⬜

- shadcn/ui components for consistent UI
- SealButton animation (circular progress)
- Responsive design
- Error states and loading states

---

## Phase 6: Deploy ⬜

1. Push to GitHub ✅
2. Connect repo to Vercel
3. Set env vars in Vercel
4. `npx convex deploy` for production
5. End-to-end verification

---

## Implementation Order (vertical slicing)

1. **Scaffold** → Phase 1 ✅
2. **Schema + create + Home** → "Can create a contract and see it by URL" ✅
3. **Contract page + TermsEditor + NegotiationLog** → "Two users can negotiate" ✅
4. **SealButton + seal backend** → "Both hold and contract is sealed" ✅
5. **ContractReceipt + immutability** → "Sealed contracts are immutable" ✅
6. **Polish + access control** → "Everything looks good and is secure" ⬜
7. **Deploy** → Live! ⬜

---

## Key Architectural Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Editing | Discrete proposals | Avoid CRDT complexity |
| Seal timing | Server scheduler (3 sec) | Don't trust client clocks |
| checkAndSeal | internalMutation | Client can't call directly |
| Counterparty | First non-author takes the slot | Simplicity for MVP |
| Routing | 2 routes (/, /contract/:id) | Contract page handles both states |
| Immutability | Server guards + no delete mutations | Defense in depth |

---

## Verification (manual testing)

1. ⬜ Happy path: create → negotiate → seal → read-only
2. ⬜ Seal interruption: one releases at 2 sec → not sealed
3. ⬜ Immutability: after seal, updateTerms attempt → error
4. ⬜ Access control: unauthorized can view but not edit
5. ⬜ Third user: cannot become counterparty if slot is taken
