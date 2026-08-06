# AI_MASTER_LOG — escala-porteiros

> Diário cronológico do trabalho. Documento **append-only**, fatiado por período ao estourar o teto.
> O **porquê** de cada decisão vive no [`DIARIO_DE_BORDO.md`](DIARIO_DE_BORDO.md); aqui fica o
> registro do que foi feito, passo a passo.
>
> **Cadeia de navegação:** [`ESTADO.md`](ESTADO.md) → [`handoff mais recente`](docs/handoff/HANDOFF_2026-08-06.md) → [`BACKLOG.md`](BACKLOG.md)
> **Roteador:** [`AGENTS.md`](AGENTS.md) ·
> **Solicitações:** [`docs/solicitacoes/INDICE_DE_SOLICITACOES.md`](docs/solicitacoes/INDICE_DE_SOLICITACOES.md) ·
> **Fatias arquivadas:** [`docs/historico/INDICE.md`](docs/historico/INDICE.md)

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

---

## [04/08/2026] Sessão 1 — continuação: o produto no ar

**Gatilho.** O Flavio deu o "go": workflow completo no padrão-ouro, em loop, ordem do assistente.

**Feito, na ordem em que aconteceu:**

1. Repositório `flaviocom/escala-porteiros` criado, público, conferido **no remoto**.
2. Cadeia documental ligada: `ESTADO → handoff → BACKLOG`, mais roteador, índice de solicitações e
   índice do histórico. Portão de órfãos: **10 documentos, 0 órfãos, 0 links quebrados**.
3. 🔴 **O disco `D:` inviabilizou o build.** Medido em repouso: **79.844 ms para 100 arquivos
   pequenos**, contra **45 ms em `C:`** — 0,8 s por arquivo. Junção (`mklink /J`) não resolve: o npm
   apaga `node_modules` que não seja diretório real. Contornado clonando em `C:`, onde o
   `npm install` levou **14 segundos**.
4. Núcleo do domínio: datas locais em texto, tipos, malha como dado, catálogo de 15 regras,
   validação e gerador. **55 testes verdes**, cada regra provada nas duas pontas.
5. Carga inicial conferida contra a fonte: **184 turnos, 549 vagas, 549 preenchidas**.
6. Geração real de 05/08 a 30/12: **piso 6 descoberto** (tentou 9, 8, 7), **0 pares com ≤3 dias**
   (eram 18), Santa Ceia em **16/08 com ninguém escalado**.
7. 🔴 **`"strict"` estava comentado no `tsconfig` herdado.** Ligar resolveu 12 erros de estreitamento
   e revelou 9 trechos de código morto.
8. Site publicado no GitHub Pages (`main` + `/docs`) e **validado ao vivo no navegador**.
9. Área administrativa no ar: cofre (PBKDF2 + AES-GCM), elenco, geração, conferência e publicação
   por commit. **Validada ao vivo**, incluindo a prova de que a cifragem morde.

**Portões rodados:** `pre-voo` exit 0 · `checar-orfaos-doc` exit 0 · `checar-tamanho-docs` exit 0 ·
`npm run gate` exit 0 (typecheck 0 erros, 55 testes, build 2,46 s) · validação ao vivo do site e da
área administrativa, ambas aprovadas.

**Pendente:** o motor (P3.9), o ajuste manual (P3.12), o histórico com reversão pela tela (P3.10) e a
auditoria adversarial (P2.10). E, do lado do Flavio, colar as duas credenciais.

---

## [04/08/2026] Sessão 1, parte 2 — quatro itens do backlog, e dois portões que mentiam

**Gatilho.** Segundo "go" do Flavio (S-004): workflow completo, em loop, ordem do assistente.

**Ordem que eu determinei** — maior dano primeiro, depois o que não depende de terceiro:
P3.13 → P3.12 → P3.9 → P2.9 → P2.7.

1. **P3.13** — mês lido em UTC. Mapeadas **4 ocorrências** antes de mexer; 3 corrigidas, 1
   (`ScheduleTable:114`) deixada de propósito por ser só chave de agrupamento. Portão novo:
   `test:fuso:berlim`, que roda a suíte noutro fuso **depois de provar que o fuso mudou**.
   Provado com infrator injetado: passa em São Paulo, falha em Berlim.
