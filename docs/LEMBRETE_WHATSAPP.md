# Lembrete de véspera no WhatsApp — a ponte pelo Charmway

> **Cadeia:** [`AGENTS.md`](../AGENTS.md) → **você está aqui** · Vizinhos: [`FASE2.md`](FASE2.md) ·
> [`COMUNICACOES.md`](COMUNICACOES.md)
> Nasceu da S-051 (07/08/2026) — decisão do dono: rota B **pela ponte do Charmway**.

## A decisão, e por que ela muda o cálculo de risco

A rota não-oficial foi desaconselhada em S-050 **para o número da igreja**. O dono escolheu outra
coisa: usar a infraestrutura do **Ecossistema Charmway** — que já opera disparos em produção com
**números dedicados**, Evolution API na VPS própria, teto por conta e kill-switch. Palavras dele:
*"não haveria risco de banimento [do número da igreja], porque são números específicos para bases
específicas (…) e são muito poucos."* O risco residual que fica é sobre o número DEDICADO de
disparo — o mesmo risco que as campanhas do Charmway já operam conscientemente todos os dias.

## O desenho — uma mensagem por dia, para o GRUPO

| Peça | O quê |
|---|---|
| Onde roda | VPS do Charmway (`187.127.26.152` · srv1866253.hstgr.cloud), cron diário 18h São Paulo |
| Script | [`scripts/vps/lembrete_escala.py`](../scripts/vps/lembrete_escala.py) — **espelho versionado**; o vivo fica em `/root/escala_lembrete/` na VPS (padrão da casa Charmway: a VPS não é repo) |
| Fonte do dado | a URL PUBLICADA da escala — a mesma que os irmãos veem; nenhuma cópia paralela |
| Envio | `POST /message/sendText/{instância}` na Evolution local (`127.0.0.1:8080`), **para o JID do GRUPO** dos porteiros |
| Por que grupo | zero telefone pessoal no script, zero LGPD a carregar — e a mensagem chega onde a escala já é assunto |
| Segredos | **nenhum aqui**: a chave da Evolution é lida de `/opt/charmway-crm/.env` NA VPS, onde já vive |
| Kill-switch | arquivo `STOP` ao lado do script desliga tudo sem mexer no cron |
| Sem turno amanhã | sai em silêncio — segunda, terça, quinta e sexta não geram mensagem |

Dry-run local já provado com o dado real: domingo (2 turnos, 6 nomes) e Santa Ceia (16/08 —
mensagem própria, ninguém escalado) saem no modelo da casa.

## Os passos que SÓ o dono pode dar (nesta ordem)

1. ✅ **Acesso SSH resolvido (verificado ao vivo em 18/08/2026).** A chave `claude-escala-lembrete`
   perdeu o par em 08/08 (registro abaixo, mantido como histórico), mas a chave `charmway_deploy`
   (autorizada em 10/08/2026, já presente nesta máquina) **funciona** — testada com leitura real na
   VPS (`whoami`, `docker ps`, Evolution API respondendo). Nada a fazer aqui.

   <details><summary>Registro histórico — a chave perdida de 08/08/2026</summary>

   ```
   ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGK7TfzdOE9woYgAMnaUWutOmcZPOVAbVd09auZlgzP7 claude-escala-lembrete
   ```

   Esta chave pública perdeu o par em 08/08/2026 — a parte privada vivia só no contêiner da sessão
   em que foi gerada, recolhido quando aquela sessão se perdeu na atualização do aplicativo. Ficou
   sem uso; a `charmway_deploy` a substituiu de fato.
   </details>

2. ⏳ **Número escolhido (S-059, 18/08/2026): `551194950100`.** Explícito por decisão do dono — *"não
   irei usar os números que estão conectados na instância. Irei usar o número específico (…) que é o
   551194950100 (…) ele fica conectado em Ritmo & Números da aba do administrador, no painel de
   campanhas."* Levantamento ao vivo em 18/08/2026 confirmou que os 6 números já conectados na
   instância (`fetchInstances` + `fetchAllGroups`) não servem — nenhum está em grupo de
   porteiros/igreja, todos são do ecossistema comercial Charmway. O `551194950100` é dedicado e
   ainda **não está conectado**. Falta: (a) ele conectar o número em Ritmo & Números — ação dele,
   parear WhatsApp é login, fora do meu alcance — e (b) colocá-lo dentro do grupo dos porteiros.

