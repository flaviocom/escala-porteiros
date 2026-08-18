# Histórico do ESTADO — agosto de 2026

> **Regime referência** (subpasta, teto 800 linhas / 100 KB — lido sob demanda, não toda sessão).
> Nasceu em 18/08/2026 quando `ESTADO.md` estourou o teto do regime "vivo" (400 linhas/40 KB) — a
> rotação manda **dividir por assunto**: aqui fica o narrativo mais antigo (04/08 a 08/08), lá fica
> só o estado atual. Nada foi excluído; é o mesmo texto, movido.
>
> **Cadeia de navegação:** [`ESTADO.md`](../ESTADO.md) → [`handoff mais recente`](handoff/INDICE.md) → [`BACKLOG.md`](../BACKLOG.md)
> **Roteador do projeto:** [`AGENTS.md`](../AGENTS.md) · **Histórico append-only (diferente disto):** [`historico/INDICE.md`](historico/INDICE.md)
>
> ⚠️ Diferente de `docs/historico/` (append-only, imutável): este documento é **referência viva** —
> se algo aqui se mostrar errado, corrige-se aqui mesmo, como qualquer outro documento de referência.

---

## O anterior: o gate ficou portátil — verde fora da máquina de origem (08/08)

A sessão de 07/08 se perdeu numa atualização do aplicativo e a retomada saiu **dos registros**
(nada se perdeu). O gate, rodado pela primeira vez noutra máquina, reprovou 7 validações ao vivo —
**nenhuma era defeito do produto**: eram as réguas (corrida de largada do servidor de teste, espera
curta para downloads, grupo LOCAL abrindo a URL publicada, e a régua de foco reprovando o anel
`outline: auto` — 19 inocentes, prova por pixel). Corrigidas: **15 de 15 verdes**. ⚠️ A chave do
lembrete de WhatsApp **perdeu o par privado** com o contêiner da sessão perdida — aviso no runbook;
a nova nasce no "go" da instalação. E, à tarde, a informação dele fechou **cinco registros
vencidos** de uma vez: a divulgação do site já tinha acontecido, e P0/P1 zeraram ([DB-050](../DIARIO_DE_BORDO.md)).
Detalhe: [`HANDOFF_2026-08-08.md`](handoff/HANDOFF_2026-08-08.md) · [DB-049](../DIARIO_DE_BORDO.md).

## O anterior: veredito medido — a escala no ar PODE SER DIVULGADA (07/08, manhã)

Pedido dele: *"me diga se a escala publicada está correta em todas as validações, citando a
quantidade — e se o validador independente chegou ao mesmo veredito."* Medido pela URL, não pelo
disco (`npm run vivo:veredito`): **1ª régua 17/17, 0 falhas duras** (1 aviso Q4, qualidade);
**2ª régua 8/8 promessas, 258 escalações conferidas uma a uma**; **auditor do site 0 divergências**
contra a tela pública. Piso 4 declarado = real. Equilíbrio 18–19, diferença 1. Williams dentro do
teto em todos os meses. **As três réguas concordam: pode divulgar.**

No mesmo dia, a **pesquisa mundial de métodos** (registro auditado em
[`PESQUISA_2026-08-07-metodos-rostering.md`](superpowers/specs/PESQUISA_2026-08-07-metodos-rostering.md))
confirmou o GRASP e teve a recomendação central **medida e recusada** — busca local: 0 trocas nos
dados reais; prova re-rodável em `npm run experimento:busca-local`. E a varredura de variações
fechou **três defeitos com mutante nas duas pontas** — o pior: as duas réguas cegas para a MESMA
ausência invertida (pessoa escalada dentro da própria viagem, tudo verde). Detalhe:
[`HANDOFF_2026-08-07.md`](handoff/HANDOFF_2026-08-07.md) · [DB-042 a DB-044](../DIARIO_DE_BORDO.md).

## Ele publicou, e foi conferido por fora (07/08, madrugada)

O dono publicou pela tela e pediu para conferir. Medido no que o site **serve**, não no que o deploy
diz: bloco `bloco-2026-08-06-2026-12-31`, **87 turnos, piso 4**, passado intacto byte a byte, 14
ativos, Eduardo e Thiago com 0 turnos, **17 de 17 regras** no site publicado, e a escala **refazível**
turno a turno. As **duas** pastas de dados moveram.

🔴 **E o que a pergunta dele não previa:** comparado com a escala que já estava no ar, deu **87
iguais, 0 mudados**. A única mudança foi a data final do bloco — 30/12 → 31/12, que é quinta-feira,
sem culto. **O site atualizou e o dia de ninguém mudou** — correto, porque o gerador é determinístico
e o bloco não traz semente (saiu de um "Gerar escala" limpo, não de um "Não gostei").

## "O botão é uma farsa" (06/08, noite)

