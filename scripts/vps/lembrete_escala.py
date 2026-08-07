#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
LEMBRETE DE VÉSPERA — roda na VPS do Charmway, manda o lembrete da escala no grupo dos porteiros.

🔴 POR QUE EXISTE, E POR QUE NA VPS. Decisão do dono em 07/08/2026 (S-051): a rota escolhida foi a
ponte pelo Charmway — *"ele já faz disparos através de números específicos para bases específicas
(…) são muito poucos (…) temos VPS configurada"*. O aviso de risco da rota não-oficial foi dado e
fica valendo para o número DA IGREJA; aqui o remetente é um número DEDICADO de disparo do Charmway,
que é o modelo de operação que ele já usa em produção nas campanhas.

── ONDE ISTO VIVE ────────────────────────────────────────────────────────────────────────────────
VPS 187.127.26.152 (srv1866253.hstgr.cloud) · /root/escala_lembrete/lembrete_escala.py
Este arquivo no repositório é o ESPELHO versionado (o padrão da casa Charmway: a VPS não é repo).
Cron sugerido (18h São Paulo = 21h UTC):  0 21 * * *  /usr/bin/python3 /root/escala_lembrete/lembrete_escala.py >> /root/escala_lembrete/lembrete.log 2>&1

── COMO FUNCIONA, passo a passo ──────────────────────────────────────────────────────────────────
1. Baixa o dado PUBLICADO da escala (a mesma URL que os irmãos veem — nada de cópia paralela).
2. Calcula os turnos de AMANHÃ no fuso de São Paulo. Sem turno amanhã → sai em silêncio.
3. Monta a mensagem no modelo da casa (docs/COMUNICACOES.md — curta, com dia da semana conferido).
4. Envia UMA mensagem ao GRUPO dos porteiros via Evolution API local (127.0.0.1:8080), usando a
   instância do número dedicado. Grupo, e não números individuais, de propósito: zero telefone
   pessoal neste script, zero LGPD para carregar.
5. Kill-switch: o arquivo STOP ao lado do script desliga tudo sem mexer no cron.

── O QUE ESTE SCRIPT NÃO FAZ ─────────────────────────────────────────────────────────────────────
Não guarda segredo nenhum: a chave da Evolution é lida de /opt/charmway-crm/.env NA VPS, onde já
vive. Não conhece telefone de ninguém: manda para o JID do grupo. Não decide escala: só LÊ o
publicado.

Configuração (edite as 2 constantes abaixo na VPS, uma única vez):
  INSTANCIA  — nome da instância Evolution do número de disparo (GET /instance/fetchInstances)
  GRUPO_JID  — JID do grupo dos porteiros (GET /group/fetchAllGroups/{instância}?getParticipants=false)
               ⚠️ o número de disparo precisa SER MEMBRO do grupo para enviar.

Teste sem enviar:  python3 lembrete_escala.py --dry-run [--data AAAA-MM-DD]
"""
import json
import os
import re
import sys
import urllib.request
from datetime import datetime, timedelta, timezone

# Saída sempre em UTF-8: o console do Windows (cp1252) engasgava no emoji durante o dry-run local,
# e o mesmo protege o lembrete.log da VPS de qualquer locale torto.
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

SITE = "https://flaviocom.github.io/escala-porteiros/"
EVOLUTION = "http://127.0.0.1:8080"
ENV_EVOLUTION = "/opt/charmway-crm/.env"   # onde a chave AUTHENTICATION_API_KEY já vive na VPS
INSTANCIA = "CONFIGURAR_NA_VPS"            # ex.: o nome da instância do número de disparo
GRUPO_JID = "CONFIGURAR_NA_VPS"            # ex.: 1203630XXXXXXXXX@g.us
STOP = os.path.join(os.path.dirname(os.path.abspath(__file__)), "STOP")

ROTULO_TURNO = {"MANHA": "manhã", "TARDE": "tarde", "NOITE": "noite"}
DIAS = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"]


def baixar(caminho):
    with urllib.request.urlopen(f"{SITE}{caminho}?cb={int(datetime.now().timestamp())}", timeout=30) as r:
        return json.loads(r.read().decode("utf-8"))


def hoje_sao_paulo():
    # UTC-3 fixo: o Brasil não tem horário de verão desde 2019, e a VPS roda em UTC.
    return datetime.now(timezone(timedelta(hours=-3)))


def chave_evolution():
    with open(ENV_EVOLUTION, encoding="utf-8") as f:
        for linha in f:
            m = re.match(r"^AUTHENTICATION_API_KEY=(.+)$", linha.strip())
            if m:
                return m.group(1)
    raise SystemExit(f"AUTHENTICATION_API_KEY não encontrada em {ENV_EVOLUTION}")


def montar_mensagem(data_iso, turnos, nome_de):
    dia_semana = DIAS[int(datetime.strptime(data_iso, "%Y-%m-%d").replace(tzinfo=timezone.utc).strftime("%w"))]
    data_br = "/".join(reversed(data_iso.split("-")))
    linhas = [f"🔔 *Lembrete da escala — amanhã, {dia_semana}, {data_br}*", ""]
    for t in turnos:
        if t.get("santaCeia"):
            linhas.append("📖 *Santa Ceia* — ninguém escalado; vêm Irmãos de outra congregação.")
            continue
        nomes = ", ".join(nome_de.get(p, p) for p in t["pessoas"])
        rotulo = t.get("rotulo") or ROTULO_TURNO.get(t["tipo"], t["tipo"])
        linhas.append(f"• *{rotulo.capitalize()}*: {nomes}")
    linhas += ["", "Que Deus abençoe o serviço de cada porteiro. 🙏", SITE]
    return "\n".join(linhas)


def enviar(mensagem):
    chave = chave_evolution()
    corpo = json.dumps({"number": GRUPO_JID, "text": mensagem}).encode("utf-8")
    req = urllib.request.Request(
        f"{EVOLUTION}/message/sendText/{INSTANCIA}",
        data=corpo,
        headers={"Content-Type": "application/json", "apikey": chave},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.status, r.read().decode("utf-8")[:200]


def main():
    if os.path.exists(STOP):
        print("STOP presente — nada enviado (kill-switch).")
        return
    dry = "--dry-run" in sys.argv
    if "--data" in sys.argv:
        alvo = sys.argv[sys.argv.index("--data") + 1]
    else:
        alvo = (hoje_sao_paulo() + timedelta(days=1)).strftime("%Y-%m-%d")

    blocos = baixar("dados/blocos.json")
    pessoas = baixar("dados/pessoas.json")
    nome_de = {p["id"]: p["nome"] for p in pessoas["pessoas"]}
    turnos = [t for b in blocos["blocos"] for t in b["turnos"] if t["data"] == alvo]
    if not turnos:
        print(f"{alvo}: sem turno amanhã — nada a lembrar.")
        return

    msg = montar_mensagem(alvo, turnos, nome_de)
    print(f"--- mensagem para {alvo} ({len(turnos)} turno[s]) ---")
    print(msg)
    if dry:
        print("--- dry-run: NADA foi enviado ---")
        return
    status, resposta = enviar(msg)
    print(f"Evolution respondeu {status}: {resposta}")


if __name__ == "__main__":
    main()
