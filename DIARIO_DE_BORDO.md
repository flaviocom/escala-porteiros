# DIÁRIO DE BORDO — escala-porteiros

> **Rastreabilidade total.** Cada entrada registra: **solicitação → pesquisa → decisão → porquê →
> como reverter.** Documento **append-only**, fatiado por período ao estourar o teto. **Nada é
> excluído, nunca.**
>
> **Cadeia de navegação:** [`ESTADO.md`](ESTADO.md) → [`handoff mais recente`](docs/handoff/HANDOFF_2026-08-06.md) → [`BACKLOG.md`](BACKLOG.md)
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

---

## DB-006 · 04/08/2026 — a ponta simétrica: o site novo contra o dado

**Solicitação:** [S-007](docs/solicitacoes/INDICE_DE_SOLICITACOES.md), continuação.
**Handoff:** [parte 5](docs/handoff/HANDOFF_2026-08-04-e.md).

### O que se perguntou

Conferir o passado contra o site antigo cobria metade. A outra metade: **o dado publicado chega
inteiro à tela do site novo?** A validação ao vivo provava que a tela renderizou e que 7 pontos
estavam certos — não que cada dia aparece com cada nome.

E a conferência do site antigo acabara de provar que uma suposição sobre renderização pode estar
inteiramente errada (ele não mostra o passado). Não havia razão para confiar nesta sem medir.

### O resultado

**131 dias · 543 escalações · 0 divergências.** Santa Ceia conferida pelos dois lados: o aviso
aparece e nenhum dos 16 irmãos está na tela. Os dois únicos dias sem gente são os dois de Santa
Ceia — 07/06 preservado no histórico (o que os irmãos viram) e 16/08 no bloco novo.

### Decisões

| # | Decisão | Por quê |
|---|---|---|
| 1 | Conferir os **131** dias, os dois blocos | amostra prova ausência de defeito sistemático, não ausência de defeito |
| 2 | Checar a Santa Ceia pelos **dois lados** | "ninguém escalado" e "o aviso aparece" são coisas diferentes, e só as duas juntas descrevem a tela certa |
| 3 | **Fora do GATE**, com nome no `package.json` | depende da rede; mas sem nome no manifesto, ninguém saberia que existe |

### Como reverter

Script de verificação: ninguém o chama, apagá-lo não muda comportamento — só perde a prova.
Os nomes no `package.json` são atalhos; removê-los não afeta o GATE.

---

## DB-007 · 04/08/2026 — mapear o grafo antes de mexer, e o que ele denunciou

**Solicitação:** [S-008](docs/solicitacoes/INDICE_DE_SOLICITACOES.md) — sexto "go".
**Handoff:** [parte 6](docs/handoff/HANDOFF_2026-08-04-f.md).

### O que se perguntou

O ensaio da parte 5 provou o domínio. Mas provar o domínio só vale se for **o domínio que a tela
usa** — e o site antigo tinha justamente lógica duplicada. Então: mapear o grafo de importações
inteiro **antes** de tocar em qualquer coisa.

A resposta foi boa: `Admin`, `AbaAjustar` e `ValidationView` importam do domínio, sem cópia
paralela. O ensaio prova o motor certo. Mas o mapa expôs outra coisa.

### Decisões

| # | Decisão | Por quê |
|---|---|---|
| 1 | `BROTHERS` contém **todos**, com `ativo` | filtrar por `ativo` é decisão de quem **escala**, não de quem **desenha** — e o domínio já filtra no lugar certo (regra D8) |
| 2 | Estatísticas **contam sempre** | o guard `if (counts[bId])` descartava turno em silêncio; contar sempre transforma dado estranho em linha visível |
| 3 | Quem saiu aparece **marcado**, por último | some-lo apaga o passado; escondê-lo confunde com quem escala hoje |
| 4 | Frente **"camada de tela"** na auditoria | teste de unidade cobre a raiz, não os consumidores: um `.filter(ativo)` de volta no componente deixaria o GATE verde |

### O achado

