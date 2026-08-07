# Arquitetura

> **Cadeia:** [`AGENTS.md`](../AGENTS.md) → [`docs/RECONSTRUIR.md`](RECONSTRUIR.md) → **você está aqui**
>
> Vizinhos: [`MODELO_DE_DADOS.md`](MODELO_DE_DADOS.md) · [`CATALOGO_DE_REGRAS.md`](CATALOGO_DE_REGRAS.md) ·
> [`ALGORITMO.md`](ALGORITMO.md) · [`OPERACAO.md`](OPERACAO.md)
>
> As dependências abaixo foram **medidas** no código, não descritas de memória.

---

## Em uma frase

Um site estático que **lê três arquivos JSON**, mais uma área administrativa no mesmo pacote que
**escreve** esses arquivos pela API do GitHub. Não há servidor, não há banco de dados, não há
processo rodando em lugar nenhum.

---

## Por que estático, e o que isso custa

| Ganho | Custo |
|---|---|
| Hospedagem de graça, para sempre (GitHub Pages) | Publicar é um *commit*, não um `UPDATE` |
| Nada para manter no ar, nada que caia às 3h da manhã | Não dá para ter login de verdade |
| O histórico do git **é** o histórico da escala, de graça | O token do GitHub tem de viver no navegador de quem administra |
| Qualquer um consegue auditar: são três arquivos de texto | Duas cópias do dado (`public/` e `docs/`) para manter iguais |

A decisão de fundo: **o custo de operação precisa ser zero**, porque quem vai administrar isto é um
voluntário, não um time de plantão.

> ✅ **Revisitada em 07/08/2026 a pedido do dono (S-043)**: para a fase 1 (uso interno, um
> administrador) este é o formato certo, e ele **publica de verdade** — commit → deploy → site, ~1
> minuto. Para **comercializar** (produto genérico, cliente leigo), o modelo muda: backend + conta
> e-mail/senha + multi-tenant, com o desenho já registrado no
> [`BACKLOG.md` §P4.y](../BACKLOG.md). O domínio não muda uma linha — é o que o portão
> `arquitetura` garante.

---

## As camadas, e a regra que as separa

```
                   ┌───────────────────────────────┐
                   │  main.tsx  (rota por hash)    │
                   └───────┬───────────────┬───────┘
                           │               │
                  #/  ─────┘               └───── #/admin
                           │                             │
              ┌────────────▼─────────┐      ┌────────────▼──────────┐
              │  App.tsx + components│      │  admin/Admin.tsx      │
              │  (o que o irmão vê)  │      │  (quem monta a escala)│
              └────────────┬─────────┘      └────────────┬──────────┘
                           │                             │
                           └──────────┬──────────────────┘
                                      │
                        ┌─────────────▼──────────────┐
                        │  dados/carregar.ts         │  lê os 3 JSON
                        └─────────────┬──────────────┘
                                      │
                        ┌─────────────▼──────────────┐
                        │  dominio/                  │  ← NÃO importa nada de fora
                        │  tipos · datas · malha     │
                        │  regras · gerador          │
                        │  conferencia-independente  │
                        └────────────────────────────┘
```

**🔴 A regra que segura tudo:** `src/dominio/` **não importa nada de fora dele**. Medido, não
suposto — o grafo de importações confirma. Ele não sabe que existe React, navegador ou GitHub.

🔒 **E agora tem portão:** `npm run arquitetura`, dentro do `npm run gate`. Ele confere as duas
invariantes que este documento afirma:

1. o domínio ser uma **ilha** — no dia em que alguém importar React lá dentro, para um `useMemo` "só
   neste caso", o domínio deixa de rodar fora do navegador e metade dos scripts para;
2. a segunda régua **não importar o catálogo** — se alguém "aproveitar" uma função de `regras.ts`
   ali, ela vira espelho: continua verde, continua concordando, e para de valer qualquer coisa.
   Seria a pior falha possível — uma segunda opinião que é a primeira disfarçada.

As duas eram verdade quando foram escritas, e nenhuma tinha nada que as cobrasse. Provado nas duas
pontas: com React injetado no domínio e o catálogo injetado na segunda régua, ele acusa as duas;
limpo, passa.

Por isso:
- as regras podem ser testadas sem montar tela nenhuma;
- os scripts fora do navegador usam **o mesmo código** que o produto, via `scripts/lib/dominio.mjs`;
- trocar a tela inteira não toca numa linha de regra.

### Dependências medidas entre camadas

```
admin      → dados, dominio
components → dados, dominio, types
dados      → dominio, types
export     → types
types      → dominio
utils      → export, types
raiz       → admin, components, dados, dominio, types, utils
```

⚠️ São **7** arestas. A primeira versão desta lista trazia 6 — faltava `types → dominio` — num
parágrafo que se anuncia como *"medido, não descrito de memória"*. Achado por auditoria externa em
05/08/2026. Reconferir é uma linha:

```bash
npm run arquitetura
```

Nenhuma seta aponta para dentro do domínio a partir de baixo. Nenhum ciclo.

---

## O que cada arquivo faz

### `src/dominio/` — as regras do mundo

