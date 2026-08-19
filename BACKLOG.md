# BACKLOG — escala-porteiros

> **O que falta fazer, em ordem.** Lugar único: item que não está aqui não existe como pendência.
> Documento **vivo** — item concluído sai daqui e vira registro no histórico.
>
> **Última atualização:** 19/08/2026
>
> **Cadeia de navegação, nesta ordem:**
> [`ESTADO.md`](ESTADO.md) → [`handoff mais recente`](docs/handoff/HANDOFF_2026-08-19-e.md) → **`BACKLOG.md` (você está aqui)**
>
> **Roteador do projeto:** [`AGENTS.md`](AGENTS.md) ·
> **Solicitações:** [`docs/solicitacoes/INDICE_DE_SOLICITACOES.md`](docs/solicitacoes/INDICE_DE_SOLICITACOES.md) ·
> **Histórico:** [`docs/historico/INDICE.md`](docs/historico/INDICE.md)

**Legenda:** 🔴 bloqueia o próximo marco · 🟠 defeito em produção · 🔵 método/infra · ⚪ produto
**Dono da decisão:** 👤 só o Flavio · 🤖 autônomo (o assistente executa sem perguntar)

---

## P0 — Decisões do dono 👤

### P0.1 ✅ FECHADO 08/08/2026 — aprovado pelo fato
O desenho ([`a spec`](docs/superpowers/specs/2026-08-04-area-administrativa-escala-design.md))
pedia aprovação antes de construir. A construção foi dirigida por ele solicitação a solicitação
(S-001 → S-053), a escala foi gerada por ele (S-027), publicada pela tela (S-030, commits de
06/08 22:07 com autor dele via API) e **divulgada aos irmãos** (S-054). Produto em produção e em
uso é a forma mais forte de aprovação — o item ficou aberto no papel por registro, não por dúvida.

### P0.2 — era "colar as duas credenciais"; **metade está paga, e a metade aberta é opcional**
**O assistente nunca digita, lê ou transcreve o valor** — regra intacta.
- `GITHUB_PAT_ESCALA_PORTEIROS` ✅ **paga, provado em 06/08/2026**: publicar pela tela só existe
  com o token no navegador, e os commits de dados de 06/08 22:07 têm autor dele via API.
- `ANTHROPIC_API_KEY_ESCALA` ⏳ **aberta e opcional**: sem ela o algoritmo gera, valida e publica
  normalmente — o que não liga é a proposta paralela do **motor**, com explicação e placar.
  Cola quando (e se) quiser o motor. Nada trava sem ela.

---

## P1 — Defeitos conhecidos 🟠

### P1.1 ✅ FECHADO 08/08/2026 — pela divulgação do site novo
O código de `escala-irmaos-2026-mar` marca `2026-06-07` como Santa Ceia; a correta é **16/08/2026**
(domingo), e o site antigo exibiria 6 porteiros num dia em que ninguém deve ser escalado. A correção
decidida era o site novo entrar no ar e ser divulgado antes de 16/08. **Aconteceu**: *"o site já
foi divulgado, os irmãos já têm conhecimento, cada um através da sua escala, pelo site"* (o dono,
08/08/2026 — S-054). O site novo mostra 16/08 como SANTA CEIA com **zero** escalados, conferido ao
vivo pelas duas réguas (S-042).
⚠️ **Risco residual, declarado:** o site antigo continua no ar servindo a data errada **para quem
guardou o link antigo** — e fica assim por decisão dele (S-024: *"não faça alteração"*).

### P1.3 ✅ FECHADO 08/08/2026 — mesma razão
O site antigo não mostra o passado (medido 04/08). A condição de fechamento escrita aqui era
literal: *"some quando o link novo for divulgado"*. Foi divulgado (S-054); o site novo mostra o
passado como dado congelado.

### P1.2 ✅ FECHADO 08/08/2026 — mesma razão
Distanciamento não é regra no gerador do site antigo (Williams com 7 intervalos de 1 dia, 18 pares
≤3 dias). Resolvido por desenho no projeto novo (Q1) — e, com a divulgação, a escala que os irmãos
consultam **é** a do projeto novo.

### ✅ Itens FECHADOS (P1.4 a P1.7) — rotacionados para o histórico
Fechados entre 06 e 07/08/2026, com prova. Detalhe completo, imutável:
[`docs/historico/2026-08_BACKLOG_itens-fechados.md`](docs/historico/2026-08_BACKLOG_itens-fechados.md).


---

## P2 — Método e infraestrutura 🔵