`definirPessoas` filtrava `.filter((p) => p.ativo)` — recriando na tela o órfão que
`dominio/tipos.ts` proíbe em letra maiúscula, **três camadas acima de onde a regra foi escrita**.

Medido ao vivo com o Carlos Henrique (36 turnos no passado) desativado: o código anterior mostrava
o **id cru**, não achava nada na busca, e **sumia com os 36 turnos das estatísticas** — com o
console **limpo**. Ausência de erro não é ausência de defeito.

### O erro no meio do conserto

A checagem nova acusou o **próprio comentário** que documenta o defeito. Régua que lê texto sobre
código como código — mesma família de `SANTA CEIA` reprovado por conter "IA". Corrigida tirando
comentários antes de medir, com `(?<!:)` para não engolir o `//` de URL.

### Como reverter

Três arquivos (`types/scheduler.ts`, `App.tsx`, `components/StatsView.tsx`) e um commit. Reverter
devolve o defeito: quem sair do elenco perde o passado na tela.

---

## DB-008 · 04/08/2026 — a imagem do WhatsApp virou documento, não captura de tela

**Solicitação:** [S-009](docs/solicitacoes/INDICE_DE_SOLICITACOES.md) — uma imagem de referência,
sem mais instrução. **Handoff:** [parte 7](docs/handoff/HANDOFF_2026-08-04-g.md).

### O que se descobriu ao abrir o código

A exportação **fotografava a tela** — e fatiava a lista em **5 dias** a partir de hoje. Numa escala
de cinco meses, a imagem saía com cinco dias, e o alerta de erro pedia *"filtre um período menor"*.
**É por isso que existe um arquivo de referência feito por fora**: o produto nunca conseguiu gerar
aquilo.

### Decisões

| # | Decisão | Por quê |
|---|---|---|
| 1 | Layout **próprio**, não captura | documento não se faz fotografando site; e a imagem tem de ser igual em qualquer aparelho |
| 2 | **Estilos em linha** | o CSS do aplicativo (incluindo `is-exporting`) não pode alcançar a imagem — foi esse acoplamento que a fez envelhecer junto com a tela |
| 3 | Filtro extraído para `dados/filtrar.ts` | tela e imagem passam a usar **a mesma** regra; duas cópias divergem em silêncio |
| 4 | Corte de 5 dias **removido** | existia porque a tela não aguentava a captura, não porque o formato pedisse |
| 5 | Testar a **lógica**, não o pixel | agrupamento por dia, ordem dos turnos e contagem são o que erra sem aparecer numa imagem bonita |

### Duas correções que a comparação expôs

**A Santa Ceia não estava na legenda** — a cor mais chamativa da imagem era a única sem explicação.
**E a contagem a somava como turno**: dizia "19 turnos" incluindo um dia sem porteiros. Virou
`18 turnos · 1 Santa Ceia`.

### Diferença esperada em relação à referência

O **16/08 sai como SANTA CEIA sem porteiros**; a referência do Flavio, anterior à correção, traz seis
irmãos escalados. É diferença de **dado**, não de forma — e é o defeito que originou o projeto.

### Como reverter

Quatro arquivos novos e um reescrito, num commit. Reverter devolve a captura de tela com corte de
5 dias.

---

## DB-009 · 04/08/2026 — duas falhas silenciosas no mesmo passo

**Solicitação:** [S-009](docs/solicitacoes/INDICE_DE_SOLICITACOES.md), continuação.
**Handoff:** [parte 7](docs/handoff/HANDOFF_2026-08-04-g.md).

### 1. Tirei uma trava sem testar o caso que a justificava

Removi o corte de 5 dias da exportação e **não gerei o período inteiro**. O portão recém-escrito
mediu: **969 × 16384**. Os navegadores cortam o canvas em 16384px e, para caber, encolhem a largura
— o PNG sai truncado e distorcido, **sem erro**. Troquei uma falha declarada por uma silenciosa.

