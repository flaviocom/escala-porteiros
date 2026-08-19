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
- Mensagem individual por pessoa (em vez de grupo) exigiria cadastro de telefones + consentimento —
  fica como evolução possível, registrada na [`FASE2.md`](FASE2.md).
