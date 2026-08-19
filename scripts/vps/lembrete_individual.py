#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
LEMBRETE INDIVIDUAL — roda na VPS do Charmway, manda mensagem PESSOAL no WhatsApp de cada
porteiro que tiver telefone cadastrado (S-064, 19/08/2026).

🔴 POR QUE EXISTE, E EM QUE DIFERE DO LEMBRETE DE GRUPO. `lembrete_escala.py` manda UMA mensagem
por dia para o GRUPO, de propósito sem telefone de ninguém (zero LGPD a carregar) — decisão de
07/08/2026 (S-051). Em 19/08/2026 o dono pediu o oposto para quem QUISER: uma lista aberta de
nome + telefone (nunca apagada — sair da escala continua sendo `ativo: false`, igual ao elenco) e
DUAS mensagens por pessoa: o resumo da semana (domingo a domingo) e o lembrete da véspera. Decisão
dele, registrada: sem controle de consentimento aqui — quem não quiser, simplesmente não tem
telefone cadastrado no Elenco da área administrativa.

── ONDE ISTO VIVE ────────────────────────────────────────────────────────────────────────────────
VPS 187.127.26.152 (srv1866253.hstgr.cloud) · /root/escala_lembrete/lembrete_individual.py
Este arquivo no repositório é o ESPELHO versionado (o padrão da casa Charmway: a VPS não é repo).
Mesma pasta do `lembrete_escala.py` — compartilha o MESMO arquivo STOP (kill-switch) e a MESMA
chave (`/opt/charmway-crm/.env`), mas é um script à parte: cada um se explica sozinho, sem import
entre os dois — convenção da casa, porque a VPS recebe cada arquivo por cópia, não por `git clone`.

Cron sugerido (São Paulo):
  diário, 18h  (véspera, mesmo horário do lembrete de grupo):
    0 21 * * *  /usr/bin/python3 /root/escala_lembrete/lembrete_individual.py --modo diario >> /root/escala_lembrete/lembrete_individual.log 2>&1
  semanal, SEGUNDA-feira 8h:
    0 11 * * 1  /usr/bin/python3 /root/escala_lembrete/lembrete_individual.py --modo semanal >> /root/escala_lembrete/lembrete_individual.log 2>&1

  🔴 Por que SEGUNDA e não domingo (mudou em 19/08/2026, dois agentes de pesquisa independentes,
  S-065): não existe padrão de mercado único aqui — os líderes do setor de escala de turno
  (7shifts, Deputy, Sling) disparam no momento em que o GESTOR publica, não num dia fixo de
  calendário; e a norma técnica brasileira (ABNT NBR 5892:2019) e a ISO 8601 divergem entre si
  (domingo vs. segunda). Decisão registrada como CONVENÇÃO DE CASA, não como "padrão de mercado":
  segunda de manhã é quando o destinatário já está pensando em termos de "minha semana de
  compromissos que começa agora" — o cálculo da semana continua ancorado domingo-a-domingo por
  dentro (`domingo_da_semana`, sem mudança), só o DIA DO DISPARO mudou. Relatório completo:
  `docs/LEMBRETE_WHATSAPP.md` §"A pesquisa, e o que ela mudou".

── COMO FUNCIONA, passo a passo ──────────────────────────────────────────────────────────────────
1. Baixa o dado PUBLICADO (a mesma URL que os porteiros veem) — pessoas e blocos.
2. `--modo diario`: para cada pessoa COM telefone, olha os turnos de AMANHÃ; se ela está escalada,
   manda o lembrete. Sem turno amanhã para ela → nada é enviado (silêncio, igual ao grupo).
