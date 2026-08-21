# ESTADO — escala-porteiros

> **Onde o projeto está agora.** Documento **vivo**: sobrescrito, não acumulado.
>
> **Última atualização:** 20/08/2026 · **Fuso:** America/São_Paulo
>
> **Cadeia de navegação, nesta ordem:**
> **`ESTADO.md` (você está aqui)** → [`handoff mais recente`](docs/handoff/HANDOFF_2026-08-20.md) → [`BACKLOG.md`](BACKLOG.md)
> *onde estamos · o que aconteceu na última sessão e por quê · o que fazer a seguir*
>
> **Reconstruir do zero (portabilidade entre IAs):** [`docs/RECONSTRUIR.md`](docs/RECONSTRUIR.md)
> **Roteador do projeto:** [`AGENTS.md`](AGENTS.md) ·
> **Solicitações:** [`docs/solicitacoes/INDICE_DE_SOLICITACOES.md`](docs/solicitacoes/INDICE_DE_SOLICITACOES.md) ·
> **Histórico:** [`docs/historico/INDICE.md`](docs/historico/INDICE.md) ·
> **Fontes de dados:** [`docs/INVENTARIO_DE_FONTES.md`](docs/INVENTARIO_DE_FONTES.md)

---

## 🪑 MESA DO DONO

> Recado do Flavio para quem assumir a sessão — lido ANTES de tudo o mais. **Vazio agora.** Como
> usar: o dono escreve aqui em texto livre (prioridade, decisão, contexto que não cabe no
> `BACKLOG.md`); a sessão seguinte lê isto primeiro, ao abrir o `ESTADO.md` — ordem de leitura
> completa (e por quê) em [`AGENTS.md`](AGENTS.md) — e apaga o recado depois de atender: esta mesa
> nunca acumula.

*(nada na mesa agora)*

---

## Handoff ativo

Sem handoff ativo.

Formato em `COEXISTENCIA_HANDOFF_E_CONTEXTO.md`, dos padrões globais — usar quando houver troca de
agente/harness ou trabalho paralelo em arquivos disjuntos.

---

## Em uma frase