**Correção:** uma imagem por **mês** — que é como a escala é usada, não remendo. Mais duas travas:
altura acima do teto vira erro com a razão escrita, e a largura do PNG é conferida **depois** de
gerado. *Conferir o que saiu, não o que foi pedido.*

### 2. Validei "ao vivo" a versão anterior

25 segundos após o push, o Pages ainda servia o pacote antigo. Tela abriu, nomes apareceram, console
limpo — e eu quase reportei o comportamento velho como novo. Só apareceu porque o **nome do arquivo
baixado** era o do formato anterior.

**Correção:** `npm run vivo` compara o `index-*.js` do HTML publicado com o de `docs/assets` antes de
qualquer outra checagem. Provado com divergência injetada.

### A regra que as duas compartilham

> **Toda trava que eu remover exige rodar o caso que a motivou. E "esperar um pouco" nunca é
> verificação — comparar é.**

---

## DB-010 · 04/08/2026 — "deixa o token embutido" e o cofre portátil

**Solicitação:** [S-010](docs/solicitacoes/INDICE_DE_SOLICITACOES.md).
**Handoff:** [parte 7](docs/handoff/HANDOFF_2026-08-04-g.md).

### O pedido, e por que não foi atendido como veio

*"Deixa esse token embutido, eu só coloco a senha."* O repositório **é público** — conferido, não
presumido. Embutir significa publicar o token para todo visitante **e** ter o GitHub revogando-o
automaticamente, o que quebraria o botão Publicar sozinho, repetidamente. Cifrar não salva: o texto
cifrado ficaria público e atacável offline.

### O que ele queria de verdade

*"Só a senha"* — legítimo. O obstáculo real era o cofre ser **por navegador**: cada aparelho pedia o
token de novo.

### Decisões

| # | Decisão | Por quê |
|---|---|---|
| 1 | **Não** embutir | fato técnico, não preferência: repositório público + revogação automática |
| 2 | Transportar o cofre **cifrado** | pode ir por qualquer canal; a senha viaja na cabeça dele, o único canal sem cópia |
| 3 | Recusar código truncado **antes** de gravar | instalar cofre quebrado trocaria "cole de novo" por "senha incorreta" eterno |
| 4 | Declarar `github.com` no inventário | o portão reprovou antes do commit — e é o único host da lista que **não busca dado** |

### O que quase me pegou

O inventário de fontes é **gerado** a partir de uma constante no script. Editei o markdown à mão e o
portão continuou vermelho — corretamente: a próxima geração desfaria a edição. **A fonte de verdade
não era o documento.**

### Como reverter

`exportarCofre`/`importarCofre` em `cofre.ts` e dois componentes na tela. Remover não afeta quem já
está configurado.

---

## DB-011 · 04/08/2026 — o encavalamento que não estava no DOM

**Solicitação:** [S-011](docs/solicitacoes/INDICE_DE_SOLICITACOES.md).
**Handoff:** [parte 8](docs/handoff/HANDOFF_2026-08-04-h.md).

### O que a medição desmentiu

O Flavio mandou a captura de novembro com os nomes sobrepostos. A hipótese óbvia era "a quebra de
linha está errada". Medi antes de mexer:

```
 linha MANHÃ  topo 266  fundo 351
 linha NOITE  topo 351  fundo 439      ← encosta, não sobrepõe
```

**No DOM não há sobreposição.** Ela existe só na **imagem**: a captura reproduz o layout num clone,
e ali o ponto de quebra do `flex-wrap` diverge do original.

### Decisões

| # | Decisão | Por quê |
|---|---|---|
| 1 | **Eliminar** a quebra, não ajustá-la | ajustar o ponto de quebra trataria o sintoma e reabriria com qualquer nome mais longo; coluna fixa não tem ponto de decisão para o clone discordar |
| 2 | Uma contagem de colunas para a imagem inteira | é o que alinha os nomes de um cartão para o outro, não só dentro da linha |
| 3 | Seletor **só quando há escolha** | um mês em vista é o caso comum; ele não paga o preço da pergunta |
| 4 | `<dialog>` nativo | a barra lateral tem rolagem própria e recortaria um painel absoluto; e vêm foco preso, `Esc` e fundo inerte de graça |
| 5 | O botão diz **quantos arquivos** saem | a surpresa de download era o defeito, não o número de meses |

