# Catálogo de regras

> ⚠️ **ARQUIVO GERADO.** Não edite à mão — as alterações somem na próxima geração. A fonte é
> `src/dominio/regras.ts`; para mudar o texto de uma regra, mude o campo `explicacao` dela.
>
> Regenerar: `npm run doc:regras` · Conferir se está atualizado: `npm run doc:regras:conferir`
> (roda dentro do `npm run gate`).
>
> **Cadeia:** [`AGENTS.md`](../AGENTS.md) → [`docs/RECONSTRUIR.md`](RECONSTRUIR.md) → **você está aqui**

---

## Como o catálogo funciona

São **16 regras**: **11 duras** e **5 de qualidade**. A diferença é o que acontece quando
falham:

| Família | Falha vira | Bloqueia publicar? |
|---|---|---|
| **DURA** | reprovação 🔴 | **Sim.** A tela não deixa publicar |
| **QUALIDADE** | aviso 🟡 | Não. É informação para quem administra decidir |

Toda regra é uma função que recebe a escala inteira e devolve as violações que achou. **Nenhuma
regra olha só um turno**: distanciamento, teto mensal e equilíbrio só existem no conjunto.

Cada uma tem teste que prova as **duas pontas** — reprova um infrator injetado de propósito **e**
aprova o caso limpo. Uma regra que só prova um lado pode estar sempre vermelha ou sempre verde sem
ninguém notar.

---

## Regras DURAS — reprovam, e travam a publicação

| # | O que confere | O que isso quer dizer, em português |
|---|---|---|
| **D1** | Capacidade — cada turno com o número certo de pessoas | Todo turno precisa ter exatamente o número de pessoas que ele pede. Com gente a menos, o posto fica descoberto; com gente a mais, alguém foi chamado à toa. |
| **D2** | Sem repetição no mesmo dia | Ninguém serve dois turnos no mesmo dia — nem manhã e noite do mesmo domingo. |
| **D3** | Dias permitidos — quem só pode em certos dias da semana | Quem só pode em certos dias da semana aparece somente neles. |
| **D4** | Dias proibidos — quem nunca pode em certo dia da semana | Quem nunca pode num certo dia da semana nunca é escalado nesse dia. |
| **D5** | Turnos permitidos — quem só pode em certo turno | Quem só pode num turno — só de manhã, só à noite — não é escalado no outro. |
| **D6** | Ausências — férias, viagem, compromisso | Quem avisou que estará fora (férias, viagem, compromisso) não é escalado nesses dias. |
| **D7** | Teto mensal — quem tem limite de escalas por mês | Quem tem limite de quantas vezes pode servir por mês não passa desse limite. |
| **D8** | Elenco — só quem está no elenco do bloco, e ativo | Só entra na escala quem está na equipe e ativo hoje. Quem saiu continua aparecendo no passado já publicado, mas não é escalado para a frente. |
| **D9** | Santa Ceia — o dia do calendário está marcado, e não recebe ninguém | Existem dias marcados no calendário em que ninguém deve ser escalado — aqui, a Santa Ceia. A conferência é contra o CALENDÁRIO, não contra a própria escala: se a marca se perder, ela acusa. |
| **D10** | Coerência do piso declarado | O intervalo mínimo que esta escala afirma ter garantido é conferido pessoa por pessoa. Serve para o número anunciado não ser maior do que a realidade. |
| **D11** | Cobertura — o bloco tem os turnos que o período dele exige | A escala cobre todos os dias e turnos que o período exige — nem falta dia, nem sobra dia que não é de culto. É o que impede publicar uma escala vazia ou pela metade. |

---

## Regras de QUALIDADE — avisam, nunca travam

| # | O que confere | O que isso quer dizer, em português |
|---|---|---|
| **Q1** | Distanciamento — cada um o mais longe possível da própria escala anterior | Cada pessoa o mais longe possível da própria escala anterior. É o defeito que originou este projeto: alguém servindo quarta e voltando no sábado. Avisa quando alguém fica com **3 dias ou menos** entre duas escalas. |
| **Q2** | Equilíbrio de carga dentro do bloco | A carga fica parecida entre quem não tem limite próprio. Quem tem teto mensal fica fora da comparação, porque joga outro jogo. Avisa quando a diferença entre quem mais pegou e quem menos pegou passa de **2 turnos**. |
| **Q3** | Variedade de dia da semana — ninguém preso sempre no mesmo dia | Ninguém preso sempre no mesmo dia da semana — quem sempre pega sábado acaba nunca indo ao culto de domingo com a família. Avisa quando **mais de 70%** das escalas de alguém caem no mesmo dia da semana; só avalia quem tem **4 escalas ou mais**, porque abaixo disso a proporção não significa nada. |
| **Q4** | Variedade de companhia — evitar o mesmo grupo se repetindo | Evita que a mesma companhia se repita demais. Avisa quando uma formação (o conjunto de quem divide o turno) aparece **3 vezes ou mais** no período; lista as 10 mais frequentes. Não impede publicar; é para você saber. |
| **Q5** | Piso mensal — quem tem teto e ficou MUITO abaixo dele | O teto é um máximo, nunca uma meta: ficar abaixo dele não é falha. Este aviso só aparece quando alguém fica 2 ou mais abaixo do próprio teto, num mês INTEIRO. Aí pode ser injustiça de distribuição, ou pode ser a restrição dele funcionando. Mês cortado pela metade — o primeiro e o último de qualquer escala — não conta, porque não dá para cobrar uma conta mensal de quem só teve meio mês. |

---

## Onde cada coisa vive

| O quê | Onde |
|---|---|
| As 16 regras | `src/dominio/regras.ts` (a constante `CATALOGO`) |
| Os testes das duas pontas | `src/dominio/regras.test.ts` |
| A conferência independente (outra régua) | `src/dominio/conferencia-independente.ts` |
| A tela que mostra o resultado | `src/components/ValidationView.tsx` (público) e a aba **Conferir** (administrativo) |

## A segunda régua

Existe uma **conferência independente** que reimplementa as regras por outro caminho e **não importa
uma linha** de `regras.ts`. Ela monta a linha do tempo de cada pessoa, em vez de percorrer o
catálogo turno a turno.

Serve para discordar: se as duas concordam, a escala tem duas opiniões independentes a favor. Se
discordam, uma das duas está errada — e é melhor descobrir isso antes da congregação descobrir.
