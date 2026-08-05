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
4. Se não gostar, **Gerar outra combinação** — muda o sorteio e monta outras oito.
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

---

## Parte 2 — Como conferir que está certo

### A validação que os irmãos veem

Aba **Validação** no site público: roda as **16 regras** do catálogo e mostra o resultado.

### "Conferir por fora" — e por que é diferente

Só na área administrativa. É uma **segunda régua**: reimplementa as regras por outro caminho, sem
importar uma linha do catálogo. Monta a linha do tempo de cada pessoa, em vez de percorrer regras.

| | Validação (pública) | Conferir por fora (administrativo) |
|---|---|---|
| O que roda | as 16 regras do catálogo | uma implementação **independente** |
| Para quê | mostrar que a escala está boa | **discordar**, se houver do que discordar |

Se as duas concordam, a escala tem duas opiniões independentes a favor. Se discordam, **uma das duas
está errada** — e é melhor descobrir antes da congregação descobrir.

---

## Parte 3 — Para quem mexe no código

### O GATE — nada passa sem isto

```bash
npm run gate
```

16 passos, nesta ordem:

| Passo | O que prova |
|---|---|
| `typecheck` | `strict` ligado |
| `test` | a suíte **completa**, nunca escopada |
| `test:fuso:berlim` | a mesma suíte noutro fuso, **depois de provar que o fuso mudou** — em UTC−3 um defeito de fuso é invisível |
| `denominacao` | nenhum jargão comoditizado em texto que alguém lê |
| `fontes` | nenhuma fonte externa chamada sem estar declarada no inventário |
| `contagem` | nenhum documento vivo declara um número de regras que o catálogo desmente |
| `cadeia` | os documentos apontam para o handoff que É o mais recente |
| `generico` | nenhum nome de cliente cravado no código (§0) |
| `generico:autoteste` | prova que o portão acima **morde** — 21 casos, mais a autodefesa |
| `doc:regras:conferir` | o catálogo de regras documentado bate com o código |
| `auditoria` | 20 ataques ao próprio código, com infrator injetado |
| `doc:comandos` | todo `npm run` citado na documentação existe de verdade |
| `arquitetura` | o domínio continua sendo uma ilha; a segunda régua não virou espelho da primeira |
| `fatos` | nenhum documento vivo desmente um número **medido** (passos do gate, casos de autoteste, piso…) |
| `regras-mestras` | tooltip em todo botão |
| `build` | compila e gera em `docs/` |

### As validações AO VIVO — fora do gate, de propósito

Elas abrem o site **publicado** num navegador de verdade. Não entram no `gate` porque dependem da
rede e do GitHub Pages, e **portão que quebra por causa alheia é portão que alguém desliga.**

Rodar **depois de publicar**:

| Comando | O que confere |
|---|---|
| `npm run vivo` | a tela renderizou, as 16 regras aparecem, sem erro no console |
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