| Arquivo | Responsabilidade | Por que existe separado |
|---|---|---|
| `tipos.ts` | O modelo de dados | Um lugar só define o que é uma Pessoa, um Turno, um Bloco |
| `datas.ts` | Tudo que é data | 🔴 **`toISOString()` é proibido no projeto** — devolve UTC, e às 21h de São Paulo já é o dia seguinte. Toda data passa por aqui |
| `malha.ts` | Que dias têm turno | A malha é **dado**, não código. Já mudou uma vez |
| `regras.ts` | As 17 regras | Ver [`CATALOGO_DE_REGRAS.md`](CATALOGO_DE_REGRAS.md) |
| `gerador.ts` | Monta a escala | Ver [`ALGORITMO.md`](ALGORITMO.md) |
| `validacao.ts` | Roda o catálogo e resume | Separado das regras para o resumo não virar regra |
| `blocos.ts` | Como os blocos se encaixam quando entra escala nova | 🔴 Estava escrito **duas vezes à mão** — na tela e no script —, e as duas divergiam. Fonte única, com teste |
| `conferencia-independente.ts` | 🔴 **A segunda régua** | Reimplementa as regras por outro caminho e **não importa `regras.ts`** — medido |

### `src/dados/` — a fronteira com o mundo

| Arquivo | Responsabilidade |
|---|---|
| `main.tsx` | A porta: carrega os dados **antes** de montar a tela, roteia por hash, e envolve tudo num **`ErrorBoundary`** (`class Rede`). 🔴 Ele não existia até 05/08/2026 — `grep` devolvia zero. Um estouro no render derrubava a árvore inteira e a página ficava **em branco**, que é o desfecho que este arquivo declara, em letras grandes, como o pior possível |
| `carregar.ts` | Baixa os 3 JSON, **completa o que faltar**, emenda os blocos em ordem, tenta 3× antes de desistir. `retratoPublicado()` remonta o retrato com o que **acabou de ser gravado** — reler da rede traria o dado ANTIGO, porque o Pages leva um minuto |
| `filtrar.ts` | O filtro que a tabela e a exportação usam — **o mesmo**, para a imagem não sair diferente da tela |
| `ponte-para-a-tela.test.ts` | 🔴 **A prova de que `carregar.ts` e `filtrar.ts` fazem o que dizem.** Nasceu em 05/08/2026: até então, quatro mutantes que apagam a escala de todos os irmãos (`assignedBrothers: []`, `date` fixa em 2000, `type` sempre `NOITE`, `filtrarTurnos` devolvendo `[]`) passavam nos 232 testes. O domínio estava coberto até o osso; **o caminho que a pessoa vê**, não |

### `src/admin/` — quem monta a escala

| Arquivo | Responsabilidade |
|---|---|
| `Admin.tsx` | As 5 abas: Elenco · Gerar · Ajustar · Conferir por fora · Publicar |
| `AbaAjustar.tsx` | Troca manual de uma pessoa, com a lista de quem **pode** entrar e o motivo de quem não pode |
| `cofre.ts` | Guarda o token cifrado no navegador (PBKDF2 + AES-GCM). O token **nunca** vai para o repositório |
| `github.ts` | Escreve nas duas pastas pela API. Toda recusa vira frase em português dizendo **o que consertar** |
| `motor.ts` | O motor de linguagem propõe, explica e arbitra — e **nunca** publica sem passar pelo catálogo |

### `src/export/` — a imagem do WhatsApp

Layout **próprio**, com estilos em linha. Não fotografa a tela: o CSS do aplicativo não alcança este
componente, para a imagem não envelhecer junto com o site.

---

## O caminho de um dado, do clique à congregação

```
1. Administrador abre  #/admin  e digita a senha
2. O cofre no navegador descriptografa o token do GitHub
3. Ele escolhe o período e clica em Gerar
4. gerador.ts monta 8 escalas e escolhe a melhor
5. regras.ts confere as 16 — se alguma DURA falhar, a publicação fica travada
6. Ele clica em Publicar
7. github.ts escreve blocos.json nas DUAS pastas, via API
8. O GitHub Pages reconstrói o site (~40 s)
9. O irmão abre o link e carregar.ts lê os 3 JSON
```

**O ponto onde tudo pode dar errado em silêncio é o 7.** Por isso ele tem teste contra um GitHub de
mentira, e a resposta diz o que **já** foi gravado quando falha no meio.

---

## O que é DE PROPÓSITO, e alguém vai querer "consertar"

| Escolha | Por quê |
|---|---|
| **Sem `react-router`** | São duas telas. Rota por hash cabe em 6 linhas, e o GitHub Pages não sabe reescrever URL — `/admin` daria 404 ao recarregar |
| **Sem servidor** | Custo zero é requisito, não preferência |
| **Sem Web Worker na geração** | A geração leva menos de 1 segundo. Abaixo desse limite a pessoa não percebe espera; a complexidade não se paga |
| **Estilos em linha na imagem** | Para o CSS do site não vazar para o documento que vai ao WhatsApp |
| **Duas pastas de dado** | `public/` é a origem, `docs/` é o que o Pages serve. É assim que o Pages funciona |
| **O domínio não importa nada** | É o que permite testar e rodar por script sem navegador |