3. `--modo semanal`: para cada pessoa COM telefone, olha os turnos da semana — DOMINGO A DOMINGO,
   incluindo o domingo seguinte (8 dias corridos; mesma regra do filtro "Esta Semana" da tela,
   `src/App.tsx`, pedido do Flavio em 06/08/2026: "nem todo mundo conta a semana começando no
   domingo"). Sem turno na semana para ela → nada é enviado.
4. Formato do número, confirmado contra código de referência real na própria VPS (skill
   `int-evolution-api`, `_format_number`): dígitos com DDI 55 + `@s.whatsapp.net` — NÃO é o mesmo
   formato do envio a grupo (que usa `@g.us`).
5. Kill-switch: o mesmo arquivo `STOP` ao lado do script (compartilhado com `lembrete_escala.py`)
   desliga os dois sem mexer no cron.

── O QUE ESTE SCRIPT NÃO FAZ ─────────────────────────────────────────────────────────────────────
Não guarda segredo nenhum: a chave da Evolution é lida de /opt/charmway-crm/.env NA VPS, onde já
vive. Não decide escala: só LÊ o publicado. Não manda para quem não tem telefone cadastrado — pular
em silêncio, não é erro.

Configuração (edite a constante abaixo na VPS, uma única vez — é a MESMA instância do grupo):
  INSTANCIA  — nome da instância Evolution do número de disparo (GET /instance/fetchInstances)

Teste sem enviar:  python3 lembrete_individual.py --modo diario  --dry-run [--data AAAA-MM-DD]
                   python3 lembrete_individual.py --modo semanal --dry-run [--data AAAA-MM-DD]
"""
import json
import os
import re
import sys
import urllib.request
from datetime import datetime, timedelta, timezone

# Saída sempre em UTF-8 — mesma razão do lembrete de grupo: console do Windows (cp1252) engasga
# no emoji durante o dry-run local, e protege o .log da VPS de qualquer locale torto.
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

SITE = "https://flaviocom.github.io/escala-porteiros/"
EVOLUTION = "http://127.0.0.1:8080"
ENV_EVOLUTION = "/opt/charmway-crm/.env"   # onde a chave AUTHENTICATION_API_KEY já vive na VPS
INSTANCIA = "CONFIGURAR_NA_VPS"            # a mesma instância do número dedicado do lembrete de grupo
STOP = os.path.join(os.path.dirname(os.path.abspath(__file__)), "STOP")

ROTULO_TURNO = {"MANHA": "manhã", "TARDE": "tarde", "NOITE": "noite"}
DIAS = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"]
DIAS_CURTO = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"]


def baixar(caminho):
    with urllib.request.urlopen(f"{SITE}{caminho}?cb={int(datetime.now().timestamp())}", timeout=30) as r:
        return json.loads(r.read().decode("utf-8"))


def hoje_sao_paulo():
    # UTC-3 fixo: o Brasil não tem horário de verão desde 2019, e a VPS roda em UTC.
    return datetime.now(timezone(timedelta(hours=-3)))


def data_br(data_iso):
    return "/".join(reversed(data_iso.split("-")))


def dia_da_semana(data_iso):
    # `%w`: 0=domingo … 6=sábado — mesma convenção do domínio TypeScript (`diaDaSemana`).
    return int(datetime.strptime(data_iso, "%Y-%m-%d").replace(tzinfo=timezone.utc).strftime("%w"))


def domingo_da_semana(data_iso):
    """O domingo desta semana (ou a própria data, se já for domingo) — início do intervalo "Esta
    Semana" da tela (`src/App.tsx`, `startOfWeek` com locale pt-BR)."""
    d = datetime.strptime(data_iso, "%Y-%m-%d")
    return (d - timedelta(days=dia_da_semana(data_iso))).strftime("%Y-%m-%d")


def somar_dias(data_iso, n):
    return (datetime.strptime(data_iso, "%Y-%m-%d") + timedelta(days=n)).strftime("%Y-%m-%d")


def chave_evolution():
    with open(ENV_EVOLUTION, encoding="utf-8") as f:
        for linha in f:
            m = re.match(r"^AUTHENTICATION_API_KEY=(.+)$", linha.strip())
            if m:
                return m.group(1)
    raise SystemExit(f"AUTHENTICATION_API_KEY não encontrada em {ENV_EVOLUTION}")


"""
🔴 REDAÇÃO E FORMATAÇÃO — pesquisadas, não inventadas (19/08/2026, S-065, dois agentes de pesquisa
independentes; relatórios completos citados em `docs/LEMBRETE_WHATSAPP.md`).

Sintaxe confirmada contra a página oficial do WhatsApp Help Center (faq.whatsapp.com): negrito é
UM asterisco de cada lado (`*texto*`) — o que já se usava estava certo. Lista com marcador via API
de terceiro (`- item`) NÃO tem confirmação de que renderiza como marcador de verdade em todo
cliente — por isso as duas mensagens continuam usando o caractere "•" digitado à mão (Unicode
comum, garantido em qualquer app), não a sintaxe de lista do WhatsApp.

Estrutura em 3 blocos (Nielsen Norman Group + práticas de mensagem transacional): (1)
IDENTIFICAÇÃO — quem manda, na primeira linha, negrito só no nome — resolve o erro mais comum
apontado pela pesquisa: mensagem automática sem remetente claro é lida como possível spam; (2)
CORPO — o fato central, rótulo em negrito + valor simples, sem enterrar a informação num parágrafo;
(3) FECHAMENTO — cordial, sem negrito extra (negrito em tudo equivale a negrito em nada). Emoji:
2 por mensagem, cada um com função de sinalização (🔔/📅 = tipo de aviso, 🙏 = fechamento), dentro
da faixa de 1 a 3 que a pesquisa aponta como profissional-porém-cordial.
"""


def montar_mensagem_diaria(pessoa, data_iso, turnos_da_pessoa, titulo):
    saudacao = pessoa.get("nomeCompleto") or pessoa["nome"]
    dia = DIAS[dia_da_semana(data_iso)]
    rotulos = ", ".join(t.get("rotulo") or ROTULO_TURNO.get(t["tipo"], t["tipo"]) for t in turnos_da_pessoa)
    return "\n".join([
        f"🔔 *{titulo}* — lembrete de escala",
        "",
        f"Olá, {saudacao}! Passando para lembrar:",
        "",
        f"*Data:* amanhã, {dia}, {data_br(data_iso)}",
        f"*Turno:* {rotulos}",
        "",
        "Que Deus abençoe o seu serviço! 🙏",
        SITE,
    ])


def montar_mensagem_semanal(pessoa, inicio_iso, fim_iso, turnos_da_pessoa, titulo):
    # `fim_iso` vem de `selecionar_semanal` — NUNCA recalculado aqui. Recalcular por conta própria
    # foi o segundo achado da auditoria de 19/08/2026: duas fórmulas para a mesma fronteira divergem
    # sempre que `inicio` não é domingo, e o texto passava a prometer um dia que o filtro nunca
    # buscou. Ver o comentário grande em `selecionar_semanal`.
    saudacao = pessoa.get("nomeCompleto") or pessoa["nome"]
    linhas = [
        f"📅 *{titulo}* — sua escala da semana",
        "",
        f"Olá, {saudacao}! De {data_br(inicio_iso)} a {data_br(fim_iso)}, você está assim:",
        "",
    ]
    for t in sorted(turnos_da_pessoa, key=lambda t: t["data"]):
        rotulo = t.get("rotulo") or ROTULO_TURNO.get(t["tipo"], t["tipo"])
        linhas.append(f"• {DIAS_CURTO[dia_da_semana(t['data'])]}, {data_br(t['data'])} — {rotulo}")
    linhas += ["", "Que a semana seja abençoada! 🙏", SITE]
    return "\n".join(linhas)


def enviar_individual(telefone, mensagem):
    chave = chave_evolution()
    corpo = json.dumps({"number": f"{telefone}@s.whatsapp.net", "text": mensagem}).encode("utf-8")
    req = urllib.request.Request(
        f"{EVOLUTION}/message/sendText/{INSTANCIA}",
        data=corpo,
        headers={"Content-Type": "application/json", "apikey": chave},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.status, r.read().decode("utf-8")[:200]


def selecionar_diario(alvo, pessoas, blocos):
    """Quem tem telefone E está escalada em `alvo` — puro, sem rede/print/envio. Devolve
    [(pessoa, turnos_da_pessoa), ...]. Testado isoladamente em `autoteste_lembrete_individual.py`."""
    turnos = [t for b in blocos["blocos"] for t in b["turnos"] if t["data"] == alvo and not t.get("santaCeia")]
    resultado = []
    for p in pessoas["pessoas"]:
        if not p.get("telefone"):
            continue
        turnos_da_pessoa = [t for t in turnos if p["id"] in t.get("pessoas", [])]
        if turnos_da_pessoa:
            resultado.append((p, turnos_da_pessoa))
    return resultado


def selecionar_semanal(alvo, pessoas, blocos):
    """Quem tem telefone E tem turno na semana (domingo a domingo) de `alvo`, DE HOJE PRA FRENTE —
    puro, mesma forma de `selecionar_diario`. Devolve
    (inicio_iso, fim_iso, [(pessoa, turnos_da_pessoa), ...]).

    🔴 PRIMEIRO ACHADO (19/08/2026, S-065, no dia em que o disparo mudou de domingo para
    segunda-feira): com disparo no domingo, `alvo == domingo_da_semana(alvo)` sempre, então nunca
    fazia diferença. Com disparo na SEGUNDA, `domingo_da_semana` aponta para ONTEM — sem cortar,
    alguém cujo único turno da semana fosse justamente domingo (já realizado) recebia "sua escala
    desta semana: domingo, [ontem] — noite", um turno que já tinha acontecido. `inicio` é sempre
    `alvo` — nunca lista, nem seleciona, turno anterior a hoje (`domingo_da_semana(alvo)` nunca é
    posterior a `alvo`, então o antigo `max(domingo, alvo)` sempre resolvia para `alvo`; simplificado
    porque a comparação nunca desempatava para o outro lado — achado da auditoria cega do próprio
    conserto, mesmo dia).

    🔴 SEGUNDO ACHADO, da MESMA auditoria: `fim` tem de ser DEVOLVIDO, não recalculado por quem
    monta a mensagem. A primeira versão do conserto acima só devolvia `inicio`, e
    `montar_mensagem_semanal` recalculava `fim = inicio + 7` sozinha — que é DIFERENTE do `fim` que
    esta função usa para filtrar (`domingo_da_semana(alvo) + 7`) sempre que `alvo` não é domingo
    (ou seja, em TODA mensagem semanal enviada sob o cron real de segunda-feira). Resultado: a
    mensagem prometia "de HOJE a domingo+8" no texto, mas só tinha CONSULTADO até "domingo+7" — um
    turno real no último dia prometido nunca era buscado, e a mensagem mesmo assim afirmava cobrir
    aquele dia. Reproduzido ao vivo: turno em 31/08 dentro do período anunciado no texto, ausente da
    lista, porque o filtro nunca foi além de 30/08. Conserto: `fim` sai daqui, uma vez só, e quem
    monta a mensagem usa o mesmo valor — nunca dois cálculos para a mesma fronteira.
    """
    fim = somar_dias(domingo_da_semana(alvo), 7)
    inicio = alvo
    turnos = [t for b in blocos["blocos"] for t in b["turnos"] if inicio <= t["data"] <= fim and not t.get("santaCeia")]
    resultado = []
    for p in pessoas["pessoas"]:
        if not p.get("telefone"):
            continue
        turnos_da_pessoa = [t for t in turnos if p["id"] in t.get("pessoas", [])]
        if turnos_da_pessoa:
            resultado.append((p, turnos_da_pessoa))
    return inicio, fim, resultado


def rodar_diario(alvo, pessoas, blocos, titulo, dry):
    selecionados = selecionar_diario(alvo, pessoas, blocos)
    for p, turnos_da_pessoa in selecionados:
        msg = montar_mensagem_diaria(p, alvo, turnos_da_pessoa, titulo)
        print(f"--- {p['nome']} ({p['telefone']}) — {alvo} ---")
        print(msg)
        if dry:
            print("--- dry-run: NADA foi enviado ---\n")
        else:
            status, resposta = enviar_individual(p["telefone"], msg)
            print(f"Evolution respondeu {status}: {resposta}\n")
    if not selecionados:
        print(f"{alvo}: ninguém com telefone cadastrado está escalado amanhã — nada a enviar.")


def rodar_semanal(alvo, pessoas, blocos, titulo, dry):
    inicio, fim, selecionados = selecionar_semanal(alvo, pessoas, blocos)
    for p, turnos_da_pessoa in selecionados:
        msg = montar_mensagem_semanal(p, inicio, fim, turnos_da_pessoa, titulo)
        print(f"--- {p['nome']} ({p['telefone']}) — semana de {inicio} ---")
        print(msg)
        if dry:
            print("--- dry-run: NADA foi enviado ---\n")
        else:
            status, resposta = enviar_individual(p["telefone"], msg)
            print(f"Evolution respondeu {status}: {resposta}\n")
    if not selecionados:
        print(f"semana de {inicio}: ninguém com telefone cadastrado está escalado — nada a enviar.")


def main():
    if os.path.exists(STOP):
        print("STOP presente — nada enviado (kill-switch).")
        return
    if "--modo" not in sys.argv:
        raise SystemExit("uso: lembrete_individual.py --modo diario|semanal [--dry-run] [--data AAAA-MM-DD]")
    modo = sys.argv[sys.argv.index("--modo") + 1]
    if modo not in ("diario", "semanal"):
        raise SystemExit(f"--modo tem de ser 'diario' ou 'semanal', veio '{modo}'")
    dry = "--dry-run" in sys.argv
    if "--data" in sys.argv:
        alvo = sys.argv[sys.argv.index("--data") + 1]
    elif modo == "diario":
        alvo = (hoje_sao_paulo() + timedelta(days=1)).strftime("%Y-%m-%d")
    else:
        alvo = hoje_sao_paulo().strftime("%Y-%m-%d")

    pessoas = baixar("dados/pessoas.json")
    blocos = baixar("dados/blocos.json")
    # `config.identidade.titulo` é DADO configurável (nunca cravado — regra máxima de escopo, §0 do
    # AGENTS.md), e é o que a mensagem usa para se IDENTIFICAR na primeira linha — achado da
    # pesquisa: mensagem automática sem remetente claro é lida como possível spam.
    titulo = baixar("dados/config.json")["identidade"]["titulo"]

    if modo == "diario":
        rodar_diario(alvo, pessoas, blocos, titulo, dry)
    else:
        rodar_semanal(alvo, pessoas, blocos, titulo, dry)


if __name__ == "__main__":
    main()
