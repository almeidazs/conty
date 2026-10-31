# Exemplos

Cada arquivo roda com Bun e entra no `bun run check:types`.

```bash
CONTY_API_KEY=ck_live_... bun examples/board/campaigns.ts
```

| Pasta | Exemplos |
| --- | --- |
| `coupons/` | `per-creator.ts`, `available.ts`, `sales.ts` |
| `board/` | `campaigns.ts`, `items.ts` |
| `errors/` | `handling.ts`, `observability.ts` |
| `webhooks/` | `hono.ts`, `elysia.ts`, `next.ts`, `fetch.ts`, `express.ts`, `fastify.ts`, `verify.ts` |

Variáveis: `CONTY_API_KEY`, `CONTY_WEBHOOK_SECRET` (webhooks), `CAMPAIGN_ID` e `MISSION_ID`.
Os exemplos de `coupons/` e `board/` chamam a API de verdade.
