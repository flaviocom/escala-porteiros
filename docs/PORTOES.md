# Os portões, por dentro

> **Cadeia:** [`AGENTS.md`](../AGENTS.md) → [`docs/RECONSTRUIR.md`](RECONSTRUIR.md) → **você está aqui**
>
> Vizinhos: [`OPERACAO.md`](OPERACAO.md) (como rodar) · [`ARQUITETURA.md`](ARQUITETURA.md)

---

## Por que este documento existe

Um teste de portabilidade em 05/08/2026 deu a documentação a outra inteligência artificial, proibida
de abrir código, e pediu que reconstruísse o produto. Um dos três vereditos:

> *"O projeto inteiro se apoia na tese **'regra sem portão é disciplina, e disciplina falha'** — e
> nenhum portão está descrito por dentro. Quem reconstruir recria o produto **sem a rede que o
> produto considera o próprio valor**."*

Estava certo. Os portões eram nomes numa tabela. Aqui eles têm **critério, população, e o que
decidiram não olhar**.

---

## A anatomia de um portão que funciona

Todo portão deste projeto tem estas cinco partes. Faltando qualquer uma, ele fica verde sem medir.

| Parte | Por quê |
|---|---|
| **Critério explícito** | "está bom" não é critério. `< 44px` é |
| **População impressa** | quantos itens foram medidos. Sem isso, ninguém nota quando ele para de varrer metade |
| **O que foi PULADO, também impresso** | isenção silenciosa lê-se como cobertura total |
| **Autoteste das duas pontas** | reprova um infrator injetado **e** aprova o caso limpo. Só uma ponta não distingue portão certo de portão sempre-verde |
| **Saída ≠ 0 quando reprova** | senão ele não pode entrar em `&&` nenhum |

🔴 **E, para portões que usam expressão regular: autodefesa.** Três vezes num único dia, um `\b`
escrito por script virou byte de backspace (0x08) dentro de uma regex. O portão rodava, imprimia
*"7 termos procurados · 0 achados"*, e o 0 era verdade sobre uma busca que não procurava nada. O
portão genérico agora **confere as próprias expressões antes de medir** e morre com saída 2 se
alguma tiver caractere de controle.

---

## Os 16 passos do `npm run gate`

### 1. `typecheck` — `tsc --noEmit`, `strict` ligado
Sem `strict`, o TypeScript nem estreita união discriminada, e metade das garantias de tipo do
projeto some.

### 2. `test` — `vitest run`, a suíte COMPLETA
🔴 **Nunca escopada.** Rodar só as suítes tocadas esconde regressão em área não tocada. É regra de
método, com prejuízo registrado.

### 3. `test:fuso:berlim` — a mesma suíte em `Europe/Berlin`
**Critério:** o script primeiro **prova que o fuso mudou** (compara a data local antes e depois), e
só então roda. Sem essa prova, um `TZ` ignorado pelo sistema faria o passo passar sem testar nada.
Em UTC−3 um defeito de fuso é invisível: o dia só vira no fim da tarde.