### O erro na régua do teste

`getByRole('button', { name: /Gerar/i })` casou com o botão de **fechar** — `title="Fechar sem
gerar"`, e o nome acessível cai no `title` quando não há texto. Rótulo vazio, clique errado, produto
certo. **Nome acessível não é texto visível.**

### Como reverter

`SeletorDeMeses.tsx` e a grade em `EscalaImagem.tsx`. Reverter devolve o encavalamento na imagem e
os dez downloads de uma vez.
## 04/08/2026 · parte 8 — a auditoria independente, e o que ela derrubou

**Solicitação:** *"go"*.

**Decisão de escopo:** o `BACKLOG.md` tinha um único item autônomo em aberto — **P2.10**, a auditoria
independente, marcada com a ressalva de que quem auditou tinha escrito o código. Foi por ela que o
turno começou.

### Por que seis auditores, e não um

Frentes **disjuntas** e instrução **adversarial**: achar defeito, não confirmar. Cada um obrigado a
citar `arquivo:linha` **e** provar com comando e saída real — ler código e raciocinar não contava.
Resultado: **20 achados**, nenhum deles visto pela auditoria automatizada que roda 20 checagens todo
dia. Dois auditores, em frentes diferentes, chegaram sozinhos ao mesmo defeito de raiz (o vite
órfão) — convergência independente é o sinal mais forte que este método consegue produzir.

### As decisões que exigiram julgamento, não conserto

**1. `Contexto` ganhou `config` como campo OBRIGATÓRIO.** Opcional seria mais barato e teria deixado
D9 cega em qualquer chamador que esquecesse. Obrigatório fez o compilador listar os treze chamadores
um a um. Nos scripts `.mjs`, que ele não alcança, as regras **falham fechadas**: sem configuração,
reprovam. *Reverter:* tornar o campo opcional devolve a cegueira silenciosa.

**2. A fronteira do passado.** Assim que D9 e D11 passaram a existir, a **escala publicada reprovou**
— o bloco histórico traz 07/06/2026 marcada como Santa Ceia, que é a data errada do site antigo,
congelada de propósito porque é o que os irmãos viram. Cobrar do passado o calendário de hoje é pedir
para reescrevê-lo, e essa é a primeira regra que o projeto não viola.

Decisão: **o sistema responde pelo que ele gera**; do passado importado cobra só o que continua
valendo (nenhum turno de Santa Ceia com gente, e não estar vazio). A fronteira **aparece na medida da
regra**, e há teste provando que não virou porta dos fundos — o mesmo bloco, com gente escalada,
reprova mesmo importado. *Reverter:* tirar `congelado(ctx)` volta a reprovar a escala no ar.

**3. `est.formacoes` foi REMOVIDO, não ligado.** O comentário prometia "variar a companhia" e o campo
nunca era lido. Ligá-lo mudaria a escala já publicada, e escala publicada não se reescreve por conta
própria. Q4 mede a repetição e avisa; o gerador não a persegue, e isso agora está **declarado** em
vez de subentendido. *Reverter:* é item de backlog com nova geração e nova publicação.

**4. Dois portões novos, em vez de oito correções.** Havia oito lugares dizendo "15 regras" e um
ponteiro de handoff apontando para a parte 4 de 7. Corrigir à mão resolveria hoje e quebraria na
próxima regra e no próximo handoff — este mesmo, aliás. Viraram `npm run contagem` e `npm run cadeia`,
os dois com autoteste das duas pontas, os dois isentando documento append-only (reescrever handoff
seria falsificar histórico). *Reverter:* tirar os dois passos do `gate` no `package.json`.

