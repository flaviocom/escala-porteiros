# DIÁRIO DE BORDO — escala-porteiros

> **Rastreabilidade total.** Cada entrada registra: **solicitação → pesquisa → decisão → porquê →
> como reverter.** Documento **append-only**, fatiado por período ao estourar o teto. **Nada é
> excluído, nunca.**
>
> **Cadeia de navegação:** [`ESTADO.md`](ESTADO.md) → [`handoff mais recente`](docs/handoff/HANDOFF_2026-08-04-d.md) → [`BACKLOG.md`](BACKLOG.md)
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

---

## DB-002 · 04/08/2026 · Quatro itens do backlog, e a lição dos portões que mentem

### Solicitação

S-004: segundo **"go"** — *"workflow completo item a item (…) sempre expandir, mapeando todas as
ligações em Documentos e Código antes de mexer (…) quem determina a ordem é você, sempre."*

### Decisões, e o porquê de cada uma

| # | Decisão | Por quê |
|---|---|---|
| 1 | Ordem P3.13 → P3.12 → P3.9 → P2.9 → P2.7 | maior dano primeiro (defeito silencioso de fuso), depois o que completa o pedido original, depois os portões |
| 2 | Não corrigir `ScheduleTable:114` | é chave de agrupamento e `startOfMonth` já é local — mexer seria risco sem ganho |
| 3 | O portão de fuso **prova que o fuso mudou** antes de rodar | um `TZ` ignorado pelo sistema faria o portão passar sem testar nada |
| 4 | O motor fatia por mês | ~264 nomes numa resposta só faz a taxa de erro crescer |
| 5 | O placar é **determinístico** | quem mede é o código. Deixar o motor avaliar a si mesmo seria pedir que o réu presidisse o júri |
| 6 | Falsos positivos viram caso **permanente** do autoteste | senão o mesmo engano volta na próxima régua |
| 7 | Inventário **reprova quando mede zero** | zero, num projeto com fontes externas, é medidor quebrado |

### O aprendizado que vale além deste projeto

**Autoteste passando prova os casos que alguém pensou em escrever, não cobertura.** Os dois portões
novos passaram nos próprios autotestes e estavam errados — um com 9 falsos positivos, outro
sempre-verde. O que os expôs foi rodar contra **código de verdade**.

E as duas causas já estavam documentadas no método (borda de regex; normalizar em vez de excluir).
Repeti as duas mesmo com o texto em contexto — que é exatamente a razão de o método preferir portão
a disciplina.

### Como reverter

Cada item é um commit próprio, com o porquê na mensagem. Reverter um não derruba os outros. Os
dados publicados não mudaram nesta parte — só código, portões e documentação.

---

## DB-003 · 04/08/2026 · A auditoria que achou o que os testes não achavam

### Solicitação

S-005: terceiro **"go"**, mesma instrução — workflow completo em loop, ordem do assistente.

### O achado que importa, e por que ele escapou de 71 testes

A validação **aprovava** uma escala com pessoa **desativada**. D8 conferia `bloco.elenco` e não o
campo `ativo`.

Escapou porque o gerador consulta `podeAssumir`, que já barra inativo — então **a escala gerada
nunca continha o caso**, e nenhum teste do gerador poderia encontrá-lo. O buraco só se abre por
três caminhos que os testes não exercitavam: ajuste manual, bloco importado, e alguém desativado
**depois** de a escala ser gerada.

Esse terceiro caminho é literalmente o motivo de o projeto existir: *"sempre acontece de saírem
pessoas da escala"*.

**A lição:** provar a REGRA não é provar o CAMINHO. Testar o gerador prova que ele não produz o
defeito; não prova que a validação o pegaria se viesse de outro lugar. A validação é a última
linha antes de publicar, e precisa cobrir portas que o gerador nunca abre.

### O segundo achado, e o que ele ensina sobre réguas

O detector de código morto acusou 8 funções; 7 eram inocentes — ele ignorava o próprio arquivo e
os testes como consumidores. **Régua frouxa não é conservadora: é ruidosa.** E ruído em portão é o
que faz alguém desligá-lo, levando junto a proteção. Afinado, sobrou uma de verdade.

### Como reverter

Cada item é um commit próprio. A correção do D8 tem 2 testes que ficam vermelhos se alguém a
desfizer. Os dados publicados não mudaram nesta parte.

### Limite declarado

