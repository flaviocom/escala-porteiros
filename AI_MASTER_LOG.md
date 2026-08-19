# AI_MASTER_LOG — escala-porteiros

> Diário cronológico do trabalho. Documento **append-only**, fatiado por período ao estourar o teto.
> O **porquê** de cada decisão vive no [`DIARIO_DE_BORDO.md`](DIARIO_DE_BORDO.md); aqui fica o
> registro do que foi feito, passo a passo.
>
> **Cadeia de navegação:** [`ESTADO.md`](ESTADO.md) → [`handoff mais recente`](docs/handoff/HANDOFF_2026-08-19-e.md) → [`BACKLOG.md`](BACKLOG.md)
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

**Estado:** `EXIT_GATE=0` em **32 passos** · 341 testes · 183 turnos no ar · 0 estouros de teto ·
BACKLOG com **0 itens de tabela abertos**.

> ⚠️ **Esta entrada foi escrita no MEIO da sessão e ficou para trás** — dizia "29 passos · 335
> testes", e o trabalho continuou por mais três frentes. O portão de fatos não pegou porque
> arquivo append-only é **isento** dele, e a isenção supõe que a entrada está fechada quando
> escrita. **Entrada append-only escrita antes do fim da sessão é rascunho, não registro:** ou se
> escreve por último, ou se volta nela. Achado ao responder à pergunta *"ficou alguma pendência
> nas entrelinhas?"* — e não havia nada que a pegasse sozinha.

**Handoff:** [`HANDOFF_2026-08-06.md`](docs/handoff/HANDOFF_2026-08-06.md) ·
**Diário:** DB-026 a DB-030.

---

## [06/08/2026] Sessão 2, parte 8 — a tela pública, e o dia em que publicar virou o problema

**O quê.** O foco saiu do motor e foi para **o que o irmão vê ao abrir o link** — porque era isso que
o Flavio estava prestes a mandar no grupo. Três defeitos de tela, um de publicação, e dois que eu
mesmo criei tentando consertar.

**Feito:**

1. **🔴 O site não abria no próximo culto** (`d964647`) — medido no ar: abria em **MAR 01** com o
   próximo turno **32.496 px** abaixo. Ninguém tinha notado porque o navegador de quem já usa
   **restaura a rolagem anterior** no reload: o defeito só aparece para quem abre **pela primeira
   vez** — o irmão recebendo o link. A causa foi a soma de duas correções certas: a limpeza do
   temporizador (5ª auditoria) cancelava a rolagem que a trava `hasScrolled` se recusava a reagendar.
2. **"Esta Semana" de domingo a DOMINGO** (`446466e`) — pedido do dono: *"tem gente que acha que a
   semana começa na segunda, então ela não veria a escala do domingo próximo"*. E os atalhos
   passaram para a ordem menor→maior, iguais nos **dois** conjuntos de botões.
3. **As Estatísticas não diziam que período contavam** (`8ba5d98`) — com o filtro da semana ligado e
   visível em vermelho, a tabela mostrava março a dezembro, idêntica. Contar tudo é o certo; faltava
   **dizer**. O período agora é derivado dos próprios turnos, para não poder discordar da tabela.
4. **🔴 O GitHub parou de publicar** (`DB-032`, `DB-033`) — seis tentativas mortas: build passa,
   publicação é criada, e o relógio da ação (10 min) aborta. A publicação passou para um workflow
   próprio, com autorização do dono, e o teto subiu para 30 min.
5. **E dois defeitos que o remédio criou:** cancelar uma publicação pela API **envenena o SHA**
   daquele commit; e criar `.github/` **derrubou o selo**, que tentava ler uma pasta — pior, o
   conteúdo de pasta nova ficava **fora da impressão digital**, calado.

**Verificação que faltava, e a lição do dia.** Nada disso apareceu medindo o DOM. O primeiro
(`markdown cru na tela`) apareceu ao **olhar uma captura**; o segundo, ao medir **posição** em vez de
presença — `isVisible()` devolvia `true` com o alvo a 32 mil pixels. **Olho e medição pegam coisas
diferentes, e eu vinha usando só um.**

**Estado:** `EXIT_GATE=0` em **32 passos** · 341 testes · 183 turnos no ar · 0 estouros · BACKLOG com
**0 itens de tabela abertos**.

**Handoff:** [`HANDOFF_2026-08-06.md`](docs/handoff/HANDOFF_2026-08-06.md) ·
**Diário:** DB-031 a DB-034.

---

## [06/08/2026] Sessão 2, parte 9 — a tarde em que o produto passou a lembrar

**O quê.** O dono foi usar o sistema de verdade — tirar irmãos do elenco e gerar a escala — e cada
passo revelou algo. Nenhum achado veio de auditoria: vieram do uso.

**Feito:**

1. **🔴 O campo "Até" saltava um ANO sozinho** (`30e8154`) — ele publicou 12 meses sem perceber. A
   sugestão *"se sobrar menos de 30 dias, 31/12 do ano seguinte"* virava escada a cada publicação.
   E a data que ele acusou (*"30/12/2027, isso é um absurdo"*) estava **certa**: era consequência do
   ano publicado sem querer.
2. **Eu inventei uma trava de 6 meses que ele não pediu** (`b16306e`) — e desfiz.
   *"Você vai calcular o ano inteiro"*, *"não tem mínimo nem máximo"*. Ficou só a metade certa: a
   **janela visível**, sem julgamento.
3. **O bloco de 2027 apagado** e a **escala regerada com os 14 ativos** — a remoção revelou 26 turnos
   com Eduardo e Thiago, desativados e ainda escalados. Piso caiu de 7 para 4, o preço medido de dois
   irmãos a menos.
4. **D8 corrigida** — a `explicacao` prometia que o passado congelado não seria acusado por quem saiu,
   e o código acusava.