**5. A defesa contra o servidor fantasma é RECUSAR-SE A COMEÇAR.** Matar a árvore de processos resolve
o vazamento, mas se um órfão sobrar por outro motivo — outra sessão, um Ctrl+C — o script novo ainda
falaria com ele. Por isso a porta é conferida **antes** de subir, e ocupada o script para dizendo o
PID. *Reverter:* `scripts/lib/servidor-de-teste.mjs`; os três chamadores voltariam ao `spawn` direto.

### Uma alegação que o código não sustentava

O piso é buscado por escolha gulosa **sem retrocesso**, e o docstring dizia "o maior que a escala
aceitou". É *o maior que esta busca conseguiu*. Medido: o piso 7 falha em 03/10/2026 e inverter o
desempate daquele dia não destrava — evidência de que 6 está perto do limite real. Evidência, não
prova. O texto foi corrigido; a busca, não. Trocá-la por uma com retrocesso é P4.9.

---

## DB-012 · 04/08/2026 — entregar um caminho não é o mesmo que explicá-lo

**Solicitação:** [S-012](docs/solicitacoes/INDICE_DE_SOLICITACOES.md).
**Handoff:** [parte 10](docs/handoff/HANDOFF_2026-08-04-j.md).

### O diagnóstico dele, que estava certo

*"Não houve uma maneira concreta de preparar o login."* Eu tinha explicado quatro opções, recomendado
uma, e deixado um `.cmd` na Área de Trabalho. Nenhuma das três coisas é preparar o caminho:

- o guia morava **longe de onde a pergunta aparece**;
- o `.cmd` **nunca foi rodado por mim** — artefato não verificado entregue como caminho pronto;
- e a mensagem de recusa **não dizia o que consertar**, que é onde a pessoa desiste.

### Decisões

| # | Decisão | Por quê |
|---|---|---|
| 1 | O guia vai **para dentro da tela** | quem trava, trava no primeiro acesso; instrução noutro lugar não é lida |
| 2 | **Uma fonte só** (`COMO_CRIAR_O_TOKEN`) para o que a tela manda e o que o código exige | guia que envelhece separado do verificador vira instrução errada com cara de certa — e há teste provando que não divergem |
| 3 | Cada recusa **nomeia o campo** | 404 num token fine-grained é *repositório não marcado*, não erro de digitação. Quem lê o código HTTP procura no lugar errado |
| 4 | O `.cmd` só **abre a tela** | duas versões da mesma instrução divergem; uma delas fica errada e ninguém percebe |

### A lição

**Explicar opções não é preparar o caminho.** O trabalho não termina quando a alternativa existe no
código — termina quando a pessoa consegue percorrê-la sozinha, do ponto em que está travada.

### Como reverter

`COMO_CRIAR_O_TOKEN` e `ComoCriarOToken` são aditivos: remover devolve as mensagens genéricas e tira
o guia da tela.

---

## 05/08/2026 — entrar na administração: a senha que protegia o vazio

**Solicitação:** *"Eu não consigo logar porque pede token do GitHub. Eu não tenho token. Quais são
as opções para eu entrar sem digitar token?"* — e, depois, *"entrou uma vez, fica liberado?"*

### A decisão que exigiu julgamento

O token já era opcional. O reflexo seria responder "é só deixar o campo vazio" e encerrar. Mas o
incômodo dele apontava para outra coisa: **a tela ainda exigia SENHA**.

A senha existe por um motivo só — cifrar o token no `localStorage`. Sem token e sem chave do motor,
o cofre é um objeto vazio. A tela pedia oito caracteres para proteger nada, e nem sigilo comprava: o
repositório é público. Quem só queria olhar a escala pagava pedágio inventado.

**Decisão:** a proteção passa a ser proporcional ao que existe para proteger. Sem segredo, sem
senha, sem cofre. *Reverter:* devolver a validação incondicional de senha em `criar()`.

### A decisão que eu quase errei

Ele pediu para "ficar liberado". O caminho fácil seria guardar o token **em claro** no
`localStorage` e não pedir nada. Recusei: qualquer um que abrisse o navegador dele publicaria na
escala da congregação.

