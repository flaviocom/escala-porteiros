# RECONSTRUIR — o sistema inteiro, do zero

> **Este é o documento de portabilidade.** Ele existe para que **qualquer** pessoa — ou qualquer
> outra inteligência artificial — consiga reconstruir este produto sem ter participado de nada, sem
> perguntar nada a ninguém, e sem ler o código-fonte antes de entender o que ele faz.
>
> **Cadeia:** [`AGENTS.md`](../AGENTS.md) → **você está aqui** → os documentos de detalhe abaixo

---

## Índice

| Documento | Responde |
|---|---|
| **este** | o que é, por que é assim, e em que ordem reconstruir |
| [`MODELO_DE_DADOS.md`](MODELO_DE_DADOS.md) | os 3 arquivos JSON, campo a campo |
| [`CATALOGO_DE_REGRAS.md`](CATALOGO_DE_REGRAS.md) | as 17 regras — ⚙️ **gerado a partir do código** |
| [`ALGORITMO.md`](ALGORITMO.md) | como a escala é montada, e o que o algoritmo não garante |
| [`ARQUITETURA.md`](ARQUITETURA.md) | as camadas, medidas no grafo de importações |
| [`OPERACAO.md`](OPERACAO.md) | como usar, como conferir, o que fazer quando dá errado |
| [`INSTALAR.md`](INSTALAR.md) | do zero numa máquina nova, e como publicar para **outro cliente** |
| [`PORTOES.md`](PORTOES.md) | cada portão **por dentro**: critério, população, e o que ele decidiu não olhar |
| [`FINALIDADE_E_FASES.md`](FINALIDADE_E_FASES.md) | **para quem o produto é, e quando** — as 3 fases, e o que cada uma reabre |

Registro histórico: [`handoff/INDICE.md`](handoff/INDICE.md) ·
[`solicitacoes/INDICE_DE_SOLICITACOES.md`](solicitacoes/INDICE_DE_SOLICITACOES.md) ·
[`historico/INDICE.md`](historico/INDICE.md)

---

## 1. O que é

Um site que mostra **quem está escalado em cada turno**, com uma área administrativa que **gera,
confere e publica** a escala sem tirar o site do ar.

O caso de origem: a portaria de uma congregação, com ~16 voluntários e 3 vagas por turno, em cultos
de domingo (manhã e noite), quarta (noite) e sábado (noite), mais um ensaio no 1º sábado do mês.

**Mas o produto é genérico e configurável, com intenção de comercialização.** Isso é a regra máxima
de escopo (§0 do [`AGENTS.md`](../AGENTS.md)) e não é decoração: há um portão que reprova o *build*
se alguém cravar um nome de cliente no código.

⏱️ **Atenção ao tempo verbal:** *intenção* de comercialização. **Hoje o produto atende uma
congregação, e só ela.** Vender é a fase 3, e não começou. O produto é genérico agora porque cravar
o nome depois vira reescrita, não configuração — ver [`FINALIDADE_E_FASES.md`](FINALIDADE_E_FASES.md).

## 2. O problema que ele resolve

O sistema anterior tinha **quatro** defeitos, e os quatro têm a mesma raiz:

| Defeito | Consequência |
|---|---|
| A escala era **recalculada** a cada abertura, não guardada | não havia o que editar. Trocar uma pessoa exigia mexer no código |
| O distanciamento não era regra | gente escalada de novo **1 dia depois**; 18 pares com ≤3 dias |
| A data da Santa Ceia estava **no código** | ficou errada no ar, e ninguém tinha como corrigir |
| O gerador e a validação **discordavam** | `tetoMensal` era teto para um e valor exato para o outro |

> **A raiz de todos: o que devia ser DADO estava em CÓDIGO.**

É essa a inversão que o produto faz. Tudo que varia — pessoas, restrições, dias de culto, capacidade,
datas especiais, nome, vocabulário, emblema — é **dado configurável**. O código só sabe as regras.

## 3. As decisões que não são negociáveis

Quem reconstruir isto vai ser tentado a "melhorar" cada uma delas. Elas estão aqui com o porquê.

| Decisão | Por quê |
|---|---|
| **O passado não se reescreve** | Um bloco publicado só pode ser *truncado* numa data, nunca alterado no trecho que fica. Quem já viu a escala não pode ser desmentido |
| **Piso de distanciamento descoberto, não cravado** | Número fixo alto não fecha a escala; baixo traz de volta o defeito original. Ver [`ALGORITMO.md`](ALGORITMO.md) |
| **Teto mensal é MÁXIMO, nunca meta** | Foi confundir os dois que quebrou o sistema anterior |
| **Quando não fecha, DECLARA** | Nunca entregar escala pela metade em silêncio |
| **A pessoa decide, o motor propõe** | O motor de linguagem nunca publica. Ele passa pelo catálogo de regras primeiro |
| **Nenhum nome de cliente no código** | §0. Com portão que reprova |
| **`toISOString()` é proibido** | Devolve UTC. Às 21h de São Paulo já é o dia seguinte, e a escala erra o dia |
| **Toda regra prova as DUAS pontas** | Reprova um infrator injetado **e** aprova o caso limpo. Só uma ponta não distingue regra certa de regra sempre-vermelha ou sempre-verde |

## 4. Em que ordem reconstruir

Cada passo é verificável sozinho. Não avance sem o anterior verde.

### Passo 1 — O modelo de dados
Ler [`MODELO_DE_DADOS.md`](MODELO_DE_DADOS.md). Criar `tipos.ts` e `datas.ts`.

🔴 `datas.ts` primeiro, e **sem `toISOString()`**. Toda data do sistema é `AAAA-MM-DD` em texto, e
"hoje" se calcula com `Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' })`.

