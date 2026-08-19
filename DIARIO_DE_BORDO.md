# DIÁRIO DE BORDO — escala-porteiros

> **Rastreabilidade total.** Cada entrada registra: **solicitação → pesquisa → decisão → porquê →
> como reverter.** Documento **append-only**, fatiado por período ao estourar o teto. **Nada é
> excluído, nunca.**
>
> **Cadeia de navegação:** [`ESTADO.md`](ESTADO.md) → [`handoff mais recente`](docs/handoff/HANDOFF_2026-08-18-c.md) → [`BACKLOG.md`](BACKLOG.md)
> **Roteador:** [`AGENTS.md`](AGENTS.md) ·
> **Solicitações:** [`docs/solicitacoes/INDICE_DE_SOLICITACOES.md`](docs/solicitacoes/INDICE_DE_SOLICITACOES.md) ·
> **Histórico:** [`docs/historico/INDICE.md`](docs/historico/INDICE.md)

---

> 📦 **Fatia arquivada:** as entradas **DB-001 a DB-012** (04/08/2026) estão em
> [`docs/historico/2026-08-04_DIARIO_DE_BORDO_DB001-012.md`](docs/historico/2026-08-04_DIARIO_DE_BORDO_DB001-012.md).

## DB-013 · 05/08/2026 — a escala nova desmentia o site que os irmãos já tinham

### Solicitação (Flavio, verbatim)

> *"Hoje, quarta-feira, na escala que estamos trabalhando agora, você já alterou o Williams por
> Isaac, sem eu sequer ter solicitado alteração na escala nova. Note que isso é muito importante."*

### Medição, não presunção

Um script leu os dois sites num navegador de verdade e comparou dia a dia, de hoje em diante:

```
turnos comparáveis IGUAIS ....... 0
turnos comparáveis DIVERGENTES .. 87
```

**Todos.** E **nenhum portão pegou** — todos comparavam o site novo com o **dado** do site novo.
Coerência interna impecável enquanto a escala inteira contradizia o que a congregação tinha em mãos.

### Decisão, e o porquê

O bloco histórico foi recortado até **05/08 inclusive**, congelando 96 turnos, e a escala nova passa
a começar em 06/08. O que já foi divulgado vira passado imutável.

> **Coerência interna não é verdade.** O que foi DIVULGADO é a referência.

E a instrução dele sobre a Santa Ceia foi obedecida ao pé da letra — *"se estava errada, mantenha;
se a data já passou, mantenha"*: a Ceia de 07/06, errada no site antigo, está dentro do bloco
congelado e **não foi tocada**.

### Como reverter

`git revert 47fb59f` devolve o recorte. O bloco congelado volta a terminar em 04/08 e a escala nova
a começar em 05/08 — o que faria o site desmentir o turno de hoje outra vez.

### Portão que nasceu disto

`npm run vivo:divulgado -- --antigo <url>`. Ele **não existia**, e a medição que motivou o recorte
tinha sido feita num arquivo solto, fora do repositório — número que ninguém consegue re-medir não é
medição, é lembrança.

---

## DB-014 · 05/08/2026 — configuração morta: existia, e nunca era lida

### Solicitação (Flavio, verbatim)

> *"Coloque como regra máxima do escopo: é uma escala genérica, configurável, **mas genérica**, com
> intenção de comercialização."*

### O que a auditoria externa achou, horas depois

O código dizia o contrário em **nove** lugares: cabeçalho do site (desktop e celular), cabeçalho da
administração, tela de entrada, imagem do WhatsApp, nome do arquivo baixado, título da aba, os três
prompts do motor, 24 ocorrências de "Irmão", e o **emblema importado**.

E `config.identidade` **já existia** — no tipo, no dado publicado e no padrão de carregamento.
**Nunca era lido.**

### Decisão, e o porquê

> **Configuração morta é pior que configuração ausente: ela parece que resolve.** Quem lesse o tipo
> concluiria que o produto já era configurável e não procuraria mais.

Título, subtítulo, emblema e vocabulário viraram dado com **tela**. O padrão do produto virou
genérico ("Escala de plantões" / "Pessoa"), e o nome deste cliente vive só em `dados/`.

⚠️ **Sem fallback que carregue o nome antigo.** A primeira correção deixou `?? 'Escala de Porteiros'`
no JSX — pior que o defeito original: parece configurável e guarda o nome antigo como rede.

### Como reverter

`git revert c9fc6be`. Voltaria a cravar o nome — e a fechar a porta das fases 2 e 3.

---

## DB-015 · 05/08/2026 — o teto é máximo, não meta

### Solicitação (Flavio, verbatim)

> *"Elas têm um teto e elas não podem ultrapassar o teto, mas ficar abaixo, desde que não fiquem
> muito abaixo, com tolerância. Tudo bem também."*

### Decisão, e o porquê

Q5 acusava **qualquer** valor abaixo do teto — o que transforma o aviso em ruído, e aviso que
aparece sempre é aviso que ninguém lê. Duas mudanças:

1. **tolerância de 1** — só avisa quem fica 2 ou mais abaixo. 🏠 **Convenção de casa, declarada**:
   não há fonte externa para *"quanto abaixo do teto é demais"* numa escala de voluntários;
2. **mês cortado não se julga** — era a origem dos dois avisos. Agosto entrava com 24 dos 31 dias.

### O risco que isso cria, e como está travado

Toda tolerância pode virar uma regra que nunca acusa — e regra que nunca acusa é indistinguível de
regra apagada. Os testes cobrem os **dois lados**: 1 abaixo passa, **2 abaixo ainda acusa**.

### Como reverter

`TOLERANCIA_ABAIXO_DO_TETO = 0` em `src/dominio/regras.ts` e remover `mesInteiro`. Dois testes ficam
vermelhos, que é o comportamento certo.

---

## DB-016 · 05/08/2026 — gerar um período menor apagava escala já divulgada

### Como apareceu

Quarta auditoria externa do dia, mirando o caminho que o Flavio ia percorrer: *ajustar elenco →
gerar → publicar → mandar a URL*.

### A medição, no dado real

```
publicado: 183 turnos  →  gerar 01/09 a 31/10  →  110 turnos
PERDIDOS: 73 — novembro e dezembro inteiros, sem substituto
```

A montagem guardava só a **cabeça** do bloco anterior. A **cauda** sumia. E
`conferirPassadoPreservado`, escrito no mesmo dia para provar que *"o passado não se reescreve"*,
**aprovava** — porque contava só o que vinha antes do corte.

> 🔴 **Um conferidor que prova metade da frase é pior que nenhum: ele dá licença.**

### Decisão, e o porquê

O bloco anterior passa a ser **partido em cabeça e cauda**. O bloco novo manda no período dele, e só
nele. E o guarda — que vivia só num script declarado *"não é ferramenta de produção"* — foi **ligado
na tela**, travando a publicação e dizendo **quais dias** sumiriam.

### Como reverter

`git revert 0c0f15d`. Voltaria a apagar a cauda em silêncio, no clique que ele daria hoje.

---

## DB-017 · 05/08/2026 — quatro auditorias, 48 achados, e o padrão que se repete

### O que foi feito

Quatro auditorias externas independentes, em frentes disjuntas: configuração morta (15) · teste de
portabilidade da documentação (3 estruturais) · regressões e fronteiras (20) · o caminho de
publicação (10). **Todos fechados e provados nas duas pontas.**

### O padrão que apareceu nas quatro

**A fronteira do portão é onde o defeito mora.** Em ordem de descoberta:

| # | O portão media | O defeito estava |
|---|---|---|
| 1 | texto em `src/` | no `import` de uma imagem — que não tem texto |
| 2 | `src/` + `index.html` | no `package.json` |
| 3 | aspas simples | num `import` com aspas duplas |
| 4 | só arquivos `.md` | num `console.log` de script |
| 5 | número **depois** da palavra "gate" | num título com o número **antes** |

Cada achado que escapou virou critério novo. E o portão de fatos — criado justamente para fechar
essa classe — teve o **quarto** buraco de fronteira dentro dele.

### A decisão de método que sai daqui

Todo portão novo declara, no próprio cabeçalho, **o que ele decidiu não olhar**. Não como desculpa:
como o primeiro lugar onde o próximo auditor vai procurar.

### Como reverter

Nenhuma destas correções deve ser revertida isoladamente — cada uma tem teste que fica vermelho.
O `BACKLOG.md` lista as 48, com `arquivo:linha` e como reproduzir.

---

## DB-018 · 05/08/2026 — o guarda estava certo; o argumento é que estava velho

### A solicitação

*"Go workflow completo item a item… sempre expandir, mapeando todas as ligações em Documentos e
Código antes de mexer… quem determina a ordem é você, sempre."* — Flavio, 05/08/2026 (S-032).

Quinta auditoria externa, mirando o que as quatro anteriores **não** tinham olhado.

### A medição

`carregarDados()` roda **uma vez**, no topo do módulo. O objeto ficava congelado no closure da tela,
e a área administrativa media tudo contra ele. Medido com o domínio de produção e o dado real:

```
publicação 1 (jan→mar/2027)            → 238 turnos
publicação 2 (abr→jun), sem recarregar → 238 turnos   ← jan-mar SUMIU
                                          guarda: ok=true, perdidos=0
com o retrato atualizado               → 293 turnos   ⇒ 55 turnos salvos
```

Segundo efeito da mesma raiz: a fronteira lia a última escala de `p1` como **27/09** em vez de
**27/12**, e o gerador o escalava em 01/01 — um dia depois de ele servir em 31/12.

### A decisão, e o porquê

O retrato do publicado virou **estado**, atualizado por quem grava, com o que gravou.

**Recarregar da rede foi recusado**, e é a parte que importa: o GitHub Pages leva cerca de um minuto
para servir o arquivo novo. Buscar de novo logo depois de publicar traria **o dado antigo de volta** —
a cura seria pior que a doença, e silenciosa. Quem sabe a verdade neste instante é quem acabou de
gravar.

Campo a campo, e só o que **de fato** passou: numa falha parcial, trocar um retrato velho por um
retrato falso é pior, porque o guarda passaria a comparar com algo que nunca existiu.

> 🔴 **A lição, que é a de ontem por outra porta:** ontem o defeito estava na função
> (`conferirPassadoPreservado` contava só a cabeça). Hoje, no que ela **recebia**. Um conferidor só é
> tão bom quanto o argumento que lhe entregam — e nenhum teste de unidade pega isso, porque o teste
> entrega o argumento certo.

### Como reverter

`git revert e7fcd37` desfaz o commit inteiro. Só esta parte: devolver `dados` a prop em
`Admin.tsx` e apagar `retratoPublicado` de `carregar.ts`. Os testes de `blocos.test.ts` continuam
verdes — eles não cobrem esta ponta, e é justamente por isso que ela escapou.

---

## DB-019 · 05/08/2026 — nasceu D12, e ela nasceu com o defeito que existe para fechar

### A medição

```
capacidadePadrao = 0 → 110 turnos · 0 pessoas escaladas → "Aprovada, sem ressalvas."
                       2ª régua: 0 furos de 7
```

