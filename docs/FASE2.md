# FASE 2 — requisitos e sugestões registradas (nada começa sem decisão do dono 👤)

> **Cadeia:** [`ESTADO.md`](../ESTADO.md) → [`handoff mais recente`](handoff/INDICE.md) → [`BACKLOG.md`](../BACKLOG.md) → **você está aqui**
> **Roteador:** [`AGENTS.md`](../AGENTS.md) · Documento **vivo**, dividido do BACKLOG por ASSUNTO em
> 07/08/2026, quando os requisitos de fase 2 passaram a ser um assunto inteiro.
> Solicitações de origem: S-043, S-047, S-048, S-049, S-050.

### P4.x 💡 Oportunidades de produto apontadas pela pesquisa (decisão do dono)
A pesquisa de 07/08 (§4) lista variações que sistemas maduros suportam e este produto não tem —
fronteira de escopo declarada, não defeito: **pares proibidos/preferidos** (cônjuges que não servem
juntos, ou só servem juntos — carona), **alocação fixa por data** ("fulano sempre no 1º domingo").
Ambas pedem decisão de produto antes de qualquer código.

### P4.w 💡 FASE 2 — malha PARAMETRIZÁVEL e vocabulário NEUTRO (requisito do dono, S-048, 07/08/2026) 👤
Palavras dele: *"é muito importante ser parametrizável (…) o dia e os horários do culto, dos
ensaios, cultos extras e outras atividades (…) temos que afastar a questão religiosa — escala
ampla: porteiros de prédio, segurança e assim por diante (…) selecionar o dia da semana e o horário
de início e fim; pode se repetir no mesmo dia (…) e o ensaio, que é o primeiro sábado de cada mês —
como parametrizar, de forma geral, um evento que ocorre num dia da semana e horário específicos?"*

**O que o MODELO já sabe fazer** (`RegraMalha` em `src/dominio/tipos.ts` — o motor já é genérico):

| Pedido dele | Já existe? |
|---|---|
| Evento por dia da semana | ✅ `diaSemana: 0–6` |
| Dois eventos no MESMO dia (manhã crianças, noite adultos) | ✅ duas regras com o mesmo `diaSemana` — é como domingo funciona hoje |
| "Primeiro sábado do mês" (o ensaio) | ✅ `somenteOcorrencia: 1` — é literalmente a regra do ENSAIO em produção |
| Padrões quinzenais/alternados | ✅ `cadaNDias` + `ancora` |
| Nome do evento | ✅ `rotulo` (livre — "ENSAIO" é só o valor atual) |
| Vagas por evento | ✅ `capacidade` por regra |

**O que FALTA para a fase 2** (nada disso muda o motor — muda dado e tela):

1. **Horário de início e fim** — hoje o evento é um TIPO fixo (`MANHA`/`TARDE`/`NOITE`); o pedido é
   hora real (`inicio: "09:00"`, `fim: "11:30"`), com o tipo virando rótulo derivado ou livre;
2. **Tela para editar a malha** — hoje a `MALHA_ATUAL` é cravada em `src/dominio/malha.ts`; o
   administrador precisa criar/editar regras sem tocar código (mesma família da identidade, que já
   é dado);
3. **Evento avulso em DATA específica** (culto extra, evento único) — hoje só há recorrência + o
   dia especial *sem* expediente; falta o avulso *com* expediente;
4. **Vocabulário neutro configurável** — "culto" → "evento/atividade", "ensaio" → rótulo livre,
   "Santa Ceia" → "dia sem expediente/feriado" (ver P4.z item 1). O precedente é o vocabulário
   `Irmão/porteiro`, que já é dado (`config.identidade`).

