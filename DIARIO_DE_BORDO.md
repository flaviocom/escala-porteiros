# DIÁRIO DE BORDO — escala-porteiros

> **Rastreabilidade total.** Cada entrada registra: **solicitação → pesquisa → decisão → porquê →
> como reverter.** Documento **append-only**, fatiado por período ao estourar o teto. **Nada é
> excluído, nunca.**
>
> **Cadeia de navegação:** [`ESTADO.md`](ESTADO.md) → [`handoff mais recente`](docs/handoff/HANDOFF_2026-08-19-e.md) → [`BACKLOG.md`](BACKLOG.md)
> **Roteador:** [`AGENTS.md`](AGENTS.md) ·
> **Solicitações:** [`docs/solicitacoes/INDICE_DE_SOLICITACOES.md`](docs/solicitacoes/INDICE_DE_SOLICITACOES.md) ·
> **Histórico:** [`docs/historico/INDICE.md`](docs/historico/INDICE.md)

---

> 📦 **Fatias arquivadas:**
> - **DB-001 a DB-012** (04/08/2026) em [`docs/historico/2026-08-04_DIARIO_DE_BORDO_DB001-012.md`](docs/historico/2026-08-04_DIARIO_DE_BORDO_DB001-012.md).
> - **DB-013 a DB-052** (05 a 08/08/2026) em [`docs/historico/2026-08-05-a-08_DIARIO_DE_BORDO_DB013-052.md`](docs/historico/2026-08-05-a-08_DIARIO_DE_BORDO_DB013-052.md).

## DB-053 · 18/08/2026 — a cópia local mentia 10 dias, e o auditor achou 3 defeitos que ninguém tinha pedido

**O pedido:** S-057 — "resume" (retomar, sem dizer onde); depois, vendo a reconciliação,
*"Siga de onde parou ou com os próximos passos, ou ainda resolva os problemas encontrados, você
TOTALMENTE AUTONOMO, workflow completo, e Template Gauntlet Loop."*

**Antes de mexer: a cópia de trabalho em `C:\Users\oflav\build\escala-porteiros` estava 7 dias e 6
commits atrás do `origin/main`** (parou em S-051, o real já tinha S-052 a S-056 até 14/08). Um
primeiro commit de sincronização de `ESTADO.md`/`BACKLOG.md` foi escrito sobre essa base velha —
**e ficou errado** (dizia "credenciais vazias" quando a do GitHub já estava paga; citava uma chave
SSH que a sessão perdida já tinha invalidado). Descartado (`git reset --hard origin/main`) antes de
qualquer push — nada compartilhado foi tocado. **Lição registrada:** sincronizar documento sem
antes conferir `git fetch` é editar sobre areia.

**Com a cópia certa, `npm run vivo:no-ar` saiu 100% verde** (5/5 contra o site publicado) — mas
imprimiu um aviso `DEP0190` do Node.js que não devia estar ali.

1. **`scripts/rodar-validacoes-ao-vivo.mjs:92`** usava `execFileSync('npm', ['run', nome], {shell:
   true})` — o padrão que o Node está depreciando: com `shell:true`, arquivo+args são concatenados
   numa linha de comando SEM escapar. Hoje `nome` só vem de `Object.keys(package.json.scripts)`
   (nunca de fora), então não é injeção explorável — mas essa garantia vivia implícita no fluxo de
   dados, e o projeto já baniu esta MESMA classe uma vez (P2.16). Corrigido: `execSync` com string
   única (não aciona o aviso) + `exigirNomeValido()` em `scripts/lib/guarda-nome-vivo.mjs`, fonte
   única e testável — a garantia virou trava, não presunção. Autoteste
   (`scripts/autoteste-guarda-nome-vivo.mjs`): 6 nomes limpos aprovados, 10 hostis (`; rm -rf /`,
   `` `whoami` ``, `$(whoami)`, aspas, maiúsculas, string vazia…) barrados.
2. **`npm run citacoes` estava VERMELHO** — 5 citações apodrecidas em
   `docs/TABELA_CONFORMIDADE_PROJETOS_IRMAOS.md` (arquivo que chegou pela sincronização do método
   global, não desta esteira). A causa: o documento compara DOIS repositórios lado a lado
   (charmway-erp × escala-porteiros) usando os MESMOS nomes de arquivo relativo (`AGENTS.md`,
   `docs/pre-voo.json`) — e o portão, corretamente escopado só a este repositório, resolvia a
   citação do charmway-erp contra o arquivo homônimo DAQUI. Reescritas as 6 citações cruzadas
   (5 que o portão pegou + 1 que passava por coincidência de número de linha, sem ser certa) para
   prosa com o repositório nomeado, em vez de `` `arquivo:linha` `` — o formato que o próprio
   `portao-citacoes.mjs` sugere para o que não é citação estável. **E duas das citações LOCAIS
   (que o portão aprovava por a linha existir) apontavam para o texto ERRADO** — `AGENTS.md:73-77`
   dizia ser a "Seção MÉTODO" e era o trecho do portão genérico; `AGENTS.md:38` dizia ser a URL do
   site e era uma linha em branco. A seção MÉTODO real fica em `AGENTS.md:137-141`, a URL em
   `AGENTS.md:97` — corrigidas. **O porquê que interessa:** o portão prova que o arquivo e a linha
   existem, nunca que o conteúdo bate — é a limitação que ele já declara ter, e foi ela que deixou
   estes dois passarem.
3. **P5.3 (teto do `blocos.json`) fechado com fonte, não mais "por medir".** A sessão de 08/08
   rodava sem rede; esta tem. Medido agora: 43.773 bytes / 183 turnos = 239 bytes/turno (228 em
   08/08 — a diferença é o campo de esquema do P5.4, que nasceu depois); ~220 turnos/ano (medido em
   DB-046) → ~52,6 KB/ano. Fonte oficial consultada
   (`docs.github.com/.../about-large-files-on-github`): GitHub não documenta um teto específico do
   endpoint PUT da Contents API — só o teto GERAL de arquivo (aviso 50 MiB, bloqueio 100 MiB), que
   se aplica porque a Contents API grava por commit normal. Não encontrado um número mais
   restritivo em nenhuma fonte — registrado como não encontrado, não chutado. Usando o mais
   conservador dos dois (50 MiB): **~997 anos** de folga no ritmo atual.

**Depois de tudo isso, dois efeitos de segunda ordem, achados só porque o gate roda de ponta a
ponta:**

4. **`ESTADO.md` estourou o teto do regime "vivo"** (400 linhas) com as seções que este registro
   acrescentou. Rotacionado por assunto — regra do método, não decisão: o narrativo de 04/08 a
   08/08 (as seis auditorias, "o que entrou em cada dia") mudou para
   [`docs/HISTORICO_ESTADO_2026-08.md`](../docs/HISTORICO_ESTADO_2026-08.md) (regime referência,
   800 linhas). `ESTADO.md` ficou com 154 linhas — só o estado atual. Isso moveu uma citação do
   nome do cliente e mudou a contagem de "documentos vivos" (22→23); os dois portões que dependem
   desses números (`generico:docs`, `fatos:conferir`) foram reconferidos e ficaram verdes.
5. **O autoteste novo (`autoteste-guarda-nome-vivo.mjs`) não estava ligado a nada** — nem
   `package.json`, nem o `gate`. É a mesma classe de defeito que motivou `rodar-validacoes-ao-vivo.mjs`
   existir ("validador que não roda é pior que não existir"). Virou o script `guarda-vivo:autoteste`,
   entrou no gate como o **15º passo** (33 no total), e as duas listas numeradas que descrevem a
   ordem do gate (`docs/PORTOES.md`, `docs/OPERACAO.md`) foram renumeradas e conferidas pelo
   próprio `npm run ordem-do-gate`. No caminho, achei e corrigi mais um apodrecimento
   pré-existente, sem relação com esta sessão: as duas listas diziam "12 validações do grupo LOCAL"
   e "3 do grupo NO AR" — hoje são 15 e 5.

**Estado final:** `npm run gate` completo, **33 passos, `EXIT_GATE=0`**, selo `eb588b17980c`.

**Como reverter.** `git revert` do commit desta entrada — os scripts voltam ao `execFileSync`
depreciado (nenhuma exploração conhecida, mas o aviso volta), as citações cruzadas voltam a
apontar para o repositório errado, P5.3 volta a "por medir", `ESTADO.md` volta a carregar o
narrativo inteiro toda sessão, e o autoteste da guarda volta a não rodar em lugar nenhum. Produto:
nada muda — nenhuma linha de `src/` foi tocada.

