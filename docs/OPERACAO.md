# Operação — como usar e como conferir

> **Cadeia:** [`AGENTS.md`](../AGENTS.md) → [`docs/RECONSTRUIR.md`](RECONSTRUIR.md) → **você está aqui**
>
> Vizinhos: [`MODELO_DE_DADOS.md`](MODELO_DE_DADOS.md) · [`ARQUITETURA.md`](ARQUITETURA.md)

---

## Parte 1 — Para quem administra a escala

### Entrar

`https://<seu-site>/#/admin`

Na **primeira vez**, cola-se o token do GitHub e escolhe-se uma senha. Daí em diante **só a senha** —
o token fica guardado cifrado no navegador (PBKDF2 + AES-GCM), nunca no repositório.

Se trocar de aparelho ou limpar o navegador, o token é pedido de novo. Não há como recuperá-lo: ele
só é mostrado uma vez pelo GitHub.

### O token, uma vez só

Em **github.com → Settings → Developer settings → Personal access tokens → Fine-grained**:

| Campo | Valor |
|---|---|
| Token name | qualquer coisa |
| Repository access | **Only select repositories** → só este repositório |
| Repository permissions | **Contents: Read and write** |

🔴 **"Only select repositories"** é o que garante que este site não enxerga nenhum outro projeto seu.

### As cinco abas

| Aba | Para quê |
|---|---|
| **Elenco** | Quem participa. Tirar alguém, acrescentar, e cadastrar as 5 restrições — inclusive **férias** |
| **Gerar escala** | Escolhe o período e monta. Mostra a conferência regra a regra e o que o motor propôs |
| **Ajustar** | Trocar **uma** pessoa num turno. Mostra quem pode entrar e **por que** os outros não podem |
| **Conferir por fora** | A segunda régua, independente. Ver abaixo |
| **Publicar** | Sobe para o ar |

### Gerar uma escala

1. Escolha **de** e **até**. Datas anteriores a hoje ficam bloqueadas — passado divulgado não se
   reescreve.
2. Clique em **Gerar escala**.
3. Leia a conferência. **Vermelho trava a publicação; amarelo é informação.**
4. Se não gostar, **Gerar outra combinação** — muda o sorteio e monta outras oito. Se a escala sair
   **idêntica**, a tela avisa: não é defeito, é o sistema dizendo que já achou a melhor que consegue
   para este período e este elenco. Para obter outra de verdade, mude a **entrada** (o período, quem
   está ativo, as restrições, as pessoas por turno).
5. **Publicar.**

⚠️ **Gerar de novo produz uma combinação diferente.** Se a escala atual já foi divulgada e está boa,
não gere: só publique quando quiser mesmo mudar.

### Marcar férias de alguém

Aba **Elenco** ou direto na aba **Gerar escala** — são a mesma informação, espelhada. Cadastre o
intervalo **antes** de gerar; a regra D6 impede que a pessoa entre naqueles dias.

### Publicar

O botão escreve nas **duas pastas** (`public/dados/` e `docs/dados/`) e o GitHub Pages reconstrói o
site em ~40 segundos.

Se falhar no meio, a mensagem diz **o que já foi gravado** — para ninguém achar que nada subiu
quando metade subiu.

### Voltar a uma versão anterior

O painel **Histórico de publicações**, no fim da aba Publicar, lista as últimas publicações. Ele abre
**sem token** (histórico de repositório público qualquer um lê); os botões de voltar só aparecem com
token, porque reverter é uma **escrita**.

⚠️ **Cada publicação é um commit por arquivo**, então o que se reverte é `pessoas.json` **ou**
`blocos.json` **ou** `config.json` — um de cada vez, nunca "tudo para aquele ponto". Isso importa: o
elenco e a escala são coerentes entre si, e voltar só um dos dois quebra a coerência.

Desde 05/08/2026 esse caminho tem guarda, e ele lê a versão **antes** de gravar:

| o que a reversão faria | o que acontece |
|---|---|
| reescrever um dia que **já passou** | 🔴 **impedido**, nada é gravado — o site não desmente o que as pessoas já viram |
| deixar alguém escalado **fora do elenco** | 🔴 **impedido** — a tela mostraria o código no lugar do nome |
| mudar turnos **futuros** | ⚠️ pergunta, dizendo **quantos** — é para isso que reverter existe |

> Antes desse guarda, medido pela sexta auditoria: voltar só o elenco deixaria **120 de 543 nomes
> saindo como código cru em 70 dias**, e a mensagem de sucesso saía verde.

---

### A virada de ano — a escala de 2027, 2028, 2029…