5. **O aviso "mexe em dias que já estão no ar" REMOVIDO** (`d06c69d`) — ele só falava de dias futuros,
   que o dono altera de propósito, e a lista "antes → depois" o fez concluir que quem saiu do elenco
   **voltava sozinho**. Um aviso que inventa defeito é pior que silêncio.
6. **A tela passou a lembrar** (`5f868d9`) — datas, pessoas por turno, Santas Ceias e elenco
   sobrevivem ao F5, com o rascunho **se declarando** e com botão de descartar.
7. **🔴 A raiz dos conflitos de porta da sessão inteira**: três scripts meus chamavam
   `servidor.parar?.()` — o método é `derrubar`. O `?.` engoliu o nome errado em silêncio e cada
   execução deixou um servidor vivo. No `vivo:publicar` isso fazia o processo terminar com 9 de 9 e
   **nunca encerrar**: 10+ minutos de espera viraram **15 segundos**.

**O fio que liga a tarde inteira:** três vezes uma sonda minha mediu a si mesma e quase virou chamado
falso — o teste que lia o campo depois de tê-lo preenchido, a leitura dupla do rascunho, e o "reload"
que só trocava o `#` e não remontava a aplicação. **Toda medição precisa da pergunta: e se o defeito
for do meu instrumento?**

**Estado:** `EXIT_GATE=0` em **32 passos** · selo conferido · 183 turnos no ar · 0 estouros de teto ·
14 ativos, e nenhum desativado escalado para a frente.

**Handoff:** [`HANDOFF_2026-08-06.md`](docs/handoff/HANDOFF_2026-08-06.md) ·
**Diário:** DB-035 a DB-038.

---

## 06/08/2026 · noite — "o botão é uma farsa", e cada peça estava certa sozinha

**Solicitação (S-038):** *"Distanciamento por pessoa, mesmo clicando várias vezes, não muda nada. O
'Não gostei — gerar outra combinação' é uma farsa."*

**Medido antes de tocar em qualquer linha:** quatro cliques na tela → a mesma escala; oito
sementes-base no domínio → **uma** escala entre as oito, com `semente escolhida: guloso` em todas.

1. **A causa era o oposto do que parecia.** A semente mudava a cada clique e as oito versões saíam
   **distintas** — a **cascata** é que escolhia sempre a versão gulosa, a única que não usa semente.
   Oito alternativas montadas, oito descartadas.
2. **Nenhum teste podia pegar.** Um provava que sementes diferentes dão escalas diferentes: passava,
   e está certo. Outro, que a escolhida nunca é pior que a gulosa: passava, e está certo. **O defeito
   morava na junção** — e a junção só existe inteira na tela, com este elenco. Daí a trava nova ser
   de navegador (`vivo:outra`, 4 cliques) e não de unidade.
3. **A correção**: o clique manda junto a escala recusada, e ela sai da disputa. Sem `recusada`, nada
   muda — a primeira geração continua sendo a melhor possível, e há teste para isso. Nos dados reais,
   **piso 4 antes e piso 4 depois**: alternativa sem custo de qualidade.
4. **A tela deixou de mentir no caso limite**: o aviso dizia *"nenhuma superou esta"*; passou a dizer
   que nenhuma ficou **diferente** desta — que é o que de fato acontece quando repete.
5. **`Cartao` ganhou `aria-labelledby`**, porque a sonda agarrava só o cabeçalho. Nome alcançável
   serve a leitor de tela **e** a instrumento de medida — agora em bloco, não só nos campos.

**O fio que liga a noite:** dois defeitos foram do INSTRUMENTO, não do produto. O portão nasceu
vermelho com a correção certa no lugar (quarta sonda da sessão a medir o próprio rastro), e os três
testes novos, inseridos por script, **não chegaram ao arquivo** — o script imprimiu sucesso e o
mutante passou verde, o que por um instante pareceu prova de que a correção era desnecessária.
**Depois de escrever por script, confira o ARQUIVO, nunca a mensagem do script.**

**Provado nas duas pontas:** com o mutante `if (false)`, o teste do botão reprova (1 de 27) e o
`vivo:outra` acusa "MESMA escala" nos quatro cliques; na árvore limpa, 27 testes e 4 escalas
diferentes.

**Skills acionadas:** `engineering-loop` (orientar→executar→verificar→registrar), `loop-autonomo`,
`documentacao-auditavel`, `ponytail` (a correção é um parâmetro opcional e um filtro, não um motor
novo).

6. **E a frase abaixo do botão mentia depois da correção** — achado ao OLHAR a captura do site já
   publicado. *"A melhor de 8 versões"* é verdade na primeira geração e falsa depois de uma recusa,
   porque a melhor de todas pode ser justamente a que ele recusou. **Mesma classe de defeito, outro
   suporte:** corrigir o comportamento sem corrigir o texto que o explica deixa a mentira de pé, agora
   com um portão verde por cima. A frase ganhou dois estados e o `vivo:outra` mede a virada.

**Estado:** `EXIT_GATE=0` em **32 passos** · **354 testes** · selo conferido · 183 turnos no ar ·
0 estouros de teto · 14 ativos.

**Handoff:** [`HANDOFF_2026-08-06.md` §6d](docs/handoff/HANDOFF_2026-08-06.md) ·
**Diário:** DB-039 e DB-040.

---

## 06/08/2026 · noite (2) — a estatística no administrador, e um alarme que quase mentiu

**Solicitação (S-039):** *"na escala na área do administrador, abaixo de distanciamento por pessoa,
coloque uma estatística tipo essa ou melhor. Aceito sugestão. Somente das datas no intervalo de datas
selecionado em De–Até."*

1. **Cartão "Distribuição de turnos"** na aba Gerar, sobre o bloco recém-gerado — que **já é** o
   De–Até, sem filtro a aplicar. O período vai escrito no subtítulo mesmo assim: tabela que não diz o
   que conta é lida como se contasse tudo.