Nenhuma das réguas errou por descuido. **D1** pergunta *"o turno recebeu o que pediu?"* e `0 === 0` é
verdade. **D11** compara a grade do bloco com a esperada — construída pela **mesma** função, com a
mesma capacidade: casam perfeitamente. **Q2** vê amplitude zero, que é equilíbrio perfeito.

### A decisão

A pergunta que faltava é anterior a todas: **o turno pediu um número que faz sentido?** Isso não cabe
em D1 (que julga o preenchimento) nem em D11 (que julga a cobertura), e por isso virou regra própria
em vez de remendo — com `explicacao` própria no catálogo, que é o que o usuário lê.

Santa Ceia é a exceção **legítima e única**: ela tem capacidade 0 por definição.

### O que aconteceu no caminho, e vale mais que a regra

A primeira versão de D12 fazia `for (const t of comGente.slice(0, 5))` — fatiava os **turnos**
achando que limitava as **mensagens**. Medido no dado real: um turno sem vaga na **posição 10**, no
meio de uma escala boa, saía **aprovado**.

> 🔴 **A regra escrita para fechar a classe "portão que mede menos do que diz" tinha o defeito dentro
> dela.** E ela passou nos cinco testes que eu tinha acabado de escrever, porque todos usavam
> cenários curtos. Só apareceu porque a correção foi medida **contra o dado real**, e não só contra o
> cenário que a inspirou.

Regra de bolso que sai daqui: **filtra primeiro, fatia depois.** O `slice` limita o RELATÓRIO; a
conferência é sempre sobre a população inteira.

### Como reverter

Tirar `D12` de `REGRAS_DURAS` em `regras.ts` e o id de `comTeste` em `regras.test.ts`. ⚠️ O portão
`fatos:conferir` ficará vermelho até os textos voltarem de 12 para 11 duras — é ele que impede que
catálogo e documentação divirjam.

---

## DB-020 · 05/08/2026 — quatro maneiras de apagar a escala de todos, com o portão verde ao lado

### A medição

O auditor injetou mutantes num espelho do projeto e rodou a suíte inteira:

| mutante | o que a congregação veria | suíte |
|---|---|---|
| `paraShifts` → `assignedBrothers: []` | escala vazia para todo mundo | 232/232 ✅ |
| `paraShifts` → `date: 01/01/2000` | a escala inteira em 2000 | 232/232 ✅ |
| `paraShifts` → `type: 'NOITE'` | manhã e Santa Ceia somem da tela | 232/232 ✅ |
| `filtrarTurnos` → `return []` | tela em branco | 232/232 ✅ |

### A decisão, e o porquê

O domínio deste projeto está coberto até o osso — 16 regras, duas réguas independentes, portão do
portão. **O caminho que a pessoa realmente vê** não tinha um único teste: `paraShifts`,
`filtrarTurnos`, `gerarImagensDaEscala`, `reverterPara`, `medir`.

A causa é conhecida e vale registrar: o adaptador para a tela herdada foi escrito como "código de
cola", e código de cola parece não merecer teste. Ele é justamente onde **todo** o dado passa.

`ponte-para-a-tela.test.ts` afirma **um campo por vez, com valor absoluto**. Comparar
`paraShifts(t)[0].type` com `TIPO_PARA_TELA[t.tipo]` seria escrever o defeito duas vezes e chamar
isso de prova.

### Como reverter

Apagar `src/dados/ponte-para-a-tela.test.ts`. Nada de produção depende dele — e é exatamente essa a
razão pela qual ele demorou a existir.

---

## DB-021 · 05/08/2026 — o portão de acessibilidade media a tela FECHADA

### A medição

O portão media **uma cena**: o celular, como a página nasce. O veredito *"contraste, foco de teclado
e idioma dentro do piso WCAG AA"* era verdadeiro — e era verdadeiro sobre **6 elementos focáveis**.

A barra lateral inteira (busca, "Minha Escala", os dois filtros, os botões de enviar) vive sob
`hidden md:flex`: no celular tem retângulo zerado e fica fora da conta; no desktop nunca era
visitada; e a porta do administrativo, nunca.

| cena | textos | focáveis | abaixo do contraste |
|---|---|---|---|
| celular, como nasce | 1.303 | 6 | 0 |
| celular, **filtros abertos** | 1.317 | 12 | **4** |
| **desktop 1440px** | 1.311 | 7 | **3** |
| **porta do administrativo** | 21 | 6 | **2** |

O pior: *"Toque para configurar"* a **2,67:1** — que é o convite para o irmão de 60+ achar o próprio
nome na escala.

### A decisão

Quatro cenas, com a mesma régua aplicada às quatro. E o portão **reprova se uma cena não abrir**: se
o seletor do painel mudar de nome, `preparar` falha em silêncio e a cena volta a medir a tela
fechada. O sinal é o número de **focáveis**, que mais que dobra com o painel aberto.

> 🔴 **Portão que mede menos do que diz é pior que portão ausente**: ele responde "está tudo bem" a
> uma pergunta maior do que a que ele fez. É a quinta vez que esta classe aparece no projeto, e a
> primeira em que a defesa é o próprio portão conferir o tamanho da população que mediu.

### Como reverter

`git revert` do commit. Só a cor: `text-gray-600` volta a `text-gray-400` em `App.tsx`,
`MultiSelect.tsx` e `Admin.tsx`, e `indigo-700` a `indigo-400`. ⚠️ `vivo:acessibilidade` fica
vermelho — é para isso que ele existe.

---

## DB-022 · 05/08/2026 — 🔒 o gate foi verde sobre outra árvore, e eu escrevi o número no commit

### A medição

Com três auditores rodando em paralelo, um deles tinha um mutante vivo no disco no segundo em que
rodei `git add -A && git commit`:

```
3f8e366 → src/dominio/datas.ts: return d.slice(0, 4)   ← o mês virou o ANO
7af91e1 → return d.slice(0, 7)                          ← restaurado no commit seguinte
3f8e366 NÃO tocou docs/assets/ · o bundle no ar sempre serviu slice(0, 7)
```

O commit entrou na história de `main` com o produto quebrado dentro, e a mensagem **afirma
`EXIT_GATE=0`**.

### A decisão, e o porquê

**Nada mentiu.** O gate foi verde minutos antes, sobre uma árvore que já não era a mesma. Eu apliquei
o veredito de um estado a outro — e o escrevi na mensagem do commit, que é onde ele vira registro
permanente e é lido por quem vier depois.

O commit **não é reescrito**. Pela mesma regra que proíbe reescrever escala publicada: apagar o erro
apaga a informação mais valiosa, que é por que se acreditou nele. O commit fica, e este registro fica
junto — quem fizer `bisect` naquele ponto encontra o mês errado, e agora sabe por quê.

O conserto é mecânico, porque **disciplina falha e eu acabei de ser a prova**:

- `npm run selo:gravar` é o **24º passo do gate** e guarda a impressão digital de todo arquivo
  versionado (índice do git + hash do que estiver sujo);
- `npm run selo:conferir`, antes de commitar, compara.

> 🔴 **Um veredito só vale para o estado que ele mediu.** E isso não é uma regra sobre agentes
> paralelos: vale para qualquer edição feita entre o gate e o commit — inclusive as minhas, que é o
> caso comum e o mais fácil de não notar.

### Como reverter

Tirar `selo:gravar` do gate e apagar `scripts/selar-arvore.mjs`. Nada depende dele — e é exatamente
por isso que ele demorou a existir.

---

## DB-023 · 05/08/2026 — o gate cobria o domínio até o osso e não tocava na tela

### A medição

`vite.config.ts` restringia o vitest a `src/**` com extensão `.test.ts`, e **não há um único teste de
componente**. Nenhum dos 20 passos executava uma linha de `Admin.tsx`. O auditor desligou duas travas:

```
if (false && diferencaEmDias(de, hojeSaoPaulo()) > 0)      → gate EXIT=0
const impedido = (relatorio ? !relatorio.aprovada : false)  → gate EXIT=0
```

A segunda é literalmente o defeito dos 73 turnos apagados de ontem, com o conserto desfeito.

### A decisão, e o porquê

**Não escrever teste de componente — tirar a decisão da tela.**

Teste de componente exigiria `jsdom`, biblioteca de renderização e um jeito novo de escrever teste
neste projeto. E resolveria o sintoma: a regra continuaria morando onde ninguém a alcança.

Regra que decide **se publica ou não** é domínio. A tela pergunta e pinta. `travaDeDataRetroativa` e
`publicacaoImpedida` foram para `blocos.ts`, com 9 testes das duas pontas, e `Admin.tsx` ficou com
uma chamada no lugar de uma condição.

⚠️ Fica **declarado como aberto**: outras decisões continuam na tela (qual aba abre, o que o botão
desabilita, o que o `useMemo` recalcula). Elas não decidem o que vai ao ar. No dia em que uma decidir,
ela desce para o domínio pelo mesmo caminho — e `.test.tsx` deixou de ser ignorado em silêncio, para
que a alternativa também exista.

### Como reverter

`git revert` do commit. As duas funções voltam para dentro de `Admin.tsx`; os 9 testes ficam órfãos e
o vitest reclama do import.

---

## DB-024 · 05/08/2026 — três correções da manhã estavam na variável errada

### A medição

O commit da manhã diz, **no próprio código**, que fechou o "reverter e publicar desfaz a reversão".
Ele atualizou o retrato (`dados`). Mas `publicar()` não sobe `dados.pessoas` — sobe o estado
`pessoas`, que nasce de um inicializador preguiçoso e nunca mais é reescrito.

```
reverter o elenco → mensagem verde → clicar Publicar → o nome revertido VOLTA
```

Com `config.json`, pior: `configMudou` comparava o estado velho com o retrato revertido, então a
publicação seguinte **decidia ativamente** republicar a configuração antiga.

E os campos De/Até não acompanhavam `dados`: depois de publicar jan→mar, continuavam em
`De = 01/01/2027`, com cara de certo.

### A decisão, e o porquê

`aoReverter` sincroniza também o estado editável — e é **separado** de `aoGravar` de propósito: numa
publicação com falha parcial, `dados.config` fica sendo o antigo porque não foi gravado, e copiá-lo de
volta apagaria a edição que a pessoa ainda quer publicar. Reverter é o único caso em que o arquivo
lido do passado **é** a intenção declarada.

> 🔴 **A lição: uma correção que menciona o defeito no comentário não é uma correção verificada.** O
> texto estava certo, a análise estava certa, e a variável era outra. Só a medição ao vivo separou as
> duas coisas.

### Como reverter

`git revert`. `aoReverter` volta a ser `setDados`, e o defeito volta com ele.

---

## DB-025 · 05/08/2026 — oito fronteiras de portão, e a régua que separa afirmação de narrativa

### A medição

