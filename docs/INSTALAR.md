# Instalar do zero — e publicar para um cliente novo

> **Cadeia:** [`AGENTS.md`](../AGENTS.md) → [`docs/RECONSTRUIR.md`](RECONSTRUIR.md) → **você está aqui**
>
> Vizinhos: [`MODELO_DE_DADOS.md`](MODELO_DE_DADOS.md) · [`OPERACAO.md`](OPERACAO.md)

---

## O que precisa estar na máquina

| Ferramenta | Versão usada | Por que essa |
|---|---|---|
| **Node.js** | 25.8.0 (testado) · **mínimo 20** | Precisa de `fetch` embutido e `node --test` moderno. Os scripts usam ESM com *top-level await* |
| **npm** | 11.11.0 | Vem com o Node |
| **git** | qualquer recente | O histórico da escala **é** o histórico do git |

Nada mais. Não há banco de dados, servidor, Docker, nem processo em segundo plano.

```bash
git clone <repositorio>
cd <pasta>
npm ci
npm run gate      # tem de sair 0 antes de qualquer coisa
npm run dev       # http://127.0.0.1:5173
```

⚠️ **`npm ci`, não `npm install`.** O `ci` respeita o `package-lock.json`; o `install` pode subir
versões e você passa a depurar um bug que não é seu.

### Dependências, e por que cada uma

| Pacote | Para quê | Dava para não usar? |
|---|---|---|
| `react` + `react-dom` | a tela | não, sem reescrever tudo |
| `date-fns` | formatação de data **na tela** | 🔴 **a lógica de data é nossa** (`src/dominio/datas.ts`). `date-fns` só formata |
| `lucide-react` | ícones | sim, ao custo de desenhar cada um |
| `clsx` | juntar classes CSS condicionais | sim — são 5 linhas |
| `html-to-image` | a imagem do WhatsApp | é o miolo da exportação |

Ferramentas de desenvolvimento: `vite` 7 · `typescript` 5.8 (`strict`) · `vitest` 3 ·
`tailwindcss` 3.4 · `playwright` (validação ao vivo) · `esbuild` (os scripts compilam o domínio na
hora, para usar o **mesmo** código do produto).

### O que o navegador do usuário precisa ter

| Recurso | Onde é usado | Se faltar |
|---|---|---|
| `crypto.subtle` | o cofre do token (PBKDF2 + AES-GCM) | **só a área administrativa** para de funcionar. O site público continua |
| `fetch` | ler os 3 JSON | nada carrega |
| `<dialog>` | o seletor de meses | o diálogo não abre |

Todos existem em qualquer navegador de 2020 em diante. ⚠️ `crypto.subtle` **exige HTTPS** (ou
`localhost`): num servidor `http://` a área administrativa não abre o cofre.

---

## Publicar para um cliente NOVO — o caminho inteiro

O produto é genérico. Instalar para outro cliente é trocar **dado**, nunca código — e há portão que
reprova o *build* se alguém cravar um nome (§0 do [`AGENTS.md`](../AGENTS.md)).

### 1. Criar o repositório

Um repositório novo no GitHub. Em **Settings → Pages**, apontar para a branch principal, pasta
`/docs`.

### 2. Ajustar o caminho base

Em `vite.config.ts`, `base` precisa ser `/<nome-do-repositorio>/`. O GitHub Pages serve o projeto
sob esse caminho; errar aqui dá **tela em branco sem erro no console** — o pior desfecho, porque
parece que o site está no ar.

Se for domínio próprio na raiz, `base: '/'`.

### 3. Escrever `public/dados/config.json`

Ver [`MODELO_DE_DADOS.md`](MODELO_DE_DADOS.md). O mínimo:

```json
{
  "versao": 1,
  "capacidadePadrao": 2,
  "malhaPadrao": { "regras": [{ "diaSemana": 1, "turnos": ["MANHA", "NOITE"] }] },
  "santaCeia": [],
  "identidade": {
    "titulo": "Portaria Bloco A",
    "subtitulo": "Unidade Centro",
    "logo": "",
    "pessoa": { "singular": "Plantonista", "plural": "plantonistas" }
  }
}
```

- `logo: ""` = sem emblema, e a tela se arranja. Para ter um, ponha o arquivo em `public/dados/` e
  escreva o nome dele aqui.
- `santaCeia: []` = nenhum dia especial. É o caso comum fora de congregação.

### 4. Escrever `public/dados/pessoas.json`

```json
{ "pessoas": [{ "id": "ana", "nome": "Ana", "ativo": true, "restricoes": {} }] }
```

O `id` **nunca muda** — é ele que aparece dentro dos turnos.

### 5. Começar sem escala