2. **P3.12** — ajuste manual turno a turno, com o motivo de cada impedimento antes do clique.
3. **P3.9** — o motor, com o portão determinístico entre a proposta e a publicação, fatiado por
   mês, e placar determinístico comparando as duas escalas.
4. **P2.9** — portão de denominação. 🔴 Passou no autoteste (17/17) e produziu **9 falsos**
   **positivos** reais. Causas: borda de regex só cobria minúscula (`SANTA CEIA` → "IA") e
   expressão de template lida como texto (`NOMES_DIA`). Os 9 viraram casos permanentes.
5. **P2.7** — inventário de fontes. 🔴 Nasceu **sempre-verde**: mediu 0 hosts e disse "toda fonte
   declarada", porque o `//` de `https://` era comido como comentário. Corrigido, com autoteste do
   medidor e reprovação automática quando medir zero.

**Portões ao fim:** `npm run gate` (typecheck + 71 testes × 2 fusos + denominação + fontes +
build) exit 0 · órfãos 0 · site e área administrativa validados **ao vivo** no navegador.

**Pendente:** P3.10 (histórico com reversão pela tela) e P2.10 (auditoria adversarial).

---

## [04/08/2026] Sessão 1, parte 3 — os dois últimos itens do backlog

**Gatilho.** Terceiro "go" (S-005).

1. **P3.10** — histórico com reversão. O mapa feito antes de mexer achou `historicoPublicacoes()`
   **sem consumidor**: o ERRO 12 no código desta própria sessão. Ligado, com leitura do arquivo
   num commit específico e reversão que **não apaga nada** — publica de novo.
2. **P2.10** — auditoria adversarial: 17 checagens em 5 frentes, com infrator injetado.
   🔴 **Achado 1:** pessoa desativada escalada era aprovada (D8 olhava só o elenco do bloco).
   🔴 **Achado 2:** o detector de código morto era frouxo — 8 acusados, 7 inocentes. Afinado,
   sobrou `formatarMesBR`, removida.

**GATE final:** typecheck + 73 testes × 2 fusos + denominação + fontes + auditoria + build.

**Pendente:** auditor **independente** (o limite estrutural da autoauditoria) e as credenciais.

---

## [04/08/2026] Sessão 1, parte 4 — a Regra Mestra 3, que era regra sem portão

**Gatilho.** Quarto "go" (S-006), com o backlog técnico já vazio.

- **Tooltips: 17% → 100%.** O grep ingênuo dizia 0%; o número real era 8 de 46. Medir errado
  quase me fez escrever 38 dicas sobre diagnóstico falso.
- **README** escrito — o repositório não tinha porta de entrada.
- **Celular validado ao vivo**: achou alvo de toque de **16px** nos botões de senha. Corrigido
  para 44px.
- **Arrastar-e-soltar:** não implementado, por decisão declarada (ver handoff).

🔴 **Dois erros meus:** quebrei o JSX com aspas duplas numa dica, e **publiquei com o gate**
**vermelho** por encadear com `;`. O site não caiu por sorte. Os dois viraram portão.

**GATE agora tem 8 passos**, com `regras-mestras` incluído.

---

## [04/08/2026] Sessão 1, parte 5 — conferir o passado contra a tela

**Gatilho.** Quinto "go" (S-007), backlog técnico vazio pela segunda vez.

- **Histórico congelado conferido contra o site antigo AO VIVO:** 66/66 dias, **282 nomes**,
  **0 divergências**. Antes, a fidelidade era ao código-fonte; agora é à tela que os irmãos viram.
- 🔴 **Achado:** o **site antigo não mostra o passado** — lista do dia de hoje em diante. Quem abre
  aquele link hoje não vê março a julho. Virou P1.3.
