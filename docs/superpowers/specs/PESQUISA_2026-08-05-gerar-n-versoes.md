# PESQUISA — gerar N versões da escala e escolher a melhor

> **Solicitação:** [`S-020`](../../solicitacoes/INDICE_DE_SOLICITACOES.md) · 05/08/2026
> **Cadeia:** [`ESTADO.md`](../../../ESTADO.md) → [`handoff`](../../handoff/INDICE.md) → [`BACKLOG.md`](../../../BACKLOG.md)
> **Roteador:** [`AGENTS.md`](../../../AGENTS.md)
>
> ⚠️ **Ordem inegociável do método: pesquisa → registro → decisão.** Este documento é o registro. A
> decisão está no fim, e nada foi implementado antes dele existir.

---

## A pergunta

> *"No gerar escala, não precisa ter pressa. O motor pode pensar, gerar uma, duas, três versões
> internamente e comparar qual é a melhor versão de si mesmo para enviar à tela. E mesmo assim, o
> usuário pode recusar e solicitar outra combinação. É tranquilo isso? É coerente? É necessário?"*

## Como a pesquisa foi feita, e o que foi DESCARTADO

Delegada a um agente de pesquisa profunda (56 fontes). **O relatório bruto não foi aceito como
veio** — a skill do método avisa que pesquisa delegada traz prosa inflada, redirecionadores opacos e
nomes próprios inventados. O que foi rejeitado na auditoria, e por quê:

| Descartado | Motivo |
|---|---|
| Tabela de preços de concorrentes (Deputy, When I Work, QGenda…) | números específicos vindos de agregadores secundários, sem página oficial; preço de SaaS muda e não dá para conferir por redirecionador opaco |
| *"os softwares líderes optam **unanimemente** por…"* | no corpo do relatório, só o **When I Work** tem o comportamento descrito. Os outros aparecem só na tabela de preços. Generalização não comprovada |
| Casos com números exatos (hospital sérvio com "variância ≤ 2"; "0,49 → 0,71, redução de 40%") | específicos demais para fonte não aberta. Fica registrada a **existência** das técnicas, não os números |

**O que sobreviveu**, e com que confiança:

- 🟢 **Alta** (conhecimento estabelecido, independente desta pesquisa): o problema é NP-difícil;
  GRASP existe e é de Feo e Resende; o índice de Jain existe; os limiares de Nielsen (0,1s / 1s /
  10s); JavaScript no navegador é thread única e Web Worker é a saída documentada (MDN).
- 🟡 **Média** (descrito com especificidade, uma fonte): o *When I Work* entrega **uma** escala por
  "Auto-Assign", com aceitar ou limpar — **não** várias lado a lado.
- 🔴 **Não confirmado:** comportamento de UI de Deputy, Shiftboard e QGenda; qualquer preço.

## O que a pesquisa respondeu