| # | Item | Estado |
|---|---|---|
| P2.1 | `AGENTS.md` + `ESTADO.md` + `BACKLOG.md` na raiz | ✅ 04/08 |
| P2.2 | `docs/pre-voo.json` e `docs/regimes-documentos.json` | ✅ 04/08 |
| P2.3 | Pré-voo verde | ✅ 04/08 — exit 0 |
| P2.4 | Criar `flaviocom/escala-porteiros` + repositório local | ✅ 04/08 — conferido no remoto |
| P2.5 | `.gitignore` excluindo `.claude/` e `.agents/` (ERRO 26) | ✅ 04/08 |
| P2.6 | `AI_MASTER_LOG.md` + `DIARIO_DE_BORDO.md` | ✅ 04/08 |
| P2.7 | `docs/INVENTARIO_DE_FONTES.md` **gerado por script** | ✅ 04/08 — 2 hosts medidos, 3 declarados |
| P2.8 | GATE: typecheck + suíte completa + build | ✅ 04/08 — `npm run gate`, exit 0 |
| P2.9 | Portão de denominação provando as duas pontas | ✅ 04/08 — 9 acusações + 13 absolvições, 0 vazamentos |
| P2.10 | Auditoria adversarial **INDEPENDENTE** | ✅ 04/08 — **6 auditores em frentes disjuntas, 20 achados**. Ver [handoff](docs/handoff/HANDOFF_2026-08-04-i.md) |
| P2.11 | 🔴 **Disco `D:` a 0,8 s por arquivo** — build roda numa cópia em `C:` | 👤 contornado; a causa é do Flavio |
| P2.12 | Pré-voo vermelho em `D:` por ausência **proposital** de `node_modules` | ✅ 04/08 — o método ganhou `deps: {bloqueia, motivo}`, que **falha fechada** (sem motivo escrito, não isenta) e não desliga a checagem de instalação parcial. Autoteste de 8 casos; contra a versão anterior, reprova 4 |
| P2.13 | Portão `contagem` — documento vivo não declara número de regras que o catálogo desmente | ✅ 04/08 — achou 8 divergências de uma vez |
| P2.14 | Portão `cadeia` — a cadeia de navegação aponta para o handoff que **é** o mais recente | ✅ 04/08 — `AGENTS.md` apontava para a parte 4 de 7 |
| P2.15 | Servidor de teste único, que **recusa** porta ocupada | ✅ 04/08 — 3 scripts vazavam o vite no Windows e validavam servidor fantasma |
| P2.16 | **`subirServidor` devolvia sem esperar a porta abrir**, e a espera vivia COPIADA em parte dos consumidores: em máquina mais lenta que a de origem, `vivo:abas` e `vivo:caminho` levavam `ERR_CONNECTION_REFUSED` com o produto certo | ✅ 08/08 — a espera desceu para a fonte única (`scripts/lib/servidor-de-teste.mjs:135`): teto de 30 s, servidor morto é acusado pelo código de saída, estouro derruba. A rede de segurança da saída passou a valer **fora do Windows** (um órfão de vite VIVO neste contêiner foi a prova de que ela faltava) e o 4º consumidor fora da fonte única (`scripts/validar-seletor-de-meses.mjs:27` — nascera com o `spawn('npx'…, shell: true)` que o cabeçalho da própria fonte única denuncia) foi migrado. Prova: os dois scripts verdes no mesmo contêiner em que reprovavam |
| P2.17 | **Janela de estabilização curta para downloads múltiplos** no `vivo:seletor`: a checagem "gera SÓ os meses marcados" concluía `0 arquivo(s)` antes de o primeiro download chegar — reprovava o produto certo em máquina lenta | ✅ 08/08 — espera o número prometido pelo rótulo do botão (até 20 s) e mantém a sobra proposital que flagra um TERCEIRO arquivo indevido (`scripts/validar-seletor-de-meses.mjs:87`). Prova: 11 de 11 checagens no contêiner em que dava 10 de 11 |
| P2.18 | **`vivo:admin`, `vivo:celular` e `vivo:acessibilidade` estavam no grupo LOCAL do gate abrindo a URL PUBLICADA** — dentro do gate isso aprova a árvore que JÁ ESTÁ no ar, não a que se quer aprovar ("verde de outra árvore"), e onde a rede é fechada nem roda | ✅ 08/08 — os três servem o **build local** por padrão (`scripts/validar-admin.mjs:25`, `scripts/validar-celular.mjs:24`, `scripts/medir-acessibilidade.mjs:45`); a URL por argumento segue valendo para medir o site no ar depois do push. Prova: os três verdes num ambiente **sem** acesso ao site publicado |
| P2.19 | **A régua de foco reprovava o anel `outline: auto`** — o desenhado pelo PRÓPRIO navegador: um build do Chromium computa a largura dele como `0px`, e a exigência de largura > 0 acusou **19 elementos certos** | ✅ 08/08 — `outline-style: auto` conta como anel (`scripts/medir-acessibilidade.mjs:213`), com **prova por pixel** antes da correção: a captura do botão focado mostra o anel pintado. Depois: foco visível em 47 de 47 |

---

## P4 — FASE 2: requisitos e sugestões → documento próprio

Cresceu até virar assunto: **[`docs/FASE2.md`](docs/FASE2.md)** — malha parametrizável, vocabulário
neutro, logotipo, lembrete de véspera (3 rotas), pares proibidos, e as sugestões do assistente.
Nada de lá começa sem decisão do dono.

## P4 — Achados da auditoria independente, ainda abertos 🟠

> 🔴 **Quatro itens deste bloco estavam marcados como ABERTOS com o defeito já corrigido no
> código** (medido em 06/08/2026). É a mesma classe do P7.7, ao contrário: lá o registro dizia
> "fechado" sobre o que não tinha sido feito; aqui dizia "aberto" sobre o que estava pronto. O P4.6
> chegava a afirmar que `npm run imagem` estava **fora do gate** — e ele é o passo 27.
>
> **Registro que mente para o lado do medo custa igual:** alguém refaz trabalho pronto, ou
> desconfia de um portão que funciona. Nasceu daí o passo 15 do gate (`citacoes`), que ao menos
> impede a forma de apodrecimento que este mesmo documento já tinha registrado duas vezes: a
> citação `arquivo:linha` que envelhece sozinha.