**O produto está no ar, divulgado e em uso: os irmãos consultam a própria escala pelo site**
(palavras do dono, 08/08 — S-054). Auditado por fora CINCO vezes, escala de 06/08 a 31/12 publicada
e conferida, o nome do cliente fora do código. **P0 e P1 estão sem item aberto** — a única
credencial em aberto é a chave do motor, **opcional**; nada trava sem ela. **20/08:** o produto
virou dois — nasceu [`escala-geral`](https://github.com/flaviocom/escala-geral), motor genérico
para vender, sem tocar neste repositório de produção. Detalhe completo do dia inteiro:
[`HANDOFF_2026-08-20.md`](docs/handoff/HANDOFF_2026-08-20.md).

## O mais recente: nasceu o `escala-geral`, e horário real virou regra máxima (S-067 a S-072, 20/08)

**O pivô do dia:** o dono decidiu vender o motor como produto genérico. Nasceu
[`flaviocom/escala-geral`](https://github.com/flaviocom/escala-geral) (Template Repository, público,
codebase copiado da trilha genérica já provada) — **este repositório de produção não foi tocado**,
os 9 commits daqui hoje são só documentação e um experimento de medição (busca local pós-GRASP não
generaliza fora de 14 pessoas, S-068). No `escala-geral`: telas de malha e mensagem configuráveis
pela tela; um vazamento de dado entre repositórios (mesma origem `flaviocom.github.io`) achado ao
vivo pelo dono e fechado em 3 rodadas de auditoria; e a **regra máxima do dia** — *"eu não quero um
horário fixo ou período fixo... controle horas mesmo, com data e hora de Brasília, sempre"* — que
atravessou **6 rodadas de auditoria independente** (a 4ª achou 4 defeitos, a 5ª achou uma regressão
da própria correção da 4ª, a 6ª fechou sem defeito). Depois, dado real de demonstração carregado
(16 pessoas, malha e 183 turnos reais) e um "rascunho fantasma" — bug que escondia dado publicado
desde a primeira visita de qualquer pessoa, em qualquer aba — achado ao vivo pelo dono e corrigido
na raiz. Detalhe completo, com os 7 recortes pedidos (feito/aprendido/ajustado/solicitado/não
atendido/não decidido/pendências):
[`HANDOFF_2026-08-20.md`](docs/handoff/HANDOFF_2026-08-20.md) · [DB-063 a DB-069](DIARIO_DE_BORDO.md).

## O anterior: a pergunta certa achou um bug real na mensagem semanal (S-066, 19/08)

Mesma pergunta de auditoria de sempre, depois do S-065 — resposta honesta: faltava verificação
visual (achado: telefone inválido ainda sumia em silêncio) e auditoria de verdade. Agente auditor
independente, mandado a REFUTAR, confirmou o conserto do "turno já passado" mas achou um
**SEGUNDO** defeito real: `montar_mensagem_semanal` recalculava o fim da semana (`inicio+7`)
separado do que `selecionar_semanal` usava para filtrar (`domingo+7`) — as duas fórmulas divergem
sempre que o disparo não cai num domingo, **inclusive na cadência real (segunda-feira)** — e a
mensagem prometia um dia que o filtro nunca tinha buscado. Reproduzido ao vivo antes de aceitar.
Corrigido: `fim` sai de um único lugar, nunca recalculado; `max(domingo,alvo)` simplificado para
`inicio = alvo` (nunca desempatava para o outro lado). **Sweep completo do painel administrativo**
(não só o achado anterior): 12 campos sem `id`/`name` corrigidos, verificado tela por tela, zero
avisos restantes. **Achado lateral, no próprio instrumento de medição:** o contador de casos do
autoteste era escrito à mão e tinha desatualizado (26 exibido, 32 rodando de verdade, em silêncio)
— trocado por contagem automática, nos dois autotestes que tinham esse padrão. Autoteste: 26→**32
casos**. Gate: **37 passos**, verde. Detalhe:
[`HANDOFF_2026-08-19-e.md`](docs/handoff/HANDOFF_2026-08-19-e.md) · [DB-062](DIARIO_DE_BORDO.md).

## O anterior: pesquisa ANTES do código — cadência e formatação do lembrete (S-065, 19/08)

Depois do S-064, o Flavio perguntou o texto das mensagens e se o resumo semanal deveria disparar
segunda em vez de domingo, com instrução explícita: *"coloque os agentes de pesquisa antes de você
codar ou tomar qualquer decisão."* Cumprido: dois agentes de pesquisa independentes, em paralelo,
relatórios lidos por inteiro, só então código. **Cadência:** não há padrão de mercado único (líderes
do setor disparam ao publicar, não em dia fixo); domingo×segunda é empate documentado (ABNT NBR
5892 vs. ISO 8601) — decisão: **segunda-feira de manhã**, convenção de casa DECLARADA, não "padrão
de mercado". A estrutura já desenhada (resumo semanal + véspera) replica o padrão de maior eficácia
achado na literatura (Steiner et al. 2018, AJMC: 4,4% de falta com 2 lembretes vs. 5,3–5,8% com 1)
— sem necessidade de terceiro lembrete. **Formatação:** confirmado contra o WhatsApp Help Center
oficial (negrito já certo; monoespaçado é 3 crases, não 1; listas via API sem confirmação de
renderização, mantido "•" manual); achado real — as mensagens não se identificavam (erro nº1
apontado pela pesquisa), corrigido com `config.identidade.titulo`. Construído: `lembrete_individual.py`
reescrito (cron→segunda, 3 blocos, `main()` lê `config.json`), `primeiro_nome()` morta removida,
autoteste 19→**22 casos**. Gate: **37 passos**, verde. Detalhe:
[`HANDOFF_2026-08-19-d.md`](docs/handoff/HANDOFF_2026-08-19-d.md) · [DB-061](DIARIO_DE_BORDO.md).

## O anterior: lembrete individual no WhatsApp — telefone cadastrado, duas mensagens (S-064, 19/08)

O Flavio perguntou a URL da versão nova e como cadastrar nome/telefone para o lembrete. Perguntei se
era para trocar o lembrete de GRUPO (S-051, sem telefone de ninguém, de propósito) por individual,
ou somar — resposta: somar. *"Lista editável (...) nome completo (...) e o telefone. Essa lista tem
que ficar aberta, não é para apagar (...) mensagem bonita e cordial (...) agendamentos no começo da
semana (...) domingo a domingo (...) e um dia antes (...) Não precisa se preocupar com nada de
LGPD."* Decisão dele sobre LGPD, registrada como tal, não engolida. Construído: `Pessoa.nomeCompleto`/
`telefone`; `src/utils/telefone.ts` (formato confirmado contra código de referência REAL lido na
própria VPS do Charmway); tela no card de cada pessoa do Elenco, sem botão de apagar (reaproveita o
`ativo: false` que já existia); `scripts/vps/lembrete_individual.py` — dois modos, `semanal`
(domingo a domingo) e `diario` (véspera) — com autoteste dedicado (19 casos, sem rede). Dois
defeitos achados testando AO VIVO no navegador local, corrigidos antes de fechar: aspas escapadas
quebrando o JSX, e telefone inválido sendo apagado em silêncio ao perder o foco. Gate: **37 passos**,
verde — o portão `fatos:conferir` pegou 2 números que meus próprios arquivos novos desatualizaram
(testes na suíte, testes pulados), corrigidos. Ativação real segue bloqueada: número
`551194950100` ainda não conectado. Detalhe: [`HANDOFF_2026-08-19-c.md`](docs/handoff/HANDOFF_2026-08-19-c.md) ·
[DB-060](DIARIO_DE_BORDO.md).

## O anterior: a pergunta certa achou o que o fechamento anterior não tinha feito (S-063, 19/08)

O Flavio perguntou, direto, se o fechamento do S-062 tinha verificação visual e auditoria de
verdade — *"Seja sincero!"*. A resposta honesta era **não**, em dois pontos: só `curl` (prova que o
servidor responde, não que a tela renderiza certo) e nenhuma auditoria independente (CONSTRÓI,
VALIDA e "AUDITA" com o mesmo agente é autoverificação, não auditoria). Fechadas as duas,
autonomamente. **(1) Navegador de verdade** nas duas trilhas: produção e genérica renderizam certo,
Estatísticas e Validação (17/17 regras) conferidas, vocabulário neutro confirmado na tela. Achado
real e **pré-existente** (não do S-062): 2 campos sem `id`/`name` em `DateSearch.tsx` — corrigido.
**(2) Agente auditor independente**, mandado a REFUTAR o conserto do selo com comparação cega —
achou um **terceiro** problema de parsing: renomear arquivo staged produzia `R  antigo -> novo` no
`git status --porcelain`, tratado como um único "arquivo" fantasma. Julgamento próprio sobre o
achado: a auditoria chamou isso de "mesma classe" do defeito do S-062, mas **não é** — renomear
MUDA o caminho de verdade, então o selo deve continuar acusando (e continua, antes e depois do
conserto); só a higiene do parsing precisava de conserto. Caso G novo no autoteste (6→7 casos), com
a expectativa corrigida (a primeira versão copiou a leitura errada da auditoria). Gate: **37
passos**, verde. Detalhe: [`HANDOFF_2026-08-19-b.md`](docs/handoff/HANDOFF_2026-08-19-b.md) ·
[DB-059](DIARIO_DE_BORDO.md).

## O anterior: `retomaescala` funcionou, e a varredura achou o selo mentindo (S-062, 19/08)

Primeira retomada de sessão usando a palavra `retomaescala` — funcionou, sem o dono reexplicar
nada. A varredura de rotina (VPS reconferida: número `551194950100` ainda não conectado; nada
novo) esbarrou em `npm run selo:conferir` acusando "árvore mudou" com `git status` **totalmente
limpo**. Investigado, não ignorado: `selar-arvore.mjs` hashava o mesmo arquivo de duas formas
diferentes — blob do índice do git (LF-normalizado por `core.autocrlf`) para o que já estava
staged/commitado, bytes crus do disco (CRLF) para o que estava só modificado. O fluxo padrão deste
projeto (`npm run gate`, que termina em `selo:gravar`, ANTES de `git add`) trocava quase todo
arquivo de representação entre o `--gravar` e o `--conferir` seguinte — **zero mudança real, selo
gritando mesmo assim**. Corrigido: a impressão digital agora lê sempre o disco, nunca o índice.
`selar-arvore.mjs` nunca tinha autoteste (a única trava do projeto nessa condição) — criado
`autoteste-selar-arvore.mjs`, 6 casos, reproduzindo o defeito exato. Gate: 36 → **37 passos**.
Detalhe: [`HANDOFF_2026-08-19.md`](docs/handoff/HANDOFF_2026-08-19.md) · [DB-058](DIARIO_DE_BORDO.md).

## O anterior: a trilha GENÉRICA nasceu — segundo build, mesmo repositório (S-059/S-060, 18/08)

O Flavio recuperou o brainstorm de 07/08 sobre o lembrete de WhatsApp (rota B pela ponte Charmway,
S-050/S-051) e perguntou dois próximos passos. **1) O número de disparo:** ele escolheu
`551194950100` (dedicado, ainda não conectado — os 6 números já ativos na instância foram
descartados por levantamento ao vivo: nenhum está em grupo de porteiros). Corrigido no caminho: a
chave SSH `charmway_deploy` (10/08) já resolve o acesso — a `claude-escala-lembrete` perdida (08/08)
era a única marcada como bloqueio no runbook. **2) Uma versão "só Escala", sem cliente, para testar
sem risco:** ele perguntou se precisava de repositório novo. Resposta medida: não — `npm run
generico` já provava que `src/` não tem texto de cliente, então bastava um segundo build
(`vite build --mode generico`) publicado pela mesma esteira. Construído: `docs/generico/` (base
`/escala-porteiros/generico/`), `public-generico/dados/` com identidade neutra ("Plantonista",
"portaria de prédio" — o próprio exemplo que `tipos.ts` já citava), portão dedicado
(`generico:dados`, autoteste `generico:dados:autoteste`) garantindo que a trilha nunca carregue o
cliente de produção. Verificado num navegador de verdade antes de declarar pronto. Gate: **36
passos**, dois novos portões + duas novas seções de doc (`ARQUITETURA.md` §"A segunda trilha",
`FASE2.md` §P4.w2). Detalhe: [`HANDOFF_2026-08-19.md`](docs/handoff/HANDOFF_2026-08-19.md) ·
[DB-055, DB-056](DIARIO_DE_BORDO.md).

