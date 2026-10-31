<div align="center">

# Conty OS

### SDK não oficial para a API da [Conty](https://appconty.com).

Um cliente tipado, sem dependências, para conversar com a Conty em Node.js e Bun.

<img src="https://raw.githubusercontent.com/almeidazs/conty/main/assets/banner.png" alt="contyos" />

[Instalação](#instalação) · [Uso](#uso) · [REST](#rest) · [CLI](#cli) · [Subpaths](#subpaths) · [Desenvolvimento](#desenvolvimento)

<br />

> Projeto não oficial, mantido pela comunidade. Não é afiliado à Conty.

<br />

## Instalação

</div>

```sh
bun add contyos
# Ou
npm install contyos
```

<div align="center">

## Uso

Crie um cliente com a chave de API da sua marca (`ck_live_...`), ou com um objeto de opções.
Nenhuma chamada lança: o resultado é sempre `{ ok: true, data }` ou `{ ok: false, error }`.

</div>

```ts
import { Conty } from 'contyos';

const client = new Conty(process.env.CONTY_API_KEY);
// Ou `new Conty({ secret: process.env.CONTY_API_KEY, rest: { retries: 2 } })`

const me = await client.me();

const coupon = await client.coupons.create({
	code: 'FULANA10',
	mission_id: missionId,
});

if (!coupon.ok) {
	// `code` é estável: trate o erro por ele, nunca pela mensagem.
	if (coupon.error.code === 'coupon_exists') {
		console.log(coupon.error.details?.[0]?.coupon_id);
	}

	return;
}

console.log(coupon.data.id, coupon.data.totals.sales_count);
```

<div align="center">

| Recurso | Métodos |
| --- | --- |
| `client.me()` | Identifica a marca dona da chave |
| `client.coupons` | `create`, `list`, `get`, `update`, `assign`, `unassign`, `listSales`, `upsertSale` |
| `client.campaigns` | `list`, `get`, `stages`, `items` |
| `client.missions` | `get` |

</div>

<div align="center">

Há exemplos completos em [`examples/`](./examples).

### Paginação

`iterate` percorre os itens e busca a próxima página só quando precisa. Uma página com erro lança `ContyError`.

</div>

```ts
for await (const coupon of client.coupons.iterate({ assigned: false })) {
	console.log(coupon.code);
}
```

<div align="center">

| Lista | Itens | Páginas |
| --- | --- | --- |
| `coupons.list` | `coupons.iterate` | `coupons.pages` |
| `coupons.listSales` | `coupons.iterateSales` | `coupons.salesPages` |
| `campaigns.list` | `campaigns.iterate` | `campaigns.pages` |
| `campaigns.items` | `campaigns.iterateItems` | `campaigns.itemsPages` |

### Repetir chamadas

A API não tem `Idempotency-Key`. `coupons.upsertSale` (pelo `external_id`) e `coupons.assign` (com a mesma missão) são seguros de repetir.
`coupons.create` não é: repetir devolve `coupon_exists`, com o id do cupom em `details`.

</div>

<div align="center">

### Lançar erros

O método devolve o resultado, e `.unwrap()` vira os dados ou lança um `ContyError`.
Sem o `.unwrap()`, nada lança.

</div>

```ts
import { Conty, ContyError } from 'contyos';

const client = new Conty(process.env.CONTY_API_KEY);

try {
	const coupon = await client.coupons.get(couponId).unwrap();
	
	console.log(coupon.totals.sales_count);
} catch (error) {
	if (error instanceof ContyError && error.code === 'not_found') {
		// Também há `status`, `requestId`, `details`, `retryAfter` e `type`.
	}
}
```

<div align="center">

Falhas de rede, timeout e abort também viram `ContyError` (`type`), com o erro original em `cause`.
Para os resultados do `client.rest`, use `unwrap(result)` de `contyos/rest`.

### Tratar erros por código

Em vez de comparar `error.code` na mão, use os helpers: eles funcionam com o resultado e com o erro capturado do `.unwrap()`, e estreitam o tipo de `details`.

</div>

```ts
import { isContyError, isCouponExists, isRateLimited } from 'contyos';

const result = await client.coupons.create({ code: 'FULANA10', mission_id: missionId });

if (isCouponExists(result)) {
	// `details` nunca é `undefined` aqui, e cada item tem o `coupon_id`.
	console.log(result.error.details[0]?.coupon_id);
} else if (isRateLimited(result)) {
	await sleep(result.error.retryAfter ?? 1000);
} else if (isContyError(result, 'validation_failed')) {
	console.log(result.error.details);
}

try {
	await client.coupons.get(couponId).unwrap();
} catch (error) {
	if (isContyError(error, 'not_found')) {
		// ...
	}
}
```

<div align="center">

`isContyError(valor, código?)` serve para qualquer código da API. Os atalhos são `isCouponExists`, `isNotFound`, `isRateLimited` e `isValidationFailed`.
Falhas sem código (rede, timeout, abort) nunca casam. Para elas, use `error.type`.

</div>

<div align="center">

## REST

O `client.rest` é um cliente HTTP com retry, backoff exponencial e timeout.
Nenhuma requisição lança: o resultado é sempre `{ ok, ... }`.

</div>

```ts
import { Routes, type APICoupon } from 'contyos/types';

const result = await client.rest.get<APICoupon>(Routes.coupon(id), {
	query: { limit: 10 },
});

if (!result.ok) {
	console.error(result.error.type, result.error.message);

	return;
}

console.log(result.data.id, result.status);
```

<div align="center">

Também dá para usar o cliente sozinho, com hooks de observabilidade.

</div>

```ts
import { REST } from 'contyos/rest';
import { Routes } from 'contyos/types';

const rest = new REST({
	retries: 3,
	timeout: 15_000,
	secret: process.env.CONTY_API_KEY,
	hooks: {
		onRetry: ({ attempt, delay }) =>
			console.log(`Retry #${attempt} em ${delay}ms`),
	},
});