| portão | o que dizia medir | onde o defeito estava |
|---|---|---|
| contagem de regras | documento que desmente o catálogo | não casava **"as 16 regras"** — 16 lugares vivos |
| genérico | nome de cliente no que vai ao ar | o **`README.md`** ficou de fora |
| datas | `toISOString` não decide dia | **`Date.UTC(`**, a forma do defeito real |
| regras-mestras | "tooltips em tudo" | piso de **90%** — 7 botões mudos aprovados |
| crescimento | o dado cabe onde é servido | media `public/`, e serve-se `docs/` |
| typecheck | `strict` ligado | **`vite.config.ts`** sem verificação nenhuma |
| fatos | nenhum número decorado | **a contagem de testes** não era fato |
| segunda régua | 8 promessas com teste | **nenhuma trava** para a próxima |

Nenhum conta errado. Todos medem **menos do que a frase promete** — oitava vez que esta classe
aparece no projeto.

### A decisão que vale além destes oito

Os dois padrões novos nasceram **largos** e acusaram inocentes: 9 linhas na contagem de regras, 7 na
de testes. Todas eram **narrativa histórica** — *"o núcleo nasceu com 15 regras"*, *"passavam nos 232
testes"* —, que é o registro de uma medição e a coisa mais valiosa que estes documentos guardam.

> ⚠️ **Portão que acusa o inocente é portão que alguém desliga** — e aqui seria pior: alguém apagaria
> a lição para calar o portão.

Duas réguas fecham a classe, e valem para qualquer portão de número futuro:

1. **artigo definido** separa "as 16 regras" (afirma o conjunto de hoje) de "com 15 regras" (conta uma
   história);
2. **número entre aspas é citação, não afirmação.**

### Como reverter

Cada portão tem o próprio `git revert`. ⚠️ Reverter o de contagem ou o de fatos deixa 16 documentos
livres para mentir de novo — e a tela volta a poder contradizer a si mesma na mesma seção.

---

## DB-026 · 06/08/2026 — a escala no ar estava errada, e corrigir o gerador não conserta o dado

**A solicitação.** *"⚠️ A escala que está no ar continua com Williams em 5. Gere outra escala e
avalie novamente."* E depois, autorizando a republicação: *"essa escala é fictícia. Não foi gerada
ainda, não foi publicada. De 06/08/2026 em diante pode alterar qualquer coisa."*

**O que estava errado.** O teto mensal não atravessava a fronteira entre blocos. O gerador recebia
"quantos turnos cada um já tem no mês" só do bloco que estava gerando. O Williams, teto 3, tinha
**5 turnos em agosto** — 2 no bloco histórico, 3 no novo.

**O porquê que interessa.** O código tinha sido corrigido no dia anterior e **o dado no ar continuou
errado**. Corrigir o gerador não reescreve a escala já gerada. São duas coisas: a regra e o dado que
nasceu antes dela.

**A decisão.** Levantei como pare-e-pergunte com as duas opções **medidas**: regeração completa (85
de 87 turnos mudam, 16 irmãos afetados) ou correção mínima — que **não existia**, porque em 26/08 as
8 pessoas que passavam nas regras duras violavam todas o piso de 7 dias. O Flavio decidiu republicar.

**Como reverter.** `git revert 66f90e2` devolve a escala anterior — com o Williams em 5.

---

## DB-027 · 06/08/2026 — três defeitos, uma frase: o portão responde só à pergunta que se fez a ele

**O quê.** Num único dia, a mesma classe de defeito apareceu três vezes, em lugares sem nenhuma
relação entre si:

| Onde | O portão perguntava | O que ninguém perguntou |
|---|---|---|
| `PORTOES.md` | "quantos passos o gate tem?" | "**em que ordem** eles rodam?" |
| `README.md` | "quantas regras duras existem?" | "a **lista** enumera todas?" |
| `docs/handoff/` | "o ponteiro para o mais recente está certo?" | "e os **outros** continuam alcançáveis?" |

Nos três casos o portão existente estava **verde com razão**. Ele media o que prometia medir. O
defeito morava no espaço entre a pergunta feita e a promessa que o documento fazia ao leitor.

**O porquê que interessa.** Um portão não é uma opinião sobre qualidade; é uma **pergunta**. Escrever
o portão é escolher a pergunta, e a escolha exclui tudo o que não foi perguntado — em silêncio. É por
isso que a anatomia de um portão neste projeto exige **população impressa** e **o que foi pulado,
também impresso**: são as duas únicas partes que deixam a pergunta não feita aparecer.

**O caso mais caro dos três** foi o do índice de handoffs, porque o dano era invisível: dois
registros de sessão existiam no disco e **nenhum caminho levava até eles**. A causa foi uma
substituição cega de nome — o script que religa a cadeia trocou o handoff antigo pelo novo em *todos*
os arquivos, e no índice, que é justamente onde os nomes antigos **devem** ficar, isso apagou
histórico.

**Regra que fica:** nome antigo no índice **não se substitui**; acrescenta-se a linha nova por cima.

**Como reverter.** Cada portão tem o próprio `git revert`. ⚠️ Reverter o `handoff-orfao` deixa o
registro do projeto livre para perder sessões inteiras em silêncio de novo.

---

## DB-028 · 06/08/2026 — campo sem rótulo é campo invisível, e nome não é sequência de bytes latinos

**O quê.** O campo de data da Santa Ceia, acrescentado por mim no dia anterior, nasceu só com
`title`. Cobrou duas vezes: quem usa leitor de tela ficou sem saber o que ele era, **e** o validador
de "Gerar", que procurava campos de data por posição (`nth(2)`, `nth(3)`), passou a digitar a data da
ausência dentro dele. A tela recusava a ausência com razão, e o teste acusava a tela.

**O porquê que interessa.** Acessibilidade neste projeto deixou de ser um item de lista de boas
intenções e virou **mecanismo de medição**: um localizador por rótulo quebra alto no dia em que o
rótulo sumir; um por posição erra em silêncio. **Posição não é identidade.**

**E o segundo defeito, da mesma família.** O produto tratava nome como se toda letra coubesse numa
unidade de código UTF-16 e como se todo nome tivesse alguma letra de a–z:

- emoji no começo → `charAt(0)` devolvia **meio par substituto** e a imagem morria com *"URI
  malformed"*, mensagem que não diz nada a quem só quis publicar a escala do mês;
- nome inteiro fora do alfabeto latino → o identificador virava `_`, e **o segundo cadastrado
  colidia com o primeiro**.

O produto é vendido como genérico, para qualquer congregação. A que escrever em outro alfabeto não
pode depender de sorte.

**Detalhe que vale registrar:** minha primeira versão de `idDoNome` era frouxa — `...` virava o
identificador `p_2e2e2e`. **O teste escrito antes reprovou a implementação**, e a guarda virou
`\p{L}|\p{N}` ("tem letra ou número em qualquer alfabeto").

**Como reverter.** `git revert a3ccb46` devolve `charAt(0)` e o identificador colidente.

---

## DB-029 · 06/08/2026 — os sete achados abertos, e a mensagem que manda a pessoa para o lado errado

**O quê.** Os sete achados que a sétima auditoria tinha deixado em aberto foram fechados. Três deles
ensinam mais que o conserto:

**1. Mensagem que descreve o sintoma de OUTRO problema é pior que mensagem nenhuma.** Com "De" em
31/12/2026 e "Até" em 01/01/2026, a tela respondia: *"não há nenhum dia de culto. A escala tem turno
em: domingo, quarta, sábado. Escolha um período mais longo."* Cada palavra verdadeira, o diagnóstico
inteiro falso. Quem seguisse o conselho — alargar o período — só se afastaria da solução, com a
autoridade de quem sabe. **A guarda tinha de vir antes de montar a grade**, porque era a grade vazia
que produzia o engano.

**2. O estrago de uma tela desatualizada não é visual.** Geração recusada deixava a proposta anterior
na tela, com o `Ajustar` destravado e o `Publicar` oferecendo publicá-la. Os campos "De" e "Até" já
mostravam o período NOVO e a proposta era do VELHO: publicar dali punha no ar uma escala que a tela
não estava descrevendo. **Uma proposta só é verdadeira enquanto os campos que a geraram continuam
valendo.**

**3. `candidatosBarrados` era a regra da casa esperando ser aplicada.** O gerador já calculava quem
não pôde entrar e por quê, e ninguém lia. A mensagem mandava *"afrouxar alguma restrição"* sem dizer
qual nem para quem — o conselho certo com a informação que o resolve escondida no objeto de retorno.
Dado que existe aparece **mastigado, onde a pessoa já está**.

**A decisão de desenho que vale registrar.** O piso declarado podia ser menor que o entregue (1 em 20
combinações medidas: declarava 5, entregava 6). A tentação era corrigir `pisoAlcancado` para a
medição. **Seria errado:** ele é a EXIGÊNCIA com que o gerador conseguiu cobrir tudo, volta ao
gerador no portão `refazer` e é o que a D10 usa para reprovar. Trocar o significado quebraria a
reprodutibilidade de tudo o que já foi publicado. A medição passou a viver ao lado, **derivada** —
nada gravado, nada migra — e a tela mostra as duas quando diferem.

**Um detalhe de método que custou uma rodada.** Ao reproduzir o ano de 5 dígitos, atribuí
`el.value` direto no campo. Isso **burla o rastreador de valor do React**: o `onChange` não roda, o
estado continua com a data antiga, e a escala foi gerada — eu quase registrei "não reproduz". O
setter nativo (`Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set`) é o que o
React observa. **Sonda que não dispara o caminho real mede o estado anterior e chama de resultado.**

**Como reverter.** `git revert` do commit desta entrada devolve os sete.

---

## DB-030 · 06/08/2026 — as três fronteiras declaradas: duas eram piores, uma era melhor

**O quê.** Restavam três limites que os próprios portões admitiam ter, escritos no BACKLOG para
ninguém confundir com cobertura total. Ao medir cada um, nenhuma das três declarações estava certa.

**1. O `ensaio` "passa com metade dos turnos" — ERA MELHOR do que a declaração dizia.** Injetei um
mutante que jogava fora metade dos turnos: o ensaio **reprovou**, 4 promessas caíram. Mas **5 das 11
passaram intactas** — as quatro famílias de restrição e o distanciamento. É da natureza delas: são
propriedades do tipo *"nada fora do permitido"*, e meia escala também não tem nada fora do permitido.
**Propriedade negativa não mede ausência.** Quem segurava a barra eram as regras do catálogo — e
depender de outro portão é ficar cego no dia em que ele mudar de escopo. O ensaio ganhou duas
promessas próprias de cobertura.

**2. O `auditoria` "1 de 5 superfícies" — ERA PIOR: 1 de 36.** Ela injetava **um** termo em **uma**
extensão; o portão procura **12 termos em 3 extensões**. E a matriz completa achou um buraco de
verdade: o extrator de texto de tela usava **lista de permissão de nomes de campo**, e `explicacao:`
não estava nela. São **18 campos `explicacao:` em `regras.ts`**, todos mostrados na tela da
conferência — e o portão aprovava `explicacao: "Feito por inteligência artificial"` sem piscar.

> **Lista de permissão erra em silêncio; lista de exclusão erra alto.** O projeto já tinha aprendido
> isso no portão de contagem, e aqui a lição não tinha sido aplicada. O critério deixou de ser o
> NOME do campo e passou a ser a FORMA do valor: string com espaço e minúscula é prosa.