> *"Distanciamento por pessoa, mesmo clicando várias vezes, não muda nada. O 'Não gostei — gerar
> outra combinação' é uma farsa."*

**Ele estava certo, e a causa era o oposto do que parecia.** A semente mudava a cada clique e as oito
versões saíam de fato distintas — a **cascata** é que escolhia sempre a versão **gulosa**, a única que
não usa semente nenhuma. Oito alternativas montadas, oito descartadas, em toda rodada.

Havia teste provando que sementes diferentes dão escalas diferentes, e ele passava. Havia teste
provando que a escolhida nunca é pior que a gulosa, e ele passava. Os dois estão certos: **cada peça
estava certa sozinha, e o defeito morava na junção** — que só existe inteira na tela.

Agora o clique manda junto a escala recusada, e ela sai da disputa. Medido nos dados reais: **piso 4
antes e depois**, sem custo de qualidade. Portão novo `vivo:outra` — quatro cliques na tela de
verdade — provado nas duas pontas com mutante. Detalhe em
[`HANDOFF_2026-08-06.md` §6d](handoff/HANDOFF_2026-08-06.md) e [DB-039](../DIARIO_DE_BORDO.md).

## A SEXTA auditoria (05/08, noite)

**25 achados, todos fechados** — e ela mirou o que nenhuma outra podia mirar: **o código que tinha
nascido horas antes**. Três correções da manhã estavam na **variável errada**:

```
reverter o elenco → mensagem verde → clicar Publicar → o nome revertido VOLTA
```

A correção tinha atualizado o *retrato* dos dados; o que sobe no arquivo é outro estado. Uma correção
que menciona o defeito no comentário não é uma correção verificada.

E o gate **não executava uma linha de `Admin.tsx`**: desligar a trava contra escala retroativa, ou o
guarda dos 73 turnos, passava nos 20 passos. A resposta não foi montar teste de componente — foi
**tirar a decisão da tela**, que é onde ela nunca deveria ter morado.

🔒 **E um incidente meu**, que vale mais que qualquer achado: com auditores rodando em paralelo, um
`git add -A` capturou um mutante e o commit `3f8e366` entrou na história com o produto quebrado
dentro, afirmando `EXIT_GATE=0`. **Produção nunca recebeu o defeito.** O commit não é reescrito, e o
24º passo do gate — o selo da árvore — impede a repetição.

Detalhe em [`HANDOFF_2026-08-06.md`](handoff/HANDOFF_2026-08-06.md).

## A quinta auditoria (05/08, tarde)

**21 achados, todos fechados.** Ela mirou o que as quatro anteriores não tinham olhado — entrada
hostil, concorrência, a matemática do Jain, a imagem do WhatsApp, acessibilidade, `localStorage` —
e o pior repetia o de ontem **por outra porta**:

```
publicar 2× na mesma sessão, sem recarregar → a 1ª publicação SUMIA (55 turnos medidos)
                                              e o guarda dizia ok=true, perdidos=0
```

O guarda não errou: recebia o **retrato envelhecido**. `carregarDados()` roda uma vez, no topo do
módulo, e o objeto ficava congelado no closure da tela. **Um guarda só é tão bom quanto o argumento
que lhe entregam.**

Os outros dois vermelhos: `capacidade: 0` gerava 110 turnos com **zero pessoas** e as DUAS réguas
aprovavam (nasceu **D12**); e a ponte dado→tela não tinha **um único teste** — quatro mutantes que
apagam a escala de todos os irmãos passavam em 232/232.

Detalhe em [`HANDOFF_2026-08-06.md`](handoff/HANDOFF_2026-08-06.md).

## O que aconteceu antes, em 05/08/2026

**1. A escala nova desmentia o site que a congregação já tem o link — em TODOS os turnos.**
O Flavio viu antes de mim: hoje, 05/08, a escala nova trocava uma pessoa sem ninguém ter pedido.
Medido: **87 de 87 turnos divergiam** de 05/08 em diante. Nenhum portão pegou, porque todos
comparavam o site novo com o **dado** do site novo — coerência interna impecável enquanto a escala
inteira contradizia o mundo. *Coerência interna não é verdade; o que foi DIVULGADO é a referência.*

O histórico foi recortado até 05/08 (96 turnos congelados) e a escala nova começa em **06/08**.
Re-medível a qualquer momento:

```bash
npm run vivo:divulgado -- --antigo https://flaviocom.github.io/escala-irmaos-2026-mar/
```

> ✅ **DECIDIDO em 05/08: começa em 06/08 mesmo.** De 06/08 em diante, **84 turnos mudam** em relação
> ao que o site antigo mostra — é o esperado, a escala nova conserta o distanciamento. Ele optou por
> avisar os irmãos em vez de adiar o início.

