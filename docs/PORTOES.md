# Os portões, por dentro

> **Cadeia:** [`AGENTS.md`](../AGENTS.md) → [`docs/RECONSTRUIR.md`](RECONSTRUIR.md) → **você está aqui**
>
> Vizinhos: [`OPERACAO.md`](OPERACAO.md) (como rodar) · [`ARQUITETURA.md`](ARQUITETURA.md)

---

## Por que este documento existe

Um teste de portabilidade em 05/08/2026 deu a documentação a outra inteligência artificial, proibida
de abrir código, e pediu que reconstruísse o produto. Um dos três vereditos:

> *"O projeto inteiro se apoia na tese **'regra sem portão é disciplina, e disciplina falha'** — e
> nenhum portão está descrito por dentro. Quem reconstruir recria o produto **sem a rede que o
> produto considera o próprio valor**."*

Estava certo. Os portões eram nomes numa tabela. Aqui eles têm **critério, população, e o que
decidiram não olhar**.

---

## A anatomia de um portão que funciona

Todo portão deste projeto tem estas cinco partes. Faltando qualquer uma, ele fica verde sem medir.

| Parte | Por quê |
|---|---|
| **Critério explícito** | "está bom" não é critério. `< 44px` é |
| **População impressa** | quantos itens foram medidos. Sem isso, ninguém nota quando ele para de varrer metade |
| **O que foi PULADO, também impresso** | isenção silenciosa lê-se como cobertura total |
| **Autoteste das duas pontas** | reprova um infrator injetado **e** aprova o caso limpo. Só uma ponta não distingue portão certo de portão sempre-verde |
| **Saída ≠ 0 quando reprova** | senão ele não pode entrar em `&&` nenhum |

🔴 **E, para portões que usam expressão regular: autodefesa.** Três vezes num único dia, um `\b`
escrito por script virou byte de backspace (0x08) dentro de uma regex. O portão rodava, imprimia
*"7 termos procurados · 0 achados"*, e o 0 era verdade sobre uma busca que não procurava nada. O
portão genérico agora **confere as próprias expressões antes de medir** e morre com saída 2 se
alguma tiver caractere de controle.

---

## Os 37 passos do `npm run gate`

### 1. `segredos` — nenhum segredo em arquivo versionado
**População:** todo arquivo que `git ls-files` lista (148 hoje) · **5 formas** procuradas · 4 isentos
declarados, cada um com o motivo.
**Por quê:** o `ARQUITETURA.md` promete que o token *"nunca vai para o repositório"*, e o
`OPERACAO.md` diz que esse token tem `Contents: Read and write` **neste** repositório — que é
**público**. A promessa estava escrita em dois documentos e não havia nada que a medisse: nenhuma das
21 checagens da auditoria adversarial olha para segredo.
**Vem primeiro no gate**, e é o único passo com essa propriedade: os outros se consertam commitando
de novo; um segredo commitado fica exposto no mesmo instante, e a correção é **revogar na origem**.
**Nunca imprime o valor** — só o prefixo e o comprimento. Portão que vaza o segredo no log é pior que
o segredo no arquivo, porque o log vai para o terminal, para o CI e para o histórico da sessão.
**Provado nas duas pontas:** token de forma válida (valor inventado) injetado em `datas.ts` → EXIT=1
sem vazar o valor; `.env` forçado para dentro do índice → EXIT=1; árvore limpa → EXIT=0.

### 2. `typecheck` — `tsc --noEmit`, `strict` ligado
Sem `strict`, o TypeScript nem estreita união discriminada, e metade das garantias de tipo do
projeto some.

### 3. `test` — `vitest run`, a suíte COMPLETA
🔴 **Nunca escopada.** Rodar só as suítes tocadas esconde regressão em área não tocada. É regra de
método, com prejuízo registrado.

### 4. `test:fuso:berlim` — a mesma suíte em `Europe/Berlin`
**Critério:** o script primeiro **prova que o fuso mudou** — ele compara `getTimezoneOffset()` e
exige que fique **negativo** — e só então roda.

🔴 **E esse mecanismo tem um ponto cego, medido em 05/08/2026:** exigir offset negativo significa
testar sempre num fuso POSITIVO (Berlim). Um defeito que só morde em fuso negativo — como o
`Date.UTC` misturado com getters locais em `ultimoDiaDoMes` — passa por aqui intacto. A tese *"em
UTC−3 um defeito de fuso é invisível"* tem um inverso, e ele custou uma regressão viva em produção.
Por isso funções de data ganham teste de **valor absoluto**, que não depende do fuso de quem roda. Sem essa prova, um `TZ` ignorado pelo sistema faria o passo passar sem testar nada.
Em UTC−3 um defeito de fuso é invisível: o dia só vira no fim da tarde.