**3. O `generico` "não varre `docs/*.md`" — a declaração estava certa pelo motivo errado.** Ninguém
tinha medido o que havia lá. São **12 citações em 7 arquivos, todas legítimas**: o README diz *"esta
instalação atende…"*, o MODELO_DE_DADOS mostra o valor num exemplo de JSON — que é o **oposto** de
cravar. Proibir apagaria a documentação de quem o produto atende; não medir deixaria a décima
terceira entrar em silêncio. Virou **inventário fechado**, que reprova citação a mais, arquivo novo
fora do inventário **e citação a menos**.

**O porquê que interessa.** Uma fronteira declarada é uma promessa sobre o que o portão **não** faz,
e ela apodrece igual a qualquer número escrito à mão — só que ninguém a confere, porque parece
humildade. **Declaração errada é defeito por si:** a do `ensaio` faria alguém desconfiar de um portão
que funciona; a do `auditoria` escondia um buraco sete vezes maior que o anunciado.

**Um tropeço de método, de novo.** Ao reescrever o extrator por script, `\b` virou o byte 0x08 e
`\2` virou 0x02 **dentro do arquivo** — a terceira vez que isso acontece neste projeto. O autoteste
da própria régua pegou (2 casos que deviam acusar pararam de acusar). Editar regex por script no
Windows continua sendo a armadilha; a ferramenta de edição é o caminho.

**Como reverter.** `git revert` do commit desta entrada devolve as três fronteiras.

---

## DB-031 · 06/08/2026 — o que só o OLHO pega, e o que só a MEDIÇÃO pega

**A pergunta que originou isto.** *"Fez verificação visual autônoma e completa e detalhada? Ficou
alguma pendência nas entrelinhas? Seja sincero."* A resposta honesta era **não**: eu tinha medido o
DOM de todas as telas, e não tinha **olhado** nenhuma captura das mudanças do dia.

**O que apareceu ao olhar.** Na aba `Ajustar`, na tela, com os asteriscos:

> *"…mas ficaria \*\*abaixo do piso que este bloco declara\*\* — e aí a escala fica inválida…"*

JSX não é markdown. O trecho tinha nascido num comentário — onde markdown é a convenção deste
projeto — e escorregou para dentro de um `<p>`. **Nenhuma medição de DOM pegaria**, e várias
rodaram por cima: toda checagem de texto casava, porque o texto *está lá*. Só está feio.

**E o inverso, que é a outra metade da lição.** O portão que escrevi em seguida achou mais **cinco**
ocorrências em `regras.ts`, no texto da conferência regra a regra — e **quatro delas estavam na
captura que eu tinha acabado de ler**. Eu passei por cima. Olho e medição pegam coisas diferentes;
nenhum dos dois substitui o outro, e eu tinha usado só um.

**Duas outras pendências que a mesma pergunta destravou:**

1. **Ramo inerte na tela.** Eu tinha posto `piso 5 (entregue: 6)` no quadro de números. Medi depois:
   pelo caminho que a tela usa — a cascata de `gerarVariasVersoes` — são **36 combinações com zero
   divergências**. A cascata escolhe pelo maior piso e não deixa folga. O ramo **nunca renderizaria**.
   Código inerte não é segurança extra: é uma promessa que ninguém pode ver falhar. Removido, e a
   medição virou checagem no portão `refazer`, sobre o bloco **publicado**.
2. **Registro append-only escrito no meio da sessão.** A entrada do `AI_MASTER_LOG` dizia "29 passos ·
   335 testes" e o trabalho continuou por mais três frentes. O portão de fatos não pega, porque
   append-only é **isento** dele — e a isenção supõe que a entrada está fechada quando escrita.
   **Entrada append-only escrita antes do fim da sessão é rascunho, não registro.**

**O porquê que interessa.** Este projeto trocou "olhar" por "medir" de propósito, e com razão:
medição é repetível, o olho não. Mas a troca virou substituição, e **a categoria de defeito que só o
olho pega ficou sem ninguém**. O portão `markdown-cru` (passo 6) é a parte automatizável dessa
categoria. O resto continua exigindo abrir a captura e ler.

**Como reverter.** `git revert` do commit desta entrada devolve os asteriscos e o ramo inerte.

---

## DB-032 · 06/08/2026 — a fatia automatizável do "está feio", e o portão que nasceu sempre-verde

**O quê.** Depois de admitir que a verificação visual não tinha sido feita, fechei a parte da
categoria que **dá** para automatizar: `vivo:quebrada`, 4.404 elementos em 8 cenas — as 7 do produto
mais a tela pública a **390px**.

Três coisas: **restos de dado** na tela (`undefined`, `NaN`, `[object Object]`, `Invalid Date`,
`null`, `TODO`, `lorem ipsum`), **conteúdo empurrado para fora da tela** e **texto cortado dentro da
própria caixa**. Restos não são feios — são **errados**, e passam por qualquer checagem que só
pergunta *"o texto existe?"*.

**O que o autoteste pegou, e vale mais que o portão.** A checagem de estouro media
`documentElement.scrollWidth > clientWidth`. Injetei um `<div style={{width: 3000}}>` e o portão
**aprovou**. A casca do aplicativo tem `overflow-x: hidden`: o documento não rola — o conteúdo
simplesmente some pela direita, calado. **A sonda media a rolagem, e a rolagem tinha sido
desligada.** Passou a medir a *borda direita* de cada elemento, que pega os dois casos.

> Sem o autoteste eu teria commitado um portão que aprova qualquer estouro de largura — e ele
> apareceria na lista do gate como cobertura.

**E um detalhe do autoteste que também custou uma rodada.** A primeira versão injetava o infrator
num ponto do JSX que **só renderiza quando um irmão está selecionado**. Os três casos "passaram"
sem nada ter sido injetado. **Autoteste que não prova que o infrator CHEGOU à tela mede o vazio** —
o mesmo erro que eu tinha acabado de registrar sobre o setter nativo do React, em outra roupa.

**O que fica declarado como NÃO coberto:** *"está bonito?"*, *"a hierarquia está clara?"*, *"a frase
confunde?"*. Isso exige abrir a captura e ler. E há prova, com data, de que os dois são necessários:
o `markdown-cru` achou quatro ocorrências que estavam numa captura que eu tinha acabado de ler, e eu
passei por cima delas.

**Detalhe de desenho que se pagou.** O `vivo:quebrada` **não** exigiu mexer no gate: o `vivo:tudo` lê
a lista do `package.json`, e a validação nova entrou sozinha. Foi exatamente para isso que a lista é
lida em vez de escrita.

**Como reverter.** `git revert` do commit desta entrada tira o portão; nada mais depende dele.

---

## DB-032 · 06/08/2026 — o commit subiu, o gate estava verde, e o site continuou velho

**O quê.** Três correções da tela pública — a rolagem automática para o próximo culto, "Esta Semana"
de domingo a domingo, e a ordem dos atalhos — foram commitadas, empurradas e **não chegaram ao ar**.
O GitHub Pages falhou em publicar **duas vezes seguidas**.

**O que a API mostrou:** o *build* passa; quem falha é o **deploy**, que fica em
`deployment_queued` até bater o teto de 10 minutos e ser abortado — `Timeout reached, aborting!`.
Duração registrada: **0ms**, que é o que confunde. O `githubstatus.com` marcava Pages e Actions como
**operacionais** no mesmo momento.

**O porquê que interessa, e é o registro que vale.** Todos os sinais de sucesso deste projeto
apontavam para verde: `EXIT_GATE=0` em 32 passos, selo conferido, `git push` sem erro, `origin/main`
igual ao local. **Nenhum deles fala sobre o que o servidor está servindo.** Entre o `push` e o site
existe um terceiro ator — a fila de publicação do GitHub — que não responde a nada que o projeto
controla, e que pode falhar em silêncio.

Quem pegou foi o `vivo`, porque ele compara **o pacote no ar com o commitado**:

    🔴 no ar: index-DVJ3kamb.js · commitado: index-jkDAsxOh.js — o Pages ainda não publicou

Sem essa comparação, eu teria dito "publicado" com sinceridade e estaria errado — e o dono mandaria
o link para os irmãos com a versão que abre em março.

**A regra que fica:** *`push` não é publicação.* A publicação se prova comparando o que o servidor
entrega com o que a árvore commitou, e é o **último** passo, sempre — depois do gate, depois do selo,
depois do push. É a mesma família do selo (o verde vale só para a árvore medida): aqui, o verde vale
só para a máquina que mediu.

**Como reverter.** Não há o que reverter: o defeito é externo. O que fica é o registro e o hábito.

---

## DB-033 · 06/08/2026 — a fila do Pages destravou trocando quem publica, e o remédio criou dois defeitos

**O quê.** O modo automático do Pages ("branch `main`, pasta `/docs`") falhou **cinco vezes
seguidas**. A publicação passou a ser feita por um workflow próprio
(`.github/workflows/publicar.yml`), com autorização do dono, e **funcionou na primeira tentativa**.

**O que eu tinha descartado antes de mexer**, para não trocar configuração no escuro: tamanho (42
arquivos, 881 KB), Jekyll (`docs/.nojekyll` existe), o nosso código (o artefato subia e a publicação
era criada), o push (`origin/main` = local), a política de branch do ambiente (permite `main`) e o
status oficial do GitHub ("operational").

**Duas armadilhas na hora de destravar, e as duas me custaram tentativas:**

1. **O identificador da publicação é o SHA do commit.** Cancelei pela API uma publicação travada; a
   tentativa seguinte, do **mesmo** commit, nasceu morta — *"Deployment cancelled"*. Destravar exige
   **SHA novo**, isto é, um commit a mais. `POST /pages/builds` reenfileira, mas reutiliza o SHA.
2. **`concurrency: cancel-in-progress` faz exatamente o que promete.** Disparei o workflow à mão
   enquanto o do push já rodava, e o meu cancelou o dele. Não é defeito — é a regra que eu escrevi,
   pegando a mim.

**🔴 E criar `.github/` derrubou o selo, que é o último passo do gate.** `git status --porcelain`
resume pasta não rastreada numa linha só (`?? .github/`), e o selo tentava ler uma **pasta**:
`EISDIR`. O estouro era o menor problema — enquanto a pasta ficasse resumida, **o conteúdo dela não
entrava na impressão digital**. Um arquivo novo dentro de pasta nova ficaria fora do selo, em
silêncio, e o selo existe justamente para dizer *"é esta árvore, exatamente esta"*. Corrigido com
`-uall`, mais uma guarda de diretório.

**O porquê que interessa.** Um mecanismo de segurança que nunca viu um caso — aqui, "pasta nova" —
não está protegendo esse caso: está **esperando** por ele. O selo rodou dezenas de vezes hoje e
nunca tinha encontrado uma pasta não rastreada; no primeiro encontro, quebrou. Vale para qualquer
portão: o dia em que ele vê algo novo é o dia em que se descobre o que ele não sabia fazer.

**Como reverter a publicação para o modo antigo:**