- 🔴 **Erro meu, pego pelo portão:** o guard procurava a data em `01/03` e deu **"0 de 66"** duas
  vezes. O site escreve `MAR` / `01` / `DOMINGO` em linhas separadas. **Formato se mede, não se
  supõe** — e "0 de 66" quase foi lido como divergência catastrófica quando era régua errada.
- **Decisão declarada:** esta conferência **fica fora do GATE** (depende do Pages do repositório
  antigo). Roda sob demanda; o resultado fica datado no handoff.

**Skills acionadas:** `engineering-loop`, `loop-autonomo`, `documentacao-auditavel`, `ponytail`.

**Continuação da parte 5 — o pré-voo deste projeto achou 3 defeitos no MÉTODO.** O portão de
tamanho disse "15 medidos" num projeto de 16 (o `docs/historico/INDICE.md` era isento por estar sob
`historico/`, mas é documento vivo). Puxando o fio: **ERRO 15 e ERRO 27 duplicados** no catálogo de
anteparos, índice parado no 26 com 31 erros existentes, `ANTEPAROS.md` 133 linhas acima do teto, e
**12 scripts com um único autoteste que ninguém rodava**. Tudo corrigido em
`flaviocom/padroes-globais` (`b08b6ec`): 2 portões novos com autoteste nas duas pontas, catálogo
dividido por assunto, e o pré-voo agora roda **todos** os autotestes antes de cada tarefa.
Registrado como ERRO 32 e ERRO 35.

**Continuação — o cenário do projeto, provado, e um anteparo que eu desliguei sem perceber.**
`npm run ensaio` roda o pedido original de ponta a ponta: sai o mais escalado, entra um irmão com as
**quatro** famílias de restrição, e a escala se refaz. **11 de 11 promessas**, inclusive o passado
byte a byte idêntico. Achou um defeito real no produto: o motivo de barragem ficava **mudo**
(`ROTULO_TURNO` de um literal inválido → `undefined` → `join` vira string vazia). Corrigido, 4 testes,
3 deles mordem. 77 testes verdes em 2 fusos.

🔴 **E o mais grave:** editando o TEXTO de um hook do método, uma crase fechou o template literal e o
hook passou a estourar. **Hook que estoura falha ABERTO** — o comando seguinte, que ele existe para
barrar, passou sem aviso. O pré-voo agora roda cada hook e este é o único item **obrigatório** do
grupo MÉTODO. ERRO 36 e ERRO 37 em `padroes-globais@ee95d91`.

---

## [04/08/2026] Sessão 1, parte 6 — o grafo, e o passado que sumia na tela

**Gatilho.** Sexto "go" (S-008), com um pedido de panorama no meio.

- **Grafo de importações mapeado antes de mexer**: a tela usa o domínio que o ensaio provou, sem
  caminho paralelo. A pergunta valia: o site antigo tinha lógica duplicada.
- 🔴 **Achado:** `definirPessoas` filtrava por `ativo` → **quem sai do elenco perdia o passado na
  tela**. Medido ao vivo (Carlos Henrique, 36 turnos): id cru no lugar do nome, busca vazia,
  estatísticas sem os turnos dele. **Console limpo** — o defeito era silencioso.
- **Corrigido**: `BROTHERS` com todos + `ativo`; filtrar é decisão de quem escala, não de quem
  desenha. 5 testes (3 mordem) + frente "camada de tela" na auditoria adversarial.
- 🔴 **Falso positivo da checagem nova**: acusou o comentário que documenta o defeito. Corrigido.

**82 testes verdes em 2 fusos · auditoria 20 checagens, 0 achados · 17 documentos, 0 órfãos.**

**Skills acionadas:** `graphify` (mapa antes de mexer), `engineering-loop`, `ponytail`,
`documentacao-auditavel`, `loop-autonomo`.

**Continuação da parte 6 — caminho de erro, régua por turno e acessibilidade.**
`vivo:erro`: 8 checagens, nenhuma falha de carregamento deixa tela branca; corrigida uma mensagem
que mandava "ajustar os filtros" sem filtro nenhum aplicado. `vivo:conferir` passou a medir **por
turno** — a versão por dia aprovava manhã e noite trocadas, e eu tinha chamado aquilo de "543 nomes
conferidos" (ERRO 32 na minha própria régua, no dia em que o escrevi). `vivo:acessibilidade`:
contraste **159 → 0** sem trocar a paleta, e o botão do WhatsApp resolvido sem tocar no verde da
marca. 🔴 Dois defeitos da minha régua: "sem foco visível" era falso (`.focus()` não dispara
`:focus-visible`) e "159 textos" eram 8 combinações repetidas.