2. **O "melhor" oferecido:** colunas por **tipo de turno** (a grade por mês esconde que manhã de
   domingo e ENSAIO são vagas escassas — o Adilson tem 19 turnos, todos de noite, e o total sozinho
   jura que está igual aos outros) e a **linha de equilíbrio** (menor · maior · diferença).
3. 🔴 **A linha de equilíbrio quase repetiu o erro do dia.** Anunciou *"diferença de 12 turnos"* em
   âmbar sobre um ano, e os 12 eram **inteiros o teto do Williams** (3/mês × 12 = 36 contra 48). O
   número certo, a leitura falsa. Alarme sobre restrição que o próprio dono cadastrou treina a
   ignorar o alarme. Quem tem teto saiu da conta **e é nomeado**, com teto e total.
4. **A contagem virou domínio** (`src/dominio/estatisticas.ts`, 13 testes) e **a tela pública foi
   migrada para ela**. Contar de novo no componente novo criaria duas réguas para a mesma medida —
   como gerador e validação divergiam no site anterior. Fonte única sem migrar consumidor não
   conserta nada.
5. **Duas decisões subiram da tela para o domínio**, e agora têm teste: quem aparece (morreu o
   `if (counts[bId])` que descartava em silêncio o turno de quem saiu do elenco) e o mês de cada
   turno, lido da string ISO em vez de um `Date` — que em fuso negativo joga o dia 1º no mês anterior.
6. ⚠️ **A checagem nova nasceu inerte** e passou verde com o cartão fora da tela: escrita como
   *"não tem a linha OU o formato está certo"*, ela era vacuamente verdadeira. **Propriedade negativa
   não mede ausência.** Passou a ler `pessoas.json` e a declarar quando se isenta.

**Provado nas duas pontas:** com o cartão desligado, `vivo:gerar` reprova nomeando-o; com a linha de
teto desligada, reprova nomeando o Williams. Na árvore limpa, 36 de 36 checagens.

**Skills acionadas:** `engineering-loop`, `loop-autonomo`, `documentacao-auditavel`, `ponytail`
(contagem em função pura, sem camada nova), `impeccable` (tabela legível, sem clichê).

**Estado:** `EXIT_GATE=0` em **32 passos** · **367 testes** · selo conferido.

**Handoff:** [`HANDOFF_2026-08-06.md`](docs/handoff/HANDOFF_2026-08-06.md) ·
**Diário:** DB-041.

---

## 07/08/2026 · madrugada — publicação do dono, conferida por fora

**Gatilho.** Ele publicou pela tela e pediu: *"Eu publiquei a nova escala. Veja se atualizou."*

**Medido no que o site SERVE, não no que o deploy diz.** Deploy verde é sobre o artefato; a pergunta
dele é sobre o dado. Baixei `blocos.json` e `pessoas.json` da URL publicada, com quebra de cache:

| | |
|---|---|
| Commits | 4, às 01:07 (elenco + escala, uma dupla por pasta de dados) |
| Deploy | `success` no último (`b2c6e47`); os intermediários **cancelados** pela concorrência, como projetado |
| Pastas de dados | as **duas** moveram — `public/dados` e `docs/dados`. Escrever só numa é a falha silenciosa deste projeto |
| Bloco no ar | `bloco-2026-08-06-2026-12-31` · 87 turnos · piso 4 · sem semente (guloso) |
| Passado | 96 turnos, **intacto byte a byte** |
| Elenco | 14 ativos · Eduardo e Thiago com **0 turnos** |
| Regras no site publicado | **17 de 17** (`vivo:conferir`) |
| Refazível | ✅ 87 turnos reconstruídos idênticos, turno a turno |

🔴 **O achado que a pergunta dele não previa:** comparado turno a turno com a escala que já estava no
ar, deu **87 iguais, 0 mudados, 0 dias novos, 0 dias perdidos**. A única mudança foi a data final do
bloco — 30/12 → 31/12, e 31/12 é quinta-feira, sem culto.

**O site atualizou e o dia de ninguém mudou.** Está correto — o gerador é determinístico, e o bloco
publicado não traz semente, o que prova que saiu de um "Gerar escala" limpo e não de um "Não gostei".
Foi dito a ele com essas palavras, porque *"publiquei"* e *"mudou"* não são a mesma coisa, e a
diferença só aparece quando alguém compara.

⚠️ **E o selo da árvore fez o trabalho dele:** `selo:conferir` reprovou (EXIT=1) antes do gate, porque
os quatro commits do dono mudaram a árvore sob o selo gravado na sessão anterior. Gate rodado de novo
sobre a árvore sincronizada: **EXIT_GATE=0**, 32 passos, 367 testes, selo `fbb8747d87fd`.

**Estado:** `EXIT_GATE=0` · 183 turnos no ar · 0 estouros de teto · 14 ativos.

---

## 07/08/2026 · madrugada (2) — auditoria independente do site, a pedido do dono

**Solicitação (S-040):** *"por ele ter cancelado os três commits, houve perda de dados ou de
configurações? E tem como fazer uma outra auditoria independente na escala do site (…) só para
confrontar com o apresentado no site, usando as mesmas pessoas que estão na escala escalada no site
hoje, de 6/8/2026 a 31/12/2026?"*

### 1. Os deploys cancelados — nada se perdeu, e está medido

**Cancelar um deploy não cancela um commit.** Cada publicação sobe a árvore inteira do SHA dela; a
última (`b2c6e47`) já contém o estado das três anteriores. Provado por três medidas:

| Medida | Resultado |
|---|---|
| Os 4 commits, arquivo a arquivo | 2 de escala (1 linha em cada pasta de dados) e **2 VAZIOS** |
| Por que os dois vazios | `pessoas.json` não muda desde **06/08 12:52** — ele salvou o elenco e não havia o que mudar |
| O que o site SERVE × o repositório | **idêntico como dado** nos 4 arquivos (a diferença de bytes é CRLF local × LF servido) |