```bash
gh api --method PUT repos/flaviocom/escala-porteiros/pages \
  -f build_type=legacy -f 'source[branch]=main' -f 'source[path]=/docs'
```

---

## DB-034 · 06/08/2026 — seis deploys mortos pelo relógio, e o preço de abortar

**O quê.** Depois de trocar a publicação para um workflow próprio, ela ainda falhou. A causa não era
mais a fila: era o **relógio da própria ação**. `actions/deploy-pages` espera a publicação terminar e
aborta em **600.000 ms**. A última tentativa chegou a `deployment_in_progress` — estava funcionando —
e foi morta a 5 segundos de distância do estado seguinte.

**O porquê que interessa: abortar não é neutro.** Ao estourar o teto, a ação **cancela** a publicação,
e o identificador dela é o **SHA do commit**. A tentativa seguinte do mesmo commit nasce
*"Deployment cancelled"* — o commit fica permanentemente impublicável. Aconteceu três vezes hoje, e
cada vez custou um commit novo só para gerar um SHA limpo.

Ou seja: **o mecanismo de desistência transformava lentidão em falha permanente.** Um teto pensado
para "não travar o CI" estava criando o travamento que ele queria evitar.

Teto novo: **30 minutos**. Esperar é barato; recomeçar do zero, não.

**O padrão, para além deste caso.** Todo tempo-limite é uma aposta sobre o que é "demorado demais", e
essa aposta envelhece — a fila do GitHub de hoje não é a de quando o padrão de 10 minutos foi
escolhido. Quando um limite começa a disparar em série, a pergunta certa não é *"o que está lento?"*,
é **"o limite ainda descreve a realidade?"**.

**Como reverter.** Tirar o `timeout:` do `.github/workflows/publicar.yml` devolve os 10 minutos.

---

## DB-035 · 06/08/2026 — o campo que saltava um ano, e os doze meses publicados sem ninguém ver

**O que o dono relatou**, com as telas na mão: *"se eu coloquei escala de 6/8/2026 até 31/12/2026,
tem que ser esta escala. Você está colocando aqui para continuar: você tem que colocar 30/12/2027.
(…) Isso é um absurdo."*

**A causa, medida.** Ele nunca escolheu 2027. O fim sugerido era *"31/12 do ano do início; se sobrar
menos de 30 dias, 31/12 do ano SEGUINTE"* — uma regra que nasceu certa, contra uma janela de um dia.
Encadeada com a publicação, virou escada:

```
publicou até 30/12/2026  →  início sugerido 31/12/2026
                            janela 31/12→31/12 = 0 dias, menor que 30
                            →  fim sugerido 31/12/2027   ← doze meses
```

Ele clicou em Gerar e **publicou um ano inteiro sem perceber**. E o passo seguinte repetia: de
30/12/2027 o fim saltaria para 31/12/2028. Cada publicação empurrava o horizonte mais um ano.

**A sugestão "30/12/2027" que ele viu estava CERTA** — era o dia seguinte ao último turno do bloco
que ele tinha acabado de publicar. Ele acusou o sintoma; a doença era o campo ao lado.

**O porquê que interessa.** Um valor sugerido é uma decisão que o produto toma **no lugar da pessoa**,
e por isso ele precisa ser (a) conservador e (b) **visível**. Este era nenhum dos dois: escolhia o
maior horizonte possível e não dizia o tamanho do que tinha escolhido. Regra de bolso que fica:
**se o produto preenche um campo sozinho, a consequência do que ele preencheu tem de estar na tela.**

Duas correções, e a segunda é a que impede a repetição:

1. `sugerirFim()` no domínio, com teto de **seis meses** — nunca o ano seguinte inteiro;
2. **a janela aparece ao lado dos campos** — `184 dia(s) · ~6 meses` —, em âmbar acima de seis meses.
   O teto pode ser burlado digitando; o número na tela, não.

**A consequência que quase escapou.** O bloco de 2027 publicado por engano tinha **0 Santas Ceias
marcadas** (não há nenhuma de 2027 cadastrada): **104 domingos de 2027 com porteiros escalados**,
incluindo os que serão Santa Ceia. É exatamente o defeito que originou este projeto — o site antigo
mostrando três porteiros num dia em que ninguém deve servir. Removido com autorização do dono.

**E o que a remoção revelou:** com o bloco de 2027 fora, a 1ª régua reprovou a escala que estava no
ar — **D8, 26 turnos com Eduardo e Thiago**, que tinham sido desativados no elenco e continuavam
escalados de 06/08 em diante. Regerada com os 14 ativos: piso caiu de 7 para 4 dias, que é o preço
medido de dois irmãos a menos.

**Como reverter.** O histórico de publicações guarda cada versão; "Voltar a esta versão" traz o bloco
de 2027 de volta, se um dia ele fizer falta.

---

## DB-036 · 06/08/2026 — o aviso que inventou um defeito, e me fez caçar fantasma

**O que o dono disse:** *"'Atenção — esta escala mexe em dias que já estão no ar': jamais solicitei
isso! A regra fixa é que não altere as posições dos dias PASSADOS, os dias futuros podem ser
alterados livremente, por 1, 2 anos… ilimitado. Não tem mínimo nem máximo."*

**Ele estava certo em dois níveis, e o segundo é o que interessa.**

O primeiro: o aviso **só conseguia falar de dias futuros**. Gerar para trás já é impossível — o campo
tem `min={hoje}` e a trava de data retroativa vive no domínio, com teste. Ou seja, ele existia para
reclamar exatamente do que o dono faz de propósito toda vez que mexe no elenco.

O segundo, que custou tempo real: na mesma conversa ele abriu outro chamado — *"tirei Eduardo e
Thiago, eles sempre voltam"*. Eu fui medir, e eles **não voltavam**. O que ele estava lendo era a
lista do próprio aviso:

```
08/08 Noite: Isac, Eduardo, Leandro → Isac, Leandro, Elson
```

O Eduardo está do lado **esquerdo** justamente por ter saído. O aviso, tentando informar, **inventou
um defeito que não existia** — e nós dois fomos atrás dele.

**O porquê que fica.** Um aviso é uma afirmação sobre o mundo, e afirmação errada custa mais que
silêncio. Este dizia a verdade em cada palavra e mentia no conjunto: mostrava a escala velha ao lado
da nova sem que a hierarquia visual dissesse qual era qual. **Quando um aviso precisa ser
interpretado, ele ainda não está pronto.**

Removido das duas telas — Gerar e Publicar. Tirar de uma só não resolveria: a de Publicar é a última
coisa lida antes do botão. Saíram junto os cálculos que só ele consumia; o `strict` acusou cada um.

**O que protege o passado continua de pé, e é outro mecanismo:** `travaDeDataRetroativa`.

---

## DB-037 · 06/08/2026 — eu inventei uma trava que ele não pediu

**O quê.** Depois de descobrir que ele tinha publicado doze meses de escala sem perceber, limitei a
sugestão do campo "Até" a seis meses. Ele desfez na hora:

> *"eu não pedi para você travar aí em 6 meses. De onde você tirou isso?"* — e, sobre o que planeja:
> *"você vai calcular o ano inteiro"*, *"não tem mínimo nem máximo"*.

**O erro de raciocínio, que vale mais que o conserto.** Ele reclamou de um **número** (a data que a
tela sugeria) e eu respondi com uma **trava** (um teto que tirava a escolha dele). Diagnostiquei
"tamanho demais" quando o defeito era "tamanho **invisível**": nada na tela dizia que aquilo era um
ano, e por isso passou.

**Reclamação sobre um valor pede que o valor fique visível e controlável — não que a decisão saia das
mãos de quem reclamou.**

O que ficou da correção é só a metade certa: a janela aparece ao lado dos campos — `366 dia(s) · ~12
meses` — e **sem julgamento**. Cheguei a pôr um alerta âmbar acima de seis meses, e estava errado
duas vezes: o sistema sugeria um ano e em seguida reclamava do próprio palpite, e a regra do dono é
explícita. O número fica; o julgamento sai.

⚠️ **E o meu teste media o próprio rastro.** A checagem lia o campo "Até" depois de o próprio teste
já ter preenchido os campos várias vezes, e então acusava o produto de sugerir seis meses quando a
tela recém-aberta sugeria o ano inteiro. Agora o padrão é capturado ANTES de qualquer preenchimento.

---

## DB-038 · 06/08/2026 — trabalho que some sem avisar ensina a não confiar na ferramenta

**O pedido:** *"é necessário também salvar as informações. Hoje não salva: você altera e elas voltam.
(…) quando eu salvar, tem que ficar fixo. Inclusive as datas."*

**Medido antes de escrever uma linha** — mudar De, Até, pessoas por turno, acrescentar uma Santa
Ceia, recarregar:

```
mudei:        De=01/03/2027 · Até=30/09/2027 · 4 por turno · Ceia 11/04/2027
recarreguei:  De=31/12/2026 · Até=31/12/2027 · 3 por turno · Ceia sumiu
```

**Nada daquela aba sobrevivia a um F5** — só o que fosse PUBLICADO, e publicar é um gesto grande
demais para guardar um ajuste em andamento.

**O porquê que interessa.** O prejuízo não é a digitação perdida: é o que ela ensina. Quem perde
trabalho duas vezes passa a publicar cedo demais "para não perder", ou a evitar mexer. A ferramenta
começa a moldar o comportamento na direção errada.

`src/admin/rascunho.ts`, e **sem botão "salvar"** — botão de salvar cria a pergunta *"eu salvei?"*, e
a resposta errada custa o trabalho todo.

⚠️ **E ele se declara na tela**, com a hora e a saída ao lado. Rascunho invisível é pior que nenhum:
guardar calado trocaria "perder trabalho" por "confiar no que não foi publicado" — que é o defeito
mais caro que este produto pode ter.

**Dois defeitos meus, os dois pegos medindo:**

1. O aviso aparecia na **tela limpa** e continuava depois de "Descartar". Eu relia o `localStorage`
   dentro da aba, e ali ele já enxergava o rascunho que o próprio efeito de gravação tinha acabado de
   criar na montagem. **Duas leituras da mesma coisa em momentos diferentes são duas verdades.**
2. Escrevi um `formatarQuando` que já existia — e o meu era pior: usava o relógio do aparelho, o que
   existia usa `America/Sao_Paulo` explicitamente. O compilador acusou a duplicata.

**E uma sonda minha quase virou chamado falso.** Ao validar no site publicado, o aviso não apareceu —
porque eu "recarregava" trocando só o `#` da URL, o que **não remonta** uma aplicação de página única.
Com `reload()` de verdade, os três casos passaram. Terceira vez hoje que uma sonda mediu a si mesma;
é a razão de toda medição precisar da pergunta *"e se o defeito for do meu instrumento?"*.

**Como reverter.** `git revert` do commit desta entrada devolve o comportamento antigo — a tela volta
a esquecer tudo a cada F5.

---

## DB-039 · 06/08/2026 — cada peça certa sozinha, o defeito na junção

**O pedido:** *"Distanciamento por pessoa, mesmo clicando várias vezes, não muda nada. O 'Não gostei
— gerar outra combinação' é uma farsa."*