```json
{ "versao": 1, "blocos": [] }
```

Não é preciso importar histórico. Quem tem escala anterior em papel pode importar depois como bloco
de `origem: "importado"`, que nasce **congelado**.

### 6. Copiar o dado para a pasta servida

```bash
npm run build      # copia public/ → docs/ e compila
```

🔴 **As duas pastas.** `public/dados/` é a origem; `docs/dados/` é o que o GitHub Pages serve.
Gravar em uma só é o erro que não avisa — o site continua no ar mostrando o dado antigo.

### 🔴 `emptyOutDir: false` — e por que isso NÃO é preferência

O GitHub Pages, em modo branch, só serve de `/` ou de `/docs`. Então `docs/` é ao mesmo tempo a
**saída do build** e o lugar onde vivem **a documentação** (`docs/*.md`), **o dado publicado**
(`docs/dados/`) e os índices.

Com a limpeza automática ligada — que é o **padrão do Vite** — o primeiro build **apagou cinco
documentos**, e a remoção entrou num commit sem ninguém notar: o site continuou funcionando, e a
cadeia documental inteira deixou de existir.

Em `vite.config.ts`:

```ts
outDir: 'docs',
emptyOutDir: false,   // 🔴 não é preferência, é a correção de um defeito real
```

Em troca, `assets/` precisa ser limpo **à mão** antes de gerar, senão sobra arquivo de build antigo a
cada vez. É o que o script `prebuild` faz — e ele remove **só** `docs/assets`, nada mais.

⚠️ **Quem reconstruir vai ser tentado a "consertar" isso.** Não conserte: o build precisa conviver
com a documentação.

### Sobre o Jekyll

Este projeto **não** tem `.nojekyll`, e funciona — nenhum arquivo servido começa com `_`, que é o
que o Jekyll do Pages ignora. Se um dia o build gerar algo assim, crie `docs/.nojekyll` (arquivo
vazio); o sintoma seria um **404 num arquivo que existe no repositório**.

### 7. Conferir antes de publicar

```bash
npm run gate                 # 28 passos, tem de sair 0
npm run generico             # nenhum nome de cliente cravado no código
```

### 8. Publicar e conferir ao vivo

```bash
git add -A && git commit -m "primeira publicação" && git push
# espere ~40 s pelo GitHub Pages
npm run vivo                 # abre o site publicado num navegador de verdade
npm run vivo:conferir        # cada dia e cada nome do JSON chega inteiro à tela
```

### 9. O token de quem vai administrar

Ver [`OPERACAO.md`](OPERACAO.md), parte 1. **Fine-grained**, *Only select repositories* apontando só
para este repositório, *Contents: Read and write*.

⚠️ **Um token por administrador**, e cada um cola o dele uma vez no próprio navegador. O token nunca
entra no repositório — se entrar, o GitHub o revoga sozinho, e aí a publicação para de funcionar sem
explicação óbvia.

---

## 🔴 Se o cliente já tem uma escala divulgada

Este é o passo que este projeto aprendeu do jeito difícil.

Uma escala nova **contradiz** a que as pessoas já têm em mãos. Antes de trocar o link:

```bash
npm run vivo:divulgado -- --antigo <url-da-escala-antiga>
```

Ele compara dia a dia, de hoje em diante, e diz quantos turnos divergem. Aqui foram **87 de 87** — e
nenhum portão pegou, porque todos comparavam o site novo com o **dado** do site novo.

> **Coerência interna não é verdade.** O que foi DIVULGADO é a referência.

Duas saídas, e é decisão de quem administra, não efeito colateral:

| Saída | Como |
|---|---|
| Avisar que muda a partir de agora | manda o link novo e comunica a data |
| Preservar a escala antiga por um tempo | importa o trecho antigo como bloco congelado e gera a escala nova **a partir** de uma data mais à frente |

---

## Problemas comuns na primeira instalação

| Sintoma | Causa | Conserto |
|---|---|---|
| Tela branca, sem erro no console | `base` errado no `vite.config.ts` | tem de ser `/<nome-do-repositorio>/` |
| Site no ar, escala velha | gravou só numa pasta | comparar `public/dados/` com `docs/dados/` |
| Área administrativa não abre o cofre | servido por `http://` | `crypto.subtle` exige HTTPS ou `localhost` |
| Publicar recusado com 403 | token sem `Contents: Read and write`, ou repositório não marcado | a mensagem **nomeia a caixa** a marcar |
| `npm run gate` reprova em `generico` | alguém cravou nome de cliente no código | a saída diz `arquivo:linha` |
| `npm ci` falha com `ENOTEMPTY` | `node_modules` corrompido | apagar `node_modules` e repetir |
