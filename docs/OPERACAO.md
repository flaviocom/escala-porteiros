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

20 passos, **nesta ordem** — lida do `package.json`, não de memória:

| # | Passo | O que prova |
|---|---|---|
| 1 | `typecheck` | `strict` ligado — sem ele o TypeScript nem estreita união discriminada |
| 2 | `test` | a suíte **completa**, nunca escopada |
| 3 | `test:fuso:berlim` | a mesma suíte noutro fuso, **depois de provar que o fuso mudou** |
| 4 | `denominacao` | nenhum jargão comoditizado em texto que alguém lê |
| 5 | `fontes` | nenhuma fonte externa chamada sem estar declarada no inventário |
| 6 | `contagem` | nenhum documento **ou código** declara um número de regras que o catálogo desmente |
| 7 | `cadeia` | os documentos apontam para o handoff que É o mais recente |
| 8 | `generico` | nenhum nome de cliente cravado (§0) |
| 9 | `generico:autoteste` | prova que o de cima **morde** — e que a autodefesa dele morde |
| 10 | `doc:regras:conferir` | o catálogo de regras documentado bate com o código |
| 11 | `doc:comandos` | todo comando citado na documentação existe de verdade |
| 12 | `arquitetura` | o domínio continua sendo ilha; a 2ª régua não virou espelho |
| 13 | `fatos:conferir` | nenhum documento vivo desmente um número **medido** |
| 14 | `datas` | `toISOString()` não decide dia nem mês em lugar nenhum |
| 15 | `citacoes` | nenhuma citação `arquivo:linha` aponta para o vazio |
| 16 | `crescimento` | o dado publicado ainda cabe onde vai ser servido |
| 17 | `tamanho-docs` | nenhum documento passou do teto do regime dele (raiz 400 · subpasta 800 · append-only 2.000) |
| 18 | `auditoria` | 20 ataques ao próprio código, com infrator injetado |
| 19 | `regras-mestras` | tooltip em todo botão |
| 20 | `build` | compila e gera em `docs/` |

> ⚠️ Esta tabela já esteve **fora de ordem e incompleta**: listava 12 linhas para 15 comandos e
> trocava `auditoria` de posição — achado por auditoria externa em 05/08/2026. Mexeu no `gate`,
> mexe aqui no mesmo passo.

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
