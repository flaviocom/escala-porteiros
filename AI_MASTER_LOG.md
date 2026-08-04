# AI_MASTER_LOG — escala-porteiros

> Diário cronológico do trabalho. Documento **append-only**, fatiado por período ao estourar o teto.
> O **porquê** de cada decisão vive no [`DIARIO_DE_BORDO.md`](DIARIO_DE_BORDO.md); aqui fica o
> registro do que foi feito, passo a passo.
>
> Estado atual em [`ESTADO.md`](ESTADO.md) · O que falta em [`BACKLOG.md`](BACKLOG.md)

---

## Índice de fatias

| Período | Arquivo | Resumo |
|---|---|---|
| 08/2026 | *(fatia corrente, abaixo)* | Nascimento do projeto, levantamento medido e desenho |

---

## [04/08/2026] Sessão 1 — Levantamento, desenho e esqueleto do método

**O quê.** Identificação do projeto de origem (`flaviocom/escala-irmaos-2026-mar`), levantamento
**medido** das regras e do comportamento real do gerador, desenho completo da área administrativa, e
montagem do esqueleto do método neste projeto novo.

**Feito:**

1. Projeto de origem identificado e mapeado — pasta local, repositório, GitHub Pages em modo branch
   (`build_type: legacy`, `source: main /`), e o workflow `deploy.yml` **falhando** (última execução
   `failure`, 18s, 01/07/2026). Quem publica é o build nativo do Pages.
2. Bundle publicado extraído e conferido contra o `src/` — **idênticos** em regras e elenco.
3. Gerador **portado e executado** em dois fusos. Medições e nove defeitos confirmados registrados na
   §12 do desenho.
4. Desenho escrito em
   [`docs/superpowers/specs/2026-08-04-area-administrativa-escala-design.md`](docs/superpowers/specs/2026-08-04-area-administrativa-escala-design.md)
   — 17 seções, catálogo fechado de **9 regras duras + 5 de qualidade**, modelo de dados, motor de
   três passos, área administrativa, segurança, portões e anteparos.
5. `_padroes-globais/` lido integralmente (17 documentos, 4 skills, template) e incorporado ao
   desenho (§15 e §16).
6. Esqueleto do método montado: `AGENTS.md`, `ESTADO.md`, `BACKLOG.md`, `docs/pre-voo.json`,
   `docs/regimes-documentos.json`, `.gitignore`, `.env.local`.
7. Credenciais `GITHUB_PAT_ESCALA_PORTEIROS` e `ANTHROPIC_API_KEY_ESCALA` cadastradas na central
   **como linhas vazias, com o bloco de instrução** — o valor é sempre colado pelo Flavio.

**Portões rodados:**

| Portão | Resultado |
|---|---|
| `pre-voo.mjs` (1ª execução) | 🔴 exit 1 — `AGENTS.md`, `ESTADO.md`, `BACKLOG.md` ausentes |
| `pre-voo.mjs` (2ª execução) | 🔴 exit 1 — `.env.local` ausente |
| `pre-voo.mjs` (3ª execução) | ✅ **exit 0 — pronto para começar** |
| `checar-tamanho-docs.mjs` | ✅ exit 0 |
| Conector MCP `github` | ✅ chamada real (`search_repositories`) |
| `gh` CLI | ✅ chamada real (`gh api .../pages`, `gh run list`) |

**Correção honesta.** A primeira versão do desenho tratava o motor como camada de explicação e
auditoria, com a distribuição inteiramente a cargo do algoritmo. O Flavio decidiu que **o motor
distribui também**. O desenho foi refeito para acomodar isso **sem perder a garantia**: o portão
determinístico fica entre o motor e a publicação, e a base do algoritmo permanece sempre disponível.

**Desvio necessário, registrado por honestidade.** No meio desta sessão o hook `Stop` do método
bloqueou **duas paradas corretamente rotuladas**. Não era erro de quem parou: era uma **corrida** —
o hook lia o transcript do disco 120 ms antes de a fala final ser gravada. Corrigido, autoteste de 8
para 10 casos, provado contra a versão anterior, commitado e conferido **no remoto**
(`flaviocom/padroes-globais`, `a4cc232`). Registrado lá como **ERRO 31**; não pertence ao histórico
deste projeto, e por isso aqui fica só o ponteiro.

**Pendente.** Aprovação do desenho (P0.1 do backlog). **Nenhuma linha de código de produto escrita.**