> **Prova:** rodar a suíte em outro fuso (`TZ=Europe/Berlin`) **depois de provar que o fuso mudou**.
> Em UTC−3 um defeito de fuso é invisível.

### Passo 2 — A malha
Que dias da semana têm turno, e quais. É **dado**, nunca código: já mudou uma vez neste projeto.

> **Prova:** construir a grade de um período e conferir a contagem de turnos contra o calendário.

### Passo 3 — O catálogo de regras
Ler [`CATALOGO_DE_REGRAS.md`](CATALOGO_DE_REGRAS.md). Cada regra é uma função que recebe a escala
**inteira** e devolve as violações.

> **Prova:** para cada regra, um teste que injeta um infrator e vê **falhar**, e outro com o caso
> limpo que vê **passar**. Regra sem as duas pontas não conta.

### Passo 4 — O gerador
Ler [`ALGORITMO.md`](ALGORITMO.md). Busca de piso, GRASP com semente, escolha em cascata.

> **Prova:** gerar uma escala de verdade e **validá-la com o catálogo do passo 3**. Se o gerador
> produz o que a validação reprova, os dois discordam — e foi isso que quebrou o sistema anterior.

### Passo 5 — A leitura do dado
Baixar os 3 JSON, **completar campo a campo** o que faltar, emendar blocos que se sobrepõem,
**tentar 3× antes de desistir**.

> **Prova:** um teste com `config.json` de versão anterior que não pode produzir `undefined` na tela;
> outro com HTTP 503 seguido de sucesso, que **não pode** virar tela de erro.

### Passo 6 — As telas
Site público (consulta, filtros, validação, estatísticas) e área administrativa (5 abas).

> **Prova:** abrir num navegador de verdade e comparar a tela com o JSON, dia a dia e nome a nome.

### Passo 7 — A publicação
Escrever nas **duas** pastas pela API do GitHub. Token cifrado no navegador.

> **Prova:** um GitHub de mentira, exercitando o código de produção. Provar as duas pastas, o
> conteúdo exato, e o que a resposta diz quando falha **no meio**.

### Passo 8 — A segunda régua
Reimplementar as regras por **outro caminho**, sem importar o catálogo.

> **Prova:** testes que exigem que as duas réguas **concordem** sobre a mesma escala.

### Passo 9 — Os portões
Ver [`PORTOES.md`](PORTOES.md) — cada um por dentro — e [`OPERACAO.md`](OPERACAO.md), parte 3, para rodar.

> **Prova:** para cada portão, um autoteste que injeta um infrator e exige que ele **reprove**. Um
> portão que nunca reprovou é indistinguível de um portão desligado.

## 5. 🔴 As armadilhas que já custaram caro aqui

Cada uma destas aconteceu neste projeto, com prejuízo real. Quem reconstruir vai encontrá-las de novo.

| Armadilha | Como aparece | Defesa |
|---|---|---|
| **Configuração morta** | o campo existe no tipo, no dado e no padrão — e **nunca é lido**. Parece que resolve | grepar **leituras**, não definições |
| **Portão inerte** | um `\b` escrito por script vira byte de backspace; a busca não procura nada e imprime "0 achados" | o portão confere as **próprias** expressões antes de medir |
| **Portão que mede menos do que diz** | uma exclusão derruba a população e o cabeçalho não conta | imprimir **medidos e pulados** lado a lado |
| **Fronteira do portão** | ele varre `src/` e o defeito está no `package.json` | perguntar *"que arquivo eu decidi não olhar?"* |
| **Classe que o critério não alcança** | um `import` de imagem não tem texto para varrer, e o emblema do cliente passou | achado que escapa vira critério novo |
| **Coerência interna ≠ verdade** | tudo bate com o próprio dado, e contradiz o que já foi divulgado | comparar com a **fonte divulgada** |
| **Uma pasta só** | grava em `public/`, o site serve `docs/`, e nada acusa | escrever nas duas, sempre |
| **Rótulo que promete mais que a medição** | "mostra as 15 regras" conferindo 5 de amostra | o número esperado vem do **código**, não digitado ao lado |
| **Citação `arquivo:linha` em documento vivo** | apodrece na primeira refatoração | citar **símbolo**, ou aceitar e revisar |
| **`fetch` não rejeita em erro HTTP** | 404 e 503 chegam como resposta resolvida | conferir `response.ok` **sempre** |

## 6. O que ainda não está resolvido

Declarado, não escondido — ver `BACKLOG.md`:

- **P4.9** — o piso é o maior que *esta busca* conseguiu, não um máximo demonstrado.
- **P4.6** — `npm run imagem` está fora do GATE; cor trocada na imagem passaria.
- **P4.8** — JSON malformado do motor descarta a proposta inteira, sem as 3 tentativas.
- **P4.15** — a tolerância do teto é convenção de casa, sem tela.
- **A publicação real pela tela nunca foi exercitada** — só contra um GitHub de mentira.

## 7. O método, se você for continuar o trabalho

Este projeto segue o padrão do dono, e três regras dele explicam quase tudo que está escrito acima:

1. **Regra sem portão é disciplina, e disciplina falha.** Toda regra nasce com algo executável que a
   cobra.
2. **O portão prova as duas pontas.** Reprova o infrator **e** aprova o limpo.
3. **Nada é fato até a fonte provar.** Número em documento vem de medição, com o comando ao lado.

E uma que vale mais que as três: **olhar a tela**. Os dois defeitos mais graves deste projeto —
a escala contradizendo o site divulgado, e o "sem porteiros escalados" na imagem — passaram por
todos os portões verdes e só apareceram quando alguém **abriu e leu**.