---

## [04/08/2026] Sessão 1, parte 7 — a imagem do WhatsApp

**Gatilho.** S-009: uma imagem de referência (`escalaagosto2026.png`), sem mais instrução.

- **Descoberto ao abrir o código:** a exportação fotografava a tela e **fatiava em 5 dias**. Numa
  escala de 5 meses, saíam 5 dias — e o erro pedia "filtre um período menor". É por isso que havia
  um arquivo de referência feito por fora.
- **Construído:** `src/export/EscalaImagem.tsx` (layout, estilos em linha) + `gerarImagem.ts`
  (monta fora da vista, captura) + `dados/filtrar.ts` (filtro único: tela **e** imagem).
- **Corrigido na comparação:** Santa Ceia fora da legenda; contagem que a somava como turno.
- **Portões:** 11 testes sobre o que não aparece no pixel + `npm run imagem`, que gera pelo **botão**
  e confere as dimensões do PNG.

**93 testes verdes em 2 fusos · imagem 1440×2900 · GATE 8 passos.**

**Skills acionadas:** `impeccable` (o desenho), `ponytail` (testar lógica, não pixel),
`graphify` (mapear o caminho da exportação antes de mexer), `documentacao-auditavel`.

## 04/08/2026 — parte 8: a auditoria independente (P2.10)

- **Solicitação:** "go". Escopo escolhido: o único item autônomo em aberto do backlog.
- **6 auditores independentes**, frentes disjuntas, mandado adversarial, prova empírica obrigatória.
- **20 achados.** Graves: bloco vazio aprovado (destravava o Publicar) · D9 cega ao calendário da
  Santa Ceia · 3 portões que não mordiam · verde "ao vivo" sobre bundle antigo · a tela afirmando
  "nada publicado pela metade" quando podia ter sido · roteador apontando para a parte 4 de 7.
- **Corrigidos com prova nas duas pontas.** D11 nova; D9 reescrita contra o calendário; `Contexto`
  com `config` obrigatório (13 chamadores) e falha fechada nos scripts.
- **Portões novos:** `contagem` (achou 8 divergências), `cadeia` (ordenação de handoff que a
  ordenação alfabética erraria). **Corrigidos:** `fontes` (26→48 arquivos), `auditoria` (dois cegos),
  `regras-mestras` (clicáveis fora de `<button>`).
- **Acessibilidade:** o seletor de filtros era `<div onClick>` — inacessível por teclado. 100% dos
  botões com tooltip, 0 clicáveis sem papel declarado.
- **Método:** o pré-voo ganhou `deps: {bloqueia, motivo}`, que falha fechada (`padroes-globais`
  155b9a2), fechando o P2.12.

**107 testes verdes em 2 fusos · GATE 10 passos, exit 0 · 7 achados menores em P4 do backlog.**

**Skills acionadas:** `padrao-ouro` (o ciclo), `loop-autonomo`, `documentacao-auditavel`,
`ponytail` (remover em vez de ligar o estado morto), `impeccable` (acessibilidade do seletor).

---

## 05/08/2026 — sessão 2: o dia das quatro auditorias

**Solicitações atendidas:** S-013 a S-031 (ver
[índice](docs/solicitacoes/INDICE_DE_SOLICITACOES.md)). As de maior consequência: a divergência de
87 turnos (S-021), a regra máxima de escopo (S-017), a tolerância do teto (S-025), a finalidade em
três fases (S-029) e a tolerância zero (S-031).

**Quatro auditorias externas independentes, em frentes disjuntas — 48 achados, todos fechados e
provados nas duas pontas:**