**2. §0: o produto é genérico — e o código dizia o contrário.**
A regra máxima que ele instituiu (*"é uma escala genérica, configurável, mas genérica, com intenção
de comercialização"*) tinha, no mesmo dia, oito lugares com o nome deste cliente **cravado**:
cabeçalho do site, cabeçalho da administração, tela de entrada, imagem do WhatsApp, nome do arquivo
baixado, título da aba, os três prompts do motor — mais 24 ocorrências de "Irmão" e o **emblema
importado**. E `config.identidade` **já existia** no tipo, no dado e no padrão: nunca era lido.

> **Configuração morta é pior que configuração ausente: ela parece que resolve.**

Hoje título, subtítulo, vocabulário e emblema são dado, com tela na aba Gerar. O portão
`npm run generico` (+ autoteste de 21 casos, com autodefesa) impede a volta.

**3. Trava de data retroativa** — o seletor não deixa mais escolher data anterior a hoje, no
navegador **e** em código. Passado divulgado não se reescreve.

**4. O gerador passou a comparar oito versões de si mesmo antes de mostrar uma** (pedido S-020,
depois da pesquisa em [`PESQUISA_2026-08-05-gerar-n-versoes.md`](superpowers/specs/PESQUISA_2026-08-05-gerar-n-versoes.md)).
É GRASP — lista restrita de candidatos com desempate **semeado** —, e a escolha entre as oito usa o
piso primeiro e o índice de Jain depois. A primeira das oito é sempre a gulosa pura, que é a rede:
o resultado nunca fica pior do que era. **A semente fica gravada no bloco**, então "gerar outra
combinação" explora caminho diferente sem que a escala deixe de ser reproduzível.

**5. A escala de 06/08 a 31/12 foi gerada, e saiu IDÊNTICA à que já estava no ar.** O algoritmo é
determinístico: mesma entrada, mesma saída. É a melhor resposta possível para *"posso gerar sem
medo?"*. No caminho apareceram dois defeitos — o script escrevia por um caminho **pior** que o da
tela (usava o guloso; a tela compara 8 versões) e gravava em **uma pasta só**.

**6. Documentação de reconstrução — portabilidade entre IAs.** Sete documentos novos, sob
[`RECONSTRUIR.md`](RECONSTRUIR.md): modelo de dados, catálogo de regras (⚙️ **gerado do
código**, com portão que reprova se divergir), algoritmo, arquitetura (grafo de importações
**medido**), operação e instalação do zero. O portão `contagem` foi **invertido**: tinha lista fixa
de 5 documentos e deixava 4 invisíveis; agora descobre e mede **23 documentos** (medido em
18/08/2026 — o número cresce quando um documento vivo novo entra; ver `docs/PORTOES.md`).

**7. A finalidade ficou escrita, em três fases** (decisão dele, S-029). **Hoje o produto atende UMA
congregação, e só ela** — os porteiros da comum do Jd. São Luiz. Outras comuns e a venda são planos
futuros, e não começaram. Isso importa porque a §0 diz *"com intenção de comercialização"*, e quem
lesse só aquilo concluiria que o produto já está sendo vendido.

> ⏱️ **O portão genérico não serve à fase 1 — ele serve a manter as fases 2 e 3 possíveis.** Cravar
> o nome do cliente é barato hoje e vira reescrita depois.

Detalhe, com as palavras dele e o que cada fase reabre:
[`FINALIDADE_E_FASES.md`](FINALIDADE_E_FASES.md).

**8. 🔴 QUATRO auditorias externas no dia — 48 achados, todos fechados.** A última pegou o pior:
gerar um período **mais curto** que o publicado **apagava escala já divulgada**. Medido no dado
real: gerar `01/09→31/10` sobre o bloco que vai até 31/12 sumia com **73 turnos** de novembro e
dezembro — e o conferidor escrito no mesmo dia para impedir isso **aprovava**, porque contava só o
que vinha antes do corte.

> 🔴 **Um conferidor que prova metade da frase é pior que nenhum: ele dá licença.**

O bloco anterior passou a ser **partido em cabeça e cauda**, o guarda foi **ligado na tela** (vivia
só num script que se declara "não é ferramenta de produção"), e publicar trava dizendo **quais
dias** sumiriam.

**9. O caminho inteiro virou portão** (`npm run vivo:caminho`). Os outros cobrem cada peça; a
sequência que a pessoa faz de verdade não era percorrida por ninguém.

Detalhe completo em [`HANDOFF_2026-08-06.md`](handoff/HANDOFF_2026-08-06.md).

## O que entrou em 04/08: a auditoria independente (P2.10)

Era o único item autônomo em aberto, e o método se recusava a dar o projeto por encerrado sem ele:
*"quem auditou escreveu o código"*. **Seis auditores em frentes disjuntas, mandado adversarial,
obrigados a provar com comando e saída real. Vinte achados** — nenhum deles visto pela
autoverificação, que roda 20 checagens todo dia. Os quatro mais graves:

| O que estava errado | Por que ninguém tinha visto |
|---|---|
| **Bloco VAZIO era aprovado "sem ressalvas"** — e é isso que destrava o Publicar | as regras de então percorriam `turnos`; sem turnos, todas respondiam "nada a apontar" |
| **D9 era cega ao calendário da Santa Ceia** — conferia o bloco contra ele mesmo | `Contexto` não carregava a configuração. É o defeito que originou o projeto |
| **Três portões não mordiam** — o de fontes ignorava `scripts/` inteiro | infrator injetado passava verde; ninguém tinha atacado os portões |
| **O verde "ao vivo" podia ser de outro código** | o vite ficava órfão no Windows e a execução seguinte falava com ele — chegou a aprovar um **bundle antigo** |

**Consertados e provados nas duas pontas.** Dois portões novos (`contagem`, `cadeia`) existem porque
número escrito à mão e ponteiro mantido à mão apodrecem sozinhos — o `AGENTS.md` apontava para a
parte 4 de 7 como se fosse a última. Detalhe em [`HANDOFF_2026-08-04-i.md`](handoff/HANDOFF_2026-08-04-i.md).

⚠️ **Cinco achados menores continuam abertos** (P4.3, P4.6, P4.7, P4.8, P4.9), no
[`BACKLOG.md`](../BACKLOG.md), com `arquivo:linha` e reprodução. Nenhum bloqueia o uso. Eram sete;
P4.1, P4.2, P4.4 e P4.5 fecharam, e P4.10 nasceu e fechou no mesmo dia.

## O que acabou de entrar (04/08–05/08)

**O núcleo, medido e testado.** 17 regras num catálogo único (12 duras + 5 de qualidade), cada uma
com teste que **reprova um infrator injetado e aprova o caso limpo** — 55 testes verdes.

**O gerador descobre o piso de distanciamento** em vez de recebê-lo cravado. Na escala real ele
relatou: *"Piso alcançado: 6 dias. Tentei 9, 8, 7 — não foi possível cobrir todos os turnos."*

**O defeito que motivou o projeto está consertado**, e a prova é numérica:

| | Site no ar hoje | Bloco novo (05/08 → 30/12) |
|---|---|---|
| Menor intervalo | **1 dia** (Williams, 7 casos) | **6 dias** |
| Pares com ≤3 dias | **18** | **0** |
| Quarta → sábado | 6 casos | **0** |
| Santa Ceia | 07/06 errada; 16/08 com 6 escalados | **16/08 correta, 0 escalados** |
| Validação | 6 regras, nenhuma de espaçamento ou capacidade | **16 de 16** (eram 15 em 04/08; D11 nasceu em 05/08) |
| Testes | nenhum | **397** hoje (eram 71 em 04/08), verdes em 2 fusos |
| Equilíbrio | — | 16–17 turnos, diferença de **1** |

**A área administrativa está no ar**: elenco com X para tirar e + para acrescentar, as quatro
famílias de restrição, geração por intervalo de datas, conferência regra a regra e publicação por
commit. Publicar fica **bloqueado** enquanto a validação reprovar.

**Achado no caminho:** o `tsconfig` herdado do template vinha com **`"strict"` comentado**. Sem
`strictNullChecks` o TypeScript não estreita união discriminada — foi o que produziu 12 erros
falsos. Ligar o `strict` resolveu todos e revelou 9 trechos de código morto, removidos.

**Tudo validado ao vivo, no navegador** — não só por `curl`: a tela renderiza, os nomes aparecem, o
16/08 mostra SANTA CEIA sem ninguém, as 17 regras aparecem na aba Validação, o cofre cifra de
verdade (senha errada não abre) e um token inválido é recusado antes de ser guardado.

**Depois disso, na segunda parte da sessão**, entraram quatro itens do backlog:

- **P3.13** — o mês era lido em UTC (invisível em UTC−3). Corrigido em 3 pontos, com um portão que
  roda a suíte inteira em `Europe/Berlin` **depois de provar que a troca de fuso surtiu efeito**.
- **P3.12** — ajuste manual turno a turno, com o **motivo escrito antes do clique**.
- **P3.9** — o **motor**: propõe, o portão determinístico julga, e o placar compara os dois lado a
  lado. Sem chave, tudo o mais segue funcionando.
- **P2.9 e P2.7** — portões de denominação e de inventário de fontes.

🔴 **Os dois portões novos nasceram mentindo**, e os dois passavam no próprio autoteste: o de
denominação produziu **9 falsos positivos** na varredura real (`SANTA CEIA` contém "IA"), e o de
inventário mediu **zero hosts** e disse "toda fonte declarada" (o `//` de `https://` era lido como
comentário). Consertados, com os casos reais virando teste permanente.
