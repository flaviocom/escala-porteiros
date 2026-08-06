# ESTADO — escala-porteiros

> **Onde o projeto está agora.** Documento **vivo**: sobrescrito, não acumulado.
>
> **Última atualização:** 05/08/2026 · **Fuso:** America/São_Paulo
>
> **Cadeia de navegação, nesta ordem:**
> **`ESTADO.md` (você está aqui)** → [`handoff mais recente`](docs/handoff/HANDOFF_2026-08-06.md) → [`BACKLOG.md`](BACKLOG.md)
> *onde estamos · o que aconteceu na última sessão e por quê · o que fazer a seguir*
>
> **Reconstruir do zero (portabilidade entre IAs):** [`docs/RECONSTRUIR.md`](docs/RECONSTRUIR.md)
> **Roteador do projeto:** [`AGENTS.md`](AGENTS.md) ·
> **Solicitações:** [`docs/solicitacoes/INDICE_DE_SOLICITACOES.md`](docs/solicitacoes/INDICE_DE_SOLICITACOES.md) ·
> **Histórico:** [`docs/historico/INDICE.md`](docs/historico/INDICE.md) ·
> **Fontes de dados:** [`docs/INVENTARIO_DE_FONTES.md`](docs/INVENTARIO_DE_FONTES.md)

---

## Em uma frase

**O produto está no ar, auditado por fora CINCO vezes, e a escala de 06/08 a 31/12 está publicada e
conferida.** O nome do cliente saiu do código e virou dado. As duas decisões que estavam pendentes
**foram tomadas pelo Flavio em 05/08** — a data de início (06/08) e o escopo de finalidade (fase 1,
uso interno). O que falta é só o que depende das credenciais dele.

## O mais recente: a SEXTA auditoria (05/08, noite)

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

Detalhe em [`HANDOFF_2026-08-06.md`](docs/handoff/HANDOFF_2026-08-06.md).

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

Detalhe em [`HANDOFF_2026-08-06.md`](docs/handoff/HANDOFF_2026-08-06.md).

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
depois da pesquisa em [`PESQUISA_2026-08-05-gerar-n-versoes.md`](docs/superpowers/specs/PESQUISA_2026-08-05-gerar-n-versoes.md)).
É GRASP — lista restrita de candidatos com desempate **semeado** —, e a escolha entre as oito usa o
piso primeiro e o índice de Jain depois. A primeira das oito é sempre a gulosa pura, que é a rede:
o resultado nunca fica pior do que era. **A semente fica gravada no bloco**, então "gerar outra
combinação" explora caminho diferente sem que a escala deixe de ser reproduzível.

**5. A escala de 06/08 a 31/12 foi gerada, e saiu IDÊNTICA à que já estava no ar.** O algoritmo é
determinístico: mesma entrada, mesma saída. É a melhor resposta possível para *"posso gerar sem
medo?"*. No caminho apareceram dois defeitos — o script escrevia por um caminho **pior** que o da
tela (usava o guloso; a tela compara 8 versões) e gravava em **uma pasta só**.

**6. Documentação de reconstrução — portabilidade entre IAs.** Sete documentos novos, sob
[`docs/RECONSTRUIR.md`](docs/RECONSTRUIR.md): modelo de dados, catálogo de regras (⚙️ **gerado do
código**, com portão que reprova se divergir), algoritmo, arquitetura (grafo de importações
**medido**), operação e instalação do zero. O portão `contagem` foi **invertido**: tinha lista fixa
de 5 documentos e deixava 4 invisíveis; agora descobre e mede **17 documentos**.

**7. A finalidade ficou escrita, em três fases** (decisão dele, S-029). **Hoje o produto atende UMA
congregação, e só ela** — os porteiros da comum do Jd. São Luiz. Outras comuns e a venda são planos
futuros, e não começaram. Isso importa porque a §0 diz *"com intenção de comercialização"*, e quem
lesse só aquilo concluiria que o produto já está sendo vendido.

> ⏱️ **O portão genérico não serve à fase 1 — ele serve a manter as fases 2 e 3 possíveis.** Cravar
> o nome do cliente é barato hoje e vira reescrita depois.

Detalhe, com as palavras dele e o que cada fase reabre:
[`docs/FINALIDADE_E_FASES.md`](docs/FINALIDADE_E_FASES.md).

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

Detalhe completo em [`HANDOFF_2026-08-06.md`](docs/handoff/HANDOFF_2026-08-06.md).

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
parte 4 de 7 como se fosse a última. Detalhe em [`HANDOFF_2026-08-04-i.md`](docs/handoff/HANDOFF_2026-08-04-i.md).

⚠️ **Cinco achados menores continuam abertos** (P4.3, P4.6, P4.7, P4.8, P4.9), no
[`BACKLOG.md`](BACKLOG.md), com `arquivo:linha` e reprodução. Nenhum bloqueia o uso. Eram sete;
P4.1, P4.2, P4.4 e P4.5 fecharam, e P4.10 nasceu e fechou no mesmo dia.

## Onde roda