## O anterior: 3 defeitos achados sem pedido, numa sessão que começou como "resume" (18/08)

10 dias sem sessão. A cópia local tinha ficado 6 commits atrás do `origin/main` — reconciliada
(`git reset --hard`) antes de qualquer dado errado ser empurrado. Com a cópia certa, `vivo:no-ar`
saiu verde mas com aviso `DEP0190` (corrigido: `execFileSync`+`shell:true` → `execSync` + guarda
testável, mesma classe que o P2.16 já baniu uma vez); `npm run citacoes` estava VERMELHO por
citações cruzando para o repositório charmway-erp num documento de comparação — corrigidas 6,
duas delas com **conteúdo errado** que o portão não detecta (prova arquivo+linha, não conteúdo); e
**P5.3 fechado com fonte oficial** (teto geral do GitHub, ~997 anos de folga no ritmo atual — era
"por medir" desde 08/08 por falta de rede). Detalhe: [`HANDOFF_2026-08-18.md`](docs/handoff/HANDOFF_2026-08-18.md) · [DB-053](DIARIO_DE_BORDO.md).

**Rotação do próprio documento:** este arquivo estourou o teto do regime "vivo" (400 linhas) nesta
mesma sessão — o narrativo de 04/08 a 08/08 (auditorias, o que entrou em cada dia) mudou para
[`docs/HISTORICO_ESTADO_2026-08.md`](docs/HISTORICO_ESTADO_2026-08.md), regime referência. Nada foi
perdido; é o mesmo texto, movido por assunto.