await rest.get(Routes.campaigns(), { query: { status: 'approved' } });
```

<div align="center">

| Comportamento | Padrão |
| --- | --- |
| Retry | 3 tentativas, backoff exponencial com jitter, respeita `Retry-After` |
| Métodos retentados | `GET`, `PUT`, `DELETE` (e `POST`/`PATCH` apenas em `429`) |
| Timeout | 15s por tentativa |
| Autenticação | `Authorization: Bearer <secret>` |

</div>

<div align="center">

## Webhooks

Confira a assinatura de cada entrega (`X-Conty-Signature`) antes de processar o evento.
Use o **corpo cru** da requisição: não faça `JSON.parse` antes.

</div>

```ts
import { construct } from 'contyos/webhooks';

app.post('/webhooks/conty', express.raw({ type: 'application/json' }), async (req, res) => {
	const event = await construct({
		body: req.body,
		header: req.get('x-conty-signature'),
		secret: process.env.CONTY_WEBHOOK_SECRET,
	});

	if (!event) return res.sendStatus(400);

	if (event.type === 'application.approved') {
		// `event.data.mission.id` é o `mission_id` do `POST /coupons`.
	}

	res.sendStatus(200);
});
```

<div align="center">

O módulo exporta `verify` (Só a verificação, devolve `boolean`), `construct` e `sign`.
Durante a troca do segredo, passe os dois: `[novo, antigo]`.
Para testar o seu endpoint, `sign({ body, secret })` gera o cabeçalho como a Conty gera.

### Handlers prontos

Cada framework tem um `Webhooks` que valida a assinatura, converte o corpo e chama o handler do evento.
O nome vem do tipo: `application.approved` roda `onApplicationApproved`, `mission.video_submitted` roda `onMissionVideoSubmitted`.

</div>

```ts
import { Webhooks } from 'contyos/hono';
import { Hono } from 'hono';

const app = new Hono().post(
	'/webhooks/conty',
	Webhooks({
		secret: process.env.CONTY_WEBHOOK_SECRET,
		async onApplicationApproved({ data }) {
			// `data` já vem tipado para este evento.
		},
		// Roda para todo evento que não tem handler próprio.
		async onEvent(event) {},
		// Chamado quando um handler lança. A entrega responde 500 e a Conty tenta de novo.
		onError(error, event) {},
	}),
);
```

<div align="center">

A resposta é `200` quando o evento foi aceito (mesmo sem handler), `400` quando a assinatura ou o corpo não valem e `500` quando um handler lança.
A Conty espera `2xx` em até 10 segundos, então deixe o trabalho pesado para uma fila.
A Conty reenvia quando falha, então deduplique pelo `event.id`.

</div>

| Import | Uso |
| --- | --- |
| `contyos/hono` | `app.post(path, Webhooks({ ... }))` |
| `contyos/elysia` | `app.post(path, Webhooks({ ... }))` |
| `contyos/next` | `export const POST = Webhooks({ ... })` em um `route.ts` |
| `contyos/fetch` | `(Request) => Promise<Response>` para Bun, Deno, Workers, SvelteKit, Astro, Remix e afins |
| `contyos/express` | `app.post(path, express.raw({ type: 'application/json' }), Webhooks({ ... }))` |
| `contyos/fastify` | `app.register(Webhooks, { path, secret, ... })` |

<div align="center">

No Express o corpo precisa chegar cru (`express.raw`), por isso não use `express.json()` nessa rota.
No Fastify o plugin cuida disso sozinho, com um parser só dele.

O `contyos/fetch` aceita o `Request` ou o objeto `{ request }`, então serve direto no SvelteKit, Astro, Remix e React Router (`export const POST = Webhooks({ ... })`).
No Cloudflare Workers o segredo vem do `env`, então passe uma função:

</div>

```ts
import { Webhooks } from 'contyos/fetch';

