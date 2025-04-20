### Ticket — Finalize Migration to Better Auth

We have replaced the Auth.js stack with **Better Auth**, but several code paths and build issues still need to be ironed out.  
Below is the punch‑list grouped by priority.

---

## 1 — Critical build blockers

| File | Issue | Fix |
|------|-------|-----|
| `src/routes/formations/FormationForm.svelte` | Duplicate `errors` identifiers (`let errors = writable({})` vs `{ form, errors, … } = createForm`) | • Delete / rename one. <br>• Simplest: rename from the createForm destructure to `formErrors`, then update all template references (`$errors.xxx` → `$formErrors.xxx`). |
| `src/hooks.server.ts` | ESLint complains about “ESM syntax … in CommonJS module” | The file is fine for SvelteKit (ESM).  Adjust ESLint config or add `/* eslint-env es2022 */` at top.  If TypeScript compiler is the complainer, ensure the file ends in `.ts` and the project is `"type": "module"`. |
| `src/components/UpvoteDownvote.svelte` | Uses `$session` store value without declaring `$:` reactivity; also `user` constant defined incorrectly | ```svelte\nconst session = authClient.useSession();\n$: user = $session.data?.user; // make reactive\n``` Remove the old non‑reactive assignment line. |

---

## 2 — Refactor remaining Auth.js references

- `src/routes/practice‑plans/PracticePlanForm.svelte`  
  Still imports `signIn` from `@auth/sveltekit/client`. Mirror the work done in `FormationForm`:  
  * `import { authClient } from '$lib/auth-client'`  
  * Replace `await signIn('google')` → `await authClient.signIn.social({ provider:'google' })`  
  * Replace all `$page.data.session` checks with the `authClient.useSession()` reactive store (`isLoggedIn` pattern).

- Components likely still importing `@auth/sveltekit/client` (`Header.svelte`, any login buttons, etc.):  
  Search & swap to `authClient` (signIn / signOut) per docs in [llms.txt → *Basic Usage*] 📜.

```bash
rg "@auth/sveltekit" src | cat
```

---

## 3 — Session plumbing clean‑up

- `+layout.server.js` currently returns `{ session: locals.session }`.  
  Confirm `locals.session` is still populated by `better-auth/svelte-kit`. If we renamed it in hooks we might need `locals.session` **and** `locals.user` in the layout data so `$page.data.session` continues to work without giant edits.  

- Consider adding a tiny `$lib/sessionStore.ts` wrapper around `authClient.useSession()` to standardise client usage.

---

## 4 — Better Auth CLI & path alias

`auth.js` now imports the DB via a **relative path** to satisfy the CLI.  
Optional polish: use `$lib/server/db` again and set `"alias": { "$lib/*": "./src/lib/*" }` in a `better-auth.config` or `NODE_OPTIONS=--experimental-vm-modules` so the CLI resolves SvelteKit aliases, but this is not required for runtime.

---

## 5 — Lint | Test | CI

1. `pnpm lint` — fix any remaining warnings.  
2. `pnpm build` — ensure SvelteKit compiles.  
3. Manual smoke‑test:  
   - Sign‑in / sign‑out flow  
   - Upvote/Downvote  
   - Create Formation & Practice Plan (logged‑in / anonymous → login → associate)  
4. Run Better Auth migrations on staging DB again if schema changed.

---

## 6 — Cleanup

- `package.json`: confirm **@auth** deps were removed.  
- Delete obsolete files: `src/lib/auth-client.js` (old duplicate), any `authGuard` util that referenced `@auth`.  
- Update README / `.env.example` to reflect **Better Auth** variables (`BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`, etc.).

---

### Definition of Done

✔ No imports from `@auth/*` in the repo.  
✔ `pnpm build`, `pnpm lint`, `vercel dev` all succeed.  
✔ All auth‑related flows work with Better Auth (manual QA list above).