| # | Frente | Achados | O pior dela |
|---|---|---|---|
| 1 | documentação × código | 15 | `config.identidade` existia em 3 lugares e **nunca era lida** |
| 2 | portabilidade (só docs, código proibido) | 3 estruturais | o gerador **não tinha receita**: nem fórmula do piso, nem ordem de escolha |
| 3 | regressões e fronteiras | 20 | `ultimoDiaDoMes` errava **só em UTC−3**, e o portão de fuso testa UTC+2 |
| 4 | o caminho de publicação | 10 | gerar período **menor** apagava 73 turnos já divulgados, e o guarda aprovava |

**O padrão que apareceu nas quatro:** *a fronteira do portão é onde o defeito mora.* Cinco vezes —
`import` de imagem sem texto · `package.json` fora da varredura · aspas duplas · só `.md` · número
antes da palavra. Cada achado que escapou virou critério novo.

**O que ficou construído:**

- **11 portões novos**: genérico + autoteste · catálogo gerado · comandos citados · arquitetura ·
  fatos medidos · datas · citações · crescimento · tamanho de documentos · caminho inteiro · estado
  entre abas.
- **9 documentos de reconstrução**, sob [`docs/RECONSTRUIR.md`](docs/RECONSTRUIR.md) — para outra IA
  reconstruir o produto sem ter participado de nada.
- **O produto virou genérico**: nome, subtítulo, emblema e vocabulário são dado, com tela.
- **A escala de 06/08 a 31/12** publicada, conferida ao vivo, com o passado de 01/03 a 05/08
  congelado e a Santa Ceia errada de 07/06 preservada como ele mandou.

**232 testes verdes em 2 fusos · GATE 20 passos, exit 0 · caminho inteiro percorrido num navegador.**

**Skills acionadas:** `padrao-ouro` (o ciclo inteiro, quatro vezes), `loop-autonomo`,
`documentacao-auditavel`, `deep-research` (a pesquisa sobre gerar N versões), `ponytail` (remover
estado morto em vez de ligá-lo), `impeccable` (alvo de toque, contraste, foco).

---

## 05/08/2026 — sessão 2, parte 5: a quinta auditoria externa

**Solicitação:** S-032 — *"go workflow completo item a item… sempre expandir… quem determina a ordem
é você, sempre."*

**Skills acionadas:** `engineering-loop` (o ciclo) · `loop-autonomo` (executar de ponta a ponta sem
devolver a bola) · `documentacao-auditavel` (esta entrada, o Diário e a cadeia) · `ponytail` (D12 é
uma regra, não um remendo em D1; a fronteira do portão de "ensaio" é uma propriedade, não um
subsistema).

### O que a quinta auditoria mirou, e por que ela achou

As quatro anteriores olharam o domínio, os portões, a documentação e o caminho do Flavio. Esta mirou
o que **nenhuma** tinha olhado: entrada hostil, concorrência entre abas, a matemática do Jain, a
imagem do WhatsApp aberta pixel a pixel, acessibilidade fora da primeira tela, e `localStorage`.

**21 achados** — 3 vermelhos, 9 laranjas, 9 menores. Todos fechados.

| # | Achado | Medido |
|---|---|---|
| 1 🔴 | publicar 2× na mesma sessão apagava a 1ª publicação | **55 turnos** somem; guarda diz `ok=true` |
| 2 🔴 | `capacidade: 0` passava pelas DUAS réguas | 110 turnos · 0 escalados · "sem ressalvas" |
| 3 🔴 | a ponte dado→tela sem um único teste | 4 mutantes destrutivos passam em 232/232 |
| 4 | "gerar outra combinação" um clique atrasado | 1º clique devolve escala idêntica byte a byte |
| 5 | "ENSAIO" cravado no site e na imagem | `Turno.rotulo` lido em 1 de 3 lugares |
| 6 | 2ª régua sem checagem de vacuidade | 3 cenários, 0 furos de 7 |
| 7 | acessibilidade media a tela FECHADA | 4 falhas WCAG a um toque |
| 8 | reverter fora da trava de publicação | grava os mesmos 2 arquivos |
| 9 | `localStorage` nu + sem `ErrorBoundary` | tela branca com cookies bloqueados |
| 10 | digitar após atalho zerava a escala | 15 caracteres para desfazer |
| 11 | motor sem trava modular | 2 execuções pagas em paralelo |
| 12 | testes por vacuidade | inclusive os 2 do piso e o das 8 versões |