3. **Dizer "go"** — daí em diante é comigo: instalo o script na VPS, descubro a instância e o JID
   do grupo pela Evolution, configuro as duas constantes, instalo o cron, rodo o dry-run NA VPS e
   faço **um envio de teste real com você olhando o grupo** antes de deixar o cron por conta.

## Fronteiras declaradas

- O lembrete **lê** a escala publicada; não decide nada, não escreve nada.
- Se o site estiver fora do ar na hora do cron, o script falha alto no log — e o culto de amanhã
  continua na imagem e no site quando voltarem.

## O lembrete INDIVIDUAL — construído em 19/08/2026 (S-064)

O que a nota acima chamava de "evolução possível" foi pedido e construído no mesmo dia: *"Eu quero
criar uma lista editável de nomes e telefones (...) A mensagem é para enviar (...) com agendamentos
no começo da semana (...) e um dia antes (...) Não precisa se preocupar com nada de LGPD."* —
palavras do dono, S-063. Decisão dele, registrada aqui por ser exatamente o desvio da fronteira que
esta seção previa: **sem controle de consentimento** — quem não quiser mensagem individual, apenas
não tem telefone cadastrado.

**Onde cadastrar:** área administrativa → aba **Elenco** → abrir o card de qualquer pessoa → seção
"Lembrete individual no WhatsApp". Dois campos: **nome completo** (como a mensagem saúda — vazio
usa o nome curto de sempre) e **telefone** (aceita qualquer formatação digitada; normaliza sozinho
para dígitos com DDI 55 ao sair do campo — `src/utils/telefone.ts`). **Não existe botão de apagar**:
o mesmo "tirar da escala" que já existia (`ativo: false`) também para a mensagem, sem controle
duplicado — "a lista fica aberta, não é para apagar".

**Duas mensagens, cordiais, por pessoa:**

| Modo | Quando | O que diz |
|---|---|---|
| `semanal` | **segunda-feira de manhã** | todos os turnos DELA na semana — o cálculo interno continua domingo a domingo (mesma regra do filtro "Esta Semana" da tela, `src/App.tsx`); só o DIA DO DISPARO é segunda |
| `diario` | véspera (mesmo horário do lembrete de grupo) | só se ela estiver escalada amanhã |

Quem não tem turno no período **não recebe mensagem** — silêncio, igual ao lembrete de grupo. Quem
não tem telefone cadastrado nunca entra na seleção — sem erro, sem tentativa de envio.

## A pesquisa, e o que ela mudou (S-065, 19/08/2026)

O dia do disparo semanal e o texto das duas mensagens tinham sido escolhidos por mim, sem pesquisa,
só por analogia com o filtro "Esta Semana" da tela — o dono perguntou (S-065) se não deveria ser
SEGUNDA-FEIRA em vez de domingo, e pediu pesquisa **antes** de qualquer decisão ou código. Dois
agentes de pesquisa independentes rodaram em paralelo; nenhum decidiu por mim — as decisões abaixo
foram tomadas depois de ler os dois relatórios completos.

**Cadência (dia do disparo semanal, e "1 lembrete ou mais?"):**
- **Não existe padrão de mercado único.** Os líderes do setor de escala de turno (7shifts, Deputy,
  Sling, Homebase) não fixam o resumo semanal a um dia de calendário — disparam quando o GESTOR
  publica a escala, não em recorrência automática. O único achado de "dia fixo automático" veio do
  Clockify (timesheet, não escala de turno), que usa o "início de semana" configurado pelo
  workspace — ou seja, terceiriza a decisão em vez de resolvê-la.
- **Domingo vs. segunda é empate documentado, não erro de pesquisa**: a norma técnica brasileira
  (ABNT NBR 5892:2019) fixa domingo; a ISO 8601 fixa segunda; o hábito prático brasileiro trata
  segunda como "início da semana de trabalho". **Decisão: segunda-feira de manhã, como convenção
  de casa DECLARADA — não como "padrão de mercado"** (não existe um), porque é quando o conteúdo do
  resumo (a semana de compromissos) corresponde à unidade mental de quem recebe, e evita competir
  por atenção com o próprio culto de domingo.
