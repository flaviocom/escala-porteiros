# DIÁRIO DE BORDO — escala-porteiros

> **Rastreabilidade total.** Cada entrada registra: **solicitação → pesquisa → decisão → porquê →
> como reverter.** Documento **append-only**, fatiado por período ao estourar o teto. **Nada é
> excluído, nunca.**
>
> **Cadeia de navegação:** [`ESTADO.md`](ESTADO.md) → [`handoff mais recente`](docs/handoff/HANDOFF_2026-08-04.md) → [`BACKLOG.md`](BACKLOG.md)
> **Roteador:** [`AGENTS.md`](AGENTS.md) ·
> **Solicitações:** [`docs/solicitacoes/INDICE_DE_SOLICITACOES.md`](docs/solicitacoes/INDICE_DE_SOLICITACOES.md) ·
> **Histórico:** [`docs/historico/INDICE.md`](docs/historico/INDICE.md)

---

## DB-001 · 04/08/2026 · Nascimento do projeto e desenho da área administrativa

### Solicitação (Flavio, verbatim resumido)

Identificar o projeto `escala-irmaos-2026-mar` nas pastas e no GitHub, levantar **regras, dias,
escala e restrições por participante**, e criar um **projeto novo** — pasta nova e repositório novo —
com uma **área administrativa**, porque *"sempre acontece de saírem pessoas da escala e acrescentarem
nomes"*, e é preciso **redistribuir** respeitando as regras, as validações e a **regra de
distanciamento**: *"a última pessoa que esteve na quarta-feira não pode ser escalada no sábado, salvo
se não houver outra opção"*. Publicar **sem tirar o site do ar**, e poder gerar a escala do período
seguinte **dentro do mesmo site**.

### Pesquisa e medição (não presumida)

O gerador do site atual foi **portado e executado**, em `America/Sao_Paulo` e `Europe/Lisbon`. O
bundle publicado (`assets/index-D8_1_Rih.js`) foi extraído e **confere com o `src/`**. O `dist/` da
pasta local é build antigo e não é o que está no ar.

| Medição | Resultado |
|---|---|
| Período · turnos · vagas | 01/03 → 30/12/2026 · 184 · 549 |
| Turnos incompletos | **0** de 183 |
| Distribuição (14 sem cota) | 35–36 turnos cada |
| Cotas Thiago (2/mês) e Williams (3/mês) | cumpridas nos 10 meses |
| **Menor intervalo do Williams** | **1 dia**, em 7 ocorrências |
| **Pares com intervalo ≤3 dias** | **18** |
| **Casos "quarta → sábado"** | **6**, todos do Williams |

Nove defeitos confirmados (§12 do desenho). O mais urgente: **a Santa Ceia está com data errada no
site no ar** — código diz `07/06/2026`, o correto é **16/08/2026**, que é **domingo**, então o site
exibirá 6 porteiros escalados num dia sem escala.

**O padrão nos defeitos: todos são silenciosos.** Nenhum quebra a tela.

`_padroes-globais/` foi lido integralmente: 17 documentos, 4 skills e o template.

### Decisões

Doze do Flavio e três do assistente, todas registradas na §4 do desenho. As de maior consequência:

1. **Sem piso fixo de distanciamento.** *Por quê:* nas palavras dele, um número fixo *"pode
   impossibilitar (…) atender a escala"*, e o número muda com o tamanho do elenco. O motor **descobre**
   o maior piso que cabe e **informa** qual foi; se não fechar nem no mínimo, **declara que não foi
   possível gerar**.
2. **Geração por intervalo de datas, com contagem zerada e passado preservado.** *Por quê:* o passado
   já foi divulgado; reescrevê-lo faz o site desmentir o que os irmãos viram.
3. **Dados em JSON no próprio repositório, publicados por commit via API do GitHub.** *Por quê:*
   custo zero, sem servidor, o site continua estático — e cada publicação vira **um commit**, o que dá
   histórico e reversão de graça. Supabase foi descartado: o plano gratuito **hiberna após 7 dias sem
   uso**, e este site fica semanas sem administração.
4. **O motor distribui junto com o algoritmo** — decisão do Flavio, contra a recomendação inicial do
   assistente. *Como ficou seguro:* o portão determinístico fica **entre o motor e a publicação**;
   proposta que viola regra dura é reprovada e devolvida com a lista de violações, até 3 vezes; a base
   do algoritmo permanece sempre disponível.
5. **Congelar março→04/08 e gerar de 05/08 → 30/12.** *Por quê:* decidido por ele nesta sessão.
6. **Duas credenciais NOVAS, em vez de reaproveitar as da central.** *Por quê:* o `GITHUB_PAT`
   existente tem escopos amplos (`repo, workflow, admin:org, delete_repo, gist, packages`) e pendência
   de rotação desde junho/2026 — token com `delete_repo` num navegador é risco desproporcional para
   gravar um JSON. O `ANTHROPIC_API_KEY` existente roda o motor do ThetaLens em produção; vazamento
   por site público estático derrubaria o ThetaLens, não este projeto.

### Como reverter

Nada foi alterado fora desta pasta nova, exceto **duas linhas vazias acrescentadas ao fim** de
`D:\Antigravity\Meus-Projetos\.credenciais.env` (nomes `GITHUB_PAT_ESCALA_PORTEIROS` e
`ANTHROPIC_API_KEY_ESCALA`, **sem valor**). Para desfazer: apagar essas linhas e apagar a pasta
`D:\Antigravity\Meus-Projetos\escala-porteiros`. O repositório `escala-irmaos-2026-mar` **não foi
tocado** e o site continua no ar exatamente como estava.

### Skills e portões acionados

`brainstorming` (desenho antes de codar) · roteador de skills consultado · **pré-voo verde**
(`pre-voo.mjs`, exit 0) · `checar-tamanho-docs.mjs` (exit 0) · conector MCP do GitHub testado com
chamada real (`search_repositories`) · `gh` CLI testado com chamada real (`gh api .../pages` e
`gh run list`).

### Pendente

**Aprovação do desenho pelo Flavio** (P0.1). Nenhuma linha de código de produto foi escrita.