O motor gera qualquer ano **hoje**: medido em 07/08/2026 com o elenco real e a fronteira de 2026,
os anos 2027, 2028 e 2029 saíram com ~220 turnos cada, determinísticos (duas gerações idênticas
byte a byte) e aprovados pelas duas réguas. **O que o motor NÃO sabe sozinho é o calendário do ano
novo** — e é só isso que a virada exige de quem administra:

1. **Cadastrar as Santas Ceias do ano novo ANTES de gerar** (aba Gerar → "Dias de Santa Ceia").
   ⚠️ É a lacuna que já mordeu: em 06/08/2026 um bloco de 2027 foi gerado sem nenhuma Santa Ceia —
   **104 domingos com porteiros escalados** num ano em que as Ceias nem estavam marcadas. A tela
   avisa (*"Nenhuma Santa Ceia cadastrada entre … e …"*) — **leia o aviso**;
2. Conferir o **elenco** (quem entrou, quem saiu, restrições novas);
3. Gerar com "De" no primeiro dia após a última escala publicada — a sugestão de "Até" já cobre o
   ano inteiro; a **fronteira** (espaçamento e cota do mês) com o bloco anterior o sistema carrega
   sozinho;
4. Conferir (Validação + Conferir por fora), publicar, e **divulgar pelo modelo da casa**
   ([`COMUNICACOES.md`](COMUNICACOES.md)) — inclusive o pedido de apagar a escala velha.

Nada disso é código novo: é operação. O que é do código — gerar, validar, publicar, refazer — já é
plurianual e está provado pelos portões (`refazer` reconstrói o publicado turno a turno).

## Parte 2 — Como conferir que está certo

### A validação que os irmãos veem

Aba **Validação** no site público: roda as **17 regras** do catálogo e mostra o resultado.

### "Conferir por fora" — e por que é diferente

Só na área administrativa. É uma **segunda régua**: reimplementa as regras por outro caminho, sem
importar uma linha do catálogo. Monta a linha do tempo de cada pessoa, em vez de percorrer regras.

| | Validação (pública) | Conferir por fora (administrativo) |
|---|---|---|
| O que roda | as 17 regras do catálogo | uma implementação **independente** |
| Para quê | mostrar que a escala está boa | **discordar**, se houver do que discordar |

Se as duas concordam, a escala tem duas opiniões independentes a favor. Se discordam, **uma das duas
está errada** — e é melhor descobrir antes da congregação descobrir.

---

## Parte 3 — Para quem mexe no código

### O GATE — nada passa sem isto

> Aqui está **como rodar**. Cada portão **por dentro** — critério, população, o que ele decidiu não
> olhar — está em [`PORTOES.md`](PORTOES.md).

```bash
npm run gate
```

33 passos, **nesta ordem** — lida do `package.json`, não de memória:

