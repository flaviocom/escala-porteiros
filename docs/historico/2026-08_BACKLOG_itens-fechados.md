# Fatia do histórico — itens do BACKLOG fechados em agosto/2026 (P1.4 a P1.7)

> **Imutável.** Rotacionado do `BACKLOG.md` em 07/08/2026, quando o documento vivo estourou o teto
> de 40 KB. O contrato do BACKLOG sempre disse: *"item concluído sai daqui e vira registro no
> histórico"* — estes quatro saíram com a prova junto.
> **Voltar:** [`índice do histórico`](INDICE.md) · [`BACKLOG.md`](../../BACKLOG.md)

### P1.4 ✅ Sete achados da sétima auditoria — FECHADOS em 06/08/2026 🤖
Todos medidos antes de mexer, corrigidos na causa, e ancorados em teste que morre se alguém voltar
atrás.

| # | Achado | Como ficou |
|---|---|---|
| 1 | "Até" antes de "De" dizia *"não há dia de culto — escolha um período mais longo"* | guarda de ORDEM antes de montar a grade; a mensagem nomeia as duas datas · `vivo:gerar` |
| 2 | Geração recusada deixava a proposta velha na tela, no `Ajustar` e no `Publicar` | `aoGerar(null, '')` subiu para o TOPO de `executar()`, antes das quatro recusas · 6 checagens novas |
| 3 | Seletor de meses dizia 19, imagem dizia 18 | o seletor passou a usar **a régua da imagem**; Santa Ceia aparece ao lado, nunca somada |
| 4 | *"veio do motor e passou no portão"* sobrevivia a um ajuste à mão | terceiro ramo para `origem === 'manual'`; a conferência **de fato** reroda, e agora a frase diz isso |
| 5 | `candidatosBarrados` escrito e nunca lido | virou TELA: quem foi barrado e por quê, agrupado por pessoa, dentro da mensagem de falha |
| 6 | Piso declarado podia ser menor que o entregue (1 em 20 casos medidos) | `pisoEntregue()` — **derivado, nada gravado**; a tela mostra *"5 (entregue: 6)"* só quando difere |
| 7 | Mensagem de ano com 5 dígitos não descrevia o que aconteceu | guarda de FORMATO com `ehDataValida`; a mensagem diz "o ano tem quatro dígitos" |

⚠️ **`pisoAlcancado` continua sendo a EXIGÊNCIA, não a medição** — é ele que volta ao gerador no
portão `refazer` e que a D10 usa. Trocar o significado quebraria a reprodutibilidade de tudo o que
já foi publicado.

Detalhe em [`HANDOFF_2026-08-06.md`](docs/handoff/HANDOFF_2026-08-06.md) § 6.

### P1.5 ✅ Três fronteiras de portão — TODAS FECHADAS em 06/08/2026 🤖
Eram limites que os próprios portões **admitiam** ter. Ao medir cada um, **dois se revelaram pior
do que a declaração dizia e um, melhor** — e a declaração errada é defeito por si: quem lê
desconfia de um portão que funciona, ou escreve outro em cima.

- ~~o portão `auditoria` exercita a denominação em 1 de 5 superfícies~~ — **FECHADO**, 06/08/2026.
  Ela injetava **1 termo em 1 extensão**; o portão procura **12 termos em 3 extensões**. Agora varre
  as **36 combinações**, com a lista de termos **lida do próprio portão** (copiá-la apodreceria).
  🔴 **E a matriz achou um buraco de verdade:** o extrator usava **lista de permissão de nomes de
  campo**, e `explicacao:` não estava nela — são **18 campos `explicacao:` em `regras.ts`**, todos
  na tela da conferência, e o portão aprovava *"Feito por inteligência artificial"* ali sem piscar.
  O critério virou a FORMA do valor (prosa: tem espaço e minúscula), não o nome do campo.
  A isenção que sobra — prosa em constante solta — é **medida a cada auditoria** e hoje vale zero;