## Onde roda

| | |
|---|---|
| Site | **https://flaviocom.github.io/escala-porteiros/** |
| Área administrativa | **https://flaviocom.github.io/escala-porteiros/#/admin** |
| Trilha GENÉRICA (demonstração, sem cliente) | **https://flaviocom.github.io/escala-porteiros/generico/** |
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
| O motor funcionar | 👤 Flavio cola `ANTHROPIC_API_KEY_ESCALA` (opcional — sem ela o algoritmo segue) |
| Desenvolver na pasta `D:` | 👤 Flavio decide se investiga o antivírus/disco |

✅ **Publicar pela tela deixou de bloquear em 06/08** — o token está no navegador dele, provado
pelos commits de dados com autor via API (DB-050).

O pré-voo **não reprova mais** por causa do disco: a ausência de `node_modules` em `D:` é proposital
e agora está declarada em `docs/pre-voo.json`, com motivo escrito. Ela aparece no relatório em ⚪ com
a explicação ao lado, em vez de 🔴 sem contexto — e a checagem continua acusando instalação parcial.

## Como retomar

🔑 **Uma palavra basta: `retomaescala`.** Ele trabalha com vários VS Code abertos, um por projeto —
digitar essa palavra neste repositório significa "retome exatamente de onde paramos", sem
reexplicar nada. Protocolo completo em [`AGENTS.md`](AGENTS.md), logo no topo.

1. Leia [`AGENTS.md`](AGENTS.md).
2. Leia este arquivo e o [`BACKLOG.md`](BACKLOG.md).
3. Rode o pré-voo: `node D:/Antigravity/_padroes-globais/scripts/pre-voo.mjs .`
4. Clone numa pasta em `C:` antes de rodar `npm install` — ver o aviso acima.

**Você não precisa perguntar ao Flavio onde paramos.** Se este arquivo não responde isso, ele está
desatualizado — e atualizá-lo é parte de fechar qualquer passo.