| # | Passo | O que prova |
|---|---|---|
| 1 | `segredos` | 🔐 **nenhum segredo em arquivo versionado.** O repositório é PÚBLICO e o token tem escrita nele — vem primeiro de propósito: é o único passo cuja falha não se conserta commitando de novo |
| 2 | `typecheck` | `strict` ligado — sem ele o TypeScript nem estreita união discriminada |
| 3 | `test` | a suíte **completa**, nunca escopada |
| 4 | `test:fuso:berlim` | a mesma suíte noutro fuso, **depois de provar que o fuso mudou** |
| 5 | `denominacao` | nenhum jargão comoditizado em texto que alguém lê |
| 6 | `markdown-cru` | ✳️ **asterisco de markdown vazando para a tela** — 517 trechos medidos. Achado ao OLHAR uma captura, não ao medir: o texto está lá, só está feio, e toda checagem de DOM casava. Comentários ficam de fora, de propósito |
| 7 | `fontes` | nenhuma fonte externa chamada sem estar declarada no inventário |
| 8 | `contagem` | nenhum documento **ou código** declara um número de regras que o catálogo desmente |
| 9 | `ordem-do-gate` | 🔢 **a ordem escrita é a ordem que roda** — as duas listas numeradas conferidas contra o `package.json`: número aponta para o passo certo, números crescem na ordem física do arquivo, nenhum passo fica de fora. O total já era medido; a ordem, não, e `build` estava documentado como 21º rodando em 24º |
| 10 | `cadeia` | os documentos apontam para o handoff que É o mais recente |
| 11 | `handoff-orfao` | 🔗 **nenhum handoff fica órfão**: todo `HANDOFF_*.md` do disco é citado no índice, todo citado existe, e nenhum aparece em duas linhas de tabela. O `cadeia` mede o ponteiro para o mais recente; este mede se os OUTROS continuam alcançáveis |
| 12 | `proximo-id` | 🆔 **o "próximo identificador livre" é mesmo o próximo** — varre TODAS as fatias de `docs/solicitacoes/` (depois de uma rotação o maior ID sai de vista) e recusa ID duplicado no corpo. A regra estava documentada com o motivo ao lado e **inerte**: dizia S-032 com o S-033 escrito abaixo |
| 13 | `generico` | nenhum nome de cliente cravado (§0) |
| 14 | `generico:autoteste` | prova que o de cima **morde** — e que a autodefesa dele morde |
| 15 | `guarda-vivo:autoteste` | prova que a guarda do disparador ao vivo **morde** — 6 nomes limpos aprovados, 10 hostis barrados (`; rm -rf /`, backtick-whoami, `$(whoami)`, `&&`, aspas, string vazia) |
| 16 | `generico:docs` | 📄 **o nome do cliente na documentação é inventário fechado** — 12 citações em 7 arquivos, cada uma com motivo. Não proibido (o README diz "esta instalação atende…"): reprova citação a mais, arquivo novo fora do inventário, e citação a MENOS |
| 17 | `citacoes` | 🔗 **`arquivo:linha` que envelheceu sozinho** — o arquivo existe e tem aquela linha. O próprio BACKLOG registrou o problema duas vezes e não tinha como impedir a terceira. NÃO confere se o conteúdo da linha ainda é o descrito |
| 18 | `doc:regras:conferir` | o catálogo de regras documentado bate com o código |
| 19 | `doc:comandos` | todo comando citado na documentação existe de verdade |
| 20 | `arquitetura` | o domínio continua sendo ilha; a 2ª régua não virou espelho |
| 21 | `fatos:conferir` | nenhum documento vivo desmente um número **medido** |
| 22 | `datas` | `toISOString()` não decide dia nem mês em lugar nenhum |
| 23 | `crescimento` | o dado publicado ainda cabe onde vai ser servido |
| 24 | `tamanho-docs` | nenhum documento passou do teto do regime dele (raiz 400 · subpasta 800 · append-only 2.000) |
| 25 | `auditoria` | 21 ataques ao próprio código, com infrator injetado |
| 26 | `regras-mestras` | tooltip em todo botão |
| 27 | `ensaio` | 🔴 o cenário que ORIGINOU o projeto, ponta a ponta: alguém sai do elenco, outro entra com as 5 restrições, a escala se refaz a partir de um corte |
| 28 | `tempo` | a geração não regrediu de desempenho |
| 29 | `build` | compila e gera em `docs/` |
| 30 | `imagem` | 🔴 o único passo que **renderiza o pixel**: gera a imagem pelo botão de verdade e mede o DOM que virou o PNG — texto cortado, rótulo duplicado, rodapé coerente. Três defeitos da imagem escaparam de todos os outros portões e só apareceram ao ABRIR o arquivo |
| 31 | `vivo:tudo` | 🌐 **as 15 validações de navegador do grupo LOCAL**, lidas do `package.json` — 242 s (medido em 18/08/2026). De dezesseis `vivo:*`, o gate rodava **uma**; o `vivo:gerar` estava vermelho havia dias. As 5 do grupo NO AR rodam DEPOIS do push (`npm run vivo:no-ar`) — no gate ficariam estruturalmente vermelhas |
| 32 | `refazer` | 🔁 **a escala NO AR pode ser refeita** a partir do que ela mesma registra — período, elenco, malha, piso e semente. É a promessa do `ALGORITMO.md` medida contra o dado publicado, não contra entrada de teste |
| 33 | `selo:gravar` | 🔒 guarda a impressão digital da árvore. `npm run selo:conferir`, antes de commitar, prova que o verde acima é **desta** árvore |

---

## 🔴 DEPOIS DO PUSH: `push` NÃO é publicação

O gate verde, o selo conferido e o `push` sem erro dizem tudo sobre **a sua máquina** e nada sobre
**o que o servidor está servindo**. Entre os dois existe um terceiro ator — a fila de publicação do
GitHub Pages — que não responde a nada que este projeto controla.

Em 06/08/2026 ela falhou **quatro vezes seguidas**: o build passava, a publicação era criada, e
ficava em `deployment_queued` até bater o teto de 10 minutos (`Timeout reached, aborting!`). O
`githubstatus.com` marcava Pages como **operacional** no mesmo instante. Três correções da tela
pública ficaram commitadas e fora do ar, e todos os sinais do projeto apontavam verde.

```bash
npm run vivo:no-ar    # compara o pacote NO AR com o commitado — é o último passo, sempre
```

