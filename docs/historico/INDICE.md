# Índice do histórico — escala-porteiros

> **O mapa das fatias arquivadas.** Fatia sem entrada aqui é conteúdo perdido: existe no disco e não
> existe para quem procura.
>
> **Cadeia de navegação:** [`ESTADO.md`](../../ESTADO.md) → [`handoff mais recente`](../handoff/INDICE.md) → [`BACKLOG.md`](../../BACKLOG.md)
> **Roteador do projeto:** [`AGENTS.md`](../../AGENTS.md) · **Índice de solicitações (S-0XX):** [`../solicitacoes/INDICE_DE_SOLICITACOES.md`](../solicitacoes/INDICE_DE_SOLICITACOES.md)
> **Diário de solicitações (granular, por horário):** [`SOLICITACOES/INDICE.md`](SOLICITACOES/INDICE.md)

---

## Como funciona

Três documentos deste projeto são **append-only** e crescem por natureza — os dois primeiros
declarados em [`../regimes-documentos.json`](../regimes-documentos.json), o terceiro sob
Regime B-especial (subpasta, teto próprio):

| Documento | Papel |
|---|---|
| [`../../AI_MASTER_LOG.md`](../../AI_MASTER_LOG.md) | **o que** foi feito, passo a passo |
| [`../../DIARIO_DE_BORDO.md`](../../DIARIO_DE_BORDO.md) | **por que** cada decisão foi tomada, e como revertê-la |
| [`SOLICITACOES/`](SOLICITACOES/INDICE.md) | **cada solicitação**, no calor da hora, com horário de São Paulo — nasceu 21/08/2026 (skill `/historico`) |

Ao estourar o teto, eles são **fatiados por período**: `AI_MASTER_LOG.md`/`DIARIO_DE_BORDO.md` para
`historico/<DOCUMENTO>/AAAA-MM.md` (2.000 linhas **ou** virada de mês); `SOLICITACOES/` já nasce
dentro de `docs/historico/` e fatia por **sessão/dia** (700 linhas **ou** 90 KB — Regime
B-especial, teto mais apertado porque o período natural é mais fino). O arquivo da raiz de cada um
passa a conter **duas coisas e só elas**: o índice das fatias e a fatia corrente.

**Nada é excluído, nunca.**

## Imutabilidade

**Fatia fechada não se edita.** Se um registro antigo estava errado ou mudou, escreve-se um registro
**novo** na fatia corrente que **supersede** o antigo, com link nos dois sentidos. Apagar o erro
apaga a informação mais valiosa que existe: por que se acreditou nele.

⚠️ **Efeito colateral conhecido da rotação:** mover um arquivo para `docs/historico/X/` **quebra os
links relativos dele** — `../BACKLOG.md` vira `docs/historico/BACKLOG.md`, que não existe. Como fatia
fechada é imutável, esses links **não são reescritos**: ficam como registro do que o documento
apontava na época, e a isenção do histórico é regra do método (o portão de órfãos vive no pré-voo, não neste repositório). Este aviso existe para que o
próximo leitor não confunda com defeito.

## Fatias arquivadas

| Período | Documento | Fatia | Resumo |
|---|---|---|---|
| 04/08/2026 | `DIARIO_DE_BORDO.md` | [`2026-08-04_DIARIO_DE_BORDO_DB001-012.md`](2026-08-04_DIARIO_DE_BORDO_DB001-012.md) | DB-001 a DB-012 — nascimento do projeto, desenho da área administrativa, as primeiras auditorias, o cofre do token e a imagem do WhatsApp. Fatiado quando o diário passou de 2.000 linhas |
| 05–08/08/2026 | `DIARIO_DE_BORDO.md` | [`2026-08-05-a-08_DIARIO_DE_BORDO_DB013-052.md`](2026-08-05-a-08_DIARIO_DE_BORDO_DB013-052.md) | DB-013 a DB-052 — a Sessão 1 inteira: o produto foi ao ar, a área administrativa ganhou as 15 regras, o motor entrou, a §0 (escopo genérico) nasceu, a fila do GitHub Pages foi domada, e a última rodada de auditorias antes do hiato de 10 dias. Fatiado em 19/08/2026 quando o diário passou de 2.000 linhas de novo |
| 06–07/08/2026 | `BACKLOG.md` | [`2026-08_BACKLOG_itens-fechados.md`](2026-08_BACKLOG_itens-fechados.md) | Itens P1.4 a P1.7, todos ✅ com prova: os 7 achados da sétima auditoria · as 3 fronteiras de portão · o botão "Não gostei" · a varredura de variações com as duas réguas cegas para a ausência invertida. Rotacionados quando o BACKLOG estourou 40 KB |

---

**Estado dos tetos** — conferido por **`npm run tamanho-docs`**, dentro do `npm run gate`.

Ele lê os regimes de [`../regimes-documentos.json`](../regimes-documentos.json), que é a declaração
deste projeto, e aplica o teto do regime de cada documento:

| Regime | Vem de | Teto | Por quê |
|---|---|---|---|
| **vivo** | arquivo na raiz | 400 linhas / 40 KB | carregado toda sessão |
| **referência** | arquivo em subpasta | 800 / 100 KB | lido sob demanda |
| **append-only** | lista `historico` do JSON | 2.000 / 200 KB | cresce por natureza; **fatia-se por período** |
| **fatia fechada** | `docs/historico/` | — | **isenta**: medir o passado imutável não faz sentido |

Ele imprime também o **maior de cada regime**, para a folga ser visível antes de acabar.

> ⚠️ **Como isto chegou aqui, e vale registrar.** Esta linha afirmava, desde o começo, que o teto era
> *"conferido no pré-voo **e no GATE**"*. Em 05/08/2026 uma auditoria externa mostrou que o GATE
> deste projeto **não tinha** esse passo. Naquele momento eu **declarei a dívida** em vez de
> fechá-la — e regra declarada continua sendo regra sem portão. Horas depois, no mesmo dia, o portão
> foi escrito, provado nas duas pontas (401 linhas na raiz reprova · 399 passa · fatia de 5.000
> linhas no histórico é isenta) e ligado ao GATE.
>
> Fica o outro lado, ainda **declarado e aberto**: o **portão de órfãos** citado acima continua
> vivendo só no pré-voo do método, não neste repositório.