### As frentes que NÃO renderam achado (medidas, não presumidas)

Fuzz de 400 rodadas com restrições sorteadas: **286 escalas geradas, 0 reprovadas**. `podeAssumir` ×
D3–D8 em 5.000 sorteios: **0 divergências**. `indiceDeJain` correto nos casos-limite. As 8 chamadas
de `fetch` do projeto **todas** conferem `response.ok` — é o ponto mais bem defendido do código.
Duplo clique em Gerar e em Enviar: travados. `.skip`/`.only`/`expect` comentado: zero.

### O que ficou provado

`EXIT_GATE=0` em **20 passos** · **263 testes** (eram 232) · catálogo com **17 regras** (12 duras) ·
**13 validações ao vivo** verdes · acessibilidade: 4 cenas, 3.952 textos, **0** abaixo do piso.

Os três vermelhos foram medidos **no dado real**, antes e depois — e foi essa medição que pegou o
defeito que eu mesmo introduzi em D12 (o `slice` nos turnos em vez das violações), que os cinco
testes novos não pegavam.

**Handoff:** [`HANDOFF_2026-08-05-f.md`](docs/handoff/HANDOFF_2026-08-05-f.md) ·
**Diário:** DB-018 a DB-021.

---

## 05/08/2026 — sessão 2, parte 6: a sexta auditoria, em três frentes

**Solicitação:** S-033 — a mesma instrução da anterior, reemitida: *"go workflow completo… em loop,
sem parar… quem determina a ordem é você, sempre."*

**Skills acionadas:** `engineering-loop` · `loop-autonomo` · `documentacao-auditavel` · `ponytail`
(tirar a decisão da tela em vez de montar `jsdom`; `excetoEm` como propriedade e não como subsistema).

### As três frentes, disjuntas por construção

| frente | por que ela existe | achados |
|---|---|---|
| **o código que nasceu hoje** | correção recém-escrita é o código menos auditado do projeto — e neste projeto já aconteceu duas vezes de uma correção nascer com o defeito que ela fechava | 7 + 5 menores |
| **o dado publicado, até o pixel** | o dado é o produto; medi-lo de fora é a única prova que não depende do código | 4 |
| **os portões medem o que dizem?** | *"a fronteira do portão é onde o defeito mora"* já apareceu 7 vezes | 15 |

**25 achados. Todos fechados.**

### O que mais importa deste dia

**1. O dado publicado está impecável**, e isso foi medido de oito ângulos independentes: as duas
pastas idênticas byte a byte · o site no ar com sha256 igual ao do repositório · `conferirEsquema`
com 0 problemas · **183/183 turnos e 543/543 nomes** conferindo turno a turno com a tela · fronteira
contígua entre os blocos com o piso de 7 dias respeitado ATRAVESSANDO ela · as 17 regras e a segunda
régua concordando · virada de ano em 6 fusos de UTC−11 a UTC+14.

**2. Três correções da manhã estavam na variável errada.** Uma correção que menciona o defeito no
comentário não é uma correção verificada.

**3. O gate não executava uma linha da tela onde o Flavio clica** — e a resposta certa não foi montar
teste de componente, foi **tirar a decisão da tela**.

**4. O incidente do selo.** Um `git add -A` meu capturou o mutante de um auditor; o commit `3f8e366`
está na história com o produto quebrado e a mensagem afirmando `EXIT_GATE=0`. Produção nunca recebeu
o defeito. O commit não é reescrito, e o 24º passo do gate impede a repetição.

### Frentes que NÃO renderam achado (medidas, não presumidas)