### 4. `denominacao` — nenhum jargão comoditizado em texto que alguém lê
**População:** texto visível em `src/`.
**Critério:** ocorrências de "IA"/"AI" como **palavra**, não como pedaço.
**Autoteste:** 9 casos que devem acusar + 13 que devem **absolver** — inclusive `SANTA CEIA` (contém
"IA"), `ENSAIO` (contém "AI"), expressões (`${NOMES_DIA[d]}`) e negações (*"não é inteligência
artificial"*). Os 13 de absolvição são o que impede o portão de virar ruído.

### 5. `fontes` — nenhuma fonte externa chamada sem estar declarada
**População:** 71 arquivos em `src/` **e** `scripts/` · 1 isento (o próprio inventário).
**Critério:** todo host em URL literal tem de estar em `docs/INVENTARIO_DE_FONTES.md`.
**Fora de escopo, declarado:** laço local (`127.0.0.1`) e domínios reservados pela RFC 2606
(`example.com`, `.test`, `.invalid`) — é o que permite escrever exemplo em mensagem de ajuda.
**Hoje:** 4 chamados, 4 declarados.

### 6. `contagem` — nenhum documento vivo desmente o catálogo
**População:** **todo `.md` do repositório**, descoberto — não uma lista à mão.
**Isentos, declarados:** `AI_MASTER_LOG.md`, `DIARIO_DE_BORDO.md`, `docs/handoff/`,
`docs/historico/` — append-only, registram o que era verdade então.
**Critério:** padrões específicos (`N regras duras`, `N de qualidade`, `catálogo de N regras`,
`N de M regras`) comparados com o `CATALOGO`.

🔴 **Este portão nasceu com lista de PERMISSÃO de 5 documentos, e 4 arquivos ficaram invisíveis** —
nem na lista, nem nas isenções. Foi invertido para lista de exclusão:
**lista de permissão erra em silêncio; lista de exclusão erra alto.**

### 7. `cadeia` — os documentos apontam para o handoff mais recente
**Critério de "mais recente":** por **data no nome** e, no mesmo dia, pelo **sufixo** (`-b`, `-c`…),
com o **sem sufixo sendo o PRIMEIRO** do dia. Ordenar alfabeticamente mentiria: `HANDOFF_2026-08-05.md`
vem antes de `HANDOFF_2026-08-05-b.md` no alfabeto e é o mais **antigo** dos dois.
**Conferidos:** `AGENTS.md`, `ESTADO.md`, `BACKLOG.md`, `docs/handoff/INDICE.md`.
**Autoteste:** acusa ponteiro antigo · aprova o atual · **ignora** link para handoff antigo que
esteja fora de uma linha que se diz "mais recente".

### 8. `generico` — nenhum nome de cliente cravado (§0)
**População:** 30 arquivos (`src/` + `index.html` + `package.json`) · **10 testes pulados**, contados
e impressos.
**Os 7 termos:** `JD. São Luiz` · `Congregação Cristã` · `CCB` (com borda por classe de caracteres,
sem barra invertida) · `Escala (de) Porteiros` · o prompt do motor cravado · `porteiro(s)` como
**palavra em prosa** (a borda `(?<![-\w])…(?![-\w])` deixa passar o slug `escala-porteiros`, que é
identidade de infraestrutura) · `irmão/irmãos`.
**Mais uma varredura estrutural:** `import … from './assets/…'` — emblema empacotado. Um `import` de
imagem **não tem texto** para varrer, e foi assim que o logotipo do cliente viveu no cabeçalho do
site inteiro sob "0 achados".
**Comentários são removidos antes de medir** — eles citam o defeito para explicá-lo, e um portão que
trombasse com a própria documentação seria contornado no primeiro dia.
**Por que `.test.ts` é pulado:** as fixtures usam o nome do cliente de propósito, e teste não vai
para o ar. Troca consciente, com o par no autoteste (mesmo conteúdo fora de teste **é** achado).

### 9. `generico:autoteste` — prova que o de cima morde
**21 casos:** 20 de varredura (infratores que devem reprovar + limpos que devem passar) + 1 de
autodefesa. Entre os limpos, dois valem nota: **"irmandade" não pode acusar** (a borda tem de estar
viva) e **`escala-porteiros` como slug não pode acusar**.
**O caso de autodefesa** injeta o byte de backspace num **clone** do portão e exige saída 2.

### 10. `doc:regras:conferir` — o catálogo documentado bate com o código
`docs/CATALOGO_DE_REGRAS.md` é **gerado**. Este passo regenera em memória e compara **byte a byte**
(ignorando fim de linha, porque o Windows reescreve CRLF). Muda o `titulo` ou a `explicacao` de uma
regra sem regenerar → vermelho.

### 11. `doc:comandos` — todo comando citado existe
**População:** os 15 documentos vivos · isentos os append-only.
**Critério:** todo `npm run <nome>` está no `package.json`; todo `node scripts/<arquivo>` existe em
disco. **Achou defeito na primeira execução:** `npm run tempo`, citado na documentação, não existia.

### 12. `arquitetura` — as duas invariantes que a documentação afirma
1. `src/dominio/` **não importa nada de fora** (nem `../`, nem pacote externo).
2. `conferencia-independente.ts` **não importa** `regras`, `validacao` nem `gerador`.
**Por quê:** a segunda régua existe para **discordar**. Se alguém "aproveitar" uma função do
catálogo ali, ela vira espelho — continua verde, continua concordando, e para de valer.

### 13. `fatos:conferir` — nenhum documento desmente um número medido
**11 fatos**, todos de fonte executável: passos do gate (do `package.json`), casos do autoteste (da
saída dele), checagens da auditoria, arquivos e termos do portão genérico, documentos vivos, piso do
bloco publicado, turnos congelados, fontes declaradas, regras do catálogo, regras duras.
**Nenhum é digitado.** Achou 4 contradições na primeira execução, e depois **pegou a própria
mudança**: ao entrar no gate, virou o 16º passo e reprovou os documentos que diziam 15.

### 14. `auditoria` — 20 ataques ao próprio código
Cada ataque **injeta um infrator** e exige que a validação o pegue. Frentes: validação, datas e fuso,
gerador, dado publicado (inclusive *"os dois arquivos de dados são iguais?"* — que pegou um defeito
real), e camada de tela.
⚠️ **Relatório sem achado é declarado SUSPEITO pelo próprio script**, com o motivo estrutural: quem
auditou escreveu o código.

### 15. `regras-mestras` — tooltip em todo botão
**População:** 62 botões medidos.
**Também mede:** clicáveis fora de `<button>` (div/span com `onClick` e sem papel declarado) — hoje 0
— e aspas duplas dentro do atributo, que quebram o HTML em silêncio.

### 16. `build` — compila e gera em `docs/`

---

## Fora do GATE, de propósito

As validações **ao vivo** abrem o site publicado num navegador de verdade. Não entram no gate porque
dependem da rede e do GitHub Pages, e **portão que quebra por causa alheia é portão que alguém
desliga.** Ver [`OPERACAO.md`](OPERACAO.md), parte 3.

Duas merecem nota:

**`npm run ensaio`** — o cenário que originou o projeto, de ponta a ponta, sem rede e sem
credencial: uma pessoa sai do elenco, outra entra com as cinco restrições, e a escala é regerada a
partir de um corte. **11 promessas medidas**, entre elas *"o passado antes do corte fica byte a byte
idêntico"* (128 turnos) e *"quem tem teto é aproveitado em ≥ 80% da cota"*.

**`npm run vivo:divulgado`** — o portão que **faltava**, e que o dono achou sozinho. Compara o site
novo com o que **já foi divulgado**, dia a dia. Nenhum outro portão pegava a divergência de 87
turnos, porque todos comparavam o site novo com o **dado** do site novo.

> **Coerência interna não é verdade.** O que foi DIVULGADO é a referência.

---

## Como acrescentar um portão

1. Escreva o **critério** como número ou expressão. Se não couber numa frase com número, ainda não é
   critério.
2. Imprima **população medida** e **o que foi pulado**, lado a lado.
3. Escreva o **autoteste** antes de acreditar no verde: infrator injetado tem de reprovar, caso limpo
   tem de passar.
4. Se usar expressão regular, construa com `String.raw` ou **sem barra invertida nenhuma**, e
   confira os próprios padrões contra caracteres de controle.
5. Rode com um infrator de verdade plantado no repositório e **veja vermelho** antes de commitar.
6. Só então acrescente ao `gate` — e ao [`OPERACAO.md`](OPERACAO.md) e a este documento.