### 5. `denominacao` — nenhum jargão comoditizado em texto que alguém lê
**População:** texto visível em `src/`.
**Critério:** ocorrências de "IA"/"AI" como **palavra**, não como pedaço.
**Autoteste:** 9 casos que devem acusar + 13 que devem **absolver** — inclusive `SANTA CEIA` (contém
"IA"), `ENSAIO` (contém "AI"), expressões (`${NOMES_DIA[d]}`) e negações (*"não é inteligência
artificial"*). Os 13 de absolvição são o que impede o portão de virar ruído.

### 6. `markdown-cru` — asterisco de markdown vazando para a tela
**População:** 517 trechos de tela em 29 arquivos de `src/` — JSX solto, props visíveis e campos de
objeto com prosa (as mesmas superfícies do portão de denominação).
**Procura:** `**negrito**` · `*itálico*` · crase de código · `[texto](link)`.
**Fora de escopo, declarado:** comentários — lá markdown é a convenção deste projeto e é onde ele
deve mesmo estar. E arquivos `.md`, pelo motivo óbvio.

> 🔴 **Por que ele existe, e por que ele é diferente dos outros.** Em 06/08/2026, ao **olhar** uma
> captura da aba `Ajustar`, li isto na tela, com os asteriscos:
>
> *"…mas ficaria \*\*abaixo do piso que este bloco declara\*\* — e aí a escala fica inválida…"*
>
> JSX não é markdown. O trecho tinha nascido num comentário, onde markdown é normal, e escorregou
> para dentro de um `<p>`.
>
> **Nenhuma medição de DOM pegaria isso** — e várias rodaram por cima. Toda checagem de texto casava
> normalmente, porque o texto *está lá*; só está feio. É a diferença entre **medir** a tela e **ver**
> a tela.
>
> ⚠️ **E o inverso também vale:** o portão achou mais **cinco** ocorrências em `regras.ts`, no texto
> da conferência regra a regra — e quatro delas estavam na captura que eu tinha acabado de ler, e eu
> **passei por cima**. Olho e medição pegam coisas diferentes; nenhum dos dois substitui o outro.

⚠️ **Ele nasceu contando menos do que existia:** guardava só a primeira ocorrência por trecho e
imprimia "4 achados" onde havia 5. Consertava-se um, rodava de novo, aparecia outro — uma fila de
tamanho desconhecido. **Portão que conta menos do que existe** é a classe que este projeto persegue,
e ele veio com ela dentro.

**Provado nas quatro pontas:** negrito em JSX · crase em `title` · link em campo de objeto → EXIT=1,
cada um pelo motivo certo; **negrito dentro de comentário → ABSOLVE**; árvore limpa → EXIT=0.

### 7. `fontes` — nenhuma fonte externa chamada sem estar declarada
**População:** 90 arquivos em `src/` **e** `scripts/` · 1 isento (o próprio inventário).
**Critério:** todo host em URL literal tem de estar em `docs/INVENTARIO_DE_FONTES.md`.
**Fora de escopo, declarado:** laço local (`127.0.0.1`) e domínios reservados pela RFC 2606
(`example.com`, `.test`, `.invalid`) — é o que permite escrever exemplo em mensagem de ajuda.
**Hoje:** 4 chamados, 4 declarados.

### 8. `contagem` — nenhum documento vivo desmente o catálogo
**População:** **todo `.md` do repositório**, descoberto — não uma lista à mão.
**Isentos, declarados:** `AI_MASTER_LOG.md`, `DIARIO_DE_BORDO.md`, `docs/handoff/`,
`docs/historico/` — append-only, registram o que era verdade então.
**Critério:** padrões específicos (`N regras duras`, `N de qualidade`, `catálogo de N regras`,
`N de M regras`) comparados com o `CATALOGO`.

🔴 **Este portão nasceu com lista de PERMISSÃO de 5 documentos, e 4 arquivos ficaram invisíveis** —
nem na lista, nem nas isenções. Foi invertido para lista de exclusão:
**lista de permissão erra em silêncio; lista de exclusão erra alto.**

### 9. `ordem-do-gate` — a ORDEM escrita é a ordem que roda
**População:** as duas listas numeradas do projeto — os títulos `### N. \`nome\`` deste documento e
as linhas `| N | \`nome\` |` do [`OPERACAO.md`](OPERACAO.md) — **todas**, e o próprio portão imprime
quantas foram (escrever o número aqui seria criar, dentro do portão que existe contra número podre,
mais um número podre).
**Fonte da verdade:** `package.json` → `scripts.gate`, e nada mais.

**Confere três coisas**, porque duas não bastavam:

1. cada número aponta para o passo que roda naquela posição;
2. **os números crescem na ordem física do arquivo** — sem isto, "21, 24, 22, 23" passaria com cada
   número certo e a leitura embaralhada, e quem lê a lista lê de cima para baixo;
3. nenhum passo do gate fica de fora das listas.

> 🔴 **Por que ele existe.** O `medir-fatos.mjs` já media o **total** de passos — por isso os quatro
> documentos que dizem "N passos" nunca ficam para trás. Mas ele mede um número, e o `OPERACAO.md`
> promete mais do que um número: *"nesta ordem — lida do `package.json`, não de memória"*.
>
> Em 06/08/2026, ao acrescentar um passo, descobri que a lista deste documento **já estava fora de
> ordem antes**: `build` aparecia como passo 21 quando roda em 24º. O total batia; a ordem, não.
>
> É a classe de defeito que este projeto já registrou três vezes: **o portão responde só à pergunta
> que se fez a ele.** "Quantos passos?" foi perguntado. "Em que ordem?" não. E aqui é pior que um
> número errado: se `build` viesse mesmo antes de `ensaio`, os testes de ponta a ponta rodariam
> contra um `docs/` velho — e a lista seria a razão de alguém acreditar nisso.

**Fora de escopo, declarado:** passo citado em prosa solta. A lista é o que se lê como sequência; a
prosa cita um passo pelo nome, sem prometer posição.
**Provado nas duas pontas:** número trocado, passo renomeado e ordem física embaralhada → EXIT=1, cada
um com a linha que explica; árvore limpa → EXIT=0.

### 10. `cadeia` — os documentos apontam para o handoff mais recente
**Critério de "mais recente":** por **data no nome** e, no mesmo dia, pelo **sufixo** (`-b`, `-c`…),
com o **sem sufixo sendo o PRIMEIRO** do dia. Ordenar alfabeticamente mentiria: `HANDOFF_2026-08-05.md`
vem antes de `HANDOFF_2026-08-05-b.md` no alfabeto e é o mais **antigo** dos dois.
**Conferidos:** `AGENTS.md`, `ESTADO.md`, `BACKLOG.md`, `docs/handoff/INDICE.md`.
**Autoteste:** acusa ponteiro antigo · aprova o atual · **ignora** link para handoff antigo que
esteja fora de uma linha que se diz "mais recente".

### 11. `handoff-orfao` — nenhum handoff fica invisível
**População:** todo `HANDOFF_*.md` da pasta `docs/handoff/` (17 hoje) contra as linhas de tabela do
`INDICE.md`.
**Confere as três direções:** todo handoff do disco é citado · todo handoff citado existe no disco ·
nenhum handoff aparece em **duas linhas de tabela diferentes**.

> 🔴 **Por que ele existe.** Em 06/08/2026, ao religar a cadeia, encontrei o índice com **três linhas
> diferentes apontando para o mesmo arquivo**. Os handoffs `-d` e `-e` existiam no disco e **não eram
> citados em lugar nenhum** — as sessões que os escreveram tinham ficado invisíveis.
>
> A causa foi uma substituição cega: um script trocou o nome do handoff antigo pelo novo em *todos*
> os arquivos. No índice — que é justamente onde os nomes antigos **devem** ficar — isso apagou
> histórico em vez de atualizá-lo.
>
> O `cadeia` (passo 9) já perguntava *"o ponteiro para o mais recente está atualizado?"* e respondia
> certo. Ninguém perguntava *"e os outros continuam alcançáveis?"*. **Terceira vez em dois dias que a
> mesma classe aparece** — e aqui o preço é o registro do projeto, num método que se apoia em
> conseguir reconstruir por que cada decisão foi tomada.

**Regra que fica:** nome antigo no índice **não se substitui**; acrescenta-se a linha nova por cima.
**Provado nas quatro pontas:** linha apagada · duas linhas para o mesmo arquivo (testada **isolada**,
para a checagem de duplicata disparar sozinha e não de carona na de órfão) · link para arquivo
inexistente · índice consertado → EXIT=0.

### 12. `proximo-id` — o "próximo identificador livre" é mesmo o próximo
**População:** todo `.md` de `docs/solicitacoes/` — **as fatias arquivadas inclusive**, que é
exatamente o ponto: o maior ID pode estar numa fatia que ninguém abre há semanas.
**Confere duas coisas:** o cabeçalho anuncia `maior ID + 1` · nenhum ID abre **duas linhas de
tabela** (colisão é o dano que a linha existe para evitar, e anúncio certo com duplicata no corpo
não adianta nada).

> 🔴 **Por que ele existe.** O índice de solicitações abre com *"próximo identificador livre:
> S-NNN"* e explica ao lado: *"calculado sobre todas as fatias, nunca lido da última linha"* —
> porque depois de uma rotação o maior ID **sai de vista**. O método registra o prejuízo: **cinco
> colisões de ID de uma vez**, num projeto anterior.
>
> Em 06/08/2026 a linha estava errada aqui também: dizia **S-032** com o **S-033** já escrito logo
> abaixo. A regra estava documentada, explicada, com o motivo ao lado — e **inerte**, porque nada a
> media.

⚠️ **E ele nasceu sempre-vermelho**, na primeira execução: contava o próprio anúncio do
cabeçalho como "ID em uso" e exigia sempre um a mais. Um portão eternamente vermelho é lido como
portão funcionando — este projeto já registrou isso duas vezes. A linha do anúncio passou a ser
pulada na contagem, com o motivo escrito no código.

**Provado nas três pontas, cada checagem pelo MOTIVO certo:** cabeçalho defasado · ID duplicado
**com o maior ID intacto** (senão quem dispara é a checagem do cabeçalho, de carona) · a linha do
anúncio apagada — e aprova a árvore limpa.

### 13. `generico` — nenhum nome de cliente cravado (§0)
**População:** 32 arquivos (`src/` + `index.html` + `package.json` + `README.md`) · **24 testes pulados**, contados
e impressos.
**Os 8 termos:** `JD. São Luiz` · `Congregação Cristã` · `CCB` (com borda por classe de caracteres,
sem barra invertida) · `Escala (de) Porteiros` · o prompt do motor cravado · `porteiro(s)` como
**palavra em prosa** (a borda `(?<![-\w])…(?![-\w])` deixa passar o slug `escala-porteiros`, que é
identidade de infraestrutura) · `irmão/irmãos` · `ensaio` **só em `.tsx`** (em dado a palavra é
legítima: `rotulo: 'ENSAIO'` é o exemplo do campo configurável).

> 🔴 **Estes dois números estavam errados** — sexta auditoria externa, 05/08/2026.
>
> O documento afirmava valores antigos para os termos e para os testes pulados, enquanto o portão
> imprimia outros. O fato `termos do portão genérico` já existia em `medir-fatos.mjs`, mas o padrão
> dele exigia a forma «N termos, M achados» numa linha só — e a forma natural de documentar, com dois
> pontos e a lista embaixo, não casava. Para os testes pulados não havia fato nenhum.
>
> O documento que descreve os portões é o que alguém lê para saber o que está protegido. Os dois
> números agora são **medidos**, e o padrão aceita as duas formas de escrever.

**Duas fronteiras declaradas, com o motivo ao lado:** `apenas` restringe um termo (o `ensaio` só vale
onde renderiza) e `excetoEm` o isenta (o `README.md` declara *"esta instalação atende…"* de propósito,
e lista "Irmão / Funcionário / Plantonista" como demonstração da configurabilidade — acusar isso
empurraria alguém a apagar o texto que explica a regra).
**Mais uma varredura estrutural:** `import … from './assets/…'` — emblema empacotado. Um `import` de
imagem **não tem texto** para varrer, e foi assim que o logotipo do cliente viveu no cabeçalho do
site inteiro sob "0 achados".
**Comentários são removidos antes de medir** — eles citam o defeito para explicá-lo, e um portão que
trombasse com a própria documentação seria contornado no primeiro dia.
**Por que `.test.ts` é pulado:** as fixtures usam o nome do cliente de propósito, e teste não vai
para o ar. Troca consciente, com o par no autoteste (mesmo conteúdo fora de teste **é** achado).

### 14. `generico:autoteste` — prova que o de cima morde
**21 casos:** 20 de varredura (infratores que devem reprovar + limpos que devem passar) + 1 de
autodefesa. Entre os limpos, dois valem nota: **"irmandade" não pode acusar** (a borda tem de estar
viva) e **`escala-porteiros` como slug não pode acusar**.
**O caso de autodefesa** injeta o byte de backspace num **clone** do portão e exige saída 2.

### 15. `guarda-vivo:autoteste` — prova que a guarda do disparador ao vivo morde
**População:** 6 nomes limpos aprovados, 10 nomes hostis barrados (`; rm -rf /`, ``whoami``,
`$(whoami)`, `&&`, aspas, maiúsculas, string vazia, prefixo `npm run`). Nasceu em 18/08/2026
junto da correção do `DEP0190` em `rodar-validacoes-ao-vivo.mjs` (`execFileSync`+`shell:true` →
`execSync` de string única): a garantia de que `nome` nunca carrega metacaractere de shell vivia
implícita no fluxo de dados (só vem de `Object.keys(package.json.scripts)`); este autoteste prova
que, se essa garantia um dia quebrar, `exigirNomeValido()` (`scripts/lib/guarda-nome-vivo.mjs`)
barra ANTES de a string hostil chegar ao `execSync`.

### 16. `generico:dados:autoteste` — prova que o portão da trilha genérica morde
Autoteste do passo 32 (`generico:dados`) — roda ANTES do build genérico existir de propósito,
como os outros autotestes do bloco 13-16: prova que o portão bite antes de confiar nele mais
adiante no gate, quando `docs/generico/` já existe de verdade. Ver o passo 32 para o critério.
**6 casos**, com prova nas duas pontas: 3 infratores plantados (config de produção na fonte
genérica, `CCB` solto no build, vocabulário `Irmãos` vazado) reprovam; 3 limpos (config genérico de
verdade, pasta de build ainda ausente, termo do cliente num `.md` fora do escopo deste portão)
passam.

### 17. `selo:autoteste` — prova que o selo morde, nas duas pontas
**7 casos**, num repositório git de mentira criado a cada rodada: (A) árvore limpa após gravar →
OK; (B) mutação real de um arquivo depois de gravar → ACUSA; (C) 🔴 **o defeito de 19/08/2026** —
mesmo conteúdo, só troca de staged para unstaged entre gravar e conferir → NÃO pode acusar (era
exatamente aqui que o selo antigo dava falso positivo); (D) arquivo novo não rastreado → ACUSA;
(E) arquivo rastreado apagado do disco → ACUSA; (F) nunca gravou selo → recusa com a mensagem
certa, não finge "tudo bem"; (G) arquivo renomeado e staged → ACUSA (o caminho mudou de verdade —
ver nota abaixo sobre por que este NÃO é o mesmo defeito do caso C).

O caso C é o que faltava desde que este portão nasceu (05/08/2026, sem autoteste nenhum): ele prova
a ponta que o selo NÃO deve acusar, e foi exatamente a ausência dessa prova que deixou o segundo
defeito sobreviver sem ninguém notar. Ver o passo 37 (`selo:gravar`) para o defeito por dentro.

**Caso G, achado pela auditoria cega do conserto acima (mesmo dia):** `l.slice(3).trim()` tratava a
linha `R  antigo.txt -> novo.txt` do `git status --porcelain` como se fosse UM nome de arquivo —
um caminho fantasma, que não existe em disco. A auditoria descreveu isto como "a mesma classe" do
caso C; **não é** — no caso C nada muda de verdade (mesmo arquivo, mesmo caminho, mesmos bytes, só
a representação da medição difere), enquanto numa renomeação o CAMINHO muda de verdade
(`antigo.txt` some, `novo.txt` aparece), e isso é uma edição real da árvore, coerente com a regra
deste portão ("vale para qualquer edição entre o gate e o commit"). O selo **continua acusando**
depois de uma renomeação, antes e depois do conserto — o que mudou foi trocar o candidato fantasma
pelo caminho real, para o diagnóstico apontar para algo que existe.

### 18. `generico:docs` — o nome do cliente na DOCUMENTAÇÃO é inventário fechado
**População:** todo `.md` vivo do repositório · **isentos declarados:** os append-only
(`AI_MASTER_LOG`, `DIARIO_DE_BORDO`, `docs/handoff/`, `docs/historico/`, `docs/solicitacoes/`) e as
especificações em `docs/superpowers/` — registram o que era verdade então.
**Hoje:** 12 citações em 7 arquivos, cada uma com o motivo escrito ao lado no inventário.

> 🔴 **Por que ele existe.** O portão `generico` (passo 12) varre `src/` e **declarava não varrer
> `docs/*.md`**. A declaração estava certa pelo motivo errado: ninguém tinha medido o que havia lá.

**O critério não é "zero" — proibir seria errado.** O `README.md` diz *"**esta instalação**
atende…"*; o `MODELO_DE_DADOS.md` mostra o valor num exemplo de JSON de configuração, que é o
**oposto** de cravar (é a prova de que o nome é dado); o `FINALIDADE_E_FASES.md` cita o termo como
exemplo do que **não** se crava. Apagar isso apagaria a documentação de quem o produto atende.

**O critério é inventário fechado**, e ele reprova nas três direções:

1. citação **a mais** num arquivo conhecido;
2. arquivo **novo** com citação, fora do inventário;
3. citação **a menos** — porque aí o inventário deixou de descrever a realidade.

A pergunta que ele obriga a responder, e que é a decisão de verdade: **este documento descreve a
INSTALAÇÃO (legítimo) ou descreve o PRODUTO (e aí o nome não devia estar lá)?**

**Provado nas três pontas, cada uma pelo motivo certo**, mais a árvore limpa → EXIT=0. E ele nasceu
achando: quatro citações legítimas que um `grep` à mão tinha deixado passar.

### 19. `citacoes` — `arquivo:linha` que envelheceu sozinho
**População:** todo `.md` vivo · **isentos:** os append-only (registram o que era verdade **então**;
citação velha ali é o registro funcionando). Hoje 6 citações conferidas.
**Confere:** o arquivo citado existe · o arquivo tem pelo menos aquela linha.

> 🔴 **O próprio BACKLOG pediu este portão, e ninguém ouviu.** O item P4.8 trazia esta frase,
> escrita à mão por quem viu o problema e não tinha como impedir que voltasse:
> *"as linhas 218-221 citadas antes envelheceram, **segunda ocorrência** do mesmo apodrecimento no
> mesmo documento"*.

**Citação de linha é a única referência que apodrece sozinha:** ninguém precisa mexer no documento
para ela ficar errada — basta alguém acrescentar dez linhas no arquivo citado. E apodrece em
silêncio, porque continua *parecendo* precisa.

**Fora de escopo, declarado:** se o *conteúdo* daquela linha ainda é o que a citação descreve — isso
exigiria entender a frase. Ele pega o apodrecimento grosseiro, que foi o que aconteceu duas vezes, e
não finge pegar o resto.

**Provado nas duas pontas:** linha além do fim do arquivo e arquivo inexistente → EXIT=1, cada um com
o motivo certo; árvore limpa → EXIT=0.

### 20. `doc:regras:conferir` — o catálogo documentado bate com o código
`docs/CATALOGO_DE_REGRAS.md` é **gerado**. Este passo regenera em memória e compara **byte a byte**
(ignorando fim de linha, porque o Windows reescreve CRLF). Muda o `titulo` ou a `explicacao` de uma
regra sem regenerar → vermelho.

### 21. `doc:comandos` — todo comando citado existe
**População:** os 23 documentos vivos · isentos os append-only.
**Critério:** todo `npm run <nome>` está no `package.json`; todo `node scripts/<arquivo>` existe em
disco. **Achou defeito na primeira execução:** `npm run tempo`, citado na documentação, não existia.

### 22. `arquitetura` — as três invariantes que a documentação afirma
1. `src/dominio/` **não importa nada de fora** (nem `../`, nem pacote externo).
2. `conferencia-independente.ts` **não importa** `regras`, `validacao` nem `gerador`.
3. **`docs/.nojekyll` existe.**
**Por quê (2):** a segunda régua existe para **discordar**. Se alguém "aproveitar" uma função do
catálogo ali, ela vira espelho — continua verde, continua concordando, e para de valer.

**Por quê (3):** o arquivo foi criado no primeiro commit e **apagado** em `7078186`, sem registro em
lugar nenhum — achado da sexta auditoria externa, 05/08/2026. Sem ele o GitHub Pages roda **Jekyll
sobre os 30 Markdown de `docs/`** a cada push. Um `{%` ou um `---` no topo de um handoff futuro faz o
build morrer, **o site ANTERIOR continua no ar**, e a tela de publicação já disse *"✅ escala
publicada · o site mostra a escala nova em cerca de um minuto"*. Ninguém no painel descobre, porque
`AbaPublicar` não busca a URL pública depois de gravar — o irmão ficaria com a escala do mês passado
por tempo indeterminado. Um arquivo de 0 byte elimina a classe, e ele já sumiu uma vez sem ninguém
ver: é o argumento inteiro para portão em vez de disciplina.

### 23. `fatos:conferir` — nenhum documento desmente um número medido
**16 fatos**, todos de fonte executável: passos do gate (do `package.json`), casos do autoteste (da
saída dele), checagens da auditoria, arquivos e termos do portão genérico, documentos vivos, piso do
bloco publicado, turnos congelados, fontes declaradas, regras do catálogo, regras duras.
**Nenhum é digitado.** Achou 4 contradições na primeira execução, e depois **pegou a própria
mudança**: ao entrar no gate, virou o 16º passo e reprovou os documentos que diziam 15.

### 24. `datas` — `toISOString()` não decide dia nem mês
**População:** 89 arquivos de `src/` e `scripts/` · isento `datas.test.ts`, que **cita** o
antipadrão para provar que ele erra.
**Critério, em dois níveis:**
- 🔴 **proibido:** `toISOString().slice(...)` — extrai dia ou mês **em UTC**, e às 21h em São Paulo
  já é amanhã. É a forma que quebrou o site anterior;
- ✅ **permitido, e declarado arquivo a arquivo:** usar a cadeia **inteira** como chave opaca, quando
  ela volta por `parseISO` e é formatada em hora local. Medido nos três fusos (São Paulo −3, Berlim
  +2, Tóquio +9): o rótulo sai correto nos três.
**Por que existe:** *"`toISOString()` é proibido"* é a regra mais repetida deste projeto — está em
`datas.ts`, no `RECONSTRUIR.md`, no `AGENTS.md` e em três comentários de teste. **E não havia nada
que a cobrasse.** Quando alguém foi olhar, havia 4 usos e o `BACKLOG.md` declarava 1.

### 25. `crescimento` — o dado ainda cabe onde é servido
**Critério:** nenhum arquivo de `dados/` passa de **60%** do teto de 1 MB da Contents API do GitHub,
que é a que a área administrativa usa para publicar.
**Também mede o ritmo**, do próprio dado: bytes por turno × turnos por ano → anos de folga.
**Por que 60% e não 90%:** sobra ano suficiente para arquivar sem pressa. Alarme que grita cedo
demais é alarme que alguém desliga.

### 26. `tamanho-docs` — nenhum documento passou do teto do próprio regime
**De onde vêm os tetos:** de `docs/regimes-documentos.json`, a declaração do PROJETO — não de um
número escrito no script. O regime vem do **caminho**: raiz = **vivo** (400 linhas / 40 KB,
carregado toda sessão) · subpasta = **referência** (800 / 100, lido sob demanda) · a lista
`historico` = **append-only** (2.000, fatiado por período) · `docs/historico/` = **fatia fechada,
isenta**, porque medir o passado imutável não faz sentido.
**Diz também o MAIOR de cada regime**, para a folga ser visível antes de acabar.
**Por que existe:** o `historico/INDICE.md` afirmava, desde o começo, que o teto era conferido
*"no pré-voo **e no GATE**"* — e o GATE não tinha o passo. Quando a auditoria externa mostrou
isso, a dívida foi **declarada** em vez de fechada; algumas horas depois, fechada.

### 27. `auditoria` — 21 ataques ao próprio código

> ⚠️ **O número é medido, e o medidor já leu errado uma vez** (06/08/2026): quando a auditoria
> tem achado, ela imprime *"20 checagem(ns) sem achado · 1 ACHADO(S)"*, e o fato lia o **20** — o
> total de checagens é 21. Um número medido também pode medir a coisa errada; o que salva é ele
> divergir alto quando diverge.
Cada ataque **injeta um infrator** e exige que a validação o pegue. Frentes: validação, datas e fuso,
gerador, dado publicado (inclusive *"os dois arquivos de dados são iguais?"* — que pegou um defeito
real), e camada de tela.
⚠️ **Relatório sem achado é declarado SUSPEITO pelo próprio script**, com o motivo estrutural: quem
auditou escreveu o código.

### 28. `regras-mestras` — tooltip em todo botão
**População:** 66 botões medidos.
**Também mede:** clicáveis fora de `<button>` (div/span com `onClick` e sem papel declarado) — hoje 0
— e aspas duplas dentro do atributo, que quebram o HTML em silêncio.

---

#### `vivo:quebrada` — texto quebrado e layout estourado
*(roda dentro do `vivo:tudo`; entrou sozinho, porque o disparador lê a lista do `package.json`)*

**População:** 4.404 elementos de texto em **8 cenas** — as 7 do produto mais a tela pública a
**390px**, onde estouro de largura realmente machuca.

Procura três coisas:

1. **restos de dado** na tela — `undefined`, `NaN`, `[object Object]`, `Invalid Date`, `null`,
   `TODO`/`FIXME`, `lorem ipsum`. Não são feios: são **errados**, e passam por qualquer checagem que
   só pergunta *"o texto existe?"*;
2. **conteúdo empurrado para fora da tela** pela direita;
3. **texto cortado dentro da própria caixa** (`overflow: hidden` sem reticências).

> 🔴 **Por que ele existe.** Em 06/08/2026 o dono perguntou se a verificação visual tinha sido
> feita, e a resposta honesta era **não**. O `markdown-cru` (passo 6) fechou uma forma daquela
> categoria; dizer *"o resto exige olho"* e parar ali deixaria a parte automatizável sem ninguém.

⚠️ **E ele nasceu SEMPRE-VERDE em uma das três checagens.** A de estouro media
`documentElement.scrollWidth > clientWidth`. Injetei um `<div style={{width: 3000}}>` e o portão
**aprovou**: a casca do aplicativo tem `overflow-x: hidden`, então o documento não rola — o
conteúdo some pela direita, calado. **A sonda media a rolagem, e a rolagem tinha sido desligada.**
Passou a medir a **borda direita** de cada elemento, que pega os dois casos.

Sem o autoteste eu teria commitado um portão que aprova qualquer estouro.

**Fora de escopo, declarado:** *"está bonito?"*, *"a hierarquia está clara?"*, *"a frase confunde?"*.
Isso continua exigindo abrir a captura e ler — e o registro deste projeto tem data provando que olho
e medição pegam coisas **diferentes**: o `markdown-cru` achou quatro ocorrências que estavam numa
captura que eu tinha acabado de ler, e eu passei por cima.

**Provado nas três pontas, cada uma pelo motivo certo**, mais a árvore limpa → EXIT=0.

#### `vivo:rotulos` — todo campo tem NOME que dá para alcançar
*(roda dentro do `vivo:tudo`, não como passo solto — ver o passo 28)*
Abre as **7 cenas** do produto (a trava, as cinco abas do admin e a tela dos irmãos), enumera cada
`input`/`select`/`textarea` visível e exige um nome de verdade: `aria-label`, `aria-labelledby` que
aponte para texto real, um `<label>` que envolva o campo, um `label[for]`, ou um `placeholder`.

**`title` NÃO conta, de propósito** — era exatamente o que os dois campos defeituosos tinham.

> 🔴 **Nasceu de um defeito que se pagou duas vezes** (05/08/2026). O campo de data da Santa Ceia
> entrou na aba "Gerar" só com `title`. Quem usa leitor de tela ficou sem saber o que ele era — e o
> validador de "Gerar", que procurava os campos de data **por posição** (`nth(2)`, `nth(3)`), passou
> a digitar a data da ausência dentro dele, deixando o "último dia" vazio. A tela recusava a
> ausência, com razão, e o teste acusava a tela.
>
> **Campo sem rótulo é campo invisível: para quem não enxerga e para quem mede.**

Duas fronteiras do próprio portão, fechadas porque isenção calada é buraco com outro nome:

- **as abas são lidas da tela**, não escritas no script — uma lista fixa envelheceria calada no dia
  em que uma aba nova aparecesse;
- **aba travada é destravada** (gerando uma escala) e medida; se alguma continuar travada, ela é
  nomeada na saída e o portão **reprova**. Um portão que pula o que não conseguiu abrir mede menos
  do que a frase dele promete.

#### `vivo:outra` — "Não gostei — gerar outra combinação" entrega mesmo OUTRA
*(roda dentro do `vivo:tudo`, não como passo solto — ver o passo 28)*
Abre a tela, gera uma escala e clica em **"Não gostei"** quatro vezes, lendo a cada clique o cartão
**Distanciamento por pessoa** — que é onde ele olhava. Dois cliques seguidos com o mesmo texto
reprovam.

> 🔴 **Nasceu da palavra dele** (06/08/2026): *"mesmo clicando várias vezes, não muda nada; o 'Não
> gostei — gerar outra combinação' é uma farsa."* Ele estava certo, e o caro do defeito é que **tudo
> por baixo parecia funcionar**: a semente mudava a cada clique, as oito versões saíam de fato
> distintas, e havia teste verde provando exatamente isso. Ninguém media a ÚLTIMA etapa — a cascata
> escolhia sempre a versão **gulosa**, a única que não usa semente nenhuma. Oito alternativas
> montadas, oito descartadas.
>
> **Cada peça estava certa sozinha; o defeito morava na junção — e a junção só existe inteira na
> tela.** É a razão de este portão ser de navegador e não de unidade.

Duas fronteiras do próprio portão, declaradas:

- **compara com o clique anterior**, não com o conjunto de todos. Voltar a uma combinação de três
  cliques atrás é legítimo: ele pediu *outra*, não *inédita*. Repetir a que está na tela é que quebra
  a promessa do botão;
- **não julga se a escala nova é melhor** — disso cuidam o catálogo duro e os testes do gerador.

E mede uma terceira coisa, na mesma passada: **a frase abaixo do botão**. *"A melhor de 8 versões"* é
verdade na primeira geração e deixa de ser depois de uma recusa — a melhor de todas pode ser
justamente a que ele recusou. O portão exige que a frase se corrija, e reprova se ela continuar
prometendo o que já não acontece. Deixar o texto antigo ali seria repor, em prosa, o defeito que a
correção tirou do botão.

> ⚠️ **O portão nasceu vermelho com a correção certa no lugar.** A primeira versão localizava o
> cartão por texto solto e agarrou só o cabeçalho: 83 caracteres que não mudam nunca. Sonda medindo o
> próprio rastro. Por isso `Cartao` ganhou `aria-labelledby` — e por isso a sonda agora **confere que
> leu as linhas por pessoa** antes de comparar. Sem esse sinal de vida, ele reprovaria para sempre
> pelo motivo errado.

#### `vivo:auditoria` — recontar o site do zero e confrontar com a tela
*(grupo NO AR: roda DEPOIS do push, nunca no gate — depende da rede e do GitHub Pages)*
Nasceu do pedido do dono em 07/08/2026, depois de ele publicar: *"faz uma outra auditoria
independente na escala do site (…) só para confrontar com o apresentado no site, usando as mesmas
pessoas que estão na escala escalada no site hoje, de 6/8/2026 a 31/12/2026?"*

Baixa `blocos.json` e `pessoas.json` **pela URL publicada**, recalcula do zero a distribuição (total,
por mês, por tipo) e o distanciamento de cada pessoa, abre a área administrativa no site, gera o
mesmo período e **confronta linha a linha** com os dois cartões da tela.

**A independência é da RÉGUA:** o script não importa uma linha de `src/` — nem `distribuir()`, nem
`menorIntervalo()`. Importar seria confirmar uma régua com ela mesma; um erro apareceria dos dois
lados e sairia "conferido".

> ⚠️ **A independência que ele NÃO tem, declarada:** quem escreveu a segunda contagem foi o mesmo
> autor da primeira. Um engano de **interpretação** da regra passaria pelas duas. O que ele pega é
> engano de implementação — a classe comum. Para a outra, o remédio é a definição em português no
> cabeçalho de cada medida, que fica exposta para o dono conferir com os olhos.

**Autoteste obrigatório:** `npm run vivo:auditoria:autoteste` injeta **um turno inventado na
auditoria** (o dado do site fica intocado) e exige que o relatório acuse. Ele **não entra em grupo
nenhum** dos disparadores — existe para sair vermelho, e um passo que reprova por projeto dentro de
um conjunto que soma reprovações faria alguém desligar o auditor inteiro.

> 🔴 **A primeira versão acusou as 14 linhas do site com os números batendo em todas.** A expressão
> exigia espaço entre o nome e o número, e no DOM os dois `span` vêm colados (`Adilson19 turnos`).
> **O auditor acusou o auditado por um erro dele mesmo** — a classe de defeito mais cara que um
> auditor pode ter, porque quem lê passa a desconfiar do relatório inteiro, inclusive das partes
> certas.

**Provado nas duas pontas:** árvore no ar → 0 divergências; com `--autoteste` → 5 divergências,
nomeando a pessoa e a coluna exata.

### 29. `ensaio` — o cenário que ORIGINOU o projeto, ponta a ponta
Alguém sai do elenco, outro entra com as cinco restrições, e a escala se refaz a partir de um corte.
**11 promessas medidas**, entre elas *"o passado antes do corte fica byte a byte idêntico"*.

### 30. `tempo` — a geração não regrediu de desempenho

### 31. `build` — compila e gera em `docs/`

### 32. `build:generico` — o segundo build, mesma fonte, base diferente
Roda `vite build --mode generico`: mesmo código de `src/`, `base: '/escala-porteiros/generico/'`,
lendo `public-generico/` em vez de `public/`. Gera em `docs/generico/`, dentro da MESMA árvore que o
`publicar.yml` já sobe inteira — sem workflow novo, sem repositório novo (S-059/S-060, 18/08/2026).
**Por quê depois de `build` (30) e não junto:** os dois builds escrevem em subpastas disjuntas de
`docs/` (`docs/assets` e `docs/generico/`); rodar em sequência, não em paralelo, é o que permite ao
`prebuild`-equivalente (`rmSync('docs/generico/assets', …)`) limpar sem risco de apagar o build de
produção que acabou de sair do passo anterior.
**Fora de escopo, declarado:** este passo só CONSTRÓI. A verificação de que o conteúdo é genérico é
o passo seguinte.

### 33. `generico:dados` — a trilha genérica não carrega texto de cliente
**População:** `public-generico/` (a fonte, sempre existe) **e** `docs/generico/` (o build, existe
depois do passo 31) — `.json`, `.html`, `.js`, `.css`.
**Critério:** os MESMOS termos do portão `generico` (passo 13) — `Congregação Cristã` · `Jardim São
Luiz` · `CCB` · `Irmão/Irmãos`. Se um `config.json` de produção for copiado por engano para a fonte
genérica ("só para testar depressa"), a demonstração que existe para provar que o produto não
depende deste cliente nasceria mostrando exatamente o cliente que ela existe para não mostrar.
**Por que é portão separado, e não o mesmo `generico`:** aquele varre CÓDIGO (`src/`, `index.html`);
este varre DADO (`public-generico/`, `docs/generico/`) — populações disjuntas, e o `generico` não
tem por que aprender a olhar para uma segunda árvore de dados que só existe a partir de hoje.
**Autoteste (`generico:dados:autoteste`, passo 16):** 6 casos — 3 infratores (config de produção
copiado, `CCB` solto no build, vocabulário `Irmãos` vazado) + 3 limpos (config genérico de verdade,
build ainda não rodado, termo do cliente num `.md` fora dos alvos deste portão).
**Provado nas duas pontas**, como todo portão deste projeto: infrator plantado → EXIT=1 nomeando
arquivo e termo; árvore limpa (inclusive antes do primeiro `build:generico`, quando `docs/generico/`
nem existe) → EXIT=0.

### 34. `imagem` — o único passo que RENDERIZA O PIXEL
Gera a imagem pelo botão de verdade e **mede o DOM que virou o PNG**, no instante anterior à
rasterização: texto cortado pela própria caixa, rótulo duplicado na mesma pílula, rodapé coerente.
**Por quê:** três defeitos da imagem escaparam de todos os outros portões em 05/08/2026 e só
apareceram quando alguém ABRIU o arquivo — *"sem porteiros escalados"*, o `ENSAIO` cravado em toda
tarde, e a pílula da Santa Ceia imprimindo o rótulo duas vezes. Ler o PNG a olho não escala.
⚠️ A medição usa um `MutationObserver` instalado **antes** do clique: `gerarImagem.ts` monta um palco,
rasteriza e chama `palco.remove()`, então medir depois acha uma página vazia.

### 35. `vivo:tudo` — TODAS as validações de navegador rodam
**População:** as 15 validações do grupo **LOCAL**, lidas do `package.json` — nunca de uma lista à
mão. Validação nova entra sozinha. **242 segundos** no total, medidos em 18/08/2026.

> 🔴 **Por que ele existe.** Em 06/08/2026 medi quais dos `vivo:*` o gate realmente executava.
> **De dezesseis, um.** Os outros quinze abriam navegador, mediam a tela de verdade, provavam coisas
> que nenhum teste unitário alcança — e só rodavam quando alguém lembrava.
>
> **Portão sem gatilho é regra sem portão, um nível acima.** E não era teórico: o `vivo:gerar` estava
> **vermelho** havia dias, quebrado por um campo novo no meio da tela, e ninguém sabia.

**🔴 São duas famílias, e misturá-las num passo só foi o primeiro erro deste script:**

| Grupo | O que mede | Quando roda |
|---|---|---|
| **LOCAL** (15) | sobe servidor com o build da árvore atual | **no gate** — é a árvore que se quer aprovar |
| **NO AR** (5) | abre o `github.io` e compara com o commitado | **depois do push** (`npm run vivo:no-ar`) |

O grupo NO AR **não pode** entrar no gate: o gate roda ANTES de commitar, então o pacote local está,
por construção, à frente do publicado. Ali dentro ele ficaria *estruturalmente vermelho* — e portão
que sempre reprova é portão que se aprende a ignorar. Os dois grupos são **impressos** com quem entrou
em cada um, para ninguém ler o verde de um como cobertura do outro.

⚠️ **Nunca roda:** `vivo:divulgado` — exige `--antigo <url>`, o endereço do site que a congregação já
tem. É gesto de migração, feito uma vez, com a URL na mão. Fica **nomeado na saída**.

⚠️ **E ele se excluía por NOME, o que durou uma versão.** Quando nasceu o `vivo:no-ar` — que chama
este mesmo script com outra bandeira — ele entrou na lista como se fosse uma validação e rodou 148 s
dentro do grupo errado. Excluir por nome é lista à mão com outra roupa: **o que identifica um
disparador não é como ele se chama, é o fato de chamar este arquivo.**

### 36. `refazer` — a escala NO AR pode ser refeita
Pega o que o bloco publicado registra (período, elenco, malha, piso, semente), refaz a escala e
compara turno a turno. É a promessa do `ALGORITMO.md` — *"conferir daqui a um ano"* — medida contra o
**dado publicado**, não contra entrada de teste. Bloco `importado` é isento, declarado e contado.
⚠️ Fica vermelho no dia em que o algoritmo mudar de propósito. É o ponto: nesse dia a promessa se
quebra para o que já está no ar, e alguém tem de decidir — aceitar e declarar, ou republicar.

### 37. `selo:gravar` — o verde acima é DESTA árvore
Guarda a impressão digital de todo arquivo versionado. `npm run selo:conferir`, antes de commitar,
compara. **Por quê:** em 05/08/2026 um `git add -A` capturou o mutante de um auditor e o commit
entrou na história afirmando `EXIT_GATE=0` — o gate tinha sido verde minutos antes, sobre outra
árvore. Um veredito só vale para o estado que ele mediu.

> 🔴 **Segundo defeito, achado em 19/08/2026** (retomada de sessão, palavra `retomaescala`): a
> impressão digital misturava duas representações do MESMO arquivo. Para o que estava no ÍNDICE do
> git (staged ou já commitado), usava o hash de BLOB — que `core.autocrlf=true` normaliza para LF
> antes de gravar. Para o que estava só MODIFICADO no disco (unstaged), lia os bytes CRUS do
> arquivo (CRLF, no Windows) e tirava sha256 direto.
>
> O fluxo deste próprio projeto — `npm run gate` (termina em `selo:gravar`) **antes** de `git add` —
> passa o mesmo arquivo pelas DUAS representações em sequência: hash-de-bytes-crus no `--gravar`
> (arquivo ainda modificado), hash-de-blob-LF no `--conferir` seguinte (arquivo já commitado). **Zero
> bytes mudaram de verdade, e o selo gritava "árvore mudou"** — reproduzido com `git ls-files -s`
> devolvendo o MESMO hash antes e depois de editar um arquivo sem `git add` (a leitura é do índice,
> não do disco), enquanto o hash final do selo mudava mesmo assim.
>
> **Conserto:** parar de misturar as duas fontes. A impressão digital agora lê sempre o CONTEÚDO NO
> DISCO — de todo arquivo rastreado (`git ls-files`) e de todo arquivo presente no `status
> --porcelain -uall`, por `readFileSync`, nunca pelo índice do git. É isso, e só isso, que o gate
> de fato testou: `vitest`/`vite build` leem do disco, nunca do índice. Um arquivo rastreado que
> sumiu do disco entra como `AUSENTE`, em vez de ser silenciosamente pulado.
>
> Ver o passo 17 (`selo:autoteste`) — o selo nunca tinha autoteste, e foi exatamente por faltar um
> que este defeito sobreviveu sem ninguém notar.

> 🟡 **Terceiro achado, da auditoria cega do conserto acima** (mesmo dia): renomear um arquivo
> staged fazia o parser tratar a linha `R  antigo.txt -> novo.txt` do `status --porcelain` como um
> nome de arquivo fantasma. Diferente do segundo defeito: aqui o CAMINHO muda de verdade, então o
> selo **deve** continuar acusando — e continua, antes e depois do conserto. O que mudou foi o
> candidato virar o caminho real (`novo.txt`) em vez de lixo. Ver caso G do autoteste (passo 17).

## Fora do GATE, de propósito

As validações **ao vivo** abrem o site publicado num navegador de verdade. Não entram no gate porque
dependem da rede e do GitHub Pages, e **portão que quebra por causa alheia é portão que alguém
desliga.** Ver [`OPERACAO.md`](OPERACAO.md), parte 3.

Duas merecem nota:

> 🔴 **`npm run ensaio` SAIU desta lista em 05/08/2026** — ele é o **passo 20 do gate** desde que a
> sexta auditoria mostrou que ele não precisa de rede nem de credencial. Este documento continuou
> dizendo que ele estava fora, contradizendo o `package.json` e o `OPERACAO.md` — achado da sétima
> auditoria (regressão). Ver a seção 22 acima.

**`npm run vivo:caminho`** — a SEQUÊNCIA, não as peças. Os outros portões cobrem cada parte
isolada; este percorre o que a pessoa faz de verdade, do começo ao fim, uma vez. Nasceu em
05/08/2026 de uma pergunta simples: *o caminho inteiro já foi andado alguma vez?* Não tinha. E
o primeiro trecho dele é o **site público** — porque mexer no administrativo pode quebrar o que os
irmãos abrem, e o inverso também.

**`npm run vivo:divulgado`** — o portão que **faltava**, e que o dono achou sozinho. Compara o site
novo com o que **já foi divulgado**, dia a dia. Nenhum outro portão pegava a divergência de 87
turnos, porque todos comparavam o site novo com o **dado** do site novo.

> **Coerência interna não é verdade.** O que foi DIVULGADO é a referência.

**`npm run vivo:acessibilidade`** — contraste, tamanho de fonte, foco de teclado e idioma, medidos
na **tela renderizada** (uma classe do Tailwind não diz a cor final: herança, sobreposição e
opacidade só se resolvem no navegador).

> 🔴 **Ele media UMA cena, e por isso mentia.** Até 05/08/2026 media só o celular como a página
> nasce — e o veredito *"contraste, foco de teclado e idioma dentro do piso WCAG AA"* era verdadeiro
> **sobre 6 elementos focáveis**. A barra lateral inteira (busca, "Minha Escala", os dois filtros, os
> botões de enviar) vive sob `hidden md:flex`: no celular tem retângulo zerado e fica fora da conta.
> O desktop, nunca era visitado. A porta do administrativo, nunca.
>
> Rodado nas telas que faltavam, o **mesmo código de medição** achou 4 falhas WCAG AA — a pior,
> *"Toque para configurar"* a **2,67:1**, que é o convite para o irmão de 60+ achar o próprio nome.

Hoje ele mede **quatro cenas** — celular como nasce · celular com o painel aberto · desktop 1440px ·
porta do administrativo — mais **duas medições de texto a 200%** (WCAG 2.1 AA §1.4.4, *"Resize
text"*: o conteúdo continua legível e utilizável, sem rolagem horizontal e sem palavra cortada). Essa
era a única exigência **normativa** que este portão não media — ao contrário do piso de 12px, que ele
mesmo declara como convenção de casa. Norma que ninguém mede é norma que vai embora sem aviso: medido
em 05/08/2026, o rótulo do seletor (*"Irmão"*) era **cortado inteiro** a 200%, porque a caixa tinha
`truncate`. Quem aumenta a fonte é exatamente quem precisa do rótulo.

E ele **reprova se uma cena não abrir**: se o seletor do painel mudar de nome,
`preparar` falha em silêncio e a cena volta a medir a tela fechada. O sinal é o número de
**focáveis**, que dobra com o painel aberto; o portão compara as duas cenas e acusa.

> **Portão que mede menos do que diz é pior que portão ausente**: ele responde "está tudo bem" a uma
> pergunta maior do que a que ele fez. Sexta vez que esta classe aparece no projeto — e a primeira em
> que a defesa é o próprio portão conferir o tamanho da população que mediu.

---

## Como acrescentar um portão

1. Escreva o **critério** como número ou expressão. Se não couber numa frase com número, ainda não é
   critério.
2. Imprima **população medida** e **o que foi pulado**, lado a lado.
3. Escreva o **autoteste** antes de acreditar no verde: infrator injetado tem de reprovar, caso limpo
   tem de passar.
4. Se usar expressão regular, construa com `String.raw` ou **sem barra invertida nenhuma**, e
   confira os próprios padrões contra caracteres de controle.
5. Rode com um infrator de verdade plantado no repositório e **veja vermelho** antes de commitar.
6. Só então acrescente ao `gate` — e ao [`OPERACAO.md`](OPERACAO.md) e a este documento.