- **A estrutura "resumo semanal + lembrete de véspera" já é o padrão de maior eficácia encontrado**:
  um ensaio clínico randomizado (Steiner et al., *Am J Manag Care* 2018;24(8):377-384 — 54.066
  pacientes) mediu taxa de falta de 4,4% com dois lembretes espaçados (alguns dias antes + véspera)
  contra 5,3–5,8% com um só. O par que este sistema já tinha desenhado replica exatamente esse
  padrão vencedor — **não há indicação de que seja necessário um terceiro lembrete**, e não há
  evidência de fadiga de notificação nesse volume (2 toques por evento).
- Relatório completo: `pesquisa-cadencia-lembretes.md` (agente de pesquisa, 19/08/2026 — fontes:
  7shifts, Deputy, Sling, Homebase, Clockify, ABNT NBR 5892:2019, ISO 8601, Steiner et al. 2018).

**Formatação e redação:**
- **Sintaxe confirmada contra a página oficial do WhatsApp Help Center** (faq.whatsapp.com):
  negrito é `*texto*` (o que já se usava estava certo); monoespaçado são TRÊS crases, não uma;
  listas/citação existem oficialmente desde fev/2024, mas **sem confirmação de que renderizam como
  lista de verdade quando a mensagem chega pronta via API de terceiro** (em vez de digitada no
  app) — por isso as mensagens continuam usando o caractere "•" à mão, o único formato garantido em
  qualquer cliente.
- **Estrutura em 3 blocos** (Nielsen Norman Group + práticas de mensagem transacional):
  identificação (quem manda, 1ª linha, negrito só no nome — o remetente ausente é o erro mais
  citado que faz mensagem automática parecer spam) → corpo (rótulo em negrito + valor, sem
  parágrafo corrido) → fechamento cordial, sem negrito extra. 2 emojis por mensagem, cada um com
  função de sinalização, dentro da faixa de 1–3 apontada como profissional-porém-cordial.
- **O texto das duas mensagens agora se identifica** com `config.identidade.titulo` (dado
  configurável, nunca cravado — §0 do `AGENTS.md`) na primeira linha — gap real que a pesquisa
  encontrou e que a versão anterior não tinha.
- Relatório completo: `pesquisa-formatacao-whatsapp.md` (agente de pesquisa, 19/08/2026 — fonte
  primária: WhatsApp Help Center; UX writing: Nielsen Norman Group).

> Os dois relatórios completos foram salvos no scratchpad da sessão que os produziu, não neste
> repositório — as conclusões e citações relevantes estão resumidas acima e nos comentários do
> próprio `scripts/vps/lembrete_individual.py`.

**Onde vive:** [`scripts/vps/lembrete_individual.py`](../scripts/vps/lembrete_individual.py) — espelho
versionado, mesma pasta e mesmo `STOP` do `lembrete_escala.py` (kill-switch compartilhado), mesma
instância Evolution (o número dedicado). Formato do número **confirmado contra código de referência
real na própria VPS** (skill `int-evolution-api`, 19/08/2026): dígitos com DDI 55 +
`@s.whatsapp.net` — diferente do envio a grupo, que usa `@g.us`.

**Autoteste** (não entra no `npm run gate` — Python não é parte da esteira JS deste projeto, mesma
fronteira do `lembrete_escala.py`, que também nunca entrou): 22 casos, dado fabricado, sem rede —
seleção (quem recebe o quê, nas duas pontas: com/sem telefone, com/sem turno, Santa Ceia sempre
fora) e composição da mensagem (saudação, identificação, rótulos em negrito, ordenação, ausência de
sintaxe de lista não confirmada). `python3 scripts/vps/autoteste_lembrete_individual.py`.

**O que falta para ligar de verdade:** o mesmo bloqueio de sempre — o número `551194950100` ainda
não está conectado (§2 acima). Instalar o script na VPS e configurar o cron é o mesmo passo 3
("dizer 'go'") já descrito, estendido para os dois scripts.