⚠️ **O susto do caminho:** comparar por `sha256` acusou 3 dos 4 arquivos como diferentes. Era quebra
de linha — a cópia de trabalho no Windows tem CRLF, o servido tem LF. **Comparar bytes onde a
pergunta é sobre DADO produz alarme falso**; a comparação certa é `JSON.parse` dos dois lados.

### 2. A auditoria independente — `scripts/auditoria-independente-do-site.mjs`

Recontagem **do zero**, sem importar uma linha de `src/`, sobre o dado baixado **pela URL publicada**.
87 turnos, 258 vagas, 14 pessoas. **Zero divergências** contra os dois cartões da tela — total,
mínimo, tipo e mês, pessoa a pessoa.

- equilíbrio: menor 18 · maior 19 · **diferença 1** (idêntico ao que a tela anuncia);
- menor distanciamento do período: **4 dias** — Donizete, Flavio, Isac, Luíz Cezar, Williams;
- Williams, teto 3/mês: **12 turnos**, nenhum mês acima do teto.

🔴 **A primeira versão do auditor acusou as 14 linhas com os números batendo em todas.** A expressão
exigia espaço entre nome e número, e no DOM os dois `span` vêm colados (`Adilson19 turnos`). **O
auditor acusou o auditado por um erro dele mesmo** — a classe mais cara que um auditor pode ter,
porque quem lê passa a desconfiar do relatório inteiro, inclusive das partes certas.

**Autoteste permanente:** `vivo:auditoria:autoteste` injeta um turno inventado **na auditoria** (o
dado do site fica intocado) e exige acusação — saiu com 5 divergências nomeando a pessoa e a coluna.
Ele fica **fora de todo disparador**: existe para sair vermelho, e um passo que reprova por projeto
dentro de um conjunto que soma reprovações faria alguém desligar o auditor inteiro.

**Estado:** `EXIT_GATE=0` em **32 passos** · 367 testes · selo `03c8bf4dbb5f` · `vivo:no-ar` 4/4.

---

## 07/08/2026 · manhã — pesquisa mundial de métodos + varredura de variações + auditoria das réguas

**Solicitação (S-041):** *"Corrija tudo autonomamente, pesquise na Internet toda por sistemas
semelhantes. Qual é o método que usam e qual é o mais inteligente? Corrija o motor que gera a escala
com todas as variações de campos. Valide, corrija e audite também o Validador independente."*

**Ordem executada: pesquisa (delegada ao Gemini) → registro auditado → decisão → correção → prova.**

1. **Pesquisa** em `docs/superpowers/specs/PESQUISA_2026-08-07-metodos-rostering.md`, com a
   auditoria PREPENDADA (inclusive um erro do relatório: assumiu teto mensal para os 14; só 1 tem).
   Veredito: **manter GRASP** — CP-SAT/WASM no navegador é custo sem ganho nesta escala.
2. **Busca local pós-GRASP (recomendação central): medida e RECUSADA.** Experimento nos dados reais:
   0 trocas melhoradoras em dois critérios — a escala já é ótimo local; Jain 0,9965 é o máximo
   aritmético (258 ∤ 14). Método mais inteligente é o que ganha na medição, não o de nome bonito.
3. **Três defeitos reais, corrigidos com mutante nas duas pontas:**
   - 🔴 ausência INVERTIDA ignorada em silêncio **pelas duas réguas** — pessoa escalada dentro da
     própria viagem com tudo verde. Normalização independente em cada régua;
   - 🔴 grade vazia saía `ok: true` (período invertido/sem culto) — agora declara a falha;
   - 🔴 2ª régua sem infrator de `diasProibidos`/`turnosPermitidos` — `if (false)` nos dois e as 28
     verdes dela continuavam verdes. Promessa com teste ≠ campo com teste.
4. **Varredura matricial** (`variacoes.test.ts`): 5 campos sozinhos + combinações + estrutura +
   caminho da tela, e **150 elencos forjados por PRNG semeado** (PBT da pesquisa §6, sem dependência;
   metade das ausências invertida de propósito). Mordida provada: 4 mutantes de campo derrubam 3–7
   testes cada; o de teto derruba o forjado nomeando a semente e a regra.
5. **Auditor do site redesenhado**: quebrou no dia seguinte à publicação (gerava período retroativo,
   que a tela recusa — auditor de um dia só). Confronto 1 = tela pública de Estatísticas, SEMPRE
   (16 linhas × 10 meses, 0 divergências); confronto 2 = admin, pulado-e-DECLARADO quando
   retroativo. Autoteste ampliado (distância também mente) e leitor consertado de novo
   ("Eduardosaiu" — selo colado ao nome; casar contra o CADASTRO, não regex).

**Estado:** 393 testes (354→393) · typecheck limpo · gate a rodar antes do commit.

---

## 07/08/2026 · manhã (2) — o veredito medido do que está no ar, e os órfãos fechados

**Solicitação (S-042):** a escala publicada está correta em todas as validações? O validador
independente chega ao mesmo veredito? As ligações da pesquisa existem em documento E código?

1. **Veredito** (`npm run vivo:veredito`, novo — entra no grupo NO AR): 1ª régua **17/17, 0 falhas
   duras** (1 aviso Q4); 2ª régua **8/8 promessas**, 258 escalações uma a uma; auditor do site
   **0 divergências**. Piso 4 declarado = real. **Pode divulgar.**
2. **Três órfãos fechados**: a pesquisa ligada no `gerador.ts` (decisão negativa + portão de
   reabertura); o experimento virou arquivo (`npm run experimento:busca-local` — o BACKLOG mandava
   re-rodar um script que não existia); e nasceu o **HANDOFF_2026-08-07.md**, indexado, com a cadeia
   inteira apontando (`cadeia` verde).
3. ⚠️ **Quase-incidente registrado**: o avanço dos ponteiros por replace global reescreveu **8
   referências históricas** (AML e BACKLOG citavam o handoff de 06/08 como CONTEÚDO). Revertido
   sítio a sítio — é a lição de `substituicao-cega-de-nome-apaga-historico`, de novo.