**Medido antes de tocar em qualquer linha** — quatro cliques na tela, com os dados dele, e oito
sementes-base no domínio:

```
na tela:     clique 1, 2, 3, 4 -> a MESMA escala, e o aviso "Saiu a mesma escala"
no domínio:  bases 1, 2, 3, 4, 5, 10, 42, 777 -> 1 escala distinta entre as oito
             cada base gera 8 versões válidas e DISTINTAS · semente escolhida: guloso
```

**A causa era o oposto do que parecia.** A semente mudava a cada clique. As oito versões saíam de
fato diferentes. O que ninguém media era a última etapa: a cascata escolhe a melhor por piso e por
Jain, e a vencedora era sempre a versão **gulosa** — a única que não usa semente nenhuma. O botão
montava oito alternativas e descartava as oito.

**O porquê que interessa.** Havia teste provando que sementes diferentes dão escalas diferentes, e
ele passava; havia teste provando que a escolhida nunca é pior que a gulosa, e ele passava. Os dois
estão corretos. **Cada peça estava certa sozinha, e o defeito morava na junção** — que só existe
inteira na tela, com este elenco. É a razão de a trava nova ser de navegador e não de unidade, e é o
tipo de buraco que nenhuma cobertura de unidade fecha por mais que cresça.

**A decisão.** "Não gostei" é um pedido explícito por *outra*. Quando o clique chega, ele manda junto
a escala recusada, e a escolha passa a ser feita entre as que **diferem** dela — mesmo que a melhor
delas seja um pouco pior. Preferir a mesma resposta a uma resposta um pouco pior é ignorar o pedido.
Sem `recusada`, nada muda: a primeira geração continua sendo a melhor possível, e há teste para isso.
Medido depois, nos dados reais: **piso 4 antes, piso 4 depois** — sem custo de qualidade.

⚠️ **Duas lições do instrumento, não do produto.** O portão nasceu vermelho com a correção certa no
lugar: ele pegava o cartão por texto solto e agarrava só o cabeçalho, 83 caracteres imutáveis —
**quarta sonda desta sessão a medir o próprio rastro**. E os três testes novos, inseridos por script,
**não chegaram ao arquivo**: o script imprimiu sucesso, o mutante passou verde, e por um instante
isso pareceu prova de que a correção não era necessária. `git status` limpo foi o que denunciou.
**Depois de escrever por script, confira o ARQUIVO — nunca a mensagem do script.**

**Como reverter.** `git revert` do commit desta entrada devolve o comportamento antigo — o botão
volta a entregar sempre a mesma escala.

---

## DB-040 · 06/08/2026 — a correção consertou o botão e deixou a frase mentindo

**Como apareceu:** na captura do site **já publicado**, olhando a tela depois de dar o trabalho por
fechado. Abaixo do botão continuava escrito:

```
Esta escala é a melhor de 8 versões que o sistema montou e comparou internamente.
```

**Verdade na primeira geração. Falsa depois de um "Não gostei"** — a partir da recusa a escolha é
feita entre as que **diferem** da recusada, e a melhor de todas pode ser justamente a que ele
recusou. A frase passou a descrever um comportamento que a correção daquele mesmo dia tinha mudado.

**O porquê que interessa.** Isto é a mesma classe de defeito que eu tinha acabado de fechar, mudada
de suporte: no botão era uma ação que não fazia o que a etiqueta dizia; aqui é uma frase que descreve
o que já não acontece. **Corrigir o comportamento sem corrigir o texto que o explica deixa a mentira
de pé — só que agora com um portão verde por cima.** Foi o olho na captura que pegou, não medição
nenhuma; é o mesmo par que o `markdown-cru` já tinha registrado (olho e medida pegam coisas
diferentes).

A frase agora tem dois estados, e o `vivo:outra` mede a virada: antes da recusa promete *"a melhor de
N versões"*; depois, *"a melhor entre as N que ficaram diferentes da que você recusou"*, dizendo em
seguida que pode haver combinação melhor entre as recusadas. Provado com mutante: fixando o estado em
`false`, o portão reprova nomeando a frase.

⚠️ **E o aviso "Saiu a mesma escala" mudou de significado sem mudar de lugar.** Ele nasceu para
explicar por que o botão repetia — explicava bem uma recusa que não devia existir. Hoje vale só para
o caso limite de verdade: nenhuma das oito ficou diferente. Nos dados atuais, não aparece mais.

**Como reverter.** `git revert` do commit desta entrada devolve a frase única.

---

## DB-041 · 06/08/2026 — a estatística que ele pediu, e o alarme que ela quase deu à toa

**O pedido:** *"na escala na área do administrador, abaixo de distanciamento por pessoa, coloque uma
estatística tipo essa ou melhor. Aceito sugestão. Somente das datas no intervalo de datas
selecionado em De–Até."* Ele mandou junto a tabela da tela pública como referência.

**O intervalo não precisou de filtro:** o bloco recém-gerado **é** o De–Até. Mesmo assim o período
vai escrito no subtítulo — pela mesma razão que a tabela pública passou a escrever o dela hoje: uma
tabela que não diz o que conta é lida como se contasse tudo.

**O "melhor" que ofereci, e por quê.** Duas coisas que a grade por mês não mostra:

1. **colunas por tipo de turno.** Nesta malha, domingo de manhã e o ENSAIO (uma tarde de sábado por
   mês) são vagas escassas e de peso diferente da noite de quarta. Dois irmãos com 19 turnos cada
   podem ter carga bem diferente se um pegou todas as manhãs e o outro nenhuma — e o total, sozinho,
   jura que estão iguais. Nos dados reais isso apareceu na hora: o Adilson tem 19 turnos, **todos de
   noite**, porque a restrição dele é essa;
2. **a linha de equilíbrio** (menor · maior · diferença), que responde de relance a pergunta que a
   tabela inteira existe para responder.

🔴 **E foi a linha de equilíbrio que quase repetiu o erro do dia.** A primeira versão comparava todo
mundo, e a tela anunciou **"diferença de 12 turnos"**, em âmbar, sobre a escala de um ano. Medido: os
12 eram **inteiros o teto do Williams** — 3 por mês × 12 meses = 36, contra 48 de quem não tem teto.
Não havia desequilíbrio nenhum. **O número estava certo e a leitura era falsa.**

É a mesma armadilha que ele apontou horas antes, noutro aviso: *quando um aviso precisa ser
interpretado, ele ainda não está pronto.* Um alarme que dispara sobre uma restrição que ele mesmo
cadastrou treina a ignorar o alarme — e aí ele deixa de servir no dia em que houver desequilíbrio de
verdade. Quem tem teto saiu da conta **e é nomeado**, com o teto e o total, seguindo a regra que ele
deu para a conferência independente: dizer quantos não basta, tem de dizer **quem**.

**A decisão de arquitetura.** A contagem não ficou na tela nova: virou `src/dominio/estatisticas.ts`,
função pura com 13 testes — e **a tela pública foi migrada para ela**. Contar de novo no componente
novo teria criado duas réguas para a mesma medida, que é exatamente como gerador e validação
divergiam no site anterior sem ninguém notar. Criar a fonte única sem migrar o consumidor não
conserta nada: o defeito seguiria vivo do lado que ficou de fora.

Duas decisões subiram da tela para o domínio na migração, e as duas agora têm teste: **quem aparece**
(o `if (counts[bId])` que descartava em silêncio o turno de quem saiu do elenco morreu junto) e **o
mês de cada turno**, lido da string ISO — `new Date('2026-08-01')` é meia-noite UTC, que em fuso
negativo cai em 31/07.

⚠️ **E a checagem nova nasceu inerte.** Escrita como *"não tem a linha OU o formato está certo"*, ela
passou **verde com o cartão inteiro fora da tela** — sem cartão não há linha, e a negação é
verdadeira. **Propriedade negativa não mede ausência**; o `ensaio` já tinha registrado essa classe
neste projeto. Agora ela lê `pessoas.json`: se existe alguém ativo com teto, a linha é obrigatória —
e se um dia ninguém tiver, ela **declara na saída** que se isentou.

**Como reverter.** `git revert` do commit desta entrada tira o cartão do administrador e devolve a
contagem antiga para a tela pública.

---

## DB-042 · 07/08/2026 — o auditor que acusou o auditado por um erro dele mesmo

**O pedido:** ele publicou, viu que três deploys apareciam como *cancelled*, e perguntou duas coisas:
se houve perda, e se dava para fazer **outra auditoria independente** confrontando os números do site.

**A primeira resposta é curta e está medida:** cancelar um *deploy* não cancela um *commit*. Cada
publicação sobe a árvore inteira do SHA dela, e a última já contém o estado das anteriores. Dos
quatro commits, dois eram de escala e **dois estavam vazios** — `pessoas.json` não muda desde 06/08
12:52, então salvar o elenco não teve o que gravar.

⚠️ **Mas o caminho até essa resposta deu um susto que vale mais que ela.** Comparei por `sha256` o
que o site serve com o que o repositório tem: **3 dos 4 arquivos "diferentes"**. Era quebra de linha
— a cópia de trabalho no Windows tem CRLF, o servido tem LF. **Comparar bytes onde a pergunta é sobre
DADO produz alarme falso**, e um alarme falso numa pergunta sobre perda de dados é exatamente o tipo
de coisa que faz alguém desfazer o que estava certo. A comparação certa é `JSON.parse` dos dois lados.

**A segunda resposta exigiu decidir o que "independente" significa aqui.** Não é outro agente: é
outra **régua**. O script não importa uma linha de `src/` — nem `distribuir()`, nem `menorIntervalo()`.
Se importasse, estaria confirmando uma régua com ela mesma, e um erro apareceria nos dois lados
saindo como "conferido". E lê o dado **pela URL publicada**, porque o arquivo no disco desta máquina é
uma hipótese sobre o que o site serve.

E declara o que ela **não** é: quem escreveu a segunda contagem foi o mesmo autor da primeira. Um
engano de *interpretação* da regra passaria pelas duas. O que ela pega é engano de implementação — a
classe comum. Para a outra, o remédio é a definição em português no cabeçalho de cada medida, exposta
para o dono conferir com os olhos.

🔴 **E o auditor nasceu acusando as 14 linhas do site, com os números batendo em todas.** A expressão
exigia espaço entre o nome e o número; no DOM os dois `span` vêm colados: `Adilson19 turnos`. **O
auditor acusou o auditado por um erro dele mesmo.**

É a classe de defeito mais cara que um auditor pode ter, e é pior que um auditor cego: quem lê
quatorze acusações falsas passa a desconfiar do relatório **inteiro**, inclusive das partes certas —
e a próxima acusação verdadeira chega já desacreditada. Um auditor que erra para o lado do alarme não
é "conservador": é ruído com aparência de rigor.

**Resultado depois de corrigido:** 87 turnos, 258 vagas, 14 pessoas, **zero divergências** — total,
mínimo, tipo e mês, pessoa a pessoa. E o autoteste (`vivo:auditoria:autoteste`), que injeta um turno
inventado **na auditoria** e exige acusação, saiu com 5 divergências nomeando a pessoa e a coluna.