5. **Logotipo parametrizável — excluir completamente E trocar** (pedido dele, S-049, 07/08/2026:
   *"a imagem que está no site, logotipo da ccb, deve ser parametrizável, excluir completamente e
   também alterar!"*). O medido: `config.identidade.logo` JÁ é dado e o site JÁ esconde a imagem
   quando o campo está vazio (`voc.logo && <img…>` — remoção é UMA edição de JSON). O que falta é
   TELA: campo na seção de identidade para limpar o logo e para enviar outro arquivo (o `logo.png`
   vive em `dados/` e sobe pela mesma publicação dos JSON).

**Sugestões do assistente** (S-049 — pertinência vinda do motor e da pesquisa de rostering; tudo
decisão dele, nada começa sozinho):

| # | Sugestão | Por quê, e o custo honesto |
|---|---|---|
| A | **"Minha Escala" no calendário do celular (.ics)** | cada pessoa importa os próprios dias no Google/Apple Calendar, com lembrete nativo — dá para fazer **ainda na fase 1** (arquivo gerado no navegador, sem servidor) |
| B | **Equidade ACUMULADA entre blocos** | hoje o equilíbrio é por bloco; a cota mensal atravessa a fronteira, o total acumulado não. Depois de várias republicações no meio do ano, os totais podem derivar. Entrada nova `escalasAcumuladasAnterior` como desempate — mesma família da fronteira que já existe |
| C | **Q4 como desempate do gerador** | "variedade de companhia" hoje só AVISA (é o único ponto de atenção da escala no ar). Entre versões empatadas em piso e Jain, a cascata poderia preferir a que repete menos formações — o aviso tenderia a sumir sozinho. Barato: 3º critério na cascata, com o `refazer` protegido por versão |
| D | **Preferências LEVES por pessoa** ("prefere manhã") | a pesquisa (§4–5) separa restrição dura de preferência; hoje só temos as duras. Preferência entra como desempate, nunca como barreira — e a tela diz quando não foi possível atender |
| E | **Troca entre escalados com aprovação** | padrão dos sistemas comerciais: um pede, o outro aceita, o administrador aprova, a escala republica com D2/D7 conferidos. Exige fase 2 (backend) |
| F | **Lembrete automático na véspera** (WhatsApp) | reduz falta — **desenho completo e graus de dificuldade na §P4.f abaixo** (S-050) |

⚠️ Nada começa sem decisão explícita dele. Quando começar: os campos novos entram como OPCIONAIS no
JSON (blocos publicados continuam válidos), e o `refazer` continua provando a reprodução.

### P4.f 💡 Lembrete de véspera no WhatsApp — o desenho e os graus de dificuldade (S-050, 07/08/2026) 👤
Pergunta dele: *"seria maravilhoso, inclusive para agora. Qual é a maneira correta? Há dificuldade?
Qual o grau?"* — as três rotas, com a verdade de cada uma:

| Rota | Como funciona | Grau | O risco/custo honesto |
|---|---|---|---|
| **A · Oficial (a correta)** | API oficial do WhatsApp Business (Meta Cloud API) + um agendador diário. Na NOSSA arquitetura o agendador já existe de graça: **GitHub Actions com `schedule` (cron)** — o mesmo mecanismo que publica o site — lendo `blocos.json` publicado e enviando o lembrete a cada escalado da véspera | **médio** (1–2 dias de código) + **dias de espera** que são só dele | ⚠️ **A API oficial NÃO envia para GRUPO** — envia mensagem individual a cada número (o que é até melhor: lembrete pessoal a quem serve amanhã). Exige: conta Meta Business verificada, um número DEDICADO (não pode ser o número pessoal em uso no app), modelo de mensagem pré-aprovado pela Meta, e o telefone+consentimento de cada irmão (LGPD). Custo por mensagem de utilidade ≈ centavos; ~6 envios/semana é desprezível. **Preço e política atuais conferir na implementação** |
| **B · Não-oficial (a tentadora)** | Bibliotecas que automatizam o WhatsApp Web (Evolution API, Baileys e afins) — grátis, envia para grupo, usa o número dele | baixo de esforço | 🔴 **ALTO de risco: viola os termos do WhatsApp e o número pode ser BANIDO** — e seria o número que a igreja usa. Recusada como recomendação; fica registrada porque alguém sempre a sugere |
| **C · O atalho que resolve HOJE** | **`.ics` no site** (sugestão A da §P4.w): cada irmão importa "Minha Escala" no calendário do celular UMA vez, e o **lembrete nativo do telefone** dispara sozinho na véspera/na hora — sem servidor, sem número, sem Meta, sem risco | **baixo** (horas, fase 1) | nenhum. Limite honesto: o lembrete é do calendário, não chega "no WhatsApp" |

**Recomendação registrada:** C agora, A na fase 2, B não — **e a DECISÃO DO DONO (07/08/2026,
S-051) foi outra, e mudou o cálculo**: rota B **pela ponte do Charmway**, que já opera disparos em
produção com números DEDICADOS (o risco não recai sobre o número da igreja). Construído:
`scripts/vps/lembrete_escala.py` (espelho; dry-run provado com o dado real) + runbook
[`LEMBRETE_WHATSAPP.md`](LEMBRETE_WHATSAPP.md) com os 3 passos que só ele pode dar. A recusa
original segue registrada acima porque o RACIOCÍNIO dela continua certo para quem não tiver a
infraestrutura que ele tem.

### P4.z 💡 Observações da verificação de 07/08/2026 (S-047) — decisão do dono 👤
Duas notas de produto que a medição do fluxo plurianual revelou; nenhuma é defeito hoje:

1. **O rótulo "Santa Ceia" é cravado em ~20 pontos de `src/`**, mas o CONCEITO já é genérico ("dia
   sem expediente" — o dono descreveu como feriado). Para "qualquer outro propósito de escala"
   (regra §0), o rótulo deveria vir da identidade configurável, como já acontece com
   "Irmão/porteiro". Mesma família do vocabulário que já é dado;
2. ~~Ceia cadastrada em dia SEM culto passa calada~~ — ✅ **FECHADO em 07/08/2026, por pedido
   dele** (*"Aviso, não trava — faça isso"*). A data em dia sem culto aparece em ÂMBAR com o dia da
   semana (*"⚠️ quinta — sem culto na malha"*) e continua na lista. Provado nas duas pontas ao
   vivo: quinta 15/10 acusa, domingo 18/10 não.

### P4.y 💡 FASE 2 — publicação comercializável (decisão de 07/08/2026: fica para depois) 👤
Pergunta do dono (S-043): *"este é o melhor formato [token no navegador]? em questão de usabilidade
para quem faz a gestão (…) ou deixamos assim e ajeitamos numa próxima fase?"*

**Decisão registrada: fica assim na fase 1, e a fase 2 já tem o desenho.** O modelo atual
(site estático + Publicar = commit via token fine-grained) é o CERTO para uso interno com um
administrador: custo zero de operação, histórico do git de graça, publicação real em ~1 minuto —
e o [`ARQUITETURA.md` §"Por que estático"](docs/ARQUITETURA.md) declara o custo desde o começo.

O que ele NÃO serve, declarado: **cliente leigo**. Comercializar exige que "publicar" não dependa
de conta GitHub nem de token — a pesquisa de rostering (§2) mostra que todos os sistemas comerciais
(Planning Center, Ministry Scheduler Pro, ChurchTools) usam backend hospedado com conta e-mail/senha.
Desenho da fase 2, quando a comercialização for decidida:

1. **backend + banco** (padrão do mercado: Supabase/Postgres) — "publicar" vira salvar, na hora,
   sem deploy; login e-mail/senha de verdade; **multi-tenant** (uma instância, N igrejas/empresas);
2. o **domínio não muda uma linha** — a separação medida pelo portão `arquitetura` (domínio não
   importa nada de fora) é exatamente o que torna essa migração barata;
3. o formato dos três JSON vira o contrato da API; o histórico append-only vira tabela de versões.

⚠️ Nada disso começa sem decisão explícita do dono — é a regra §0 do `AGENTS.md` aplicada: genérico
no motor primeiro (malha, identidade, vocabulário — já feito), infraestrutura por último.

---