4. **Visual das três telas do site no ar, olhado**: escala ancorada no próximo culto (08/08),
   Estatísticas íntegra (a mesma tabela que o auditor confrontou), Validação mostrando *"Aprovada ·
   17 de 17 · piso de 4 dias"* no bloco vigente.

**Estado:** gate a rodar · **Diário:** DB-044 · **Handoff:** [`HANDOFF_2026-08-07.md`](docs/handoff/HANDOFF_2026-08-07.md).

---

## 07/08/2026 · manhã (3) — S-043: o formato de publicação é decisão de FASE, registrada

**Pergunta dele:** as próximas escalas saem no mesmo padrão? E o token no navegador é o melhor
formato de publicação em usabilidade — ou muda na comercialização?

1. **Próximas escalas: o padrão é estrutural.** Gerador determinístico · Publicar BLOQUEADO com
   falha dura · gate de 32 passos antes de todo commit · 5 validações NO AR depois de toda
   publicação (incluindo `vivo:veredito`). Não depende de ninguém lembrar.
2. **Publica de verdade:** commit → deploy → site em ~1 minuto, medido ontem na publicação dele.
3. **Decisão: fica assim na fase 1.** Para comercializar, fase 2 = backend + conta e-mail/senha +
   multi-tenant, com o domínio intacto. Escrita em TRÊS lugares ligados: `BACKLOG.md` §P4.y (o
   desenho) · `ARQUITETURA.md` (a decisão na seção do custo) · `github.ts` (aviso a quem for
   reescrever: os 3 JSON são o contrato, commits viram tabela de versões).

**Diário:** DB-045 · **Handoff:** [`HANDOFF_2026-08-07.md` §3b](docs/handoff/HANDOFF_2026-08-07.md).

---

## 07/08/2026 · manhã (4) — S-044: a mensagem de divulgação para o grupo de porteiros

Texto do WhatsApp corrigido e formatado; versículo **Salmos 84:10 (ARC — a tradução da CCB)**
conferido na fonte antes de citar, e não de memória. Correções sobre o rascunho: vigência é HOJE
(07/08/2026), não "este sábado"; pedido explícito de apagar a escala antiga de agosto. A mensagem é
comunicação, não produto — registrada no índice (S-044), não no código.

---

## 07/08/2026 · tarde — S-045/S-046: o modelo de comunicação e a prova plurianual

1. **`docs/COMUNICACOES.md`**: a mensagem COMO ELE ENVIOU vira exemplar canônico (com as correções
   dele registradas — "sexta-feira" e "pela misericórdia"); estrutura bloco a bloco; banco de 5
   versículos ARC sobre porteiros/a Casa; checklist de envio. Ligado no roteador e no inventário do
   `generico:docs` (documento de INSTALAÇÃO, decisão registrada).
2. **Reprodutibilidade 2027–2029: MEDIDA.** Elenco real + fronteira de 2026 → ~220 turnos/ano, duas
   gerações idênticas byte a byte, 0 falhas nas duas réguas. O furo era o RUNBOOK: nasceu
   *"A virada de ano"* no `OPERACAO.md` — Santa Ceia do ano novo antes de gerar (a lacuna dos 104
   domingos), elenco, fronteira automática, divulgação pelo modelo da casa.

**Estado:** gate a rodar · **Diário:** DB-046 · **Solicitações:** S-045, S-046.

---

## 07/08/2026 · tarde (2) — S-047: o modelo mental dele, conferido afirmação por afirmação

Ele descreveu como entende o sistema e pediu verificação um a um. **Tudo conferido no código e
medido num ensaio do cenário exato** (2027 publicado em janeiro; ciência das Ceias em fevereiro;
recálculo do corte em diante; emenda): trava retroativa barra passado e libera futuro; passado
preservado byte a byte na emenda (29/29); Ceia em domingo = dia marcado, 0 escalados; Ceia em dia
SEM culto = inerte (coerente com "feriado"); fronteira atravessa o corte; 0 falhas nas duas réguas.
Duas observações de produto para decisão dele (P4.z): rótulo "Santa Ceia" cravado (~20 pontos) vs
conceito genérico "dia sem expediente"; e ceia em dia sem culto passa calada (risco de typo).

**Solicitação:** S-047 · **BACKLOG:** P4.z.

---

## 07/08/2026 · tarde (3) — S-048: o aviso de Ceia em dia sem culto + o requisito da fase 2

1. **Aviso no ar** (pedido: *"Aviso, não trava — faça isso"*): Ceia em dia sem culto fica ÂMBAR com
   o dia da semana (*"⚠️ quinta — sem culto na malha"*), continua na lista. `diaTemCulto` já existia;
   a tela passou a usá-lo. Provado ao vivo nas duas pontas + captura.
2. **Fase 2 registrada com o mapa "já existe × falta"** (§P4.w do BACKLOG, ligada em `malha.ts` na
   própria constante-fronteira): `RegraMalha` já cobre mesmo-dia-duas-vezes, 1º sábado do mês,
   rótulo e capacidade; falta horário início/fim, tela de edição da malha, evento avulso por data e
   vocabulário neutro (porteiros de prédio, segurança — "afastar a questão religiosa").

**Diário:** DB-047 · **Solicitação:** S-048.

---

## 07/08/2026 · tarde (4) — S-049: logotipo parametrizável + 6 sugestões para a fase 2

Pedido dele: logo removível E substituível; e sugestões minhas pertinentes. **Medido antes de
registrar**: o logo já é dado e o site já o esconde com o campo vazio — falta só a TELA (limpar /
trocar arquivo). Sugestões registradas na §P4.w com custo honesto: .ics "Minha Escala" (fase 1
viável), equidade acumulada entre blocos, Q4 como desempate da cascata, preferências leves, troca
com aprovação e lembrete de véspera (fase 2). **Solicitação:** S-049.

---

