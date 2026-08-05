# O algoritmo — como a escala é montada

> **Cadeia:** [`AGENTS.md`](../AGENTS.md) → [`docs/RECONSTRUIR.md`](RECONSTRUIR.md) → **você está aqui**
>
> Vizinhos: [`CATALOGO_DE_REGRAS.md`](CATALOGO_DE_REGRAS.md) · [`MODELO_DE_DADOS.md`](MODELO_DE_DADOS.md)
>
> Código: `src/dominio/gerador.ts` · Testes: `src/dominio/gerador.test.ts`

---

## O problema, em uma frase

Distribuir ~16 pessoas por ~90 turnos ao longo de 5 meses, de modo que **cada uma fique o mais longe
possível da própria escala anterior**, respeitando as restrições individuais e sem que ninguém
carregue muito mais que os outros.

---

## 🔴 A decisão que define tudo: o piso é DESCOBERTO, não cravado

A instrução do dono foi explícita:

> *"não posso fixar um número mínimo de dias, porque senão eu posso não conseguir atender a escala.
> Cada irmão deve estar o mais distante possível da sua última escala. E quando não tiver a
> possibilidade de gerar a escala, você vai me dizer que não foi possível."*

Um número fixo tem dois modos de falhar, e os dois são ruins:

| Se o piso fixo for… | O que acontece |
|---|---|
| **alto demais** | a escala não fecha, e o sistema fica inútil justo quando o elenco encolhe |
| **baixo demais** | a escala fecha com gente escalada de novo dois dias depois — o defeito que originou o projeto |

Então o gerador **busca**:

```
teto = o maior espaçamento teoricamente possível
para piso de teto até 1:
    tenta montar a escala inteira exigindo esse piso
    se coube  → pronto. Informa o piso e os que tentou antes
    se travou → desce 1 e tenta de novo
se nem com piso 1 couber → DECLARA que não foi possível, e diz onde travou
```

Na escala real de 06/08 → 31/12: **piso 7 dias**, tendo tentado 9 e 8. Zero pares com 3 dias ou
menos — contra 18 pares no site anterior.

### ⚠️ O que esse número NÃO é

Cada piso é tentado **uma vez**, com escolha gulosa em ordem cronológica. No primeiro turno sem
gente suficiente, aquele piso é descartado inteiro. **Não há retrocesso.**

Logo: o piso alcançado é **o maior que esta busca conseguiu**, não *o maior que existe*. O algoritmo
não distingue "impossível de verdade" de "esta sequência de escolhas travou".

Isto está declarado no código, no `BACKLOG.md` (P4.9) e aqui. Dizer "o maior possível" seria afirmar
mais do que o código sustenta. Se um dia a folga apertar, troca-se a busca gulosa por uma com
retrocesso — e aí, sim, o número passa a ser um máximo demonstrado.

---

## Oito versões, e a melhor vai para a tela

O algoritmo guloso é **determinístico**: mesma entrada, mesma saída. Rodá-lo dez vezes devolve dez
cópias idênticas. Para gerar alternativas de verdade, é preciso mudar algo entre as execuções.

A técnica é **GRASP** (*Greedy Randomized Adaptive Search Procedure*): em vez de pegar sempre o
melhor candidato, monta-se uma **lista restrita** com os 3 melhores e sorteia-se dentro dela.

```
versão 1 → guloso puro, SEM sorteio        ← a rede de segurança
versão 2 → sorteio com semente 2
   …
versão 8 → sorteio com semente 8
```

**A primeira é sempre o guloso puro.** É isso que garante que o resultado nunca fica *pior* do que
era: se as sete sorteadas saírem piores, a escala de sempre continua na mesa.

### Como a melhor é escolhida — cascata, não soma

```
1. maior piso de distanciamento
2. empatou? maior índice de Jain (equilíbrio de carga)
```

**Cascata, e não uma nota ponderada, de propósito.** Somar "piso × peso + equilíbrio × peso" produz
um ótimo agregado que pode concentrar todo o sacrifício numa pessoa — a nota fica boa e alguém é
escalado toda semana. Cascata não tem peso para escolher errado: o distanciamento vem primeiro,
sempre.

### O índice de Jain

`(Σx)² / (n · Σx²)`, de 0 a 1 — 1 significa carga idêntica para todos.

Quem tem `tetoMensal` fica **fora** da conta: essa pessoa joga outro jogo, e incluí-la faria uma
escala justa parecer injusta só por respeitar a restrição de alguém.

Na escala real: **Jain 0,9994**, carga entre 16 e 17 turnos (diferença de 1).

---

## 🔴 Sorteio, mas nunca irreproduzível

O arquivo dizia, antes: *"sem sorteio — uma escala que muda a cada abertura seria impossível de
conferir"*. O GRASP exige aleatoriedade. A contradição foi resolvida assim:

- o sorteio é **semeado** (`mulberry32`, um gerador determinístico);
- a **semente fica gravada no bloco**.

Então a promessa ficou **mais forte**, não mais fraca: *não há sorteio **irreproduzível***. Mesma
entrada + mesma semente = mesma escala, byte a byte. Quem quiser conferir daqui a um ano consegue
regerar exatamente o mesmo resultado.

O botão **"gerar outra combinação"** muda a semente. Sem semente nova, oito versões seriam oito
cópias.

---

## A concordância que não pode quebrar

Duas coisas precisam concordar, ou o sistema se contradiz:

| Quem | Pergunta |
|---|---|
| `podeAssumir()` | *"esta pessoa pode pegar este turno?"* — usada **ao montar** |
| Regras D2–D8 | *"esta escala está certa?"* — usadas **ao conferir** |

Se divergirem, o gerador produz uma escala que a própria validação reprova. **Foi exatamente esse
descompasso que quebrou o site anterior**: o gerador tratava `tetoMensal` como teto e a validação
cobrava como valor exato.

Há teste que gera uma escala de verdade e a valida, provando a concordância.

---

## O que o algoritmo NÃO faz

| Não faz | Quem faz |
|---|---|
| Escolher entre duas escalas válidas | A pessoa, na tela |
| Decidir quem "merece" mais turnos | Ninguém — o equilíbrio é medido, não julgado |
| Entregar escala pela metade | Ninguém. Se não fecha, **declara** e diz onde travou |
| Publicar | Só a pessoa, e só depois das 16 regras passarem |

---

## Como medir isto por fora

```bash
# gera e mede, sem escrever nada
node scripts/gerar-bloco.mjs --de 2026-08-06 --ate 2026-12-31

# quanto tempo leva (justifica não ter Web Worker)
npm run tempo
```

O log imprime as 8 versões comparadas, o piso alcançado, os pisos tentados, o distanciamento por
pessoa e o resultado das 16 regras.
