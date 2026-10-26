# contyos

Unofficial Bun/TypeScript library for [appconty.com](https://appconty.com). The root `package.json` publishes one package (`contyos`); modules are subpath exports under `src/modules/*`.

## Commands

- `bunx tsc --noEmit`: typecheck (test files are not typechecked; type assertions go in `tests/types/`)
- `bun run check:lint`: oxfmt + oxlint (Markdown and MDX are excluded)
- `bun run test`: test suites
- `bun run build` / `bun run pack`: tsdown build; run it after changing exports (declaration generation can fail where `tsc` passes)

## Rules

- Adding a subpath: create `src/modules/<name>/index.ts`, then register it in `tsdown.config.ts` (`entry`), `package.json` (`exports`) and `tsconfig.json` (`paths`).
- `contyos/types` mirrors discord-api-types: resource payloads are `API*` (`src/modules/types/payloads`), request/response shapes are `REST*` plus the `Routes` helper (`src/modules/types/rest`), webhook events are `Webhook*` (`src/modules/types/webhooks`), shared primitives live in `common.ts`. The source of truth is the OpenAPI at `https://api.appconty.com/public/v1/openapi.json`; query types must be `type` aliases (not interfaces) so they fit `RequestQuery`.
- `contyos/webhooks` verifies `X-Conty-Signature` with Web Crypto only (no `node:crypto`, so it runs on Node, Bun and edge runtimes) and never throws (`verify` returns a boolean, `construct` the event or `null`); the event types themselves live in `contyos/types`.
- Resources of the client (`client.coupons`, ...) live in `src/resources`: thin methods over `rest` that return `RESTResult<REST*Result>`; a new route needs its `Routes` entry, `REST*` types, a resource method and a test in `tests/resources.test.ts`.
- Commits follow Conventional Commits (enforced by commitlint via lefthook).
