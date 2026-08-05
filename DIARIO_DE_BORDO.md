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