**O problema tem nome:** *Nurse Rostering Problem* / *Employee Scheduling* / *Personnel Rostering*.
A formulação vale igual para portaria, recepção e plantão — o que interessa à
[regra máxima de escopo](../../../AGENTS.md#0--regra-máxima-de-escopo). **É NP-difícil.** Na prática
dominam metaheurísticas (Simulated Annealing, Tabu Search, GRASP, algoritmos genéticos); métodos
exatos existem e ficam lentos em instância grande.

**🔴 A armadilha que eu já suspeitava, confirmada:** rodar um guloso **determinístico** N vezes com a
mesma entrada devolve **N cópias idênticas**. "Gerar três versões" não gera três versões — gera a
mesma três vezes. Isso é lógica, não precisa de fonte.

**O que faz a técnica funcionar** chama-se **GRASP** (*Greedy Randomized Adaptive Search
Procedure*). Em vez de escolher sempre o topo do ranking, monta-se uma **lista restrita de
candidatos** (os *k* melhores elegíveis) e sorteia-se **dentro dela**. Preserva a heurística — quem
está há mais tempo sem servir continua favorecido — e injeta variabilidade real.

- **Ajuda** quando a lista tem mais de um candidato: abre caminhos que o guloso puro nunca visita, e
  pode escapar de becos sem saída que ele só descobre no fim.
- **Não ajuda** com lista de tamanho 1 (é o guloso de sempre) nem com sorteio sem viés (perde a
  qualidade da heurística).

**Como comparar duas escalas válidas:** soma de violações suaves ponderadas é o padrão, e tem
armadilha documentada — pesos arbitrários produzem um ótimo agregado que **concentra o sacrifício
numa pessoa só**. A literatura corrige isso com métricas de equidade: **min-max** (melhorar o pior
caso individual) e o **índice de Jain** — `(Σxᵢ)² / (n · Σxᵢ²)`, de 0 a 1, sendo 1 a justiça perfeita.

**Quanto se pode fazer o usuário esperar** (Nielsen): 0,1s parece instantâneo; 1s não interrompe o
raciocínio; **10s é o limite da atenção** e exige indicador de progresso. Acima de ~100ms na thread
principal, o clique e a rolagem travam — a saída é Web Worker.

**O que o mercado faz:** o único caso concretamente confirmado mostra **uma escala**, com aceitar ou
limpar. Nada de comparador lado a lado.

---

## 🔴 O CONFLITO QUE ESTA PESQUISA CRIA — e é ele que exige decisão, não a técnica

`gerador.ts` (a promessa daquele dia; hoje ela é *"não há sorteio IRREPRODUZÍVEL"*, ver `src/dominio/gerador.ts` — `mulberry32`) carrega uma promessa **declarada e deliberada**:

> *"A escolha de quem entra é determinística: mesma entrada, mesma escala. **Sem sorteio** — uma
> escala que muda a cada abertura da tela seria impossível de conferir."*

Sorteio, por definição, quebra isso. E a promessa não é capricho: **escala que muda sozinha é escala
que ninguém consegue auditar**, e este projeto inteiro existe porque o site antigo errava em
silêncio.

### A decisão

**Adotar GRASP com semente registrada no bloco.** O sorteio deixa de ser sorteio no sentido que
importa:

| | |
|---|---|
| Mesma entrada **e mesma semente** | **mesma escala**, byte a byte. O determinismo que a promessa protege continua de pé |
| Mesma entrada, **semente diferente** | escala diferente e válida — que é exatamente o "gerar outra combinação" pedido |
| A semente fica **gravada no bloco** | qualquer pessoa reproduz aquela escala depois. Conferível, que era o ponto |

A promessa antiga muda de *"não há sorteio"* para *"não há sorteio **não reproduzível**"*. É mais
forte, não mais fraca — antes havia um caminho só; agora há muitos, e cada um tem endereço.

### Os parâmetros escolhidos, e por que estes

| Escolha | Valor | Por quê |
|---|---|---|
| Tamanho da lista de candidatos | **3** | com 1 não há variação; grande demais dilui a heurística e piora o espaçamento, que é o defeito que o projeto veio consertar |
| Quantas versões | **8** | a pesquisa sugeriu 50–100; **recusado**. Para 16 pessoas e ~90 turnos, o retorno decresce rápido, e cada versão custa a busca de piso inteira (9, 8, 7…). 8 cabe folgado no orçamento de tempo |
| Critério de escolha | 1º **menos violações duras** · 2º **maior piso real** · 3º **índice de Jain** sobre a carga | evita a armadilha dos pesos arbitrários. Só desempata por equidade depois de garantir validade e espaçamento |
| Web Worker | **medir antes** | Nielsen só exige acima de ~1s. Pôr Worker sem medir é complexidade comprada no escuro — a medição está no handoff |
| Interface | **uma escala** + botão "gerar outra" | é o que o único caso confirmado faz, e comparador lado a lado aumenta carga cognitiva sem evidência de ganho |

### O que foi recusado da recomendação da pesquisa

- **50–100 iterações:** desproporcional ao tamanho do problema aqui. 8.
- **Comparador visual de várias escalas:** sem evidência de mercado e com custo cognitivo.
- **Função-objetivo com pesos somados:** é a armadilha que a própria literatura documenta.

---

## Reversão

Voltar a `k = 1` na lista de candidatos devolve o comportamento guloso puro, e a semente passa a ser
irrelevante. Nenhum dado gravado se perde: blocos antigos não têm semente e continuam válidos.