> Vieram da auditoria de 04/08/2026 ([handoff](docs/handoff/HANDOFF_2026-08-04-i.md)). **Nenhum
> bloqueia o uso.** Estão aqui com `arquivo:linha` e reprodução — não como lembrete vago. Foram
> separados por serem de risco baixo e escopo próprio; os graves já foram corrigidos.

### Sexta auditoria externa — 05/08/2026, **25 achados, 0 abertos**

Três frentes disjuntas: o código que nasceu hoje · o dado publicado até o pixel · os portões medem o
que dizem. Detalhe em [`HANDOFF_2026-08-06.md`](docs/handoff/HANDOFF_2026-08-06.md) e no
`DIARIO_DE_BORDO.md` (DB-022 a DB-025). Ficam aqui os que alguém precisa saber que existiram:

| # | Item | Estado |
|---|---|---|
| P6.1 | 🔒 **O gate foi verde sobre OUTRA árvore.** Um `git add -A` capturou o mutante de um auditor; `3f8e366` está na história com `mesDe` devolvendo o ano, e a mensagem afirma `EXIT_GATE=0` | ✅ **FECHADO** — produção nunca recebeu (o commit não tocou `docs/assets/`). O commit **não é reescrito**; o 24º passo do gate é o selo da árvore, provado nas duas pontas |
| P6.2 | 🔴 **Reverter e publicar em seguida DESFAZIA a reversão** — a correção da manhã mexeu no retrato, e o que sobe no arquivo é outro estado. Com `config.json`, a publicação seguinte republicava a configuração antiga **ativamente** | ✅ **FECHADO** — `aoReverter` sincroniza o estado editável, e é separado de `aoGravar` de propósito (falha parcial não pode apagar edição não publicada) |
| P6.3 | 🔴 **O gate não executava uma linha de `Admin.tsx`.** Desligar a trava de data retroativa ou o guarda dos 73 turnos passava nos 20 passos | ✅ **FECHADO** — as duas decisões desceram para o domínio, com 9 testes. ⚠️ Declarado aberto: outras decisões seguem na tela, mas nenhuma decide o que vai ao ar |
| P6.4 | 🔴 **Oito fronteiras de portão** — nenhum contava errado; todos mediam menos do que a frase prometia | ✅ **FECHADO** — e os dois padrões novos ganharam a régua que separa **afirmação de narrativa** (artigo definido; número entre aspas é citação) |

### Quinta auditoria externa — 05/08/2026, **21 achados, 0 abertos**

Detalhe e medição em [`HANDOFF_2026-08-06.md`](docs/handoff/HANDOFF_2026-08-06.md) e no
`DIARIO_DE_BORDO.md` (DB-018 a DB-021). Ficam aqui os três vermelhos, porque são os que alguém
precisa saber que existiram para não recriá-los:

| # | Item | Onde | Estado |
|---|---|---|---|
| P5.8 | 🔴 **Publicar 2× na mesma sessão apagava a 1ª publicação.** O retrato dos dados era congelado no closure; a 2ª montagem usava o de antes da 1ª. **55 turnos medidos.** E o guarda do passado aprovava, porque recebia o mesmo argumento envelhecido | `src/dados/carregar.ts` (`retratoPublicado`), `src/admin/Admin.tsx` (`setDados`) | ✅ **FECHADO 05/08** — provado no dado real, antes e depois. ⚠️ recarregar da rede foi RECUSADO: o Pages leva 1 min e traria o dado antigo de volta |
| P5.9 | 🔴 **`capacidade: 0` gerava 110 turnos com zero pessoas, e as DUAS réguas aprovavam.** D1 conta `0===0` como completo; D11 compara a grade com ela mesma; Q2 vê amplitude zero | `src/dominio/regras.ts` (`D12`), `conferencia-independente.ts` (promessa 0) | ✅ **FECHADO 05/08** — nasceu **D12**. ⚠️ ela nasceu com o defeito que existe para fechar (`slice` nos turnos, não nas violações); pego pela medição no dado real |
| P5.10 | 🔴 **A ponte dado→tela não tinha um único teste.** 4 mutantes que apagam a escala de todos os irmãos passavam em 232/232 | `src/dados/ponte-para-a-tela.test.ts` | ✅ **FECHADO 05/08** — 20 testes novos, um campo por vez, com valor absoluto |