A saída certa era o **gerenciador de senhas do navegador** — o campo não tinha `name` nem
`autocomplete`, e por isso o Chrome nunca se ofereceu para lembrar. O token continua cifrado; quem
lembra a senha é o navegador, que faz isso melhor do que qualquer coisa que este site inventasse.
*Reverter:* tirar os atributos dos três campos de senha.

### O erro de comunicação que custou confiança

Ele perguntou se os projetos tinham sido misturados, e depois lembrou que eu havia reportado erro na
escala. Os dois vinham da mesma falha minha: **relatei "a escala está com erro" sem dizer QUAL
site**. O defeito é no antigo; o novo estava certo o tempo todo (131/131 dias, 543 nomes, 0
divergências, conferido ao vivo).

Nome do sistema junto com o defeito, sempre. Sem isso, um relatório correto vira alarme falso sobre
o produto errado.

### E a régua do portão nasceu errada

`input[type="password"]` contava também o campo do token e o da chave do motor — o portão acusou
"2 campos de senha" numa tela sem nenhum. Passou a medir pelo **rótulo**. Um portão que reprova o
produto por defeito da própria régua é o mais convincente dos mentirosos: o vermelho parece achado.

---

## 05/08/2026 (b) — o projeto virou produto, e a auditoria virou tela

**Solicitações:** S-015 a S-020.

### A decisão que reordena tudo o que vem depois

*"É uma escala genérica, configurável, com intenção de comercialização. Coloque como regra máxima do
escopo."* Entrou como **§0 do `AGENTS.md`**, antes da descrição do projeto — porque toda decisão
posterior passa por ela. A congregação virou o primeiro cliente, não o escopo.

Consequência imediata e concreta: `capacidadePadrao` existia no dado e só mudava editando
`config.json` à mão. Com administrador técnico ao lado, passava. **Num produto vendido, recurso sem
tela não existe** — existe como dívida. Virou campo, e `config.json` passou a ser publicado.

*Reverter:* apagar o §0 devolve o projeto ao escopo de uma congregação só.

### O furo, e por que a resposta tem duas metades

Ele tirou o Thiago da escala e o sistema seguiu acusando "0 de 2", cinco meses. Nove regras
percorriam **todo mundo cadastrado** em vez de quem está nesta escala.

Mas a pergunta que ele fez junto — *"pode o sistema GERAR escala contando quem está de fora?"* —
tem resposta diferente: **não**, e é medida (`gerador.ts:133`). Responder só "achei o bug, corrigi"
teria deixado ele achando que a escala publicada podia estar contaminada. **O relatório mentia sobre
uma escala correta**, e essa distinção é a informação que ele precisava.

*Reverter:* trocar `pessoasDoBloco(ctx)` de volta por `ctx.pessoas` nas nove regras.

### A segunda régua, e o que ela NÃO promete

A dor dele era maker–checker: *"auditoria de outro agente que não o mesmo que criou"*. Num site
estático não existe "outro agente" — mas existe **outra implementação**. `conferencia-independente.ts`
não importa uma linha de `regras.ts` e confere pelo ângulo oposto: linha do tempo por pessoa, em vez
de catálogo sobre turnos.

**A decisão difícil foi não vender isso como resolvido.** Seria fácil chamar a aba de "auditoria
independente" e riscar o item do backlog. Mas as duas réguas têm o mesmo autor, e o método do Flavio
é explícito de que isso não basta. A tela **declara o limite** e o item continua aberto. Escrever
garantia junto com a intenção é o ERRO 3 do catálogo, e é o erro mais fácil de cometer justamente
quando o trabalho ficou bom.

*Reverter:* apagar o módulo e a aba; nada mais depende deles.

### O que eu não tinha testado, e ele perguntou

*"Você testou o publicar num ambiente de teste?"* — **não**. O caminho mais consequente do produto
era o único sem teste, porque testá-lo de verdade escreveria no repositório real. Virou um GitHub de
mentira, com o código de produção intacto. E provei com infrator injetado, porque 10 verdes não
distinguem teste bom de teste frouxo.

---

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
