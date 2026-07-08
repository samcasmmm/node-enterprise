src/
├── app/                          # routes only — no business logic here
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── users/page.tsx
│   │   └── settings/page.tsx
│   ├── api/                      # route handlers — webhooks, BFF only
│   │   └── health/route.ts
│   ├── layout.tsx
│   ├── providers.tsx             # QueryClientProvider, theme, etc.
│   └── globals.css
├── modules/                      # domain-module pattern (mirrors backend)
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── queries/               # TanStack Query hooks (server state)
│   │   ├── store/                 # Zustand slice (client state)
│   │   ├── auth.types.ts
│   │   └── auth.schema.ts         # zod validation
│   ├── users/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── queries/
│   │   ├── store/
│   │   ├── users.types.ts
│   │   └── users.schema.ts
│   └── _template/                 # copy this to scaffold new modules
├── components/
│   ├── ui/                        # shadcn/ui primitives — don't hand-edit
│   ├── layout/                    # navbar, sidebar, shell
│   └── shared/                    # cross-module reusable components
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
│   └── index.ts                    # global Zustand store, if any spans modules
├── types/
│   └── global.d.ts
├── middleware.ts                   # auth/session guard at edge
└── styles/
    └── globals.css