| # | Item | Onde | Como reproduzir |
|---|---|---|---|
| P4.1 | 🟠 **Publicação concorrente entre abas.** `AbaPublicar` é desmontada ao trocar de aba, mas a promessa em voo não é cancelada; ao voltar, uma instância nova nasce com `ocupado=false` e permite clicar de novo. O resultado da primeira some sem confirmação nem erro | `src/admin/Admin.tsx:49` (`gravacaoEmVoo`) | ✅ **FECHADO 05/08** — trava modular (sobrevive à troca de aba, que era a causa). **Ampliada no mesmo dia** pela quinta auditoria: ela olhava só o Publicar, e `Voltar a esta versão` grava os MESMOS arquivos — por isso virou `gravacaoEmVoo`, e o motor ganhou a sua (`motorEmVoo`). ⚠️ terceira vez que a citação desta linha apodrece em 24 h: **coordenada em documento vivo não se guarda**, e é o portão de citações que segura |
| P4.2 | 🟠 **A mensagem amigável do token é código morto no caso mais comum.** `gravarArquivo` sempre faz um GET antes do PUT; `shaAtual` só trata 404 como especial, então um 401 sai como *"Não consegui ler … (HTTP 401)"* e a frase *"confira se ele expirou ou foi revogado"* nunca é alcançada. E 403 de limite de requisições e 500 do GitHub são rotulados como "token recusado" | `src/admin/github.ts:50-59`, `:61-89`, `:117-131` | ✅ **FECHADO 05/08** — fonte única de recusa; 401 no GET agora fala em token. 5 testes |
| P4.3 | ✅ **FECHADO 05/08** — `validar-admin.mjs` dá falso vermelho fora do build de produção.** Procura `assets/index-*.js`; em `npm run dev` o script é `/src/main.tsx`, o `.find()` volta `undefined` e o teste da criptografia quebra **antes** de rodar — parecendo que a cifra falhou | `scripts/validar-admin.mjs:44-45` | `npm run vivo:admin http://localhost:5173` |
| P4.4 | ⚪ **Corpo não-JSON em HTTP 200 vaza erro em inglês.** Todo `await r.json()` sem guarda: uma página de erro de intermediário vira `Unexpected token in JSON…` na tela, quebrando a convenção pt-BR | `src/admin/github.ts` (5 pontos) | ✅ **FECHADO 05/08** — `lerJSON` devolve frase em pt-BR, não SyntaxError |
| P4.5 | 🟠 **`validar-celular` mede 40px enquanto o comentário cita 44.** O texto ao lado invoca o piso da Apple (44) e do Material (48) como justificativa, e o código aprova de 40 para cima — sem declarar isso como convenção de casa | `scripts/validar-celular.mjs:72-81` | ✅ **FECHADO 05/08** — a régua media o campo errado; corrigida, e ganhou portão de deslocamento |
| P4.6 | ✅ **FECHADO** — `npm run imagem` é hoje o **passo 27 do gate** (conferido em 06/08/2026 contra o `package.json`). Era: É o único que renderiza o pixel; os 11 testes da imagem cobrem só as funções puras. Cor trocada, nome cortado ou cartão sobreposto passariam pelo GATE inteiro | `package.json` · `src/export/EscalaImagem.test.ts` | Trocar a cor de MANHÃ por NOITE e rodar `npm run gate` |
| P4.7 | ✅ **FECHADO 05/08** — `carga-inicial.mjs` usava `new Date().toISOString().slice(0,10)` — o antipadrão que o cabeçalho de `datas.ts` denuncia. Script de carga única, já rodado; só morde se for rerodado perto da meia-noite | `scripts/carga-inicial.mjs:193` | Rodar com `TZ=Europe/Berlin` às 23h BRT |
| P4.8 | ✅ **FECHADO** — falha de leitura da resposta do motor descartava a proposta inteira; JSON malformado aborta sem as 3 tentativas que uma falha de validação recebe; num bloco de vários meses, o trabalho já aceito se perde | `src/admin/motor.ts:97` (o `JSON.parse`) · `:240` (o `catch` que descarta) — ⚠️ as linhas `218-221` citadas antes envelheceram, **segunda ocorrência do mesmo apodrecimento no mesmo documento** | Devolver JSON truncado no 2º mês |
| P4.10 | 🔴 **O padrão da configuração só vale quando o download FALHA.** `buscarJSON<Configuracao>('config.json', PADRAO)` devolve o arquivo como veio: um `config.json` de versão anterior entrega `undefined` num campo que o TypeScript jura ser `string`. Com `identidade.pessoa` nascendo em 05/08, a primeira abertura mostraria *"Total de turnos por undefined e mês"* | `src/dados/carregar.ts` (`completarConfig`) · `src/dados/carregar.test.ts` | ✅ **FECHADO 05/08** — mescla campo a campo (a rasa devolveria `identidade` inteira do arquivo e o defeito passaria). 7 testes; **3 ficam vermelhos** contra implementação rasa injetada |
| P4.11 | 🔴 **O emblema institucional estava cravado por `import`** e o portão de escopo não o alcançava: um `import` de imagem não tem TEXTO de cliente. Renderizado no cabeçalho do site em desktop e celular, com `alt="Logo CCB"` | `src/App.tsx` · `src/dominio/tipos.ts` (`identidade.logo`) | ✅ **FECHADO 05/08** — o emblema vive em `dados/`, vazio = sem emblema; portão aprendeu a classe (`import … from './assets/…'`) |
| P4.12 | 🔴 **P4.5 foi marcado FECHADO com o defeito intacto.** A régua media 40px sob um comentário que invoca 44 (Apple) e 48 (Material); outro item foi consertado no mesmo dia e o P4.5 saiu junto. `BACKLOG.md` promete *"item que sai sem prova volta"* | `scripts/validar-celular.mjs` | ✅ **FECHADO 05/08** — régua em 44; medido antes: **todos os botões já passavam**, a folga não protegia nada |
| P4.13 | 🔴 **O instrumento que mediu os 87 turnos divergentes não existia no repositório.** Escrito solto, fora do git: o número que justificou recortar o histórico era **irreproduzível** | `scripts/comparar-com-site-divulgado.mjs` | ✅ **FECHADO 05/08** — `npm run vivo:divulgado -- --antigo <url>`; re-medido: 3 iguais · 84 divergentes |
| P4.14 | 🟠 **A checagem ao vivo se anunciava como "as 15 regras" e conferia 5 identificadores de amostra.** O catálogo tem 16, e uma amostra de 5 aprovaria uma tela que perdeu 11 | `scripts/validar-ao-vivo.mjs` | ✅ **FECHADO 05/08** — conta TODOS os IDs, lidos do catálogo do produto |
| P4.18 | 🔴 **`gerar-bloco.mjs --escrever` gravava em UMA pasta só** e contava com o `npm run build` para copiar para `docs/`, que é o que o GitHub Pages serve. Entre gerar e construir, o repositório tinha duas verdades. É o mesmo modo de falha que `publicarDados` foi escrita para não ter | `scripts/gerar-bloco.mjs` | ✅ **FECHADO 05/08** — grava nas duas. Quem pegou foi o auditor adversarial: *"os dois arquivos de dados são iguais?"* |
| P4.17 | 🔴 **O script escrevia a escala por um caminho PIOR que o da tela.** `gerar-bloco.mjs` usava `gerar()` guloso; a área administrativa usa `gerarVariasVersoes()` (8 versões, a melhor por piso e depois Jain). Fonte dupla silenciosa: as duas passam nas 17 regras, mas uma distribui melhor | `scripts/gerar-bloco.mjs` | ✅ **FECHADO 05/08** — mesmo caminho da tela, e o log imprime as 8 versões comparadas |
| P7.1 | 🔴 **Gerar período MENOR apagava escala já no ar.** `montarBlocosParaPublicar` guardava só a CABEÇA do bloco anterior; a CAUDA sumia. Medido no dado real: gerar `01/09→31/10` sobre o bloco que vai até 31/12 apagava **73 turnos** de nov+dez. E `conferirPassadoPreservado` **aprovava**, porque contava só o que vinha antes do corte | `src/dominio/blocos.ts` · `src/dominio/blocos.test.ts` | ✅ **FECHADO 05/08** — o bloco anterior é PARTIDO em cabeça e cauda. 11 testes; o conferidor agora acusa e diz **quais dias** sumiriam |
| P7.2 | 🔴 **O guarda do passado não estava ligado na TELA.** Vivia só no `gerar-bloco.mjs`, cujo cabeçalho diz *"não é ferramenta de produção"*. O botão que o Flavio clica publicava sem guarda nenhum | `src/admin/Admin.tsx` (`AbaPublicar`) | ✅ **FECHADO 05/08** — publicar trava e a mensagem nomeia as datas que sumiriam |
| P7.3 | 🔴 **`docs/PORTOES.md` descrevia 16 passos com o gate em 19** — os três portões do dia, em documento nenhum. E `OPERACAO.md`, ao lado, dizia 19: dois documentos vivos se contradizendo | `docs/PORTOES.md` | ✅ **FECHADO 05/08** — 19 descritos, com critério e população |
| P7.4 | 🔴 **Quarto buraco de fronteira: o fato "passos do gate" só via o número DEPOIS da palavra.** 4 documentos afirmavam a contagem, o portão cobria 1 — e saía verde com o P7.3 na frente dele | `scripts/medir-fatos.mjs` | ✅ **FECHADO 05/08** — padrão aceita número à esquerda. Limite declarado: por extenso continua fora |
| P7.5 | 🟠 **A unificação da manhã deixou a FRONTEIRA como fonte dupla**, no mesmo arquivo: o script varria só o último bloco anterior, a tela varre todos | `scripts/gerar-bloco.mjs` | ✅ **FECHADO 05/08** — varre todos |
| P7.6 | 🟠 **Portão de datas: permissão por ARQUIVO com padrão por LINHA.** Nos 3 arquivos permitidos, `const iso = ...toISOString()` + `iso.slice(0,7)` em duas linhas passava. E `getUTC*` — a mesma classe com outro nome — não era procurado | `scripts/portao-datas.mjs` | ✅ **FECHADO 05/08** — variáveis contaminadas são rastreadas; `getUTC*` acusa. Duas pontas provadas |
| P7.7 | 🟠 **`fronteira` recriada a cada render** no `Admin`, derrubando a memoização de `validar` e `conferirPorFora` nas abas Ajustar e Conferir | `src/admin/Admin.tsx` (`fronteira`) | 🔴 **ESTE ITEM FOI MARCADO FECHADO SEM TER SIDO FEITO** — a sétima auditoria (regressão) mostrou por `git blame` que as nove linhas estavam intactas desde 04/08: o que foi memoizado naquele dia foi um `fronteira` **homônimo**, dentro de `AbaGerar`. Havia razão estrutural para o engano — o cálculo ficava **depois** do `return` condicional do login, onde um hook é ilegal. ✅ **FECHADO DE VERDADE 05/08**, movido para antes do `return`. Segunda vez que esta classe aparece (a primeira foi o P4.5) |
| P7.8 | 🟠 **Populações erradas no `PORTOES.md`** (71/30/10 contra 83/31/17), no documento que ensina *"população impressa"* | `docs/PORTOES.md` | ✅ **FECHADO 05/08** |
| P7.9 | ⚪ **`useEffect` vazio** sobrou da remoção do estado fantasma no `DateSearch` | `src/components/DateSearch.tsx` | ✅ **FECHADO 05/08** |
| P7.10 | ⚪ **Comparação das duas pastas era byte a byte**, e acusou `config.json` por 47 fins de linha (CRLF vs LF) com conteúdo idêntico. Portão cronicamente vermelho ensina a ignorar vermelho | `scripts/auditoria-adversarial.mjs` | ✅ **FECHADO 05/08** — compara conteúdo normalizado; provado que ainda morde `ativo: true→false` numa pasta só |
| P6.1 | 🔴 **REGRESSÃO VIVA EM PRODUÇÃO, minha, do mesmo dia.** `ultimoDiaDoMes` misturava `Date.UTC` com `deData()` (getters locais) e devolvia o **penúltimo** dia de TODOS os meses em UTC−3. Q5 voltava a emitir o aviso falso que a mudança daquele dia existia para eliminar. **`test:fuso:berlim` era cego por construção** — só morde em fuso negativo, e o único fuso alternativo testado é o positivo | `src/dominio/regras.ts` (`ultimoDiaDoMes`) · `src/dominio/ultimo-dia-do-mes.test.ts` | ✅ **FECHADO 05/08** — `new Date(ano, m, 0)` local. 4 testes de **valor absoluto**, que não dependem do fuso de quem roda |
| P6.2 | 🔴 **`vivo:abas` imprimia ✅ ao lado de "(não encontrado)".** `null === null` contava como igual: 3 das 4 medições podiam virar inertes em silêncio | `scripts/validar-estado-entre-abas.mjs` | ✅ **FECHADO 05/08** — ausente reprova. Provado renomeando o rótulo na tela |
| P6.3 | 🔴 **O portão de arquitetura passava com ASPAS DUPLAS.** `import x from "y"` não casava, e `'./regras.js'` escapava da comparação exata. A invariante que a documentação chama de *"a pior falha possível"* tinha porta escancarada, e o projeto não tem linter forçando aspas | `scripts/conferir-arquitetura.mjs` | ✅ **FECHADO 05/08** — 4 formas cobertas (aspas duplas, `import()`, `require`, efeito colateral) + extensão ignorada |
| P6.4 | 🔴 **A Santa Ceia saía DUPLICADA na emenda dos blocos.** A chave incluía `santaCeia`, então o mesmo dia marcado num bloco e não marcado no outro sobrevivia duas vezes — uma vazia, outra com gente ao lado. É a forma exata do defeito fundador do projeto. Ninguém validava o resultado emendado | `src/dados/carregar.ts` (`emendarBlocos`) · `src/dados/emendar.test.ts` | ✅ **FECHADO 05/08** — chave é data+tipo. 6 testes; 2 vermelhos com a chave antiga |
| P6.5 | 🟠 **Q2 contava quem está FORA da escala** — a única regra de contagem que ainda percorria o `elenco` cru. Textualmente a reclamação do Flavio, na regra que sobrou da correção de nove | `src/dominio/regras.ts` (Q2) | ✅ **FECHADO 05/08** — usa `pessoasDoBloco`. E a lista de exceções, que dizia "só D8", passou a declarar que já esteve errada |
| P6.6 | 🟠 **"melhor de 0 versões" voltava pelo caminho do motor.** Aceitar a proposta chamava `aoGerar` com 2 argumentos | `src/admin/Admin.tsx` | ✅ **FECHADO 05/08** — a frase agora depende da ORIGEM do bloco; escala do motor tem texto próprio |
| P6.7 | 🟠 **Prop `fronteira` morta, sombreada por um `useMemo` local**, com semânticas divergentes | `src/admin/Admin.tsx` | ✅ **FECHADO 05/08** — prop removida, local declarada como a certa para a aba |
| P6.8 | 🟠 **`gerar-bloco.mjs` apagaria o bloco do meio** assim que houvesse três | `scripts/gerar-bloco.mjs` | ✅ **FECHADO 05/08** — todos os anteriores preservados, e **conta turnos antes/depois**, abortando se sumir. Provado com 3 blocos |
| P6.9 | 🟠 **Portões de número varriam só `.md`** — o "15 regras" do `ensaio` estava na SAÍDA que o operador lê | `scripts/conferir-contagem-de-regras.mjs` | ✅ **FECHADO 05/08** — varre `.md` e código: de 5 para **83** arquivos |
| P6.10 | 🟠 **7 citações `arquivo:linha` podres**, uma delas 7 linhas abaixo da própria lição, outra apontando para código inexistente | `scripts/conferir-citacoes.mjs` | ✅ **FECHADO 05/08** — portão novo. Confere arquivo, linha, e o SÍMBOLO citado junto |
| P4.20 | 🔴 **A tela dizia "esta escala é a melhor de 0 versões"** embaixo de uma escala escolhida entre oito. O número vivia DENTRO de `AbaGerar`, que é montada por condição: trocar de aba desmontava, e ao voltar nascia `0` — enquanto a escala, que mora no `Admin`, sobrevivia. Mesma classe do P4.1 | `src/admin/Admin.tsx` · `scripts/validar-estado-entre-abas.mjs` | ✅ **FECHADO 05/08** — estado subiu para onde o bloco vive. **Nenhum teste pegava, e nenhum ia pegar**: o defeito só existe depois de NAVEGAR. Provado restaurando o defeito num clone: 8 → 0 |
| P4.21 | 🔴 **`vivo:admin` estava VERMELHO desde 05/08 testando um fluxo que não existe mais.** Ele conferia `input[type="password"] >= 3` na tela de primeiro acesso; a S-013 fez entrar virar **um clique**, e os campos de senha passaram a aparecer só quando há segredo a guardar. 5 checagens obsoletas gritando vermelho sobre um produto certo | `scripts/validar-admin.mjs` | ✅ **FECHADO 05/08** — reescritas para o fluxo de hoje. ⚠️ Ficou vermelho **um dia inteiro** e ninguém viu, porque está **fora do GATE**. Régua velha não é neutra: vermelho crônico ensina a ignorar vermelho |
| P4.19 | 🔴 **A aba Gerar abria num período sem nenhum dia de culto.** Depois de publicar até 30/12, o início sugerido virou 31/12 e o fim era 31/12 do MESMO ano: janela de um dia, numa quinta. Quem clicasse em Gerar recebia *"a escala ficou inválida — o bloco está VAZIO"* | `src/admin/Admin.tsx` | ✅ **FECHADO 05/08** — o fim sugerido salta para o ano seguinte quando a janela nasce com menos de 30 dias, e a tela avisa ANTES de gerar se o período não tem dia de culto. A regra D11 estava certa; errado era deixar a pessoa chegar até lá para descobrir |
| P4.16 | 🔴 **Um soluço de rede virava tela de erro para o irmão.** `buscarJSON` desistia na primeira tentativa; um HTTP 503 do GitHub Pages durante deploy (visto ao vivo em 05/08) derrubava `blocos.json` e a pessoa que só queria saber se está escalada no domingo via erro | `src/dados/carregar.ts` · `src/dados/carregar-rede.test.ts` | ✅ **FECHADO 05/08** — 3 tentativas com espera crescente, só para o que melhora sozinho (rede e 5xx); **404 não é repetido**. 6 testes; **4 ficam vermelhos** com a repetição desligada |
| P5.1 | **Dados pessoais em repositório público.** 16 nomes (só nome próprio, sem sobrenome, sem contato) e a agenda de presença deles até dezembro | `public/dados/pessoas.json` | ✅ **DECIDIDO PELO FLAVIO 05/08** — *"esqueça LGPD neste caso"*. Escopo é a **fase 1**: uso interno da própria comum, para os próprios irmãos, que pediram a escala. ⏱️ **A fase 3 (venda) reabre** — lá o dado é de funcionários de um cliente, não de conhecidos. Fronteira em [`FINALIDADE_E_FASES.md`](docs/FINALIDADE_E_FASES.md) |
| P5.2 | 🟠 **Publicação concorrente entre DUAS PESSOAS.** P4.1 resolveu abas do mesmo navegador. `INSTALAR.md` agora admite um token por administrador; dois `PUT` com o mesmo `sha` base não têm política escrita | `src/admin/github.ts` | Declarado. Hoje o segundo recebe 409 e a mensagem manda recarregar — falta decidir se relê e reaplica |
| P5.3 | **`blocos.json` só cresce.** Nunca há arquivamento; a Contents API tem teto por arquivo | `public/dados/blocos.json` | ✅ **FECHADO 18/08/2026 — teto medido com fonte, não mais "por medir".** Local: **43.773 bytes, 183 turnos → 239 bytes/turno** (08/08 media 228; a diferença é o campo de esquema do P5.4, que nasceu depois). Anual: ~220 turnos/ano (medido em DB-046 para 2027–2029) × 239 bytes ≈ **52,6 KB/ano**. Teto: a [documentação oficial do GitHub](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github) só declara limite **geral** de arquivo — aviso em 50 MiB, bloqueio em 100 MiB (a Contents API grava via commit normal, sujeito ao mesmo teto; não achei número mais restritivo específico do endpoint PUT documentado em nenhuma fonte, e "não encontrado" é resposta válida). Usando o número **mais conservador** dos dois (50 MiB = 52.428.800 bytes): **~997 anos** de folga no ritmo atual. Não é dívida real — é declarado fechado, não "declarado por medir" |
| P5.4 | **Sem validação de esquema em `pessoas.json` e `blocos.json`** — `id` duplicado ou turno citando `id` inexistente passavam direto; o sintoma conhecido era o id cru na tela | ✅ **FECHADO no código em 06/08** (`b3ca016`) e no registro só em 08/08 — terceira ocorrência da classe "aberto no papel, pronto no código". `conferirEsquema` (`src/dados/carregar.ts`) confere id único, nome, datas que existem, referências e repetição no turno; ligado em `carregarDados()`; **não derruba o site** (defeito de dado avisa no console e a escala continua). Provado nas duas pontas em `src/dados/esquema.test.ts` |
| P5.5 | **Idioma cravado** (pt-BR em toda tela) | todo texto de tela | ⏱️ **FASE 3, e só lá.** As fases 1 e 2 são congregações brasileiras. Não é dívida enquanto o escopo for o Brasil — está declarado, não esquecido |
| P5.6 | ⚪ **Sem CI.** O GATE roda na máquina de alguém — nada impede um `push` que nunca passou por ele. ⚠️ A metade "sem LICENSE" desta linha **envelheceu**: a licença proprietária existe na raiz desde 06/08/2026 (`b3ca016`), e este registro só foi corrigido em 08/08 | raiz do repositório | Declarado — ligar CI é decisão 👤 (consome minutos do GitHub Actions da conta) |
| P5.7 | **Casos-limite sem comportamento esperado escrito** — o desenho listava três (elenco vazio, bloco de um dia, todos ausentes) sem dizer a saída correta de nenhum | ✅ **FECHADO 08/08** — os três MEDIDOS antes de afirmados: o código já fazia o certo (D-03 cobre todos — recusa declarada com motivo acionável; um dia com culto gera com piso 1). Saída esperada escrita em `docs/ALGORITMO.md` (§ Casos-limite) e travada em `src/dominio/casos-limite.test.ts` (4 testes) — uma regressão que trocasse recusa declarada por escala vazia silenciosa agora fica vermelha |
| P4.15 | 🏠 **Declarado — conferido nas TRÊS pontas em 06/08/2026** (código, este documento e a TELA: *"tolerância de 1 abaixo do teto (convenção de casa)"* aparece na conferência regra a regra, medido ao vivo). É o que o protocolo de desempate exige quando não há fonte externa. **A tolerância de 1 abaixo do teto é convenção de casa**, não padrão pesquisado. Se um cliente quiser outra, hoje é edição de código — `TOLERANCIA_ABAIXO_DO_TETO` em `regras.ts`. Candidata a virar configuração **quando alguém pedir**, não antes (§0 pede tela para o que varia; ninguém pediu ainda) | `src/dominio/regras.ts` | ⚪ **DECLARADA**, não é defeito — está no código, na tela e no `AGENTS.md` |
| P4.9 | ⚪ **Declarado.** **O piso não é um máximo comprovado.** A busca é gulosa e **sem retrocesso**: é o maior que esta busca conseguiu, não o maior que existe. Já está declarado no docstring; trocar por busca com retrocesso é o que tornaria o número um máximo de fato | `src/dominio/gerador.ts` | Medido: piso 7 falha em 03/10/2026 |
| P8.1 | 🔵 **Dois portões de citação fazem o mesmo trabalho, e o mais fraco é o que está ligado ao gate.** `scripts/conferir-citacoes.mjs` (origem do P6.10, 05/08) também confere o SÍMBOLO citado junto da linha — o wired `scripts/portao-citacoes.mjs` (`npm run citacoes`, no gate) só confere que arquivo e linha existem. Achado ao construir `docs/capacidades.json` (S-058, adoção da árvore de capacidades) — `conferir-citacoes.mjs` ficou órfão, sem `npm run` e fora do gate | `scripts/conferir-citacoes.mjs`, `scripts/portao-citacoes.mjs` | Declarado — decisão 👤: religar `conferir-citacoes.mjs` no lugar do atual, ou fundir o cheque de símbolo dentro dele. Nenhum dos dois some sem decisão |

