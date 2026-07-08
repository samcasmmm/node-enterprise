# agent.md — Frontend Coding Contract

**Scope:** Next.js 15 (App Router) + TypeScript + shadcn/ui + TanStack Query v5 + TanStack Table + Zustand v5.

This file is a binding contract for any AI coding agent (or human) working in this repo. If a request conflicts with this file, follow this file and flag the conflict — don't silently deviate.

---

## 1. Directory Structure

The frontend project must strictly follow this file tree layout:

```
src/
├── app/                          # routes only — no business logic here
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── users/page.tsx
│   │   └── settings/page.tsx
│   ├── layout.tsx
│   ├── providers.tsx             # QueryClientProvider, theme, etc.
│   └── globals.css
├── modules/                      # domain-module pattern (mirrors backend)
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/                 # each hook in its own file: e.g. useFetchUser, useCreateUser, etc.
│   │   ├── auth.types.ts
│   │   └── auth.schema.ts         # zod validation
│   ├── users/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── users.types.ts
│   │   └── users.schema.ts
│   └── _template/                 # copy this to scaffold new modules
├── components/
│   ├── ui/                        # shadcn/ui primitives — don't hand-edit (every component should be reusable)
│   ├── layout/                    # navbar, sidebar, shell
│   └── shared/                    # cross-module reusable components (if components are not reusable, they should be in the module folder)
├── lib/
│   ├── api/
│   │   ├── client.ts               # fetch/axios wrapper, interceptors
│   │   └── query-client.ts         # TanStack QueryClient config, defaults
│   ├── utils/
│   ├── validators/
│   └── constants/
├── config/
│   ├── env.config.ts               # zod-validated env
│   └── site.config.ts
├── stores/
│   └── index.ts                    # global Zustand store, all store is here
├── types/
│   └── global.d.ts
├── middleware.ts                   # auth/session guard at edge
└── styles/
    └── globals.css
```

---

## 2. State Management Rules

### Server State (TanStack Query)
- All server data fetched from APIs belongs in TanStack Query.
- Never copy server data into local `useState` or Zustand. Read directly from the Query cache hooks.

### Client State (Zustand)
- All shared client-side UI/interaction state (sidebar collapsed, theme mode, global modals, active filters) lives in the consolidated global store in `stores/index.ts`.
- Do not create module-specific Zustand stores. Keep all Zustand store state inside `stores/index.ts`.

---

## 3. Hooks Contract (1 Operation per Hook File)

Every query and mutation must have its own dedicated hook file inside the module's `hooks/` directory.

- **Granular Hooks**: Each database/table action must be in a separate file (e.g. `hooks/useFetchUser.ts`, `hooks/useCreateUser.ts`, `hooks/useUpdateUser.ts`, `hooks/useDeleteUser.ts`). Do not combine multiple query/mutation hooks into a single file.
- The hook handles query keys and calling API functions (using the unified `apiClient` under `lib/api/client.ts`).
- Always define query key factories inside module hooks or adjacent keys helper files to avoid raw string array keys at call sites.

---

## 4. Components & shadcn/ui Rules

- **Generated Components**: `components/ui/` contains shadcn primitives. **Never hand-edit files in `components/ui/`**. If you need custom variants or behavior, wrap them in a custom component under `components/shared/`.
- **Reusable Shared Components**: `components/shared/` is strictly for cross-module reusable components (e.g., custom data table, page headers, modal wrappers) that are used by 2 or more modules.
- **Module-Specific Components**: If a component is specific to one module (e.g., `UserCard`, `LoginForm`), it must stay inside that module's `components/` directory (e.g., `modules/users/components/`). Do not put them in `components/shared/`.
- **Theming**: Hex colors and arbitrary Tailwind colors are forbidden. Always use CSS variable tailwind tokens (`bg-primary`, `text-muted-foreground`, etc.).

---

## 5. Forbidden Patterns — Quick Reference

- ❌ Hand-editing shadcn components inside `components/ui/`
- ❌ Copying server state into `useState` or Zustand stores
- ❌ Inlining `useQuery` or `useMutation` directly inside pages or component JSX (always wrap in a dedicated custom hook file under `hooks/`)
- ❌ Creating module-specific Zustand stores outside `stores/index.ts`
- ❌ Putting module-specific UI components in `components/shared/`
- ❌ Combining multiple CRUD queries/mutations in a single hooks file

---

## 6. PR Checklist (agent self-check before finishing a task)

- [ ] Every hook is in a separate file under `hooks/` (e.g. `useFetchUser.ts`, `useCreateUser.ts`)
- [ ] Zustand stores are centralized in `stores/index.ts`
- [ ] No server-state is duplicated into client state
- [ ] No edits made to components inside `components/ui/`
- [ ] Module-specific components are kept inside their module folder
- [ ] Theming uses Tailwind design tokens (no hardcoded hex colors)