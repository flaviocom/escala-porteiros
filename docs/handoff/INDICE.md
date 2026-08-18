# Índice de handoffs — escala-porteiros

> **Cadeia de navegação:** [`ESTADO.md`](../../ESTADO.md) → **handoff mais recente** → [`BACKLOG.md`](../../BACKLOG.md)
> **Roteador do projeto:** [`AGENTS.md`](../../AGENTS.md)
>
> Um handoff registra **o que aconteceu numa sessão e por quê** — o que não se recupera lendo o
> código. Documento **imutável** depois de fechado: se algo mudou, escreve-se no handoff seguinte,
> nunca por cima do anterior.

| Data | Handoff | O que aconteceu |
|---|---|---|
| 18/08/2026 | [`HANDOFF_2026-08-18.md`](HANDOFF_2026-08-18.md) | **A reconciliação, e 3 defeitos achados sem ninguém pedir** — a cópia local estava 6 commits atrás do `origin/main`; um commit de sincronização escrito sobre base velha foi descartado antes do push. Com a cópia certa: `DEP0190` corrigido no disparador de validações ao vivo (`execFileSync`+`shell:true` → `execSync` + guarda testável), `npm run citacoes` VERMELHO por citações cruzando para o repositório charmway-erp (6 corrigidas, 2 com conteúdo ERRADO que o portão não detecta), e **P5.3 fechado com fonte oficial** (teto geral do GitHub; ~997 anos de folga). |
| 08/08/2026 | [`HANDOFF_2026-08-08-b.md`](HANDOFF_2026-08-08-b.md) | **Parte 2 — merge na `main` e o loop que mapeou antes de mexer** — P0/P1 zerados pela informação do dono (a divulgação já tinha acontecido); S-052 a S-055 mergeados por rebase com a prova de que o servido não muda um byte; e a fila P5 fechada com o mapa mandando: **P5.4 já estava pronto no código** (só o registro devia), P5.7 medido por sonda e travado em 4 testes, P5.3 meio-medido (~49 KB/ano; teto da API por medir, rede bloqueada). |
| 08/08/2026 | [`HANDOFF_2026-08-08.md`](HANDOFF_2026-08-08.md) | **A sessão perdida, a retomada pelos registros e as réguas no banco dos réus** — o gate rodou pela primeira vez fora da máquina de origem e 7 validações ao vivo reprovaram **sem nenhum defeito de produto**: corrida de largada na fonte única do servidor de teste, espera curta para downloads múltiplos, grupo LOCAL abrindo a URL publicada ("verde de outra árvore") e a régua de foco reprovando o anel `outline: auto` (19 inocentes, prova por pixel). Tudo corrigido: **15 de 15 verdes**. ⚠️ A chave do lembrete perdeu o par privado — aviso no runbook. |
| 07/08/2026 | [`HANDOFF_2026-08-07.md`](HANDOFF_2026-08-07.md) | **Conferência do publicado + pesquisa mundial + auditoria das duas réguas** — os deploys cancelados não perderam nada (2 commits eram VAZIOS, medido); pesquisa de rostering confirmou o GRASP e teve a recomendação central **medida e recusada** (busca local: 0 trocas nos dados reais); **três defeitos fechados com mutante**, o pior: as duas réguas cegas para a MESMA ausência invertida. Veredito medido do que está no ar: **17/17 + 8/8 + 0 divergências** — pode divulgar. |
| 06/08/2026 | [`HANDOFF_2026-08-06.md`](HANDOFF_2026-08-06.md) | **Sétima auditoria + republicação da escala** — o buraco de **93 dias** que o Publicar aceitava, a aba `Ajustar` acusando tudo de amarelo, e um item do BACKLOG marcado como FECHADO **sem ter sido feito**. A escala foi **regerada e republicada** (Williams 5/3 → 3/3, 85 de 87 turnos mudaram) com autorização do Flavio. **Três portões novos**, cada um de um defeito que ninguém tinha perguntado: campo sem rótulo, ordem do gate, e a LISTA de regras (não só o número). |
| 05/08/2026 | [`HANDOFF_2026-08-05-f.md`](HANDOFF_2026-08-05-f.md) | **Sessão 2, parte 6** — **sexta auditoria: 25 achados**, e três correções da MANHÃ estavam na variável errada. O gate não executava uma linha de `Admin.tsx`: dois mutantes desligavam a trava de data e o guarda dos 73 turnos com EXIT=0. Mais o incidente do selo — o gate foi verde sobre outra árvore. |
| 05/08/2026 | [`HANDOFF_2026-08-05-e.md`](HANDOFF_2026-08-05-e.md) | **Sessão 2, parte 5** — **quinta auditoria externa, 21 achados**. O pior repetia o de ontem por outra porta: publicar duas vezes na mesma sessão apagava a primeira publicação (55 turnos), e o guarda aprovava — porque recebia o retrato envelhecido. `capacidade: 0` passava pelas DUAS réguas. A ponte dado→tela não tinha um teste. |
| 05/08/2026 | [`HANDOFF_2026-08-05-d.md`](HANDOFF_2026-08-05-d.md) | **Sessão 2, parte 4** — **4 auditorias externas, 48 achados, todos fechados**. A pior: gerar período MENOR apagava escala já divulgada (73 turnos medidos), e o conferidor aprovava. O caminho inteiro virou portão. |
| 05/08/2026 | [`HANDOFF_2026-08-05-c.md`](HANDOFF_2026-08-05-c.md) | **Sessão 2, parte 3** — a escala nova desmentia o site vigente em **87 turnos** (o Flavio pegou, nenhum portão pegou), trava de data retroativa, e a **configuração morta**: `identidade` existia desde o começo e nunca era lida. Portão de escopo + autoteste de 15 casos. |
| 05/08/2026 | [`HANDOFF_2026-08-05-b.md`](HANDOFF_2026-08-05-b.md) | **Sessão 2, parte 2** — o projeto virou **produto genérico** (regra máxima no §0 do roteador). O furo do "fora da escala" no relatório, a **segunda régua** que existe para discordar, e o ambiente de teste do publicar. |
| 05/08/2026 | [`HANDOFF_2026-08-05.md`](HANDOFF_2026-08-05.md) | **Sessão 2, parte 1** — entrar na administração virou **um clique**: a tela cobrava senha para cifrar um cofre VAZIO. E o campo de senha não tinha `autocomplete`, então o Chrome nunca oferecia lembrá-la. |
| 04/08/2026 | [`HANDOFF_2026-08-04-j.md`](HANDOFF_2026-08-04-j.md) | **Sessão 1, parte 10** — o caminho do token saiu de um `.cmd` não testado e foi **para dentro da tela**, e cada recusa passou a nomear o campo a corrigir. |
| 04/08/2026 | [`HANDOFF_2026-08-04-i.md`](HANDOFF_2026-08-04-i.md) | **Sessão 1, parte 9** — a **auditoria independente** que faltava (P2.10): 6 auditores adversariais em frentes disjuntas, **20 achados** que a autoverificação não via. Bloco vazio era aprovado; D9 era cega ao calendário; **três portões não mordiam**; o verde "ao vivo" podia ser de um bundle antigo. Dois portões novos, com autoteste. |
| 04/08/2026 | [`HANDOFF_2026-08-04-h.md`](HANDOFF_2026-08-04-h.md) | **Sessão 1, parte 8** — nomes em colunas alinhadas na imagem (o encavalamento existia **só na captura**, não no DOM) e seletor de meses antes de gerar. |
| 04/08/2026 | [`HANDOFF_2026-08-04-g.md`](HANDOFF_2026-08-04-g.md) | **Sessão 1, parte 7** — a imagem do WhatsApp ganhou **layout próprio**, no modelo do arquivo que o Flavio usa. A anterior fotografava a tela e saía com **5 dias**. |
| 04/08/2026 | [`HANDOFF_2026-08-04-f.md`](HANDOFF_2026-08-04-f.md) | **Sessão 1, parte 6** — o grafo de importações mapeado (a tela usa o domínio, sem caminho paralelo) e o achado que ele expôs: **quem sai do elenco perdia o passado na tela**, em silêncio. |
| 04/08/2026 | [`HANDOFF_2026-08-04-e.md`](HANDOFF_2026-08-04-e.md) | **Sessão 1, parte 5** — o histórico congelado conferido contra a **tela** do site antigo (66/66 dias, 282 nomes, 0 divergências), e o achado de que o site antigo **não mostra o passado**. |
| 04/08/2026 | [`HANDOFF_2026-08-04-d.md`](HANDOFF_2026-08-04-d.md) | **Sessão 1, parte 4** — Regra Mestra 3 medida e cumprida (tooltips 17%→100%), README, validação em celular (achou alvo de toque de 16px), e a decisão declarada sobre arrastar-e-soltar. |
| 04/08/2026 | [`HANDOFF_2026-08-04-c.md`](HANDOFF_2026-08-04-c.md) | **Sessão 1, parte 3** — histórico com reversão (e código morto ligado) e auditoria adversarial com 2 achados corrigidos. |
| 04/08/2026 | [`HANDOFF_2026-08-04-b.md`](HANDOFF_2026-08-04-b.md) | **Sessão 1, parte 2** — o produto no ar. Núcleo com 15 regras, gerador com piso descoberto, site e área administrativa publicados e validados ao vivo, motor, e quatro portões novos. Dois deles nasceram mentindo e foram consertados. |
| 04/08/2026 | [`HANDOFF_2026-08-04.md`](HANDOFF_2026-08-04.md) | **Sessão 1, parte 1** — nascimento do projeto. Levantamento medido do site atual (9 defeitos, incluindo a Santa Ceia com data errada no ar), desenho da área administrativa, esqueleto do método, repositório criado. |

---

**Handoff mais recente:** [`HANDOFF_2026-08-18.md`](HANDOFF_2026-08-18.md)

Ligações: [`../solicitacoes/INDICE_DE_SOLICITACOES.md`](../solicitacoes/INDICE_DE_SOLICITACOES.md) ·
[`../historico/INDICE.md`](../historico/INDICE.md) ·
[`../INVENTARIO_DE_FONTES.md`](../INVENTARIO_DE_FONTES.md) ·
[`../../DIARIO_DE_BORDO.md`](../../DIARIO_DE_BORDO.md) ·
[`../../AI_MASTER_LOG.md`](../../AI_MASTER_LOG.md)