---

## P3 — Produto ⚪

| # | Item | Estado |
|---|---|---|
| P3.14 | Regra Mestra 3 — tooltips em 100% dos botões, com portão no GATE | ✅ 04/08 — era 17% |
| P3.15 | `README.md` — porta de entrada do repositório | ✅ 04/08 |
| P3.16 | Validação ao vivo em **celular** | ✅ 04/08 — achou alvo de toque de 16px, corrigido |
| P3.17 | **Arrastar-e-soltar** (Regra Mestra 3) | ⚖️ **NÃO implementado, por decisão declarada** — pioraria o ajuste manual, que mostra o motivo *antes* do clique. Ver [handoff](docs/handoff/HANDOFF_2026-08-04-d.md). 👤 o Flavio pode decidir o contrário |


| # | Item | Estado |
|---|---|---|
| P3.1 | Modelo de dados: `pessoas.json`, `blocos.json`, `config.json` | ✅ 04/08 |
| P3.2 | Catálogo de regras executável — **12 duras + 5 de qualidade**, cada uma com teste das duas pontas | ✅ 04/08 — 55 testes |
| P3.3 | Carga inicial: congelar 01/03 → 04/08, **contando as duas pontas** (ERRO 23) | ✅ 04/08 — 184/549/549 |
| P3.4 | Algoritmo com piso **descoberto** por busca | ✅ 04/08 — piso 6, tentou 9/8/7 |
| P3.5 | Site público lendo os JSON | ✅ 04/08 — validado ao vivo |
| P3.6 | Engrenagem discreta + login que **descriptografa** | ✅ 04/08 — cifragem provada no navegador |
| P3.7 | Telas administrativas: elenco, gerar, conferir | ✅ 04/08 |
| P3.8 | Publicação por commit via API do GitHub + baixar JSON | ✅ 04/08 — código pronto; **falta o Flavio colar o token** |
| P3.9 | **Motor**: proposta, placar, explicação, arbitragem e auditoria | ✅ 04/08 — portão entre a proposta e a publicação |
| P3.10 | Histórico de publicações com reversão pela tela | ✅ 04/08 — e ligou `historicoPublicacoes()`, que estava sem consumidor |
| P3.11 | Primeira geração real 05/08 → 30/12, com Santa Ceia em 16/08 | ✅ 04/08 — publicada |
| P3.12 | **Ajuste manual** turno a turno, com o motivo antes do clique | ✅ 04/08 |
| P3.13 | Mês lido em UTC (3 pontos) | ✅ 04/08 — portão de fuso provado nas duas pontas |

---

## Como usar este arquivo

- **Concluiu um item?** Tire daqui e registre no histórico com data e **evidência** (`arquivo:linha`,
  saída de teste, captura ao vivo). Item que sai sem prova volta.
- **Descobriu algo novo?** Entra aqui **no ato**, com prioridade.
- **Item de P0 nunca é decidido pelo assistente** — mesmo que a resposta pareça óbvia.