**Como reverter.** `git revert` do commit desta entrada remove o script de auditoria; nada do produto
depende dele.

---

## DB-043 · 07/08/2026 — as duas réguas cegas para o MESMO dado torto

**O pedido:** *"Corrija tudo autonomamente, pesquise na Internet toda por sistemas semelhantes. Qual
é o método que usam e qual é o mais inteligente? Corrija o motor que gera a escala com todas as
variações de campos. Valide, corrija e audite também o Validador independente das escalas."*

**A ordem foi a do protocolo: pesquisa → registro → decisão.** A pesquisa foi delegada ao Gemini e
auditada antes de qualquer adoção (o registro com a auditoria em cima está em
`docs/superpowers/specs/PESQUISA_2026-08-07-metodos-rostering.md` — inclusive um erro do relatório:
ele assumiu teto mensal para os 14, quando só 1 pessoa tem).

**O achado que interessa: a ausência invertida.** `fim < início` no cadastro fazia a condição de
ausência nunca casar — no gerador **e** na conferência independente, que tem código próprio mas
reproduzia a mesma leitura. A pessoa avisava que estaria fora e era escalada dentro da própria
viagem, com as duas réguas verdes. É a forma mais pura do defeito que a segunda régua existe para
impedir: **duas réguas independentes não valem nada se interpretam o dado torto do mesmo jeito.** A
correção foi normalizar em cada uma SEPARADAMENTE (código próprio, de propósito) — e o teste da
mordida derruba cada lado sozinho.

**Os outros dois:** grade vazia saía como sucesso (período invertido/sem culto → `ok: true` com
escala vazia — agora declara a falha); e a 2ª régua podia parar de conferir `diasProibidos` e
`turnosPermitidos` com a suíte dela inteira verde — a promessa tinha teste, os CAMPOS não.

**A decisão negativa, que vale tanto quanto as positivas.** A recomendação central da pesquisa
(busca local pós-GRASP, padrão INRC) foi **medida antes de adotada**: experimento sobre os dados
reais publicados, dois critérios de aceitação, **0 trocas melhoradoras** — a escala do GRASP já é
ótimo local, e Jain 0,9965 é o máximo que a aritmética permite (258 vagas não dividem por 14).
Adotar custaria versionamento de motor no `refazer` em troca de nada. **Método mais inteligente não
é o de nome mais bonito: é o que ganha na medição.** O experimento fica registrado para re-rodar se
o elenco ou a malha mudarem de forma.

**O que entrou de método:** property-based testing (§6 da pesquisa), em forma sem dependência — 150
elencos forjados por PRNG semeado, metade das ausências invertida de propósito, contrato inteiro
(gerar → 1ª régua → 2ª régua) em cada um. Mordida provada: o mutante de teto derruba nomeando a
semente e a regra.

**Como reverter.** `git revert` do commit desta entrada. As correções de ausência/grade vazia são
comportamento novo do motor; revertê-las devolve os dois silêncios.

---

## DB-044 · 07/08/2026 — o veredito medido, e os órfãos que a cobrança dele achou

**O pedido:** *"Foi documentada a pesquisa com ligação em nossos documentos e códigos? (…) O motor
está na melhor versão de si mesmo? O validador autônomo é autônomo mesmo? (…) me diga se a escala
publicada está correta em todas as validações, citando a quantidade — não de cabeça, mas no código."*

**O veredito, medido pela URL** (`npm run vivo:veredito`, que nasceu deste pedido): 1ª régua 17/17
com 0 falhas duras e 1 aviso de qualidade (Q4, variedade de companhia); 2ª régua 8/8 promessas com
258 escalações conferidas uma a uma; auditor do site 0 divergências contra a tela pública. Piso 4
declarado = real. **As três réguas concordam: pode divulgar.**

**A cobrança dele achou três órfãos de verdade:**

1. a pesquisa estava ligada no índice, no BACKLOG e no diário — mas **não no `gerador.ts`**, que é
   onde a decisão negativa (busca local recusada) precisa morar para o confronto futuro;
2. o BACKLOG mandava *"re-rodar o experimento"* e o experimento **não existia como arquivo** — tinha
   sido um script efêmero, apagado depois de medir. Referência a prova que não existe é pior que
   não ter prova. Virou `scripts/experimento-busca-local.mjs` (`npm run experimento:busca-local`),
   o portão de reabertura da decisão: se um dia achar troca melhoradora, a recusa perde a prova;
3. **não havia handoff de 07/08** — S-040 e S-041 estavam registradas no índice e no diário, mas o
   elo do meio da cadeia (`ESTADO → handoff → BACKLOG`) apontava para 06/08.

⚠️ **E o conserto do 3º órfão quase repetiu um erro registrado em memória:** avancei os ponteiros
com substituição global de `HANDOFF_2026-08-06 → 07`, e o replace acertou os 6 ponteiros da cadeia
**e reescreveu 8 referências históricas** — entradas de 05–06/08 do AI_MASTER_LOG e do BACKLOG que
citavam o handoff de 06/08 como CONTEÚDO, não como ponteiro. É a lição de
`substituicao-cega-de-nome-apaga-historico`, de novo: **no índice o nome antigo é conteúdo.**
Revertido sítio a sítio, com verificação linha a linha antes de cada troca.

**Como reverter.** `git revert` do commit desta entrada. O veredito é leitura, não escrita — nada
do produto muda com ele.

---

## DB-045 · 07/08/2026 — "token no navegador é o melhor formato?" — decisão de FASE, registrada

**O pedido:** ele quis saber se as próximas escalas saem no mesmo padrão (zero pendência), e se o
modelo de publicação — token no navegador — é o melhor **em usabilidade** para quem faz a gestão,
ou se muda quando houver comercialização.

**A primeira resposta é estrutural, não promessa.** O padrão das próximas escalas não depende de
ninguém lembrar dele: o gerador é determinístico; a tela **bloqueia o Publicar** enquanto a
validação reprovar (`Admin.tsx` — *"Publicar está bloqueado — volte…"*); o gate de 32 passos roda
antes de todo commit; e as 5 validações NO AR conferem o site depois de toda publicação, incluindo
o veredito das duas réguas (`vivo:veredito`). O que pode aparecer é AVISO de qualidade (como o Q4
de hoje) — aviso não bloqueia, e é assim por desenho.

**A segunda resposta é uma decisão de fase, e ficou escrita em três lugares ligados.** Medido o
fluxo real de quem administra: entrar (1 clique, sem senha para gerar/validar; senha só decifra o
cofre para publicar), gerar, conferir, publicar — o site serve o dado novo em ~1 minuto. **Para um
administrador, isso é usabilidade boa de verdade** — o custo do modelo é o CADASTRO do token (uma
vez por navegador), não o dia a dia.

O que ele não serve — e a pesquisa de rostering (§2) confirma ao mostrar que todo sistema comercial
usa backend hospedado com conta — é **cliente leigo**: comercializar exigirá login e-mail/senha,
multi-tenant e "publicar = salvar". O desenho está na §P4.y do BACKLOG; o `ARQUITETURA.md` ganhou o
ponteiro da decisão na seção que já declarava o custo; e o `github.ts` — o arquivo que será
reescrito naquela fase — avisa quem chegar lá que os três JSON são o contrato e o histórico de
commits vira tabela de versões.

**O porquê que interessa:** a regra §0 (produto genérico) já foi cumprida onde ela é cara — motor,
malha, identidade, vocabulário são dado, não código. Infraestrutura de publicação é a camada que
MENOS custa trocar depois, justamente porque o portão `arquitetura` prova que o domínio não importa
nada de fora. Trocar agora seria pagar o servidor antes de existir o cliente.

**Como reverter.** Nada a reverter — esta entrada registra decisão e ligações, não muda
comportamento.

---

## DB-046 · 07/08/2026 — o modelo de comunicação vira documento, e a virada de ano vira runbook

**Os pedidos:** salvar o formato da mensagem de WhatsApp como "a forma de comunicação com os Irmãos
Porteiros" ligada aos documentos; e provar que a escala é reproduzível para 2027, 2028, 2029 — por
código E documentação, ao ponto de outra inteligência artificial replicá-la tal e qual.

**1. `docs/COMUNICACOES.md`.** O exemplar canônico é A MENSAGEM COMO ELE ENVIOU — inclusive as duas
correções dele sobre a minha versão: *"sexta-feira"* (a minha dizia quinta para 07/08/2026, que É
sexta — e por isso o checklist do modelo agora manda CONFERIR o dia da semana, nunca de cabeça) e
*"pela misericórdia do Criador"*. A estrutura está explicada bloco a bloco com o porquê de cada um
— o mais importante é o bloco da REVOGAÇÃO: sem o pedido explícito de apagar a versão velha, duas
escalas circulam juntas, que é o pior cenário possível. Banco de 5 versículos ARC sobre porteiros
e a Casa, com a regra de conferir na fonte a cada uso (edição muda vírgula).

**2. A reprodutibilidade plurianual foi MEDIDA antes de afirmada.** 2027, 2028 e 2029, com o elenco
real e a fronteira real de 2026: ~220 turnos por ano, duas gerações idênticas byte a byte, zero
falhas nas duas réguas. O código já era plurianual; **o que não existia era a documentação da
virada** — "virada", "novo ano", "ano seguinte": zero ocorrências em OPERACAO e RECONSTRUIR. O furo
não era hipotético: um bloco de 2027 já tinha sido gerado SEM Santa Ceia nenhuma (104 domingos
escalados) e só não foi ao ar porque o dono viu. A seção nova do `OPERACAO.md` põe o calendário do
ano novo como PRIMEIRO passo, antes de gerar.

**O porquê que interessa:** máquina determinística não garante reprodução se o OPERADOR não souber
os passos — reprodutibilidade é código E runbook, e a metade que faltava era o runbook.

**Como reverter.** `git revert` do commit desta entrada — nada de comportamento muda; os dois
documentos somem.

---

## DB-047 · 07/08/2026 — o aviso que ele pediu, e a fase 2 com o mapa "já existe × falta"

**Os pedidos:** implementar o aviso de Ceia em dia sem culto (*"Aviso, não trava — faça isso"*) e
registrar o requisito de fase 2: malha parametrizável (dia da semana + horário de início e fim,
repetição no mesmo dia, "1º sábado do mês") com vocabulário neutro, para a escala servir a
qualquer finalidade — porteiros de prédio, segurança.

**O aviso.** `diaTemCulto` já existia no domínio (nasceu para o guarda de continuidade); a tela só
não o usava ali. A data torta fica em ÂMBAR com o dia da semana escrito — *"⚠️ quinta — sem culto
na malha"* — porque é o dia da semana que denuncia o engano de digitação. Provado ao vivo nas duas
pontas: quinta 15/10 acusa, domingo 18/10 não, e as duas datas continuam na lista (aviso ≠ trava).