**A auditoria foi feita por quem escreveu o código.** O método é explícito: *"quem escreveu
carrega os mesmos pontos cegos ao testá-lo"*. Os 2 achados provam que o ataque valeu; **não**
provam que não há mais nada. Auditor independente continua pendente no backlog.

---

## DB-004 · 04/08/2026 · A regra que não tinha régua, e dois erros meus

### Solicitação

S-006: quarto **"go"**. Com o backlog fechado, a ordem foi achar o que ainda faltava.

### Decisões

| # | Decisão | Por quê |
|---|---|---|
| 1 | Atacar a **Regra Mestra 3** | era a única regra do Flavio sem portão, portanto sem medida |
| 2 | Cada dica **escrita à mão** | dica que repete o rótulo é ruído; o script falha para botão sem dica em vez de inventar |
| 3 | Validar em **celular** | é o aparelho que está com ele quando alguém avisa que não pode ir |
| 4 | **NÃO** implementar arrastar-e-soltar | o ajuste manual mostra o motivo ANTES do clique; arrastar só descobre a violação depois de soltar. Convenção de casa, declarada — e reversível se ele quiser |

### Os dois erros, registrados porque o valor está neles

**Quebrei o JSX** com aspas duplas dentro de uma dica. O TypeScript acusou 4 erros, três em linhas
sem defeito — o que faz procurar no lugar errado.

**Publiquei com o gate vermelho**, por encadear `npm run gate ; git commit`. O site não quebrou
porque o build faz parte do gate e `docs/` não foi regerado. **Sorte não é processo.** É a mesma
família do pipe que engole o exit code: o veredito existia e foi ignorado.

Os dois viraram portão: `title` com aspas duplas é reprovado, e o portão das Regras Mestras entrou
no GATE. Logo depois, o gate **recusou** um commit meu — dessa vez antes do push.

### Como reverter

Cada item é um commit próprio. Os tooltips são atributos `title`: removê-los não muda
comportamento, só derruba o portão de 100% para abaixo do piso.

---

## DB-005 · 04/08/2026 — conferir o passado contra a TELA, não contra o código

**Solicitação:** [S-007](docs/solicitacoes/INDICE_DE_SOLICITACOES.md) — quinto "go", backlog vazio,
ordem do assistente. **Handoff:** [parte 5](docs/handoff/HANDOFF_2026-08-04-e.md).

### O que se perguntou

Sem tarefa na lista, a pergunta deixou de ser *"o que falta fazer?"* e virou **"qual afirmação deste
projeto nunca foi testada de verdade?"**. A resposta: o histórico congelado foi montado rodando o
**gerador antigo a partir do código-fonte** — fidelidade ao código, nunca à tela. E é a tela que os
irmãos têm na memória.

### Decisões

| # | Decisão | Por quê |
|---|---|---|
| 1 | Conferir os **66 dias**, não uma amostra | "sem divergência sistemática" não é "conferido": o defeito que importa pode estar no dia que não foi sorteado |
| 2 | Conferir pela **busca** do site antigo | é o único caminho que traz uma data passada à tela — o site não lista o passado |
| 3 | **Não** pôr esta checagem no GATE | depende do Pages do repositório antigo estar no ar; portão que quebra por causa alheia é portão que alguém desliga. Fica sob demanda, com o resultado datado no handoff |

### O resultado

**66 de 66 dias · 282 nomes · 0 divergências.** A promessa *"o passado continua"* passou de
presumida a medida.

### Os dois achados

**O site antigo não mostra o passado.** Ele lista do dia de hoje em diante. Quem abrir aquele link
hoje não vê março a julho. Virou P1.3 — não tem correção lá (o repositório não é tocado); some
quando o link novo for divulgado.

**Régua errada se lê como divergência total.** A varredura deu **"0 de 66"** duas vezes. Um número
vermelho dramático convence tão bem quanto um verde falso, e leva à conclusão oposta ao fato — quase
virou "o histórico congelado está todo errado". O guard procurava `01/03`; o site escreve `MAR`,
`01`, `DOMINGO` **em linhas separadas**. Corrigido depois de **medir** o texto renderizado, não de
supor o formato pela terceira vez.

O guard fez o trabalho dele: sem ele, "nenhum nome faltando" num texto vazio teria produzido
**"✅ 66 dias conferidos"** sem conferir nada.

### Como reverter

`scripts/conferir-historico-contra-site-antigo.mjs` é um script de verificação: não é chamado por
nada e apagá-lo não muda comportamento — só perde a prova.
