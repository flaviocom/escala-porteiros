# Auditoria adversarial de 03/11/2026 — passado preservado e ensaio de troca de elenco

> Rotacionado do [`BACKLOG.md`](../../BACKLOG.md) (P4.20) em 03/11/2026, quando o BACKLOG passou
> de 40 KB. Diário da noite: [`SOLICITACOES/2026-11-03.md`](SOLICITACOES/2026-11-03.md).

## P4.20 🆕 ABERTO 03/11/2026 — validação julga o bloco inteiro, e o bloco vigente tem 13 meses (A3)

Auditoria adversarial de 03/11/2026, 22:27 SP. O conserto `blocoJaAconteceu` (`src/dominio/blocos.ts`)
isenta só o bloco que JÁ TERMINOU. O vigente vai de 04/11/2026 a 31/12/2027: se o dono mudar uma
restrição (ex.: teto mensal) em fev/2027 **sem regerar**, a aba Validação passa a reprovar os meses
já cumpridos desse mesmo bloco — o mesmo defeito, adiado. E o bloco passado, isento inteiro, deixa
de passar até pelas regras estruturais (vaga, duplicidade), que não dependem de restrição.
**Conserto proposto:** julgar por TURNO (`data > hoje`) com as regras de restrição, e manter as
estruturais sobre o passado. **Não bloqueia hoje:** o vigente está aprovado (veredito de 03/11).
Junto, declarados e não consertados: **A4** — "fim == hoje" conta como passado (`blocoJaAconteceu`),
o oposto de `inicioGeravel`; um dia sem conferência, impacto pequeno. **A6** — a tolerância de
equilíbrio do ensaio (5% da média, mínimo 2) ficou igual à amplitude medida (3): sem folga, pode
oscilar com mudança pequena de elenco.
2ª rodada do mesmo crítico (22:36 SP), também declarados: **B2** — o ensaio corta por mês cheio,
mais conservador que a regeneração real (que começa amanhã); **B3** — `vivo:seletor` usa
"/11/2026" e depende desse mês continuar no `blocos.json`; **B4** — no dia em que o último bloco
termina, o veredito já sai vermelho (mesma raiz de A4). **B1** (bomba de calendário em out/2027)
foi CONSERTADO: o ensaio estende o próprio horizonte em vez de sair vermelho — simulado com
hoje = 15/10/2027, 13 de 13 promessas.