**A fase 2, medida antes de escrita.** A surpresa boa: o pedido dele já está QUASE todo no modelo —
`RegraMalha` tem `diaSemana`, duas regras no mesmo dia (é como domingo funciona), `somenteOcorrencia`
(o "1º sábado" é literalmente o ENSAIO em produção), `cadaNDias`, `rotulo`, `capacidade`. O que
falta mora em quatro pontos nomeados: horário real início/fim (hoje é tipo fixo MANHA/TARDE/NOITE),
tela para editar a malha (hoje `MALHA_ATUAL` é constante em código), evento avulso em data
específica, e vocabulário configurável (culto/ensaio/Santa Ceia). **Requisito sem mapa do que já
existe vira reimplementação do que já estava pronto** — por isso a §P4.w carrega a tabela.

**Como reverter.** `git revert` do commit desta entrada — o aviso some da tela; o registro de
fase 2 é documentação.

---

## DB-048 · 07/08/2026 — ele escolheu a rota B, e a escolha dele estava mais certa que o meu aviso

**O pedido:** *"Eu escolho o B porque está em uma das minhas rotas, que é o Charmway (…) não
haveria risco de banimento, porque são números específicos para bases específicas (…) avalie o seu
acesso a essa inteligência já desenvolvida."*

**Por que a decisão dele muda o cálculo.** Meu aviso da S-050 era sobre banir O NÚMERO DA IGREJA.
A ponte dele usa o número DEDICADO de disparo do Charmway — o mesmo modelo que as campanhas dele já
operam em produção, com teto por conta, blacklist e kill-switch. O raciocínio da recusa continua
certo para quem não tem essa infraestrutura; ele tem. Registrei as duas coisas, na ordem certa.

**O acesso, avaliado sem fingir:** a VPS está de pé e o padrão de worker+cron existe — mas a chave
SSH da fase 0 não está nesta máquina, e a senha root vive só no gerenciador dele (regra fixa: eu
nunca digito valor de credencial). Em vez de parar, **construí até a fronteira**: chave nova de
automação gerada aqui (`claude-escala-lembrete` — a PÚBLICA vai no runbook; a privada não sai de
`~/.ssh`), worker pronto e testado em dry-run com o dado real, runbook com os 3 passos que só ele
pode dar.

**As decisões de desenho que importam:**
1. **Grupo, não números individuais** — zero telefone pessoal no script, zero LGPD, e a mensagem
   chega onde a escala já é assunto;
2. **A fonte é a URL publicada** — o lembrete lê o que os irmãos veem; cópia paralela de escala é
   como nascem as divergências;
3. **Nenhum segredo no repositório** — a chave da Evolution continua onde já vive
   (`/opt/charmway-crm/.env` na VPS); o script a lê lá;
4. **Espelho versionado** (padrão da casa Charmway): a VPS não é repo; o arquivo aqui é a cópia de
   rebuild.

**Como reverter.** Apagar o cron e a pasta na VPS (ou criar o arquivo STOP, que desliga sem
desinstalar); `git revert` do commit desta entrada remove o espelho e o runbook.

---

## DB-049 · 08/08/2026 — a mudança de máquina pôs as réguas no banco dos réus, e quatro confessaram

**O pedido:** S-053 — *"Vamos trabalhá-las uma a uma, autonomamente, até o fim. No nosso padrão
ouro, Go."*

**O que a mudança de máquina revelou.** O gate sempre rodou na máquina de origem, e lá está verde.
Rodado num contêiner Linux mais lento, **sete validações ao vivo reprovaram — e nenhuma era defeito
do produto**. Eram as réguas, em quatro formas:

1. **Corrida de largada** (P2.16): `subirServidor` devolvia sem esperar a porta abrir. Na origem o
   vite ganhava a corrida sempre; aqui, `vivo:abas` e `vivo:caminho` levavam `ERR_CONNECTION_REFUSED`
   sobre um produto certo. A espera existia — copiada em parte dos consumidores. Desceu para a
   fonte única, com teto, acusação de servidor morto e derrubada no estouro.
2. **Órfão sem rede de segurança** (P2.16): a limpeza de emergência só existia para Windows — um
   vite órfão foi encontrado VIVO neste contêiner, prova de que a lacuna não era teórica. E o
   `vivo:seletor` nem usava a fonte única: nascera com o `spawn('npx'…, shell: true)` que o
   cabeçalho dela existe para denunciar. Migrado.
3. **Espera que confunde "estabilizou" com "acabou"** (P2.17): ~3,6 s para downloads múltiplos;
   máquina lenta = `0 arquivo(s)` com o produto certo. Agora espera-se o número PROMETIDO pelo
   botão, mantendo a sobra que flagra um arquivo a mais.
4. **Grupo LOCAL abrindo a URL PUBLICADA** (P2.18): `vivo:admin`, `vivo:celular` e
   `vivo:acessibilidade` mediam, dentro do gate, a árvore que JÁ ESTÁ no ar — "verde de outra
   árvore" por construção, e zero cobertura onde a rede é fechada. Os três agora servem o build
   local; a URL por argumento continua valendo para o pós-push.

**E a régua de foco acusou 19 inocentes** (P2.19): `outline: auto` É o anel do navegador, mas este
build do Chromium computa a largura dele como `0px`, e a fórmula exigia largura > 0. A prova veio
por PIXEL antes da correção: a captura do botão focado mostra o anel pintado. Depois: 47 de 47.

**O porquê que interessa:** régua que só roda numa máquina não mede o produto — mede a máquina.
Foi preciso mudar de máquina para as quatro confessarem, e é exatamente por isso que a
portabilidade (S-046) é regra padrão-ouro: cada ambiente novo é uma auditoria de graça.

**Como reverter.** `git revert` do commit desta entrada — os scripts voltam a depender da corrida
e da URL publicada; nenhum comportamento de produto muda.

---

## DB-050 · 08/08/2026 — a divulgação já tinha acontecido, e o registro mentia para o lado do medo

**O pedido:** S-054 — ele perguntou o que eram P0.2 e P1.1, *"porque o site já está em produção,
já foi divulgado, os irmãos já têm conhecimento, cada um através da sua escala, pelo site"*.

**A resposta mudou o BACKLOG, não o produto.** A pergunta dele expôs cinco registros vencidos —
a classe que este projeto já nomeou: *"registro que mente para o lado do medo custa igual: alguém
refaz trabalho pronto, ou desconfia de um portão que funciona"*. Um a um:

1. **P0.1 (aprovar o desenho)** — aberto no papel desde 04/08, pago pelo fato: ele dirigiu a
   construção solicitação a solicitação, gerou, publicou e divulgou. Fechado.
2. **P0.2 (as duas credenciais)** — metade paga com prova: os commits de dados de 06/08 22:07 têm
   autor dele **via API**, o que só existe com o `GITHUB_PAT` colado no navegador. A metade aberta
   (`ANTHROPIC_API_KEY_ESCALA`) é **opcional** — liga só o motor; nada trava sem ela.
3. **P1.1 (Santa Ceia errada no site antigo)** — a correção decidida era a divulgação do site novo
   antes de 16/08. Aconteceu, nas palavras dele. Risco residual declarado: quem guardou o link
   antigo ainda vê a data errada, e o site antigo fica como está por decisão (S-024).
4. **P1.3 (site antigo não mostra o passado)** — a condição de fechamento era literalmente
   "some quando o link novo for divulgado". Foi.
5. **P1.2 (distanciamento ausente no gerador antigo)** — com a divulgação, a escala consultada É a
   do projeto novo, onde a regra existe e é validada.

E no mesmo gesto, a linha P5.6 ("sem LICENSE e sem CI") perdeu a metade envelhecida: a licença
proprietária existe na raiz desde 06/08 (`b3ca016`).

**O porquê que interessa:** P0 e P1 ficaram **vazios de itens abertos** pela primeira vez — não
porque alguém trabalhou hoje, mas porque o registro finalmente alcançou a realidade. O contrário do
P7.7 (fechado sem ter sido feito) é igualmente caro, e agora as duas direções já têm exemplar
registrado neste diário.

**Como reverter.** `git revert` do commit desta entrada — os itens voltam a parecer abertos; nada
de comportamento muda.

---

## DB-051 · 08/08/2026 — o merge autorizado, e por que NO AR não tinha nada novo a medir

**O pedido:** S-055 — *"Go! Siga autônomo sem pedir autorização até o fim, com todos os passos."*

**As decisões deste fechamento, com o porquê:**

1. **Rebase, não merge commit** — a `main` deste projeto é uma história linear de commits S-0xx;
   um merge commit criaria o primeiro nó de costura sem informação nova. O rebase preservou os três
   commits com as mensagens (e SHAs novos: `ea2aff9`, `4075c8b`, `35d7519`).
2. **Mergeado sem re-rodar NO AR — e isso não é atalho.** Antes do merge, medido: o diff não toca
   `src/`, `public/`, `docs/dados/`, `docs/assets/` nem `docs/index.html`. O Pages passa a servir
   bytes idênticos aos de antes; logo, o veredito NO AR de 07/08 (17/17 · 8/8 · 0 divergências)
   continua sendo a medição válida do que está servido. A rede deste contêiner não alcança o site
   — e não precisou: não existia pergunta nova para a URL responder.
3. **Check-ins encerrados e branch realinhada** — o PR mergeado é desfecho final; o gatilho de
   1 hora foi apagado e a branch de trabalho renasceu da `main`.

**Como reverter.** `git revert` dos três commits na `main` (na ordem inversa) — as réguas voltam a
depender da máquina de origem; o site servido não muda em nada.

---

## DB-052 · 08/08/2026 — o loop em que o mapa valeu mais que a mão

**O pedido:** S-056 — go workflow completo em loop, padrão-ouro, ordem minha, mapeando todas as
ligações antes de mexer.

**O mapeamento mudou o plano duas vezes — e essa é a lição.** A fila que eu tinha desenhado era
"implementar P5.4, testar P5.7, medir P5.3". O mapa mostrou outra coisa:

1. **P5.4 já estava implementado desde 06/08** (`conferirEsquema`, ligado no `carregarDados`, com
   teste nas duas pontas). Se eu tivesse codado antes de mapear, teria REIMPLEMENTADO validação
   por cima de validação — o custo exato que o registro vencido cobra. Terceira ocorrência da
   classe; as três agora estão nomeadas no BACKLOG.
2. **P5.7 não era defeito de código** — os três casos-limite foram MEDIDOS por sonda e o gerador
   já fazia o certo em todos (D-03). O que faltava era a saída esperada ESCRITA e TRAVADA: agora
   uma regressão que troque recusa declarada por escala vazia silenciosa fica vermelha em 4 testes.
3. **P5.3 ficou meio-medido de propósito**: 228 bytes/turno e ~49 KB/ano são medição local; o teto
   da API exige a documentação, que a rede daqui não alcança — e teto citado de memória é chute
   vestido de fato.

**E a linha das credenciais:** o caminho que ele mandou (`D:\...\.credenciais.env`) está no PC
dele — fisicamente inalcançável da nuvem — e a regra é dele: §9.1, "nem com autorização". O loop
inteiro rodou sem precisar de credencial nenhuma, que é como deve ser.

**Como reverter.** `git revert` do commit desta entrada.

---

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