| | |
|---|---|
| Site | **https://flaviocom.github.io/escala-porteiros/** |
| Área administrativa | **https://flaviocom.github.io/escala-porteiros/#/admin** |
| Repositório | [`flaviocom/escala-porteiros`](https://github.com/flaviocom/escala-porteiros) — público |
| Publicação | GitHub Pages, modo branch, `main` + `/docs` |
| Usuários | 16 irmãos porteiros + 1 administrador |

⚠️ **O site antigo continua no ar e intocado**, como decidido: `escala-irmaos-2026-mar`.

### 🔴 A pasta local é lenta a ponto de inviabilizar o desenvolvimento

Medido em 04/08/2026, com o disco em repouso: escrever 100 arquivos pequenos leva **79.844 ms em
`D:`** contra **45 ms em `C:`** — **0,8 segundo por arquivo**, cerca de **1.775× mais lento**. Um
`npm install` (~30 mil arquivos) levaria **horas**; na cópia em `C:` levou **14 segundos**.

Não é "disco lento": é antivírus varrendo cada escrita, ou disco com defeito. **Enquanto isso não for
resolvido, o build e os testes rodam numa cópia em `C:`**, e o GitHub é a ponte:

```bash
git clone https://github.com/flaviocom/escala-porteiros.git /c/.../build-escala-porteiros
# trabalha, testa e publica de lá; a pasta em D: recebe por `git pull`
```

⚠️ Junção (`mklink /J`) **não resolve**: o npm apaga um `node_modules` que não seja diretório real
(`npm warn reify Removing non-directory`).

## O que acabou de entrar

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
| Testes | nenhum | **341** hoje (eram 71 em 04/08), verdes em 2 fusos |
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

## O que está em curso

**Nada em execução.**

**A imagem que vai para o WhatsApp tem layout próprio** (partes 7 e 8), no modelo do arquivo que o
Flavio usa — com os nomes em **colunas alinhadas** e um **seletor de meses** antes de gerar. A anterior fotografava a tela e **fatiava em 5 dias** — numa escala de cinco meses, saíam cinco
dias. Agora o período inteiro cabe, e o filtro é o mesmo da tela. Exemplo em
`capturas/exemplo-2026-08.png` — ⚠️ `capturas/` está no `.gitignore`, então quem clonar o repositório
não encontra o arquivo: **regerar com `npm run imagem`**, que é rápido e usa o dado publicado.

🔴 **O achado mais consequente do dia veio de mapear o grafo de importações** (parte 6):
`definirPessoas` filtrava por `ativo` e, com isso, **quem saísse do elenco perdia o passado na
tela** — nome virava id cru, a busca não o achava, e os turnos dele sumiam das estatísticas. Sem
erro, sem tela branca: **silencioso**. Latente hoje (as 16 pessoas estão ativas), certo no primeiro
uso do recurso que originou o projeto. Corrigido, com 5 testes e uma frente nova na auditoria.

**O cenário que originou o projeto está provado de ponta a ponta:** `npm run ensaio` tira o mais
escalado, põe um irmão com as **quatro** famílias de restrição de uma vez, refaz a escala e mede
**11 promessas** — inclusive que o passado fica byte a byte idêntico. 11 de 11.

**Na quinta parte**, sem tarefa na lista, a ordem foi conferir a afirmação mais consequente que
nunca tinha sido testada: o histórico congelado foi montado a partir do **código** do site antigo,
nunca contra o que ele **mostra na tela**. Conferido dia a dia:
**66 de 66 dias, 282 nomes, 0 divergências.** A promessa *"você não vai apagar o passado"* está
medida, não presumida.

E a ponta simétrica também foi fechada: **o site novo mostra o que o dado diz** — 131 dias, 543
escalações, 0 divergências, com a Santa Ceia conferida pelos dois lados (o aviso aparece, e nenhum
dos 16 irmãos está na tela). `npm run vivo:conferir`.

🔴 **E apareceu um achado de lado:** o **site antigo não mostra o passado**. Ele lista do dia de hoje
em diante — um irmão que abra aquele link hoje **não vê março a julho**, só digitando a data na
busca. O site novo mostra, porque ali o passado é dado congelado. Virou P1.3.

**Na quarta parte** entraram a Regra Mestra 3 (tooltips 17%→100%), o README, a validação em celular
(alvo de toque de 16px corrigido para 44px) e a decisão declarada de **não** implementar
arrastar-e-soltar.

**Na terceira parte** entraram os dois últimos itens: **P3.10** (histórico com reversão — que
revelou `historicoPublicacoes()` sem consumidor, o ERRO 12 no código desta própria sessão) e
**P2.10** (auditoria adversarial: 17 checagens, **2 achados corrigidos**).

🔴 O achado mais sério: **pessoa desativada escalada era APROVADA** pela validação. O gerador já
barrava, mas o ajuste manual e os blocos importados abriam a porta — que é exatamente o cenário
deste projeto. Corrigido, com teste.

⚠️ Aquela auditoria foi feita por quem escreveu o código, e o método dizia que não bastava.
**Isso foi resolvido em 04/08/2026** — ver a seção do topo.

## O que bloqueia

| O que | De quem depende |
|---|---|
| Publicar pela tela | 👤 Flavio cola `GITHUB_PAT_ESCALA_PORTEIROS` no primeiro acesso |
| O motor funcionar | 👤 Flavio cola `ANTHROPIC_API_KEY_ESCALA` (opcional — sem ela o algoritmo segue) |
| Desenvolver na pasta `D:` | 👤 Flavio decide se investiga o antivírus/disco |

O pré-voo **não reprova mais** por causa do disco: a ausência de `node_modules` em `D:` é proposital
e agora está declarada em `docs/pre-voo.json`, com motivo escrito. Ela aparece no relatório em ⚪ com
a explicação ao lado, em vez de 🔴 sem contexto — e a checagem continua acusando instalação parcial.

## Como retomar

1. Leia [`AGENTS.md`](AGENTS.md).
2. Leia este arquivo e o [`BACKLOG.md`](BACKLOG.md).
3. Rode o pré-voo: `node D:/Antigravity/_padroes-globais/scripts/pre-voo.mjs .`
4. Clone numa pasta em `C:` antes de rodar `npm install` — ver o aviso acima.

**Você não precisa perguntar ao Flavio onde paramos.** Se este arquivo não responde isso, ele está
desatualizado — e atualizá-lo é parte de fechar qualquer passo.