export default {
	fetch: Webhooks((env: { CONTY_WEBHOOK_SECRET: string }) => ({
		secret: env.CONTY_WEBHOOK_SECRET,
		async onApplicationApproved({ data }) {},
	})),
};
```

<div align="center">

## CLI

O pacote traz o comando `conty`, com tudo que o SDK faz e as ferramentas para testar webhooks. Não instala dependências extras para quem só usa o SDK.

</div>

```sh
npx contyos --help
# Ou instalado
npm install -g contyos
```

<div align="center">

### Conta

`conty login` pergunta o nome do perfil e a chave de API, confere a chave na Conty e salva em `~/.config/conty/config.json` (permissão 600).

</div>

```sh
conty login                 # interativo
conty whoami                # confere a chave na Conty: perfil, marca e chave em uso
conty profiles              # perfis salvos
conty switch agencia        # troca o perfil atual
conty logout agencia

# CI, sem terminal
echo "$CONTY_API_KEY" | conty login --name loja --with-key
```

<div align="center">

A chave vem de `--profile` (ou `CONTY_PROFILE`), depois de `CONTY_API_KEY`, depois do perfil atual.
`--base-url` (ou `CONTY_BASE_URL`) aponta para outra API.

### Recursos

</div>

```sh
conty coupons list --no-assigned --limit 10
conty coupons create --code FULANA10 --mission-id <id>
conty coupons upsert-sale <id> pedido-10293 --amount-cents 15000 --status confirmed --occurred-at 2026-10-21T15:42:00Z
conty campaigns items <id> --stage interested --only-compatible --all
conty missions get <id>

# O corpo também vem de JSON (inline, @arquivo ou - para o stdin). As flags vencem.
conty coupons create -d @cupom.json --code OUTRO10
```

<div align="center">

Sai uma tabela no terminal e JSON puro com `--json` ou quando a saída é um pipe. As listas trazem uma página (`--limit`, `--cursor`) e `--all` percorre todas, em NDJSON no `--json`.
Exit code: `0` ok, `1` erro da API ou de rede, `2` uso errado.

### Chamada crua

</div>

```sh
conty api GET /coupons -q limit=5 -q assigned=false
conty api POST /coupons -d '{"code":"FULANA10","mission_id":"<id>"}' -i
```

<div align="center">

### Webhooks

A Conty só entrega webhook em uma URL pública cadastrada no painel, então o `listen` é um receptor local: ele verifica a assinatura, mostra cada evento e repassa para o seu app. O `trigger` manda um evento assinado, como a Conty mandaria.

</div>

```sh
# terminal 1: sem --forward-to, o listen só mostra os eventos
conty listen
# ou repassando para o seu app
conty listen --forward-to localhost:3000/webhooks/conty

# terminal 2
conty trigger application.approved
conty trigger mission.video_submitted --set data.submission.resubmission=true

# em outro destino, ou para conferir uma entrega capturada
conty trigger webhook.test --url http://localhost:3000/webhooks/conty
conty webhooks verify payload.json --signature 't=...,v1=...' --secret whsec_...
```

<div align="center">

O `listen` imprime o segredo (`whsec_...`) que assina e verifica, gerado uma vez e salvo no perfil. Coloque-o no `.env` do seu app.
Para receber eventos reais, aponte um túnel (ngrok, cloudflared) para a porta do `listen` e use o segredo do endpoint em `--secret`.

</div>

<div align="center">

## Subpaths

</div>

| Import | Descrição |
| --- | --- |
| `contyos` | Cliente `Conty` |
| `contyos/rest` | Cliente HTTP da API da Conty |
| `contyos/webhooks` | Verificação da assinatura dos webhooks (`construct`, `verify`, `sign`) |
| `contyos/hono`, `/elysia`, `/next`, `/fetch`, `/express`, `/fastify` | `Webhooks`: handler pronto que valida e despacha os eventos |
| `contyos/types` | Tipos da API (`API*`, `REST*`), eventos de webhook (`Webhook*`) e `Routes` |

<div align="center">

<br />

Licenciado sob [Apache-2.0](LICENSE).

</div>