⚠️ **Duas armadilhas aprendidas na hora de destravar:**

- **o identificador da publicação é o SHA do commit.** Cancelar uma publicação travada pela API
  envenena toda tentativa seguinte **do mesmo commit** — ela nasce "Deployment cancelled". Para
  destravar de verdade é preciso um **SHA novo**: um commit a mais;
- **`gh api --method POST .../pages/builds` reenfileira**, mas reutiliza o mesmo SHA — logo, sozinho
  não resolve depois de um cancelamento.

Se falhar de novo, o caminho é esperar: a fila é do GitHub, e o repositório aqui tem 42 arquivos e
881 KB — não é tamanho, não é Jekyll (`docs/.nojekyll` existe) e não é cota.


> ⚠️ Esta tabela já esteve **fora de ordem e incompleta**: listava 12 linhas para 15 comandos e
> trocava `auditoria` de posição — achado por auditoria externa em 05/08/2026. Mexeu no `gate`,
> mexe aqui no mesmo passo (e o portão `fatos:conferir` cobra).
>
> 🔴 **`ensaio`, `tempo` e `imagem` ENTRARAM em 05/08/2026**, pela sexta auditoria. Os três rodam sem
> rede e sem credencial — a exclusão dos `vivo:*` nunca valeu para eles, e ficaram de fora por
> inércia. O mais caro era o `imagem`: **o único que renderiza o pixel**, e o `BACKLOG P4.6` já
> declarava que cor trocada, nome cortado e cartão sobreposto só aparecem ao abrir o PNG — três vezes
> neste projeto um defeito da imagem escapou de todos os outros portões.

### As validações AO VIVO — fora do gate, de propósito

Elas abrem o site **publicado** num navegador de verdade. Não entram no `gate` porque dependem da
rede e do GitHub Pages, e **portão que quebra por causa alheia é portão que alguém desliga.**

Rodar **depois de publicar**:

| Comando | O que confere |
|---|---|
| `npm run vivo` | a tela renderizou, as 17 regras aparecem, sem erro no console |
| `npm run vivo:caminho` | 🔴 **o caminho INTEIRO de quem administra**, num navegador: site público → filtro por data → atalhos → Validação → Elenco → Gerar → Ajustar → Conferir por fora → Publicar → e de volta |
| `npm run vivo:conferir` | cada dia e cada nome do JSON chega inteiro à tela |
| `npm run vivo:divulgado -- --antigo <url>` | 🔴 se a escala nova **desmente** o que já foi divulgado |
| `npm run vivo:identidade` | o nome do site vem do dado, com um cliente inventado |
| `npm run vivo:celular` | alvo de toque ≥ 44px, campo não foge sob o dedo |
| `npm run vivo:admin` | o cofre cifra de verdade |
| `npm run vivo:erro` | falha de carregamento vira frase em português, não tela branca |

### 🔴 O portão que faltava, e que o dono achou sozinho

`npm run vivo:divulgado` existe porque, em 05/08/2026, a escala nova contradizia **em todos os 87
turnos** o site que a congregação já tinha o link — e **nenhum portão pegou**. Todos comparavam o
site novo com o **dado** do site novo: coerência interna impecável, enquanto a escala inteira
contradizia o mundo.

> **Coerência interna não é verdade.** O que foi DIVULGADO é a referência.

### Regenerar a escala por fora do navegador

```bash
node scripts/gerar-bloco.mjs --de 2026-08-06 --ate 2026-12-31            # simula e mede
node scripts/gerar-bloco.mjs --de 2026-08-06 --ate 2026-12-31 --escrever # grava nas DUAS pastas
```

### Gerar as imagens do WhatsApp

```bash
npm run imagem 2026-09
```

Aperta o botão de verdade no site, num navegador — não chama a função por dentro. Se o clique não
levar ao download, o defeito é do produto.

---

## Parte 4 — Quando algo dá errado

| Sintoma | Provável causa | Onde olhar |
|---|---|---|
| A escala no site está velha | gravou em uma pasta só | comparar `public/dados/` com `docs/dados/` |
| "Não foi possível gerar" | restrições apertadas demais, ou fronteira contaminada | o log diz **onde travou** e quantos faltaram |
| Tela branca | um dos 3 JSON não carregou | console do navegador; `carregar.ts` tenta 3× antes de desistir |
| Publicar recusado | token expirado, sem permissão, ou limite de requisições | a mensagem **nomeia a caixa a marcar** no GitHub |
| Site no ar diferente do commitado | o Pages ainda não reconstruiu | esperar ~40 s; `npm run vivo` acusa |