---

## DB-054 · 18/08/2026 — a árvore de capacidades chegou, e achou um checador melhor que ninguém usava

**O pedido:** S-058 — *"onde está a pesquisa e os próximos passos? workflow completo alterado em
D:\Antigravity\_padroes-globais adaptado ao nosso sistema, e Template Gauntlet Loop."* Depois de eu
mostrar a pesquisa e perguntar o que fazer com o método global ainda não commitado, a resposta
dele fechou o escopo: *"opere sempre da maneira definida em `_padroes-globais`... adapte o padrão
à nossa realidade (do site...). Não é para alterar o padrão-ouro; quando for necessário, solicito."*

**O que existia, sem eu ter escrito uma linha:** `_padroes-globais` tinha 14 arquivos modificados e
6 novos, 100% não commitados — `ARVORE_DE_CAPACIDADES.md` (skill/agente/ferramenta/hook local vira
"folha" catalogada, com portão `checar-capilaridade.mjs`) e `COEXISTENCIA_HANDOFF_E_CONTEXTO.md`
(protocolo de handoff entre Claude Code/Codex/DeepSeek, portão `checar-handoff.mjs`), cada um com
pesquisa própria registrada (`pesquisas/2026-08-18_*.md`, fontes oficiais citadas, "conclusões
rejeitadas" declaradas). Rodei os dois autotestes novos: **os dois passam** — as travas mordem.
Não toquei em nada dentro de `_padroes-globais`, por instrução explícita.

**A adoção no escala-porteiros — "nossa realidade", não o padrão-ouro em si:**

1. **`docs/capacidades.json`**: os 60 scripts de `scripts/` viraram folhas — cada um com ramo
   (`metodo` → `PORTOES.md`, `validacao-ao-vivo` → `OPERACAO.md`, `dados-e-algoritmo` →
   `ALGORITMO.md`, `comunicacao` → `LEMBRETE_WHATSAPP.md`), gatilho, propósito e portão. `AGENTS.md`
   ganhou a §6.1 apontando para o mapa. `checar-capilaridade.mjs` rodado contra o projeto: **OK**.
2. **`## Handoff ativo`** em `ESTADO.md`, com "Sem handoff ativo." — só um agente escrevendo agora.
   `checar-handoff.mjs` roda **OK** (exit 0), mas imprime uma mensagem enganosa: "não contém Handoff
   ativo" mesmo quando a seção existe e diz corretamente que não há handoff — o script confunde
   "seção ausente" com "seção presente dizendo N/A" na mesma linha de log (`resultado(true, false)`
   dos dois lugares). **Achado no método global, não corrigido** (não é para alterar o padrão-ouro
   — fica registrado para o Flavio decidir).
3. **`pre-voo.mjs` (global) já reconhece o manifesto**: rodado contra o projeto, o grupo MÉTODO
   ganhou a linha "árvore de capacidades ✅" — a integração fecha nas duas pontas.

**🔴 O achado que valeu a pena catalogar tudo:** ao dar nome a cada um dos 60 scripts,
`scripts/conferir-citacoes.mjs` (122 linhas — origem do portão de citações, P6.10 do BACKLOG,
05/08/2026) apareceu **sem `npm run`, fora do gate, órfão** — e é **mais rigoroso** que
`scripts/portao-citacoes.mjs` (92 linhas, o que está ligado a `npm run citacoes` hoje): o órfão
também confere o SÍMBOLO citado junto da linha, não só se a linha existe. Registrado como **P8.1**
no `BACKLOG.md` — decisão do dono, não resolvido sozinho (é escolha de arquitetura, não bug
mecânico). Um segundo achado, menor: `scripts/provar-conferencia-por-turno.mjs` referencia um
caminho de build que não existe mais E compara contra `git show HEAD:...`, que hoje já contém a
correção que a prova originalmente demonstrava — não é "path errado", é uma prova histórica que
**não pode ser reexecutada com o mesmo sentido**. Corrigida só a DESCRIÇÃO no mapa, para não afirmar
reprodutibilidade que não existe.

**Gate final do escala-porteiros, depois da adoção:** 33 passos, `EXIT_GATE=0`, selo
`eb2cc89056dc`.

**Como reverter.** `git revert` do commit desta entrada — `docs/capacidades.json` some, a §6.1 do
`AGENTS.md` e a seção "Handoff ativo" do `ESTADO.md` somem, P8.1 sai do BACKLOG. Produto: nada
muda — nenhuma linha de `src/` tocada. `_padroes-globais` não tem nada deste projeto para reverter,
porque nada foi commitado lá.

---

## DB-055 · 18/08/2026 — o número do lembrete, e a chave que já funcionava sem ninguém notar

**O pedido (S-059):** o Flavio corrigiu o registro sobre banimento — *"eu já tinha explicado isso
porque a lista é de interesse das próprias pessoas (…) esqueça isso"* — e fechou a rota: **B, pela
VPS do Charmway**, com acesso de leitura liberado para eu verificar o estado real antes de qualquer
próximo passo. Pediu também confirmação de que eu tinha as informações sobre tornar o sistema
genérico para "qualquer tipo de escala".

**Verificação ao vivo, não suposição:** SSH com a chave `charmway_deploy` (autorizada 10/08,
presente nesta máquina) — funciona: `whoami`, `docker ps`, `crm_evolution` respondendo. A chave
`claude-escala-lembrete` (07/08) perdeu o par em 08/08 e o runbook (`LEMBRETE_WHATSAPP.md`) ainda
tratava isso como bloqueio atual — **não era mais**: o passo 1 do runbook já estava resolvido, só
não registrado. `fetchInstances` + `fetchAllGroups` por instância (6 números conectados) confirmou
que nenhum está em grupo de porteiros/igreja — todos são do ecossistema comercial Charmway.

**A decisão dele:** não usar nenhum dos 6 — número dedicado **`551194950100`**, a ser conectado por
ele mesmo em Ritmo & Números (painel de campanhas). Registrado no runbook como passo 2, ainda
pendente (conectar é login, fora do meu alcance).

**A segunda pergunta** (malha parametrizável para "qualquer escala") já estava registrada desde
07/08 em `FASE2.md` §P4.w (S-048) — confirmado e citado de volta a ele com o que já existe no motor
(`RegraMalha`: dia da semana, repetição no mesmo dia, N-ésima ocorrência, capacidade por regra) e o
que falta (horário real início/fim, tela de editar a malha, evento avulso, vocabulário neutro).

**Como reverter.** Só documentação (`LEMBRETE_WHATSAPP.md`) — nada em `src/`, nada em produto.
`git revert` do commit desta entrada restaura o texto anterior do runbook.

---

## DB-056 · 18/08/2026 — a trilha GENÉRICA: um segundo build, não um segundo repositório

**O pedido (S-060):** *"talvez seja necessário criarmos um novo GitHub, uma nova pasta (…) a partir
daí fazemos as implementações e testes, e mesclaríamos com produção somente o que escolhêssemos.
Dá pra fazer assim?"* — pergunta exploratória, respondida com recomendação antes de construir.

**A recomendação, com o porquê medido:** não bifurcar. `npm run generico` (portão do §0) já provava
que `src/` e `index.html` não têm texto de cliente cravado — o bundle já era genérico por dentro. O
que faltava não era código novo, era um segundo caminho para o `fetch` de `carregar.ts` encontrar um
segundo conjunto de dados. Confirmado antes de prometer: `publicar.yml` sobe a pasta `docs/`
**inteira** (não um arquivo), e `carregar.ts` busca em `${BASE_URL}dados/…` — então `base` diferente
já bastava.

**O Flavio perguntou duas coisas antes de autorizar:** que URL ele usaria para aprovar, e se um
segundo config dentro do mesmo repositório não seria conflitante nem confuso para outra IA (padrão
de portabilidade). Respondido com o mecanismo exato (`vite build --mode generico`, `docs/generico/`,
mesma esteira de publicação) e a correção de uma imprecisão minha ("sem pasta nova" estava errado —
nascem pastas, não repositório).

**Autorização:** *"Ótimo, deixe tudo documentado (…) e vamos seguir com a implantação no padrão
ouro."*

**Construído:**

1. `vite.config.ts` — `defineConfig(({mode}) => …)`: `base`, `publicDir` e `outDir` alternam por
   `mode === 'generico'`. **Zero linha de `src/` muda entre os dois builds.**
2. `public-generico/dados/{config,pessoas,blocos}.json` — identidade neutra ("Plantonista",
   "Demonstração — portaria de prédio", sem Santa Ceia), 3 pessoas fictícias, um bloco de exemplo de
   1 semana (7 turnos) para a demonstração não abrir vazia.
3. `scripts/conferir-generico-dados.mjs` (+ autoteste, 6 casos) — portão dedicado: os MESMOS termos
   do `portao-generico.mjs`, varrendo `public-generico/` e `docs/generico/` (dado, não código).
   🔴 **Achado no caminho:** a guarda `import.meta.url === file://${process.argv[1]}` que copiei de
   um padrão genérico **falhava em silêncio no Windows** (barra invertida em `argv[1]` contra barra
   normal em `import.meta.url` — 0 achados sempre, mesmo com infrator plantado). Removida; os outros
   portões deste projeto (`portao-generico.mjs`) nunca tiveram essa guarda, e é por isso que nunca
   pegaram esse defeito.
4. Gate: 33 → **36 passos** — `generico:dados:autoteste` (16º, ao lado dos outros autotestes de
   escopo) e `build:generico` + `generico:dados` (31º/32º, depois de `build`). `docs/PORTOES.md` e
   `docs/OPERACAO.md` renumerados e com seção própria para os 3 passos novos.
5. **Verificado num navegador de verdade** (Playwright), não só por portão: `vite preview --mode
   generico` serve exatamente em `/escala-porteiros/generico/` — o mesmo caminho da URL real —, e a
   tela mostrou "ESCALA DE PLANTÕES · Demonstração — portaria de prédio", "Plantonista 1/2/3" nos
   sete dias do bloco de exemplo. Vocabulário neutro provado ponta a ponta, não só por regex.

**Gate final:** 36 passos, `EXIT_GATE=0` (medido antes desta entrada; selo gravado no commit).

**Como reverter.** `git revert` do commit desta entrada: `docs/generico/` some do site publicado no
próximo deploy (o build não é regenerado sozinho — reverter aqui só tira do próximo push), os 2
scripts novos e os 3 arquivos de `public-generico/` somem, `package.json`/`vite.config.ts` voltam à
forma anterior, e os 3 passos saem do gate (33 de volta). Produção: **nenhuma linha de `src/` foi
tocada** — zero risco ao site que os irmãos usam.

---

## DB-057 · 18/08/2026 — a palavra que retoma o projeto: `retomaescala`

**O pedido (S-061):** *"eu estou com vários VS Code abertos, cada um executando uma tarefa. Eu
preciso de apenas uma palavra para que você saiba que eu quero iniciar, reiniciar esse projeto a
partir de onde nós paramos."*

**O problema que a palavra resolve:** o gatilho global do método ("go", "segue", "continua") não
diferencia QUAL projeto — com várias sessões abertas ao mesmo tempo, uma delas em cada janela,
"continua" é ambíguo. A cadeia de documentos (`AGENTS.md` → `ESTADO.md` → handoff → `BACKLOG.md`)
já respondia "onde paramos" desde o começo do projeto; faltava só o comando de um clique que
dispara essa leitura sem ele ter de digitar mais nada.

**Escolhida a palavra `retomaescala`** — um só termo, sem espaço (para funcionar como palavra única
em qualquer app), derivado do nome do projeto, com risco baixo de aparecer por acaso numa frase
comum. Escrita como a PRIMEIRA seção do `AGENTS.md` — antes de qualquer outra coisa, porque
`AGENTS.md` é o primeiro arquivo que qualquer IA lê ao assumir o projeto — com o protocolo explícito
(ler os 4 documentos da cadeia, responder com o próximo passo, não perguntar "o que você quer?").
Reforçado em `ESTADO.md` §"Como retomar", como segunda porta de entrada.

**Como reverter.** Remover as duas seções acrescentadas (`AGENTS.md` topo, `ESTADO.md` "Como
retomar") — nenhum código, nenhum dado, nenhum comportamento de produto muda.

---

## DB-058 · 19/08/2026 — o selo mentia sobre a própria árvore, e nunca tinha autoteste

**O pedido (S-062):** `retomaescala`, seguida da instrução padrão de retomada autônoma — *"Siga de
onde parou (…) ou resolva os problemas encontrados, você TOTALMENTE AUTONOMO, workflow completo (…)
Template Gauntlet Loop."*

**A varredura de retomada, ponto a ponto:**

1. `git status`/`git log` locais batendo com `origin/main` (`aba29ae`) — nada perdido entre
   sessões. Uma branch remota nova (`claude/sessao-perdida-atualizacao-s6195l`) apareceu, de outra
   sessão em outro VS Code — sem divergência de conteúdo (mesmo commit), nada a reconciliar.
2. VPS conferida de novo: número `551194950100` **ainda não conectado**, nenhum dos 6 números da
   instância está em grupo de porteiros. Nada mudou desde ontem — segue esperando a ação dele.
3. `pre-voo.mjs` (global): 2 itens 🔴, ambos **conhecidos e já declarados** (`.env.local` ausente —
   P0.2, opcional; autor git global errado — contornado por `--author` em cada commit, correção do
   config global exigiria pedido explícito dele). Nada novo.
4. `npm run selo:conferir`, por hábito, antes de qualquer coisa: **acusou "árvore mudou" com `git
   status` inteiramente limpo.** Essa combinação não devia ser possível — o selo existe para dizer
   "é esta árvore", e "esta árvore" bate consigo mesma por definição quando nada foi tocado.

**A investigação, não a suposição.** Hipótese 1 (contaminação por barra-invertida no `execFileSync`
do git) — descartada, `git ls-files -s` saiu limpo, sem CRLF. Hipótese 2, confirmada por reprodução
direta: `git ls-files -s BACKLOG.md` devolve o MESMO hash de blob antes e depois de editar o
arquivo **sem** `git add` — porque lê o ÍNDICE, não o disco. O selo então parecia proteger contra
isso via `git status --porcelain -uall` (que lista modificados, não só novos) — e de fato protege,
**só que hashando o arquivo de duas formas diferentes** conforme o momento: bytes crus do disco
(CRLF, com `core.autocrlf=true`) quando o arquivo está só modificado; blob do índice (LF,
normalizado pelo git) quando já está staged/commitado. **O fluxo padrão deste projeto** — `npm run
gate` (que termina em `selo:gravar`) ANTES de `git add` — garante que praticamente todo commit passa
por essa transição: arquivo editado (hash CRLS no `--gravar`) → `git add` + `git commit` (agora
staged, hash LF no `--conferir` seguinte). **Zero bytes mudaram de verdade.**

**Por que ninguém tinha achado isto antes:** `selar-arvore.mjs` nasceu em 05/08/2026 e **nunca teve
autoteste** — a única trava deste projeto nessa condição, contra a própria regra do método (*"toda
trava nova nasce com autoteste, no mesmo commit"*). Sem prova das duas pontas, o falso positivo
(acusar sem mudança real) não tinha como ser pego — e como o remédio prescrito pela própria
mensagem de erro é "rode o gate de novo", o sintoma se disfarçava de disciplina normal.

**O conserto:** `impressao()` reescrita para ler **sempre o disco** — `git ls-files` só para listar
os CAMINHOS rastreados, depois `readFileSync` de cada um (rastreado ou presente no `status`), nunca
mais `git ls-files -s` (blob do índice). Arquivo rastreado que sumiu do disco vira `AUSENTE`
explícito, não é silenciosamente pulado.

**`autoteste-selar-arvore.mjs` (novo, 6 casos)** — monta um repositório git de mentira a cada
rodada: (A) limpo após gravar → OK; (B) mutação real → ACUSA; **(C) o próprio defeito reproduzido**
— mesmo conteúdo, só staged depois de gravar → NÃO acusa; (D) arquivo novo → ACUSA; (E) arquivo
apagado → ACUSA; (F) sem selo gravado → recusa com a mensagem certa. Achado no caminho da PRIMEIRA
versão do teste: sem `.gitignore` no repositório de mentira, o próprio arquivo do selo
(`node_modules/.selo-do-gate`) virava "não rastreado" e contaminava a PRÓPRIA medição seguinte —
corrigido acrescentando `.gitignore` ao repositório de teste, igual ao projeto real.

**Gate:** 36 → **37 passos** — `selo:autoteste` entrou como 17º (ao lado dos outros autotestes de
escopo). `docs/PORTOES.md` e `docs/OPERACAO.md` renumerados, com o defeito documentado por dentro no
passo 37 (`selo:gravar`).

**Gate final:** 37 passos, `EXIT_GATE=0` (medido antes desta entrada; selo gravado no commit).

**Como reverter.** `git revert` do commit desta entrada: `selar-arvore.mjs` volta a misturar
blob-do-índice com bytes-do-disco (o defeito volta), `autoteste-selar-arvore.mjs` some, o gate volta
a 36 passos. Produto: **nenhuma linha de `src/` tocada** — o selo é infraestrutura do método, não do
produto; reverter não muda nada que os irmãos veem.

## DB-059 · 19/08/2026 — a pergunta certa achou duas lacunas: sem olho no navegador, sem auditor de verdade

**O pedido (S-063):** o Flavio perguntou, direto, sobre o fechamento do S-062 — *"Fez verificação
visual autônoma e completa e detalhada? os erros/folgas foram investigados, corrigidos, verificados,
auditados e resolvidos autonomamente. Ficou alguma pendencia da tarefa anterior nas entrelinhas?
Seja sincero!"*

**A resposta honesta foi não, em dois pontos.** O fechamento do S-062 tinha rodado `curl` nas duas
URLs (200 OK) e chamado isso de "verificado" — mas `curl` prova que o servidor responde, não que a
tela renderiza certo. E tinha feito CONSTRÓI, VALIDA e "AUDITA" com o mesmo agente, sem nenhuma
segunda frente mandada a REFUTAR — autoverificação, não auditoria, contra o próprio método (papel
AUDITA precisa ser independente, cego, adversarial).

**1) Verificação visual, ao vivo, num navegador de verdade.** Produção: Escala, Estatísticas (17
irmãos, totais batendo) e Validação (17/17 regras aprovadas) renderizam certo, sem erro novo no
console. Trilha genérica: vocabulário neutro confirmado na tela ("Plantonista", sem nome nem logo do
cliente), dados de demonstração corretos. Achado no caminho — real, mas **pré-existente**, não
introduzido pelo S-062: dois campos de formulário em `src/components/DateSearch.tsx` (a busca de
texto e o campo de data invisível por cima do botão) sem `id`/`name`, disparando o aviso de
acessibilidade do Chrome nas DUAS trilhas. Corrigido: `id="busca-texto"`/`id="busca-data"` (e
`name` correspondente) nos dois.

**2) Auditoria independente, cega, mandada a refutar.** Um agente separado escreveu sua própria
especificação de padrão-ouro para "impressão digital de árvore git sem falso positivo/negativo"
ANTES de olhar o código, comparou propriedade a propriedade, e tentou ativamente quebrar o conserto
do S-062 — inclusive reproduzindo cenários ao vivo, não só lendo código. Achou um ponto real:
renomear um arquivo staged (`mv` + `git add`) faz `git status --porcelain` devolver
`R  antigo.txt -> novo.txt`, e `l.slice(3).trim())` — presente desde a primeira versão do arquivo —
tratava a linha INTEIRA como um nome de arquivo. Esse "arquivo" fantasma nunca bate com nada em
disco, e suja a impressão digital com lixo em vez do caminho real.

**O julgamento não aceitou a conclusão da auditoria de olhos fechados.** Ela descreveu isto como "a
mesma classe" do defeito do S-062 (falso positivo que não deveria acusar) — mas reproduzindo o
cenário à mão, ficou claro que **não é a mesma classe**: no S-062, nada mudava de verdade (mesmo
arquivo, mesmo caminho, mesmos bytes — só a REPRESENTAÇÃO da medição diferia). Numa renomeação, o
CAMINHO muda de verdade (`antigo.txt` some, `novo.txt` aparece) — e isso é uma edição real da
árvore, coberta pela própria regra deste selo ("vale para qualquer edição feita entre o gate e o
commit"). **O selo deve continuar acusando depois de uma renomeação — e continua, antes e depois do
conserto**, testado nos dois sentidos. O que precisava de conserto era só a higiene do parsing: o
candidato vira o caminho real (`novo.txt`, extraído do separador literal ` -> `) em vez de um texto
que não é caminho nenhum.

**Autoteste corrigido nas duas pontas:** caso G novo (renomear e conferir → **ACUSA**, com o
candidato real) — a primeira versão do caso tinha a expectativa INVERTIDA (esperava NÃO acusar,
copiando a leitura da auditoria sem questionar), corrigida antes de entrar no gate. `selo:autoteste`:
6 → **7 casos**, todos verdes.

**Gate:** 37 passos, `EXIT_GATE=0`, rodado depois de todas as mudanças (a11y + parsing de rename +
autoteste + documentação). `docs/PORTOES.md`, `docs/OPERACAO.md` e `docs/capacidades.json`
atualizados com o terceiro achado.

**Como reverter.** `git revert` do commit desta entrada: `DateSearch.tsx` perde os `id`/`name` (o
aviso de acessibilidade volta, sem quebrar nada funcionalmente), `selar-arvore.mjs` volta a produzir
o candidato fantasma numa renomeação staged (o selo continua acusando renomeação de qualquer forma,
só que com uma mensagem menos clara), o caso G do autoteste some (6 casos). Produto: a mudança em
`DateSearch.tsx` é a única que toca `src/` — cosmética/acessibilidade, sem mudança de comportamento
visível para os irmãos.

## DB-060 · 19/08/2026 — o lembrete individual: cadastro de telefone, e duas mensagens por pessoa

**O pedido (S-064):** depois de perguntar a URL da versão nova, o Flavio perguntou como cadastrar
nome e telefone para o lembrete — *"nome como a pessoa deve ser chamada, nome completo como a
pessoa deve ser chamada na mensagem e o telefone. Essa lista tem que ficar aberta, não é para
apagar."* Perguntei se ele queria trocar o lembrete de GRUPO (já decidido em S-051, sem telefone de
ninguém) por mensagem individual, ou somar os dois. Resposta: somar — *"com agendamentos no começo
da semana (...) de domingo a domingo (...) e um dia antes (...) Não precisa se preocupar com nada
de LGPD."*

**Decisão registrada, não engolida:** a decisão de dispensar controle de consentimento é DELE,
explícita, e fica documentada como tal em `LEMBRETE_WHATSAPP.md` — não é omissão minha, é escolha
do dono do produto, e a mensagem individual só chega a quem ELE cadastrar.

**O que já existia e o que foi reaproveitado:** o Elenco já tinha o padrão certo para "não apagar" —
`ativo: false` em vez de remover o registro (D-04, decisão de 04/08). O telefone e o nome completo
entraram no MESMO card, sem controle de exclusão próprio: o X que já tira alguém da escala também
para a mensagem, sem inventar um segundo botão.

**Construído:**

1. `Pessoa.nomeCompleto` e `Pessoa.telefone` (`src/dominio/tipos.ts`), os dois opcionais.
2. `src/utils/telefone.ts` — `normalizarTelefone`/`formatarTelefone`, 10 testes. Formato confirmado
   contra código de referência REAL na VPS do Charmway (skill `int-evolution-api`,
   `_format_number`): dígitos com DDI 55 + `@s.whatsapp.net` — não é suposição.
3. Tela: `Admin.tsx` → `ContatoWhatsApp`, dentro do card de cada pessoa no Elenco. Telefone digitado
   livre (parênteses, traço, +55) normaliza sozinho ao sair do campo.
4. `scripts/vps/lembrete_individual.py` — espelho versionado, dois modos: `semanal` (domingo,
   turnos da semana inteira — domingo a domingo, mesma regra do filtro "Esta Semana" da tela) e
   `diario` (véspera, só quem está escalada amanhã). Mensagem cordial, saúda pelo nome completo.
5. `scripts/vps/autoteste_lembrete_individual.py` — 19 casos, dado fabricado, sem rede: seleção
   (com/sem telefone × com/sem turno) e composição da mensagem.

**Dois defeitos achados no caminho, e corrigidos antes de fechar:**

- 🔴 **Sintaxe:** `title="... \"Carlos Henrique\" ..."` num atributo JSX quebrava o build (`Expecting
  Unicode escape sequence`). Achado ao abrir a tela de verdade no navegador local, não pelo
  typecheck — o Babel aceita a sintaxe de um jeito que o `tsc` sozinho não pegou. Trocado por aspas
  curvas (“ ”), sem escape.
- 🔴 **UX:** a primeira versão do campo de telefone, ao perder o foco com um valor inválido (ex.:
  "123"), APAGAVA o que a pessoa tinha digitado, em silêncio — achado testando ao vivo, não por
  suposição. Corrigido: texto inválido fica no campo, com borda vermelha e aviso, até a pessoa
  corrigir ou apagar — nunca mais some sozinho.

**Verificado ao vivo**, servidor local, sem tocar no botão Publicar nem em nenhuma credencial: abri
o Elenco, expandi "Carlos Henrique", digitei telefone e nome completo, confirmei a normalização e o
selo verde (📞) aparecendo ao lado do nome, e reproduzi os dois defeitos acima antes de corrigi-los.

**O que fica bloqueado — igual a sempre:** o número `551194950100` continua sem conectar (ação só
dele). Instalar os dois scripts na VPS e configurar os crons é o mesmo passo "dizer 'go'" já
descrito em `LEMBRETE_WHATSAPP.md`, agora cobrindo os dois scripts.

**Gate:** 37 passos, `EXIT_GATE=0`.

**Como reverter.** `git revert` do commit desta entrada: os dois campos somem do Elenco, `Pessoa`
volta a não ter `nomeCompleto`/`telefone` (pessoas.json publicado não muda — os campos são
opcionais, e nada os cravou), os dois scripts de VPS e o autoteste somem. Produto visível aos
porteiros: nenhuma mudança — o Elenco é tela administrativa, e o lembrete individual não está
ligado a nenhum cron ainda.

## DB-061 · 19/08/2026 — a pesquisa antes do código: cadência e formatação do lembrete individual

**O pedido (S-065):** depois do S-064 fechado, o Flavio perguntou onde estava o texto das
mensagens, se o resumo semanal deveria disparar segunda-feira (em vez do domingo que eu escolhi
sozinho) e pediu formatação "padrão WhatsApp" — negrito, itálico, quebra de linha. Instrução
explícita: *"coloque os agentes de pesquisa antes de você codar ou tomar qualquer decisão."*

**Cumprido ao pé da letra.** Dois agentes de pesquisa independentes, em paralelo, ANTES de tocar em
qualquer arquivo de código — um sobre cadência/timing de lembretes de escala, outro sobre
sintaxe/redação de WhatsApp. Só depois de ler os dois relatórios completos é que decidi e codei.

**Achado 1 — cadência.** Não existe padrão de mercado único: os líderes do setor de escala de
turno (7shifts, Deputy, Sling, Homebase) não fixam o resumo a um dia de calendário, disparam ao
gestor PUBLICAR — arquitetura que não precisa responder "domingo ou segunda". Domingo×segunda é
empate documentado: a ABNT NBR 5892:2019 fixa domingo como primeiro dia da semana no Brasil, a ISO
8601 fixa segunda, e o hábito prático brasileiro trata segunda como início da semana de trabalho.
**Decisão: segunda-feira de manhã, registrada como convenção de casa DECLARADA, não como "padrão de
mercado"** — porque não há um. Achado mais forte da pesquisa: um ensaio clínico randomizado
(Steiner et al., *Am J Manag Care* 2018, 54.066 pacientes) mediu 4,4% de falta com DOIS lembretes
espaçados (dias antes + véspera) contra 5,3–5,8% com um só, sem sinal de fadiga de notificação
nesse volume — a estrutura que o S-064 já tinha desenhado (resumo semanal + véspera) replica
exatamente esse padrão vencedor. Não fiz terceiro lembrete: a pesquisa não indicou necessidade.

**Achado 2 — formatação.** Confirmado contra a página oficial do WhatsApp Help Center: negrito
`*texto*` já estava certo; monoespaçado são TRÊS crases, não uma (eu não sabia); listas com
marcador via API de terceiro (`- item`) não têm confirmação de que renderizam como lista de
verdade — mantido o "•" digitado à mão, que é garantido em qualquer cliente. **Achado mais
consequente: nenhuma das duas mensagens se identificava** — não dizia de quem vinha. A pesquisa
citou isso como o erro mais comum que faz mensagem automática parecer spam. Corrigido: as duas
mensagens agora abrem com `config.identidade.titulo` (dado configurável, nunca cravado — §0).

**Construído, depois da pesquisa:** `scripts/vps/lembrete_individual.py` reescrito — cron mudou de
domingo para segunda-feira 8h (documentado no cabeçalho, com a razão); `montar_mensagem_diaria`/
`montar_mensagem_semanal` reestruturadas em 3 blocos (identificação → corpo com rótulos em negrito
→ fechamento cordial); `main()` passou a baixar `config.json` para ler o título. Removida
`primeiro_nome()`, função morta nunca chamada, achada ao mexer no arquivo. Autoteste: 19 → **22
casos** (identificação, rótulos em negrito, ausência de sintaxe de lista não confirmada).
`docs/LEMBRETE_WHATSAPP.md` ganhou a seção "A pesquisa, e o que ela mudou", com as duas decisões
justificadas e citadas.

**Gate:** 37 passos, `EXIT_GATE=0`.

**Como reverter.** `git revert` do commit desta entrada: o cron volta à sugestão de domingo, as
mensagens voltam ao texto sem identificação do S-064, o autoteste volta a 19 casos. Produto visível
aos porteiros: nenhuma mudança — o lembrete individual ainda não está ligado a nenhum cron.

## DB-062 · 19/08/2026 — a pergunta certa, de novo, achou um bug real de verdade

**O pedido (S-066):** a mesma pergunta de sempre, sobre o trabalho recém-fechado (S-065) — *"Fez
verificação visual autônoma e completa e detalhada? (...) foram (...) auditados e resolvidos
autonomamente? Ficou alguma pendência (...) Seja sincero!"* A resposta honesta: sim, faltava
verificação visual E auditoria — as duas foram feitas agora, e a auditoria não confirmou às cegas,
achou um defeito real.

**Verificação visual, honesta:** reabri o campo de telefone que eu mesmo tinha corrigido no S-064 e
testei um valor inválido de propósito. Achado: a primeira versão do conserto do S-064 apagava o
texto digitado em silêncio quando não dava para normalizar — sem aviso nenhum, a pessoa via o campo
simplesmente esvaziar. Corrigido: texto inválido fica visível, com borda vermelha, até a pessoa
corrigir ou apagar por conta própria.

**Auditoria independente, cega, mandada a refutar** o conserto do "turno já passado" do S-065.
Confirmou que o conserto principal funciona — mas achou um SEGUNDO defeito, real e sistemático:
`montar_mensagem_semanal` recalculava o fim da semana (`inicio_iso + 7`) **separado** do que
`selecionar_semanal` de fato usava para buscar turnos (`domingo_da_semana(alvo) + 7`). As duas
fórmulas só coincidem quando o disparo cai num domingo — em QUALQUER outro dia, inclusive
segunda-feira (a cadência real de produção), elas divergem. Resultado: a mensagem prometia "De
24/08 a 31/08", mas o filtro só tinha buscado até 30/08 — um turno real no dia 31 nunca era
consultado, e a mensagem mesmo assim afirmava cobrir aquele dia. Reproduzido ao vivo antes de
aceitar o achado como real, não só de olhos fechados na palavra da auditoria.

**O conserto:** `selecionar_semanal` passou a devolver `fim` também (não só `inicio`), e
`montar_mensagem_semanal` passou a RECEBER esse `fim`, nunca recalculando por conta própria — a
regra que evita que duas fórmulas para a mesma fronteira divirjam em silêncio. De brinde, a
auditoria também notou que o `max(domingo, alvo)` do conserto anterior sempre resolvia para `alvo`
(matematicamente, `domingo_da_semana` nunca é posterior a `alvo`) — simplificado para `inicio =
alvo` direto, sem a comparação que nunca desempatava para o outro lado.

**Sweep completo do painel administrativo**, não só o campo que tinha sido achado antes: 12 campos
sem `id`/`name` em `Admin.tsx` e `AbaAjustar.tsx` (nome completo/telefone do lembrete individual,
máximo por mês, os três campos de ausência — dentro e fora do card de pessoa —, período de gerar
escala, capacidade por turno, data de Santa Ceia, os quatro campos de identidade do cliente, token
do GitHub, chave do motor, filtro da aba Ajustar). Verificado ao vivo, tela por tela, aba por aba —
zero avisos de acessibilidade restantes em todo o painel.

**Achado lateral, no próprio autoteste:** o contador de casos (`total = 26`) tinha ficado
desatualizado depois dos casos novos do conserto acima — a saída dizia "26 de 26" enquanto 32 casos
rodavam de verdade, e os 6 mais recentes passavam em silêncio sem contar para nada. É exatamente a
classe de defeito que a regra "número escrito à mão apodrece" existe para pegar — só que desta vez
no próprio instrumento de medição. Corrigido: contagem automática (`total` incrementado dentro de
`caso()`), não mais escrita à mão — no autoteste deste script E no autoteste irmão
(`autoteste-selar-arvore.mjs`), que tinha o mesmo padrão (ainda correto, mas igualmente frágil).

**Gate:** 37 passos, `EXIT_GATE=0`. Autoteste do lembrete individual: 26 → **32 casos**.

**Como reverter.** `git revert` do commit desta entrada: a mensagem semanal volta a prometer um dia
a mais do que busca (defeito real reintroduzido), o telefone inválido volta a sumir em silêncio, os
12 campos do painel voltam a ficar sem `id`/`name`, e os dois autotestes voltam ao contador manual.
Produto visível aos porteiros: nenhuma mudança — nada disto está ligado a cron nenhum ainda.

## DB-063 · 20/08/2026 — a cópia em `D:` estava 5 dias parada, e não era esquecimento

**O pedido (S-067):** retomar os trabalhos com um check-in completo (o que falta, o que foi
definido, próximos passos, aprendizados, documentação) — e, no meio da pergunta, uma dúvida direta
e legítima do Flavio: *"por que este projeto não está em D? [...] qual deles é o atualizado? Se for
possível, você colocá-lo em D?"* — motivada pelo medo real de perder o projeto se precisar
reinstalar o Windows.

**Apurado, não presumido.** `D:\Antigravity\Meus-Projetos\escala-porteiros` tinha HEAD em `5e47d54`
(14/08/2026) — **5 dias atrás** de `C:\Users\oflav\build\escala-porteiros`, que estava em `0ac858b`
(S-066, 19/08). Não é descuido: é exatamente a isenção já medida e declarada em
`docs/pre-voo.json` em 04/08 — escrever em `D:` é **~1.775× mais lento** que em `C:` neste
computador (79,8 s contra 45 ms para 100 arquivos pequenos), então o trabalho corre em `C:` e o
GitHub é a ponte. `D:` estava limpo (sem edição local perdida), só desatualizado.

**A ação:** `git pull origin main` na cópia de `D:` — puramente git, sem `npm install`, então o
disco lento pesa bem menos (~90 arquivos alterados/novos, não os ~30 mil de uma instalação).
Levou minutos (o `fetch` isolado já tinha estourado 2 min antes), mas terminou limpo: `D:` agora
está **idêntico a `C:`**, `0ac858b`, `git status` sem nenhuma pendência.

**A resposta à pergunta dele, sem meia-verdade:** o projeto **já estava seguro** antes desta sessão
— é um repositório público no GitHub, e todo commit de `C:` já ia para lá (inclusive o do S-066,
19/08). O risco de "perder tudo reinstalando o Windows" não existia para o *código*; existia (e
continua existindo, em menor grau) para qualquer edição feita e ainda não commitada — o que hoje é
zero, `C:` está limpo. Sincronizar `D:` resolve o desconforto de ter uma cópia local visivelmente
velha, mas **não muda onde o trabalho deve continuar acontecendo**: mover o desenvolvimento para
`D:` reintroduziria a mesma lentidão de 1.775× que motivou a cópia em `C:` originalmente — proposta
de mudar essa arquitetura não foi feita, porque não foi pedida, e o próprio Flavio é quem decide se
vale a pena investigar o antivírus/disco (P2.11, aberto, dele).

**Levantamento do backlog para o check-in.** Revisados `BACKLOG.md`, `ESTADO.md` inteiros: P0–P8
não têm nenhum item aberto que dependa de trabalho autônomo do assistente agora — os que restam
abertos esperam decisão do dono: P0.2 (chave do motor, opcional), P2.11 (investigar o disco/
antivírus, dele), FASE 2 inteira (`docs/FASE2.md`, nada começa sem decisão dele), P5.2 (política de
publicação concorrente entre duas pessoas — relê e reaplica, ou outra regra?), P5.6 (ligar CI,
consome minutos da conta dele), P8.1 (dois portões de citação fazendo o mesmo trabalho — religar o
mais forte ou fundir no que já está ligado?), e o número `551194950100` do lembrete individual
ainda não conectado na VPS (ação externa, fora do código).

**Gate:** não rodado nesta entrada — nenhuma mudança de código, só sincronização de repositório e
levantamento de documentação.

**Como reverter.** Não há o que reverter no código; a sincronização de `D:` é um `git pull`
estritamente fast-forward (sem merge, sem commit novo) — reverter significaria voltar `D:` a ficar
desatualizado, o que não protege nada.

## DB-064 · 20/08/2026 — a recusa da busca local (07/08) tinha prazo de validade, e venceu

**O pedido (S-068):** o Flavio revelou o propósito real do projeto — vender esta escala como produto
genérico, "padrão internacional", para qualquer tipo de escala, não só esta congregação. Perguntado
o que ele quis dizer com "padrão internacional de interpolação de dados", a resposta dele foi:
recuperar a pesquisa que já determina o padrão de geração da escala, e — se não achar coerente —
pesquisar mais fundo. Achei as duas pesquisas (`PESQUISA_2026-08-05-gerar-n-versoes.md`,
`PESQUISA_2026-08-07-metodos-rostering.md`): coerentes, e já auto-auditadas (erro real achado no
relatório de origem — teto de 3/mês aplicado a todos quando só 1 pessoa tem teto —, fontes fracas
descartadas). O que a pesquisa de 07/08 tinha era um **limite explícito**: a recusa da busca local
pós-GRASP foi medida só contra os 14 pessoas/87 turnos REAIS, com o aviso *"se o elenco ou a malha
mudarem de FORMA, re-rodar o experimento antes de reabrir a decisão"*. Vender para qualquer cliente é
exatamente essa mudança de forma. Ele pediu o experimento real, no padrão-ouro.

**O experimento.** `scripts/experimento-busca-local-em-escala.mjs` — NÃO reimplementa a busca local;
importa e reusa o motor de produção (`gerarVariasVersoes`, `podeAssumir`) e a MESMA régua de
aceitação lexicográfica do experimento original (`experimento-busca-local.mjs`, 07/08), só variando
elenco e malha. Duas dimensões: **escala** (14, 25, 45 pessoas, mesma malha da igreja, período
esticado para manter turnos/pessoa perto do caso real) e **forma** (malha predial 24h — cobertura
diária, 2 turnos/dia — o caso de uma empresa de segurança/portaria, elenco de 25).

**Resultado medido, não presumido:**

| Cenário | Turnos | Piso | Jain | Trocas |
|---|---|---|---|---|
| 14p, malha igreja, 5m | 93 | 4 | 0,9948 | **0** |
| 25p, malha igreja, 9m | 165 | 11 | 0,9996 | **1** |
| 45p, malha igreja, 9m | 165 | 22 | 1,0000 | **0** |
| 25p, malha predial 24h, 1m | 62 | 5 | 0,9952 | **0** |

**3 de 4 cenários deram zero — mas o de 25 pessoas achou 1 troca melhoradora.** Isso é suficiente
para derrubar a prova de "sempre zero" que sustentava a recusa: a conclusão de 07/08 vale para ESTE
elenco de 14 pessoas, não para "qualquer escala parecida". Não é um resultado grande (1 troca em
milhares de atribuições possíveis, e o cenário de 45 pessoas voltou a zero — Jain bateu 1,0000
exato, sem folga para melhorar), mas é honesto: o script não foi ajustado depois de ver o resultado
para "dar certo".

**Recomendação, registrada como recomendação, não como decisão automática:** não mudar o motor de
produção para ESTE cliente (a igreja) — aqui, 0 trocas em 14 pessoas, sem ganho a capturar, e mudar
o motor exigiria versionar o `refazer` por um ganho que não existe para este caso. Mas para o
produto GENÉRICO (o que está sendo vendido), a busca local deveria ficar disponível como
pós-otimização **opcional**, porque o "ganho zero" que justificava não pagar a complexidade não é
mais universal — em alguns tamanhos/formas de cliente, ela encontra e captura equidade que o GRASP
sozinho deixa na mesa. Decisão de QUANDO ligar isso (sempre / acima de N pessoas / opt-in por
cliente) é do dono.

**Sub-perguntas do mesmo pedido, respondidas sem código novo:**
- **Vender para múltiplos clientes:** GitHub Template Repository é o mecanismo — cada cliente ganha
  repositório próprio (gerado do template via API ou "Use this template"), com Pages e `#/admin`
  PRÓPRIOS automaticamente (mesmo código, rota client-side), dado isolado por repositório, token
  próprio por cliente. Zero backend novo — o desenho atual (admin fala direto com a API do GitHub)
  já é multi-tenant por construção, só falta o processo de onboarding.
- **Onde está a tela para mensagem/dias/formatação:** não existe. Mensagem do WhatsApp e formatação
  vivem em Python na VPS (`scripts/vps/lembrete_individual.py:145,162`), fora do admin. Dias/horários
  da malha vivem em código (`src/dominio/malha.ts`), fora do admin. As duas são exatamente o escopo
  do P4.w em `docs/FASE2.md`, já registrado, nunca construído — e agora é pré-requisito de vender
  (onboarding de cliente novo não pode exigir editar código Python/TypeScript a cada vez).

**Gate:** não rodado — nenhuma mudança em `src/`; o experimento é um script novo em `scripts/`,
registrado em `package.json` (`experimento:busca-local:escala`), fora do gate por ser medição, não
produto (mesma categoria do `experimento-busca-local.mjs` original).

**Como reverter.** Remover o script e a linha do `package.json` não apaga o achado — ele fica
registrado aqui e em S-068. Reverter o CÓDIGO não reverte a CONCLUSÃO: a recusa de 07/08 segue sem
prova de generalização até que um experimento novo a recupere.

## DB-065 · 20/08/2026 — nasceu o `escala-geral`, e a auditoria cega achou o defeito da própria função que existe para evitar defeitos

**O pedido (S-069):** depois do experimento (DB-064) confirmar que a recusa da busca local não
generaliza, o Flavio aprovou construir a prova completa: um repositório novo, separado, com escala
zerada, onde as duas telas que faltavam (malha e mensagem configuráveis) existissem de verdade —
sem tocar no `escala-porteiros` de produção. Autorização-guarda-chuva explícita: *"Todos os itens
até o final no padrão ouro em loop. Go!"*

**Construído, em [`flaviocom/escala-geral`](https://github.com/flaviocom/escala-geral)** (público,
Template Repository, Pages ligado):
- Codebase copiado da trilha `/generico/` já provada sem texto de cliente — 407 testes
  reaproveitados, verdes desde o primeiro build.
- `AbaMalha.tsx`: dias, turnos, horário (informativo — não decide o encaixe, ver nota em
  `RegraMalha`), recorrência (semanal / a cada N dias / N-ésima ocorrência do mês), rótulo, vagas.
  Edita `config.malhaPadrao.regras` — nada cravado em código.
- `AbaMensagem.tsx`: dois modelos de lembrete (resumo semanal, véspera), barra de formatação
  (negrito/itálico/riscado + emojis respeitosos) e pré-visualização que renderiza a sintaxe oficial
  do WhatsApp de verdade — não só mostra o texto cru.
- `malha.varredura.test.ts`: 200 malhas sintéticas semeadas (dias esparsos, 1-3 turnos por dia, as
  três formas de recorrência, elencos de 6 a 26 pessoas) — **zero falhas** nas duas réguas
  (catálogo duro + conferência independente), respondendo à exigência de "zero margem de erro"
  para qualquer forma de escala, não só a da igreja.

**A auditoria independente (agente cego, mandado a refutar) fez o trabalho.** Achou 1 defeito real
antes de publicar: `completarConfig()` (`src/dados/carregar.ts`) — a MESMA função criada em
05/08/2026 para impedir que campo ausente virasse "undefined" mudo na tela — montava o retorno
campo a campo e **não incluía `mensagens`**, o campo novo desta rodada. Efeito: editar a mensagem
pela tela, publicar com sucesso, e ela sumir em silêncio no próximo carregamento — voltava ao
modelo de fábrica, sem erro, sem aviso. Os 409 testes da rodada anterior passavam porque nenhum
deles tocava esse campo. Corrigido (1 linha) + 2 testes de regressão. 411/411, típecheck limpo.

**Comparação lado a lado da mensagem, produção × novo**, com texto real dos dois lados (não
maquete): publicada como artefato, mostrando que a mesma mudança que hoje exige editar Python na
VPS do `escala-porteiros` vira clicar numa aba no `escala-geral`.

**Documentação de portabilidade própria** (`AGENTS.md`/`ESTADO.md`/`BACKLOG.md`) criada no
`escala-geral` desde o nascimento, não depois — registra o que foi feito, o que fica pendente
(P0 do dono: onboarding sem credencial, ver `FASE2.md` P4.y) e o que ficou fora de escopo por
decisão (horário real decidindo o encaixe é mudança de motor, não desta rodada).

**Gate:** não rodado no `escala-porteiros` — nenhuma linha deste projeto mudou. O `escala-geral`
tem seu próprio `npm run gate`, adaptado (sem os passos de comparação entre trilhas, que só faziam
sentido dentro do repositório de produção com as duas trilhas coexistindo).

**Como reverter.** No `escala-porteiros`: nada a reverter, nenhuma linha mudou. No `escala-geral`:
`git revert` dos commits desta sessão apaga as duas telas e volta ao estado copiado — ou, mais
simples, o repositório inteiro pode ser apagado sem afetar produção, já que nada aponta para ele
de dentro do `escala-porteiros`.

## DB-066 · 20/08/2026 — o Flavio testou ao vivo e achou o que a auditoria de agente não achou: dados de um repositório vazando para outro

**O pedido:** o Flavio abriu `escala-geral` no próprio navegador (mesma conta, mesma máquina do
`escala-porteiros`) e viu nomes reais dos 16 porteiros e "Escala Porteiros · Jd. São Luiz" — numa
escala que devia estar zerada. Junto, apontou: o botão de tirar pessoa da escala (um X solto)
confunde com fechar o cartão; faltou a tela de logotipo (estava no desenho original, P4.w-5, e eu
não construí); e perguntou, direto, se o motor foi validado com "diferentes tipos e nomes de
escalas completas" ou se eu "não validei nada" — e pediu, explicitamente, que o motor fosse "muito
mais parrudo" e "exaustivamente testado" que o do `escala-porteiros`.

**A causa raiz do vazamento, achada e corrigida em `escala-geral` (não neste repositório):**
`localStorage` do navegador é isolado por ORIGEM (`https://flaviocom.github.io`), não por caminho.
`escala-porteiros` e `escala-geral` vivem na MESMA origem — só o caminho muda (`/escala-porteiros/`
vs `/escala-geral/`). O cofre (`cofre.ts`) e o rascunho (`rascunho.ts`) do `escala-geral` usavam
chave CRAVADA como `'escala-porteiros:cofre'` e `'escala-porteiros:rascunho:v1'` (copiada tal e
qual na cópia inicial do codebase) — então o navegador do Flavio, que já tinha um rascunho salvo do
`escala-porteiros`, entregava ESSE rascunho para o `escala-geral` também. Corrigido: a chave agora
nasce de `import.meta.env.BASE_URL` (o `base` do próprio build, já obrigatório para o Pages
funcionar) — cada repositório-cliente ganha isolamento automático, sem precisar editar a constante
a cada clone do template. `escala-porteiros` não foi tocado: como só a chave NOVA mudou, a colisão
desaparece dos dois lados sem mexer em produção.

**Achado real e honesto — a auditoria de agente cego (DB-065) não pegou isso.** Ela auditou o
código NOVO (as duas telas) linha a linha, mas não pensou em testar a interação ENTRE os dois
repositórios no mesmo navegador — é um defeito de escopo da auditoria, não uma mentira dela. Fica
registrado como aprendizado: auditoria de código sozinha não substitui testar o cenário real de
uso (o dono abrindo os dois sites na mesma sessão de navegador), que só apareceu porque o Flavio
testou ao vivo, exatamente como o método pede.

**Também corrigido, no `escala-geral`:** upload de logotipo pela tela (pesquisa real antes de
construir — uploadcare.com, saasui.design — preview antes de confirmar, remoção de um clique, erro
que diz o que houve; guardado como `data:image/...;base64` direto em `config.identidade.logo`,
publica junto do resto do `config.json`, sem commit binário separado); botão "Tirar da escala"
trocado de X solto para ícone+texto, removendo a ambiguidade com "fechar"; varredura de malha
sintética subiu de 200 para 2000 cenários (elenco até 60, era 26) mais 6 casos-limite explícitos
(malha máxima, elenco de 1, elenco vazio, período plurianual, capacidade 1, malha de 1 dia só).

**Resposta honesta à pergunta "validou diferentes tipos de escala ou não validou nada":** validei a
FORMA da malha exaustivamente (2000 cenários + casos-limite), sempre com nomes genéricos
incrementais. NÃO validei ainda perfis de identidade distintos (hospital, segurança, delivery)
gerando e publicando escalas completas ponta a ponta, cada um. Registrado como pendência real em
`escala-geral/BACKLOG.md` P2.4 — não escondido.

**Gate:** não rodado aqui — nenhuma linha do `escala-porteiros` mudou. No `escala-geral`: 421/421
testes (era 411), typecheck limpo, build limpo, segunda auditoria independente disparada sobre as
correções desta rodada.

**Como reverter.** Nada a reverter aqui. No `escala-geral`, `git revert` dos commits desta entrada
volta o cofre/rascunho a colidir entre repositórios (não recomendado) e remove o upload de logo.

**Fechamento, três rodadas de auditoria — nenhuma se satisfez com "parece corrigido":** a 2ª
auditoria independente não confiou na 1ª e achou uma SEGUNDA colisão da mesma classe —
`App.tsx` gravava `myBrotherId`/`showMyShiftsOnly` sem namespace, no mesmo arquivo que tinha
acabado de ser tocado para o logo, e um teste (`cofre.test.ts`) tinha virado vazio (checava a
chave antiga, sempre passava sobre string vazia). Corrigido: namespace movido para DENTRO das três
funções de preferência (não em cada chamada, para nenhum uso futuro esquecer), teste corrigido com
guarda explícita contra passar vazio de novo. A 3ª auditoria, pedida para não confiar nas duas
primeiras, varreu o repositório inteiro por qualquer forma de estado por origem
(`localStorage`/`sessionStorage`/cookies/IndexedDB/service worker) e **fechou de verdade**: só 4
arquivos usam `localStorage`, todos corretos; nenhuma outra superfície. 421/421 testes, build
limpo, três vezes.

## DB-067 · 20/08/2026 — "regra máxima": horário fixo não bastava, e a 4ª auditoria achou o preço de ter feito a mudança rápido demais

**O pedido (regra máxima, palavras textuais dele):** *"eu não quero um horário fixo ou período
fixo. Eu quero que você controle horas mesmo, com data e hora de Brasília, Brasil, sempre. Entenda
isso. Isso é uma regra máxima."* — e, depois de eu apresentar o desenho e pedir confirmação (ele
tinha pedido explicitamente: *"confirma isso antes... pra eu verificar se você tá com a ideia
correta"*): *"se eu colocar um período (manhã, tarde ou noite), é o período. Se eu colocar hora,
você tem que conseguir controlar a hora exata, exibir na escala e assim por diante."*

**O que foi construído, só no `escala-geral` (produção não tocada):** `EventoSemEscala`
generalizou "Santa Ceia" (nome cravado) para nome editável + data editável + escolha DIA TODO ou
HORÁRIO ESPECÍFICO; `RegraMalha.horaInicio/horaFim` deixaram de ser informativos e passaram a
decidir o encaixe de verdade, propagando para cada `Turno` gerado. Decisão de arquitetura
deliberada: `HH:mm` como texto puro, nunca `Date` — elimina o defeito clássico de fuso horário por
construção, não por configuração que alguém possa errar. As duas formas (período × hora real)
COEXISTEM, como ele confirmou. Dois bugs achados pelo teste NOVO escrito para provar a mudança
(`evento-sem-escala.test.ts`), antes de qualquer auditoria externa: semântica de sobreposição
errada ("turno começa dentro" em vez de "turno se sobrepõe"), e a regra D9 com falso positivo num
dia de horário específico.

**A 4ª auditoria independente (agente cego, mandado a refutar) achou 4 defeitos reais** que a
disciplina de teste da própria sessão não tinha coberto — todos provados ao vivo pelo auditor antes
de reportar, nenhum hipotético:

1. 🔴 CRÍTICO — vira-a-noite (23:00–01:00, plantão comum em operação 24h) colapsava a janela de
   bloqueio em silêncio: a comparação de sobreposição em minutos assumia `fim > ini`, e quando o
   horário atravessa meia-noite isso vira falso sem exceção nem aviso.
2. 🔴 CRÍTICO — a tela (`Admin.tsx`) aceitava a entrada que causava o item 1, sem validar a relação
   entre início e fim.
3. 🟡 MÉDIO — a régua "independente" (`conferencia-independente.ts`) usava um critério mais frouxo
   (`.some()`) que a regra D9 principal (`.every()`) para decidir se um dia estava coberto pelo
   evento — ponto cego que a régua cuja função é achar pontos cegos da outra não deveria ter.
4. 🟡 MÉDIO — um rótulo "SANTA CEIA" cravado sobrou numa tela (`AbaAjustar.tsx`) fora da lista que a
   rodada anterior tinha corrigido.

**Corrigidos, com teste de regressão reproduzindo o cenário exato de cada achado** (não só
"parece corrigido"): partição do intervalo horário em pedaços que não cruzam meia-noite
(`segmentosDoIntervalo`, `malha.ts`); validação na tela que aceita vira-a-noite de propósito
(matematicamente correto agora) mas rejeita início-igual-a-fim (sem leitura sensata), com mensagem
visível; mesmo critério `.every()` nas duas réguas; rótulo trocado para o nome editável do evento.
432/432 testes (era 428), typecheck/gate/build limpos.

**A 5ª auditoria (mandada a refutar as 4 correções acima) achou uma REGRESSÃO na própria correção
do item 1.** O comentário da correção do vira-a-noite assumia que `horaInicio === horaFim` nunca
chegaria à função, porque a tela impedia — verdade só para metade dos dois formulários que
alimentam a mesma função: `Admin.tsx` (evento) valida de verdade; `AbaMalha.tsx` (regra da malha)
era campo de texto livre, sem validação nenhuma. Provado ao vivo: uma regra de malha com início
igual a fim bloqueava (zerava a capacidade de) um turno por causa de um evento em QUALQUER outra
hora do dia, sem relação nenhuma — a mesma classe de defeito silencioso que a correção anterior
existia para eliminar, só que pela outra porta. Achado um segundo item, menor: a paridade
D9×conferência independente só tinha sido fechada numa direção; a direção contrária (dia marcado no
bloco que não consta mais do calendário — evento removido da config depois de gerar) nunca existiu
na régua independente. **Corrigidos os dois — desta vez na ORIGEM, não na porta de entrada:**
`segmentosDoIntervalo` (`malha.ts`) agora trata início-igual-a-fim como intervalo vazio, sem
depender de qual formulário o dado atravessou; `AbaMalha.tsx` ganhou `type="time"` e aviso inline,
como defesa em profundidade, não como única trava. 435/435 testes (era 432), typecheck/gate/build
limpos. **6ª auditoria** (verificação cética desta correção) disparada — resultado ainda pendente
no momento deste registro.

**Aprendizado, o mesmo de sempre, de novo — e desta vez com uma volta extra:** cada rodada de
auditoria cega achou algo real que a rodada anterior (incluindo os próprios testes escritos na
hora) não cobriu, e na 5ª rodada isso incluiu a PRÓPRIA correção anterior introduzindo o mesmo tipo
de defeito por outra porta. Não é sinal de trabalho malfeito — é o método funcionando como
desenhado: nenhuma correção de defeito silencioso, provada ao vivo pelo próprio Flavio ou por um
agente cego, foi aceita como fechada sem prova, nem quando a prova aponta para a correção anterior
mesma. Ver `escala-geral/BACKLOG.md` P1.14/P1.15 para o detalhe completo com `arquivo:linha`.

**Gate:** não rodado aqui — nenhuma linha do `escala-porteiros` mudou. Nada a reverter neste
repositório; no `escala-geral`, `git revert` dos commits desta rodada volta os defeitos acima.
