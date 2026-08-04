# BACKLOG — escala-porteiros

> **O que falta fazer, em ordem.** Lugar único: item que não está aqui não existe como pendência.
> Documento **vivo** — item concluído sai daqui e vira registro no histórico.
>
> **Última atualização:** 04/08/2026
>
> **Cadeia de navegação, nesta ordem:**
> [`ESTADO.md`](ESTADO.md) → [`handoff mais recente`](docs/handoff/HANDOFF_2026-08-04.md) → **`BACKLOG.md` (você está aqui)**
>
> **Roteador do projeto:** [`AGENTS.md`](AGENTS.md) ·
> **Solicitações:** [`docs/solicitacoes/INDICE_DE_SOLICITACOES.md`](docs/solicitacoes/INDICE_DE_SOLICITACOES.md) ·
> **Histórico:** [`docs/historico/INDICE.md`](docs/historico/INDICE.md)

**Legenda:** 🔴 bloqueia o próximo marco · 🟠 defeito em produção · 🔵 método/infra · ⚪ produto
**Dono da decisão:** 👤 só o Flavio · 🤖 autônomo (o assistente executa sem perguntar)

---

## P0 — Decisões do dono 👤

### P0.1 🔴 Aprovar o desenho da área administrativa
O desenho está em
[`docs/superpowers/specs/2026-08-04-area-administrativa-escala-design.md`](docs/superpowers/specs/2026-08-04-area-administrativa-escala-design.md).
Sem aprovação, nada de produto é construído — errar aqui custa a implementação inteira.
- **Recomendação:** aprovar como está. As 12 decisões registradas são todas dele, e as três que o
  assistente tomou (carga inicial, truncar ≠ reescrever, ler a última data no bloco anterior) estão
  declaradas na §4 do documento.

### P0.2 🔴 Colar os valores das duas credenciais
`GITHUB_PAT_ESCALA_PORTEIROS` (fine-grained, Contents: write, só em `flaviocom/escala-porteiros`) e
`ANTHROPIC_API_KEY_ESCALA`. **O assistente nunca digita, lê ou transcreve o valor** — ele entrega um
`.cmd` na Área de Trabalho, com caminho absoluto e explicação antes de agir.
- Sem a primeira: a área administrativa gera e valida, mas **não publica** (resta baixar o JSON).
- Sem a segunda: o algoritmo gera e valida normalmente, **sem** a proposta e a explicação do motor.

---

## P1 — Defeitos conhecidos 🟠

### P1.1 🔴🟠 Santa Ceia com data errada no site que está no ar 🤖
O código de `escala-irmaos-2026-mar` marca `2026-06-07` como Santa Ceia. A data correta é
**16/08/2026** — daqui a 12 dias, e é **domingo**. O site vai exibir **3 porteiros de manhã e 3 à
noite** num dia em que ninguém deve ser escalado (irmãos de outra igreja atendem).

⚠️ **Armadilha:** o Flavio decidiu que o repositório antigo **não é tocado**. Logo, a correção vem
pelo projeto novo entrando no ar antes de 16/08 — ou por uma decisão dele em contrário.

### P1.2 🟠 Distanciamento não é regra no gerador atual 🤖
Medido: Williams com **7 intervalos de 1 dia**, **18 pares com ≤3 dias**, 6 ocorrências de
"quarta → sábado". Resolvido por desenho no projeto novo (regra Q1), não no antigo.

---

## P2 — Método e infraestrutura 🔵

| # | Item | Estado |
|---|---|---|
| P2.1 | `AGENTS.md` + `ESTADO.md` + `BACKLOG.md` na raiz | ✅ 04/08 |
| P2.2 | `docs/pre-voo.json` e `docs/regimes-documentos.json` | ✅ 04/08 |
| P2.3 | Pré-voo verde | ✅ 04/08 — exit 0 |
| P2.4 | Criar `flaviocom/escala-porteiros` + repositório local | ✅ 04/08 — conferido no remoto |
| P2.5 | `.gitignore` excluindo `.claude/` e `.agents/` (ERRO 26) | ✅ 04/08 |
| P2.6 | `AI_MASTER_LOG.md` + `DIARIO_DE_BORDO.md` | ✅ 04/08 |
| P2.7 | `docs/INVENTARIO_DE_FONTES.md` **gerado por script** | ⏳ |
| P2.8 | GATE: typecheck + suíte completa + build | ✅ 04/08 — `npm run gate`, exit 0 |
| P2.9 | Portão `medir-denominacao-sem-ia` provando as duas pontas | ⏳ |
| P2.10 | Auditoria adversarial, 2 auditores em frentes disjuntas | ⏳ ao fim |
| P2.11 | 🔴 **Disco `D:` a 0,8 s por arquivo** — build roda numa cópia em `C:` | 👤 contornado; a causa é do Flavio |
| P2.12 | ⚠️ **O pré-voo fica vermelho em `D:`** por `node_modules` ausente — ausência *proposital*, já que o build vive em `C:`. Exceção declarada aqui e em [`ESTADO.md`](ESTADO.md); o script do método não tem chave para afrouxar esse item | 👤 decidir se vale acrescentar `deps: {bloqueia:false}` ao método |

---

## P3 — Produto ⚪

| # | Item | Estado |
|---|---|---|
| P3.1 | Modelo de dados: `pessoas.json`, `blocos.json`, `config.json` | ✅ 04/08 |
| P3.2 | Catálogo de regras executável — **10 duras + 5 de qualidade**, cada uma com teste das duas pontas | ✅ 04/08 — 55 testes |
| P3.3 | Carga inicial: congelar 01/03 → 04/08, **contando as duas pontas** (ERRO 23) | ✅ 04/08 — 184/549/549 |
| P3.4 | Algoritmo com piso **descoberto** por busca | ✅ 04/08 — piso 6, tentou 9/8/7 |
| P3.5 | Site público lendo os JSON | ✅ 04/08 — validado ao vivo |
| P3.6 | Engrenagem discreta + login que **descriptografa** | ✅ 04/08 — cifragem provada no navegador |
| P3.7 | Telas administrativas: elenco, gerar, conferir | ✅ 04/08 |
| P3.8 | Publicação por commit via API do GitHub + baixar JSON | ✅ 04/08 — código pronto; **falta o Flavio colar o token** |
| P3.9 | **Motor**: proposta, explicação, arbitragem e auditoria — degradável sem crédito | ⏳ **próximo** |
| P3.10 | Histórico de publicações com reversão pela tela | ⏳ (a API já lê o histórico) |
| P3.11 | Primeira geração real 05/08 → 30/12, com Santa Ceia em 16/08 | ✅ 04/08 — publicada |
| P3.12 | **Ajuste manual**: trocar uma pessoa num turno, com validação na hora | ⏳ |
| P3.13 | Mês da lista de filtros ainda usa `toISOString()` (UTC) em `App.tsx:56` | ⏳ resto do defeito que o domínio já corrigiu |

---

## Como usar este arquivo

- **Concluiu um item?** Tire daqui e registre no histórico com data e **evidência** (`arquivo:linha`,
  saída de teste, captura ao vivo). Item que sai sem prova volta.
- **Descobriu algo novo?** Entra aqui **no ato**, com prioridade.
- **Item de P0 nunca é decidido pelo assistente** — mesmo que a resposta pareça óbvia.