A matemática do gerador contra o catálogo em fuzz de 400 rodadas: **286 escalas, 0 reprovadas**.
`podeAssumir` × D3–D8 em 5.000 sorteios: **0 divergências**. As 8 chamadas de `fetch` conferindo
status — o ponto mais bem defendido do código. Dezoito dos 20 passos do gate morderam nas duas pontas
sob mutante injetado **em código**. Nenhum portão mente sobre o próprio tamanho: a doença deste
projeto não é contar errado, é **a fronteira ser menor que a frase**.

### O que ficou provado

`EXIT_GATE=0` em **24 passos** (entraram `ensaio`, `tempo`, `imagem` e o selo) · **298 testes** ·
**13 fatos medidos** · acessibilidade com 47/47 focáveis, 0 abaixo do contraste e 0 cortado a 200% ·
33 mutantes injetados pelo auditor, e os que não mordiam passaram a morder.

**Handoff:** [`HANDOFF_2026-08-05-f.md`](docs/handoff/HANDOFF_2026-08-05-f.md) ·
**Diário:** DB-022 a DB-025.

---

## [06/08/2026] Sessão 2, parte 7 — Sétima auditoria, republicação da escala e quatro portões

**O quê.** Fechamento dos achados da sétima auditoria externa, **republicação da escala inteira** com
autorização explícita do dono, e quatro portões novos — cada um nascido de um defeito que os portões
existentes não enxergavam **por não terem sido perguntados**.

**Feito:**

1. **Sétima auditoria fechada** (`962847c`) — o buraco de 93 dias que o Publicar aceitava
   (`conferirBuracoNaEscala`, bloqueante), a aba `Ajustar` que acusava tudo de amarelo (comparava
   contra o piso pedido, não o alcançado), o `validar-celular` que media uma tela prometendo duas,
   6 tooltips mentirosos, alvos de toque abaixo de 44px, 4 populações viradas em fatos medidos
   (13 → 16), 5 testes de domínio faltando — e **o item P7.7 do BACKLOG, marcado como FECHADO sem
   ter sido feito**.
2. **Escala regerada e republicada** (`66f90e2`) — o Williams estava com **5 turnos em agosto** com
   teto 3, **em produção**. A correção mínima **não existia**: em 26/08, 8 pessoas passavam nas
   regras duras e **nenhuma** respeitava o piso de 7 dias. Autorizado pelo Flavio ("essa escala é
   fictícia, não foi divulgada"), 85 de 87 turnos mudaram. **Seis portões rodaram antes de escrever
   qualquer arquivo**; medido no ar: impressão digital idêntica à local, **0 estouros de teto**.
3. **`refazer` ficou vermelho acusando o inocente** — ele reconstruía **uma** fronteira (o descanso)
   e não a **segunda** (a cota mensal), que virou entrada do gerador na mesma auditoria. Regra que
   fica: **entrada nova no gerador é entrada nova no refazedor, no mesmo passo.**
4. **`vivo:rotulos`** (passo 22) — o campo da Santa Ceia nascera só com `title`, e o validador de
   "Gerar" procurava campos **por posição**: o campo novo entrou no meio e o teste passou a digitar
   a data da ausência dentro dele. 7 cenas, 18 campos.
5. **`ordem-do-gate`** (passo 8) — a lista do `PORTOES.md` **já estava fora de ordem antes**: `build`
   documentado como 21º, rodando em 24º. O total era medido; a ordem, não.
6. **`contagem` passou a conferir a LISTA** — o `README.md` dizia "12 regras duras" e enumerava 11.
7. **`handoff-orfao`** (passo 10) — o índice tinha **três linhas apontando para o mesmo arquivo**, e
   os handoffs `-d` e `-e` estavam invisíveis. Causa: substituição cega de nome.
8. **Nome não é sequência de bytes latinos** (`a3ccb46`) — emoji no começo do nome matava a imagem
   com "URI malformed" (4 lugares); dois nomes sem ASCII viravam a **mesma pessoa**.

**Estado:** `EXIT_GATE=0` em **29 passos** · 335 testes · 183 turnos no ar · 0 estouros de teto.

**Handoff:** [`HANDOFF_2026-08-06.md`](docs/handoff/HANDOFF_2026-08-06.md) ·
**Diário:** DB-026 a DB-028.
