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
│   │   ├── hooks/                 # each table must have seprate hook. e.g useFetchUser, useCreateUser, useUpdateUser, useDeleteUser, etc
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