## 07/08/2026 · tarde (5) — S-050: lembrete de véspera no WhatsApp — o mapa das três rotas

Pergunta dele respondida com o desenho registrado (§P4.f): rota OFICIAL (Meta Cloud API + cron do
GitHub Actions que o repositório já usa; médio; não envia a grupo — individual, com conta Meta
verificada, número dedicado, modelo aprovado, telefones+consentimento); rota NÃO-OFICIAL (fácil e
com risco real de banir o número — recusada como recomendação); e o ATALHO `.ics` que resolve o
lembrete HOJE pelo calendário do celular, sem risco nenhum. Recomendação: `.ics` agora, oficial na
fase 2. **Solicitação:** S-050.

---

## 07/08/2026 · tarde (6) — S-051: a ponte Charmway construída até a fronteira do acesso

Ele escolheu a rota B pela ponte do Charmway (números dedicados — o risco não recai no número da
igreja; o raciocínio da recusa segue registrado para quem não tiver essa infra). **Avaliação de
acesso honesta:** VPS de pé, padrão worker+cron maduro, mas a chave SSH da fase 0 não está nesta
máquina. **Construído até a fronteira:** chave nova `claude-escala-lembrete` gerada · worker
`scripts/vps/lembrete_escala.py` (grupo, URL publicada, zero segredo, kill-switch) · dry-run
provado com o dado real (domingo 2 turnos · Santa Ceia própria · dia sem culto = silêncio) ·
runbook `docs/LEMBRETE_WHATSAPP.md` com os 3 passos dele. **Diário:** DB-048 · **Solicitação:** S-051.

---

## 08/08/2026 — S-052: a sessão perdida, e a retomada provada em contêiner novo

A sessão de 07/08 sumiu na atualização do aplicativo, e a resposta veio dos REGISTROS, não de
memória: nada se perdeu — S-043 a S-051 commitados, cadeia documental íntegra. Acessos verificados
com evidência num contêiner Linux novo: push aceito (dry-run), autor do git corrigido para o
obrigatório do projeto, dependências instaladas, navegador substituto ligado por link FORA do
repositório, e o gate rodado inteiro. Portões de código, documento e build: verdes.

As 7 reprovações do `vivo:tudo` foram trianguladas uma a uma e NENHUMA é defeito do produto: 3 são
a rede deste ambiente fechada para o site publicado (limitação declarada), 3 são corrida de largada
dos scripts de validação (→ P2.16/P2.17 do BACKLOG) e a última é alvo publicado sob `--local`
(→ P2.18). O ruído de ambiente (CRLF→LF no `docs/index.html` com assets idênticos; campos `libc`
do lockfile) foi REVERTIDO, não commitado — mudança acidental não entra na história.

⚠️ A chave `claude-escala-lembrete` perdeu o par privado junto com o contêiner antigo — o runbook
ganhou o aviso; chave nova nasce no "go". **Solicitação:** S-052.

---

## 08/08/2026 — S-053: "Go" — as réguas corrigidas até o gate fechar verde na máquina nova

O "go" mandou trabalhar as pendências uma a uma, autonomamente, no padrão-ouro. A fila autônoma
era o próprio achado da manhã: P2.16 (espera do servidor na fonte única + rede de segurança POSIX +
migração do `vivo:seletor`, que nem usava a fonte), P2.17 (espera pelo número prometido, não por
"estabilizou"), P2.18 (os três scripts do grupo LOCAL passam a medir o build local, não a URL
publicada) e P2.19, descoberto no caminho (a régua de foco reprovava o anel `outline: auto` do
navegador; prova por pixel antes da correção). Depois das correções: `vivo:tudo --local` com as 15
validações verdes neste contêiner — incluindo as 7 que reprovavam. Registro: DB-049, S-053,
handoff de 08/08. **Solicitação:** S-053.

---

## 08/08/2026 — S-054: P0 e P1 zerados pelo registro alcançar a realidade

A pergunta dele ("o que é P0.2? e P1.1? o site já foi divulgado, os irmãos já usam") expôs cinco
registros vencidos. Fechados com prova: P0.1 (aprovado pelo fato), metade do P0.2 (o `GITHUB_PAT`
está pago desde 06/08 — commits dele via API; resta só a chave OPCIONAL do motor), P1.1, P1.2 e
P1.3 (a divulgação do site novo era a condição de fechamento dos três, e aconteceu — palavras
dele). P5.6 perdeu a metade envelhecida ("sem LICENSE" — ela existe desde 06/08). Detalhe e risco
residual do link antigo: DB-050. **Solicitação:** S-054.

---

## 08/08/2026 — S-055: merge do PR #1 na main, com a prova de que o servido não muda

Autorização total ("sem pedir até o fim"). Provado antes do merge que o diff (S-052 a S-054) não
toca produto nem dado publicado; merge por rebase (história linear, `main` em `35d7519`);
check-ins encerrados; branch realinhada. O veredito NO AR de 07/08 permanece a medição válida do
site servido. **Solicitação:** S-055.

---

## 08/08/2026 — S-056: o loop fechou a fila P5 — dois de três itens já estavam prontos no código

Go em loop, ordem minha. Mapeamento antes de mão: P5.4 já implementado desde 06/08 (registro
fechado com prova datada), P5.7 medido por sonda — o código já fazia o certo; saída esperada
escrita no `ALGORITMO.md` e travada em `casos-limite.test.ts` (4 testes) —, P5.3 meio-medido
(228 bytes/turno, ~49 KB/ano; teto da API declarado por medir, rede bloqueada). Handoff da parte 2
criado e cadeia apontando. **Solicitação:** S-056.

---

## 18/08/2026 — S-057: cópia local desatualizada reconciliada, e 3 defeitos achados sem pedido