- ~~o `ensaio` passa com metade dos turnos~~ — **FECHADO, e a declaração estava ERRADA** (06/08/2026).
  Medido com um mutante que jogava fora metade dos turnos: o ensaio **reprovou** — 4 promessas caíram,
  EXIT=1. Mas **5 das 11 passaram intactas**: as quatro famílias de restrição e o distanciamento. São
  propriedades do tipo *"nada fora do permitido"*, e meia escala também não tem nada fora do permitido —
  **propriedade negativa não mede ausência.** Quem segurava a barra eram as regras do catálogo, e
  depender de outro portão é ficar cego no dia em que ele mudar de escopo. O ensaio ganhou **duas
  promessas próprias de cobertura**, provadas nas duas pontas.
  ⚠️ **Fronteira declarada errada é defeito por si**: quem lesse desconfiaria de um portão que
  funciona, ou escreveria outro em cima;
- ~~o `generico` não varre `docs/*.md`~~ — **FECHADO**, 06/08/2026. A declaração estava certa pelo
  motivo errado: ninguém tinha medido o que havia lá. São **12 citações em 7 arquivos, todas
  legítimas** — e proibir seria errado, porque apagaria a documentação de quem o produto atende.
  Nasceu o passo 14 (`generico:docs`): **inventário fechado**, que reprova citação a mais, arquivo
  novo fora do inventário **e citação a menos**. Ele já nasceu achando quatro que um `grep` à mão
  tinha deixado passar.

### P1.6 ✅ "Não gostei — gerar outra combinação" devolvia sempre a mesma — FECHADO em 06/08/2026 🤖
Palavra dele: *"mesmo clicando várias vezes, não muda nada; é uma farsa."* Medido: quatro cliques na
tela → a mesma escala; oito sementes-base no domínio → **uma** escala entre as oito.

A semente **funcionava** e as oito versões saíam **distintas**. A **cascata** é que escolhia sempre a
versão gulosa — a única que não usa semente nenhuma. Havia dois testes verdes cobrindo as peças, e
ambos estão certos: **o defeito morava na junção**, que só existe inteira na tela.

Agora o clique manda junto a escala recusada, e ela sai da disputa — **piso 4 antes e depois**, sem
custo de qualidade. Quando não houver mesmo outra escala válida, a tela diz isso em vez de fingir que
sorteou. Portão novo `vivo:outra` (4 cliques na tela) + 3 testes, **provados nas duas pontas** com
mutante injetado.

⚠️ Dois defeitos do instrumento, não do produto, registrados porque custaram mais que a correção: o
portão nasceu vermelho lendo só o cabeçalho do cartão (**quarta sonda da sessão a medir o próprio
rastro** — daí o `aria-labelledby` no `Cartao`), e os três testes inseridos por script **não chegaram
ao arquivo**, com o script imprimindo sucesso. Regra: **depois de escrever por script, confira o
arquivo, nunca a mensagem do script.**

### P1.7 ✅ Varredura de TODAS as variações de campos + auditoria das duas réguas — 07/08/2026 🤖
Pedido do dono: *"Corrija o motor que gera a escala com todas as variações de campos. Valide,
corrija e audite também o Validador independente."* Pesquisa delegada ao Gemini
([registro auditado](docs/superpowers/specs/PESQUISA_2026-08-07-metodos-rostering.md)) + varredura
matricial + 150 elencos forjados por semente. **Três defeitos reais achados e corrigidos**, cada um
provado com mutante nas duas pontas:

- 🔴 **ausência INVERTIDA (fim < início) era ignorada em silêncio — pelas DUAS réguas.** A pessoa
  era escalada dentro da própria viagem, e gerador e conferência cegavam juntos (a classe exata de
  "erro igual dos dois lados sai como conferido"). Agora o intervalo torto vale como ausência, com
  normalização INDEPENDENTE em cada régua;
- 🔴 **grade vazia saía como sucesso**: período invertido ou sem dia de culto devolvia `ok: true`
  com escala vazia — meia escala com cara de sucesso. Agora declara a falha, nomeando o motivo;
- 🔴 **a 2ª régua podia parar de conferir `diasProibidos` e `turnosPermitidos`** e as 28 verdes dela
  continuavam verdes — promessa com teste não é campo com teste. Infratores injetados fecham os dois.

**Busca local pós-GRASP: medida e RECUSADA** — 0 trocas melhoradoras nos dados reais (ótimo local;
Jain 0,9965 é o máximo aritmético). A prova é re-rodável: `npm run experimento:busca-local`
(`scripts/experimento-busca-local.mjs`) — se o elenco/malha mudarem de forma e ele achar troca, a
recusa perde a prova e a decisão reabre.


