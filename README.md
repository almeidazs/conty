<div align="center">

# Conty OS

### SDK não oficial para a API da [Conty](https://appconty.com).

Um cliente tipado, sem dependências, para conversar com a Conty em Node.js e Bun.

<img src="https://raw.githubusercontent.com/almeidazs/conty/main/assets/banner.png" alt="contyos" />

[Instalação](#instalação) · [Uso](#uso) · [REST](#rest) · [Subpaths](#subpaths) · [Desenvolvimento](#desenvolvimento)

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

## Subpaths

</div>

| Import | Descrição |
| --- | --- |
| `contyos` | Cliente `Conty` |
| `contyos/rest` | Cliente HTTP da API da Conty |
| `contyos/types` | Tipos da API (`API*`, `REST*`), eventos de webhook (`Webhook*`) e `Routes` |

<div align="center">

<br />

Licenciado sob [Apache-2.0](LICENSE).

</div>