Sessão "resume" + "totalmente autônomo, Gauntlet Loop". A cópia local estava 6 commits atrás do
`origin/main` (S-052 a S-056 nunca baixados); um commit de sincronização de documentação escrito
sobre essa base ficou errado e foi descartado antes do push (`git reset --hard origin/main`, nada
compartilhado tocado). Com a cópia certa, `vivo:no-ar` saiu 100% verde mas com aviso `DEP0190`:
corrigido `execFileSync(...,{shell:true})` → `execSync` + guarda testável em
`scripts/lib/guarda-nome-vivo.mjs` (autoteste: 6 limpos aprovados, 10 hostis barrados). Achado
`npm run citacoes` VERMELHO por citações cruzadas entre repositórios em
`docs/TABELA_CONFORMIDADE_PROJETOS_IRMAOS.md` — corrigidas 6, incluindo 2 que apontavam para texto
ERRADO dentro do próprio `AGENTS.md` (linha existia, conteúdo não batia — o portão não mede isso).
P5.3 fechado com fonte oficial do GitHub (teto geral 50–100 MiB; ~997 anos de folga no ritmo
atual). `ESTADO.md` estourou o teto do regime "vivo" e foi rotacionado por assunto
(`docs/HISTORICO_ESTADO_2026-08.md`, referência); o autoteste da guarda foi ligado ao gate como
15º passo (33 no total), com as duas listas numeradas renumeradas e conferidas. `npm run gate`
completo: 33 passos, `EXIT_GATE=0`, selo `eb588b17980c`. **Solicitação:** S-057.

---

## 18/08/2026 — S-058: a árvore de capacidades adotada, sem tocar no padrão-ouro

Flavio apontou para método global novo (árvore de capacidades + coexistência de harnesses),
100% não commitado em `_padroes-globais`, e pediu para adaptar ao projeto sem alterar o
padrão-ouro em si. `docs/capacidades.json` cataloga os 60 scripts de `scripts/` em 4 ramos;
`AGENTS.md` §6.1 aponta para o mapa; `## Handoff ativo` entrou em `ESTADO.md`.
`checar-capilaridade.mjs` e `pre-voo.mjs` (globais) rodados contra o projeto: OK. Achado no
caminho: `conferir-citacoes.mjs` é mais rigoroso (confere símbolo) que o `portao-citacoes.mjs`
ligado ao gate, e estava órfão — virou P8.1 do BACKLOG, decisão do dono. `npm run gate`: 33
passos, `EXIT_GATE=0`, selo `eb2cc89056dc`. **Solicitação:** S-058.

---

## 18/08/2026 — S-059: o número do lembrete escolhido, e a chave que já funcionava

Flavio fechou a rota B (Charmway) sem mais debate sobre banimento e liberou acesso de leitura à VPS
para eu verificar o estado real. SSH com `charmway_deploy` (10/08) funciona — o passo 1 do runbook
já estava resolvido e não registrado; a chave perdida (`claude-escala-lembrete`, 08/08) ficou como
histórico. `fetchInstances`+`fetchAllGroups`: nenhum dos 6 números já conectados está em grupo de
porteiros. Decisão dele: número dedicado `551194950100`, a conectar por ele mesmo em Ritmo &
Números. `LEMBRETE_WHATSAPP.md` atualizado nas duas pontas. **Solicitação:** S-059.

---

## 18/08/2026 — S-060: a trilha GENÉRICA — segundo build, mesmo repositório

Flavio perguntou se dava para testar uma versão "só Escala" sem repositório novo. Resposta medida:
sim — `npm run generico` já provava `src/` limpo de texto de cliente; faltava só um segundo `fetch`.
Construído: `vite.config.ts` alterna `base`/`publicDir`/`outDir` por `mode` do Vite (zero linha de
`src/` muda); `public-generico/dados/` com identidade neutra e bloco de exemplo de 1 semana;
`scripts/conferir-generico-dados.mjs` + autoteste (6 casos) — achou e corrigiu uma guarda
"módulo principal" que falhava em silêncio no Windows. Gate: 33 → **36 passos**
(`generico:dados:autoteste` 16º; `build:generico`+`generico:dados` 31º/32º).
`docs/PORTOES.md`/`OPERACAO.md` renumerados. Verificado num navegador real (Playwright) em
`/escala-porteiros/generico/` antes de declarar pronto. `ARQUITETURA.md` §"A segunda trilha" e
`FASE2.md` §P4.w2 escritos. `npm run gate`: 36 passos, `EXIT_GATE=0`. **Solicitação:** S-060.

---

## 18/08/2026 — S-061: o gatilho de retomada, numa palavra — `retomaescala`

Flavio trabalha com vários VS Code abertos, um por projeto — pediu uma palavra única para dizer
"retome este projeto de onde paramos", sem repetir contexto. Criada `retomaescala`, documentada
como a PRIMEIRA seção do `AGENTS.md` (antes de tudo o mais) com o protocolo: ler `AGENTS.md` →
`ESTADO.md` → handoff mais recente → `BACKLOG.md`, e responder com o próximo passo, sem perguntar.
Reforçado em `ESTADO.md` §"Como retomar". Só documentação — nenhum código tocado.
**Solicitação:** S-061.

---

## 19/08/2026 — S-062: o selo mentia sobre a própria árvore — achado numa varredura autônoma

`retomaescala` + instrução padrão de retomada autônoma. Varredura de rotina achou `npm run
selo:conferir` acusando "árvore mudou" com `git status` limpo. Reproduzido: `git ls-files -s` lê o
ÍNDICE (blob LF-normalizado), mas o selo também hashava bytes CRUS do disco (CRLF) para arquivo só
modificado — o fluxo `npm run gate` (termina em `selo:gravar`) ANTES de `git add` troca o mesmo
arquivo de representação entre gravar e conferir, sem nenhuma mudança real de conteúdo. Corrigido:
`impressao()` lê sempre o disco, nunca o índice. `selar-arvore.mjs` nunca tinha autoteste — criado
`autoteste-selar-arvore.mjs` (6 casos, reproduz o defeito exato + 5 casos de sanidade). Gate: 36 →
**37 passos** (`selo:autoteste` 17º). `docs/PORTOES.md`/`OPERACAO.md` renumerados. VPS reconferida:
número `551194950100` ainda não conectado, nada mudou. `npm run gate`: 37 passos, `EXIT_GATE=0`.
**Solicitação:** S-062.