---

## Quinta e sexta auditorias

> Rotacionado de `BACKLOG.md` em 03/11/2026 (o arquivo vivo passou de 40 KB). Texto original, sem edição além dos caminhos relativos.

### Sexta auditoria externa — 05/08/2026, **25 achados, 0 abertos**

Três frentes disjuntas: o código que nasceu hoje · o dado publicado até o pixel · os portões medem o
que dizem. Detalhe em [`HANDOFF_2026-08-06.md`](../handoff/HANDOFF_2026-08-06.md) e no
`DIARIO_DE_BORDO.md` (DB-022 a DB-025). Ficam aqui os que alguém precisa saber que existiram:

| # | Item | Estado |
|---|---|---|
| P6.1 | 🔒 **O gate foi verde sobre OUTRA árvore.** Um `git add -A` capturou o mutante de um auditor; `3f8e366` está na história com `mesDe` devolvendo o ano, e a mensagem afirma `EXIT_GATE=0` | ✅ **FECHADO** — produção nunca recebeu (o commit não tocou `docs/assets/`). O commit **não é reescrito**; o 24º passo do gate é o selo da árvore, provado nas duas pontas |
| P6.2 | 🔴 **Reverter e publicar em seguida DESFAZIA a reversão** — a correção da manhã mexeu no retrato, e o que sobe no arquivo é outro estado. Com `config.json`, a publicação seguinte republicava a configuração antiga **ativamente** | ✅ **FECHADO** — `aoReverter` sincroniza o estado editável, e é separado de `aoGravar` de propósito (falha parcial não pode apagar edição não publicada) |
| P6.3 | 🔴 **O gate não executava uma linha de `Admin.tsx`.** Desligar a trava de data retroativa ou o guarda dos 73 turnos passava nos 20 passos | ✅ **FECHADO** — as duas decisões desceram para o domínio, com 9 testes. ⚠️ Declarado aberto: outras decisões seguem na tela, mas nenhuma decide o que vai ao ar |
| P6.4 | 🔴 **Oito fronteiras de portão** — nenhum contava errado; todos mediam menos do que a frase prometia | ✅ **FECHADO** — e os dois padrões novos ganharam a régua que separa **afirmação de narrativa** (artigo definido; número entre aspas é citação) |

### Quinta auditoria externa — 05/08/2026, **21 achados, 0 abertos**

Detalhe e medição em [`HANDOFF_2026-08-06.md`](../handoff/HANDOFF_2026-08-06.md) e no
`DIARIO_DE_BORDO.md` (DB-018 a DB-021). Ficam aqui os três vermelhos, porque são os que alguém
precisa saber que existiram para não recriá-los:

| # | Item | Onde | Estado |
|---|---|---|---|
| P5.8 | 🔴 **Publicar 2× na mesma sessão apagava a 1ª publicação.** O retrato dos dados era congelado no closure; a 2ª montagem usava o de antes da 1ª. **55 turnos medidos.** E o guarda do passado aprovava, porque recebia o mesmo argumento envelhecido | `src/dados/carregar.ts` (`retratoPublicado`), `src/admin/Admin.tsx` (`setDados`) | ✅ **FECHADO 05/08** — provado no dado real, antes e depois. ⚠️ recarregar da rede foi RECUSADO: o Pages leva 1 min e traria o dado antigo de volta |
| P5.9 | 🔴 **`capacidade: 0` gerava 110 turnos com zero pessoas, e as DUAS réguas aprovavam.** D1 conta `0===0` como completo; D11 compara a grade com ela mesma; Q2 vê amplitude zero | `src/dominio/regras.ts` (`D12`), `conferencia-independente.ts` (promessa 0) | ✅ **FECHADO 05/08** — nasceu **D12**. ⚠️ ela nasceu com o defeito que existe para fechar (`slice` nos turnos, não nas violações); pego pela medição no dado real |
| P5.10 | 🔴 **A ponte dado→tela não tinha um único teste.** 4 mutantes que apagam a escala de todos os irmãos passavam em 232/232 | `src/dados/ponte-para-a-tela.test.ts` | ✅ **FECHADO 05/08** — 20 testes novos, um campo por vez, com valor absoluto |
