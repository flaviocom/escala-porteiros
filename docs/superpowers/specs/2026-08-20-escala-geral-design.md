# DESENHO — `escala-geral`, o motor genérico de escala como produto

> **Solicitação:** S-068/S-069, 20/08/2026 · **Cadeia:** [`ESTADO.md`](../../../ESTADO.md) →
> [`BACKLOG.md`](../../../BACKLOG.md) · aprovado pelo dono em 20/08/2026 ("Aprovado pela sua
> recomendação. Todos os itens até o final no padrão ouro em loop. Go!")

## O pedido

Vender esta escala como produto genérico, para qualquer tipo de propósito (portaria, segurança,
plantão — não só igreja), sem tocar no `escala-porteiros` de produção. Provar isso com um
repositório novo, zerado, com as telas que faltam (malha configurável, mensagem do WhatsApp
configurável) e o motor validado com zero margem de erro para qualquer combinação de dias/horários.

## Escopo desta rodada

1. **Repositório novo** `flaviocom/escala-geral`, gerado a partir da trilha `/generico/` já provada
   sem texto de cliente, marcado como GitHub Template Repository.
2. **Elenco e malha zerados** — estado limpo, pronto para dado de teste.
3. **Editor de malha** (tela nova): dias da semana, horário real de início/fim, recorrência
   (semanal/quinzenal/"N-ésima ocorrência do mês"), nome do evento, capacidade — sem editar código.
4. **Editor de mensagem do WhatsApp** (tela nova): texto + formatação (negrito, itálico, riscado,
   emoji), sempre com tom respeitoso — configurável, não mais cravado em Python na VPS.
5. **Motor validado com testes por propriedade** contra malhas sintéticas arbitrárias (não só os 4
   cenários do experimento anterior), buscando zero margem de erro de variação de dias/turnos/horas.
6. **Publicação real**, com as duas URLs (site + admin) entregues.
7. **Comparação lado a lado** da mensagem do WhatsApp: como está em produção (`escala-porteiros`,
   hardcoded) × como fica no repositório novo (configurável pela tela).

## Fora de escopo (fica pendente, registrado em `FASE2.md` P4.y)

Onboarding sem qualquer credencial do GitHub para o comprador final — isso exige backend + banco
multi-tenant, pesquisa própria, decisão futura do dono. Não entra nesta rodada.

## Arquitetura

Mesma base técnica do `escala-porteiros` (site estático + GitHub Pages + admin client-side falando
com a API do GitHub) — nenhuma mudança de arquitetura, só de dado (malha e mensagem viram
configuração, não código) e de tela (dois editores novos). O motor de geração (GRASP, Jain,
validador independente) é o MESMO código, reaproveitado, não reescrito — a pesquisa de 07/08 já
mostrou que a formulação generaliza; o que faltava era o dado ser editável, não o algoritmo.

## Testes e verificação

- Testes por propriedade (`fast-check`-style, já no padrão do projeto) para o parser/gerador de
  malha, cobrindo combinações arbitrárias de dias, horários e recorrência.
- Reexecução do experimento de busca local (já rodado) documentado como referência, não repetido.
- Verificação ao vivo no navegador (Playwright) das duas telas novas e da publicação real.
- Auditoria independente (agente cego) sobre o código novo antes de declarar pronto.

## Documentação

`escala-geral` nasce com seu próprio `AGENTS.md`/`ESTADO.md`/`BACKLOG.md` (regra de portabilidade),
espelhando o padrão do `escala-porteiros`. Rastro desta decisão fica em
`escala-porteiros/docs/solicitacoes/INDICE_DE_SOLICITACOES.md` (S-069) e `DIARIO_DE_BORDO.md`.