---

## 19/08/2026 — S-063: a pergunta direta do dono achou duas lacunas no fechamento do S-062

Ele perguntou se a verificação visual e a auditoria do S-062 tinham sido feitas de verdade —
resposta honesta: não. (1) Verificação visual ao vivo (chrome-devtools MCP): produção e trilha
genérica renderizam certo, Estatísticas e Validação (17/17 regras) conferidas, sem erro novo no
console. Achado real e pré-existente (não do S-062): `DateSearch.tsx`, 2 campos sem `id`/`name` —
corrigido. (2) Agente auditor independente mandado a REFUTAR o conserto do selo, comparação cega —
achou um terceiro problema de parsing: renomear arquivo staged produz `R  antigo -> novo` no `git
status --porcelain`, e o parser tratava a linha inteira como nome de arquivo (candidato fantasma).
Julgamento próprio sobre o achado da auditoria: ela chamou isto de "mesma classe" do defeito do
S-062, mas não é — renomear MUDA o caminho de verdade, então o selo deve continuar acusando (e
continua, antes e depois do conserto); só a higiene do parsing precisava de conserto (caminho real
no lugar do fantasma). Caso G novo no autoteste (6→7), com a expectativa corrigida (a primeira
versão copiou a leitura errada da auditoria). Gate: 37 passos, `EXIT_GATE=0`.
**Solicitação:** S-063.

---

## 19/08/2026 — S-064: lembrete individual no WhatsApp — telefone cadastrado, duas mensagens

Pedido: lista editável de nome completo + telefone por pessoa, nunca apagada (mesmo padrão do
`ativo: false` já existente), com mensagem cordial disparada em dois momentos — resumo semanal
(domingo a domingo) e lembrete de véspera. Dono dispensou controle de LGPD explicitamente; decisão
registrada como dele. Construído: `Pessoa.nomeCompleto`/`Pessoa.telefone` (`src/dominio/tipos.ts`);
`src/utils/telefone.ts` (normalização confirmada contra código de referência real na VPS do
Charmway, skill `int-evolution-api`, 10 testes); tela `ContatoWhatsApp` no card de cada pessoa do
Elenco (`Admin.tsx`); `scripts/vps/lembrete_individual.py` (modos `semanal`/`diario`, espelho
versionado) + `autoteste_lembrete_individual.py` (19 casos, sem rede). Dois defeitos achados
testando ao vivo, corrigidos antes de fechar: aspas escapadas quebrando o JSX (`title="...\"..."`),
e telefone inválido sendo apagado em silêncio ao perder o foco (agora fica visível com aviso).
Ativação real segue bloqueada — número `551194950100` ainda não conectado. Gate: 37 passos,
`EXIT_GATE=0`.
**Solicitação:** S-064.

---

## 19/08/2026 — S-065: pesquisa antes do código — cadência e formatação do lembrete individual

Instrução explícita: agentes de pesquisa independentes ANTES de codar ou decidir. Dois agentes em
paralelo. (1) Cadência: sem padrão de mercado único (líderes do setor disparam ao publicar, não em
dia fixo); domingo×segunda é empate documentado (ABNT NBR 5892 vs. ISO 8601) — decisão: segunda de
manhã, convenção de casa declarada. Estrutura resumo+véspera já replica o padrão de maior eficácia
da literatura (Steiner et al. 2018, AJMC: 4,4% de falta com 2 lembretes vs. 5,3–5,8% com 1) — sem
necessidade de terceiro lembrete. (2) Formatação: confirmado contra WhatsApp Help Center oficial
(negrito certo, monoespaçado é 3 crases não 1, listas via API sem confirmação de renderização);
achado real: mensagens não se identificavam (erro nº1 apontado pela pesquisa) — corrigido com
`config.identidade.titulo`. Construído: `lembrete_individual.py` reescrito (cron domingo→segunda
8h, 3 blocos: identificação/corpo/fechamento, `main()` lê `config.json`), `primeiro_nome()` morta
removida, autoteste 19→22 casos. `docs/LEMBRETE_WHATSAPP.md` documenta as duas decisões, citadas.
Gate: 37 passos, `EXIT_GATE=0`.
**Solicitação:** S-065.

---

## 19/08/2026 — S-066: a pergunta certa achou um bug real na mensagem semanal

Mesma pergunta de sempre sobre o S-065, resposta honesta: faltava verificação visual (achado:
telefone inválido sumia em silêncio no S-064, corrigido) e auditoria de verdade. Agente auditor
independente confirmou o conserto do "turno já passado" mas achou um SEGUNDO defeito real:
`montar_mensagem_semanal` recalculava o fim da semana (`inicio+7`) separado do que
`selecionar_semanal` usava para filtrar (`domingo+7`) — divergem sempre que o disparo não cai num
domingo, inclusive na cadência real (segunda-feira), e a mensagem prometia um dia que o filtro
nunca tinha buscado. Reproduzido ao vivo antes de aceitar. Corrigido: `fim` sai de
`selecionar_semanal` uma vez, nunca recalculado; `max(domingo,alvo)` simplificado para `inicio =
alvo` (a comparação nunca desempatava para o outro lado). Sweep completo do painel administrativo:
12 campos sem `id`/`name` corrigidos (não só o já achado antes), verificado tela por tela.
Achado lateral: o contador de casos do próprio autoteste era escrito à mão e tinha desatualizado
(26 exibido, 32 rodando) — trocado por contagem automática, nos dois autotestes que tinham esse
padrão. Autoteste: 26→**32 casos**. Gate: 37 passos, `EXIT_GATE=0`.
**Solicitação:** S-066.
