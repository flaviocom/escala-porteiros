#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AUTOTESTE — `lembrete_individual.py` seleciona e escreve certo, sem tocar rede nem WhatsApp
(S-064, 19/08/2026).

Mesma regra do método que criou `autoteste-selar-arvore.mjs`: *"toda trava nova nasce com
autoteste, no mesmo commit"*. Aqui não há uma trava (não é um portão que bloqueia o gate) — é a
prova de que a seleção (quem recebe o quê) e a composição da mensagem fazem o que dizem fazer,
com dado fabricado, sem depender do site publicado estar no ar.

Uso: python3 scripts/vps/autoteste_lembrete_individual.py
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import lembrete_individual as m  # noqa: E402

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

falhas = 0


def caso(nome, ok, detalhe=""):
    global falhas
    if not ok:
        falhas += 1
    marca = "✅" if ok else "🔴"
    print(f"  {marca} {nome}")
    if not ok and detalhe:
        print(f"       {detalhe}")


PESSOAS = {
    "pessoas": [
        {"id": "com_fone", "nome": "Carlos", "nomeCompleto": "Carlos Henrique", "telefone": "5511999999999"},
        {"id": "sem_fone", "nome": "Elson", "telefone": None},
        {"id": "com_fone_sem_turno", "nome": "Isac", "telefone": "5511888888888"},
    ]
}

BLOCOS = {
    "blocos": [
        {
            "turnos": [
                {"data": "2026-08-20", "tipo": "NOITE", "pessoas": ["com_fone"], "capacidade": 1},
                {"data": "2026-08-21", "tipo": "NOITE", "pessoas": ["sem_fone"], "capacidade": 1},
                {"data": "2026-08-16", "tipo": "NOITE", "santaCeia": True, "pessoas": []},
                {"data": "2026-08-19", "tipo": "MANHA", "pessoas": ["com_fone"], "rotulo": "Culto de oração", "capacidade": 1},
            ]
        }
    ]
}

# ---- domingo_da_semana — a mesma regra do filtro "Esta Semana" da tela (src/App.tsx) -------------
caso('domingo_da_semana de uma QUARTA volta para o domingo ANTERIOR', m.domingo_da_semana("2026-08-19") == "2026-08-16")
caso('domingo_da_semana de um DOMINGO devolve a própria data', m.domingo_da_semana("2026-08-16") == "2026-08-16")
caso('domingo_da_semana de um SÁBADO volta para o domingo daquela semana', m.domingo_da_semana("2026-08-22") == "2026-08-16")

# ---- selecionar_diario — quem recebe o lembrete de véspera ---------------------------------------
sel = m.selecionar_diario("2026-08-20", PESSOAS, BLOCOS)
caso('diário: só quem TEM telefone E está escalada em 20/08 entra', [p["id"] for p, _ in sel] == ["com_fone"])

sel_sem_fone = m.selecionar_diario("2026-08-21", PESSOAS, BLOCOS)
caso(
    '🔴 diário: escalada SEM telefone não entra — é a proteção contra mandar sem número',
    sel_sem_fone == [],
    f"selecionou {[p['id'] for p, _ in sel_sem_fone]}, deveria ser vazio",
)

sel_sem_turno = m.selecionar_diario("2026-08-25", PESSOAS, BLOCOS)
caso('diário: quem TEM telefone mas não está escalada nesse dia não entra', sel_sem_turno == [])

sel_ceia = m.selecionar_diario("2026-08-16", PESSOAS, BLOCOS)
caso('diário: turno de SANTA CEIA (sem gente) nunca gera seleção', sel_ceia == [])

# ---- selecionar_semanal — domingo a domingo, inclui o domingo seguinte (8 dias) ------------------
inicio, sel_semana = m.selecionar_semanal("2026-08-19", PESSOAS, BLOCOS)
caso('semanal: início da semana de 19/08 (quarta) é 16/08 (domingo)', inicio == "2026-08-16")
caso(
    'semanal: junta os turnos de "com_fone" na semana — 19/08 e 20/08 (16/08 é Santa Ceia, ignorada)',
    len(sel_semana) == 1 and {t["data"] for t in sel_semana[0][1]} == {"2026-08-19", "2026-08-20"},
    f"selecionou {sel_semana}",
)

_, sel_semana_vazia = m.selecionar_semanal("2026-09-01", PESSOAS, BLOCOS)
caso('semanal: sem ninguém escalado naquela semana → seleção vazia', sel_semana_vazia == [])

# ---- montar_mensagem_diaria — conteúdo da mensagem ------------------------------------------------
pessoa_com_fone = PESSOAS["pessoas"][0]
turnos_20 = [t for t in BLOCOS["blocos"][0]["turnos"] if t["data"] == "2026-08-20"]
msg_diaria = m.montar_mensagem_diaria(pessoa_com_fone, "2026-08-20", turnos_20)
caso('mensagem diária saúda pelo NOME COMPLETO, não pelo nome curto', "Carlos Henrique" in msg_diaria)
caso('mensagem diária cita o DIA DA SEMANA certo (20/08/2026 é quinta-feira)', "quinta-feira" in msg_diaria)
caso('mensagem diária cita a DATA em formato BR', "20/08/2026" in msg_diaria)
caso('mensagem diária cita o TURNO', "noite" in msg_diaria.lower())
caso('mensagem diária traz o link do site', m.SITE in msg_diaria)

pessoa_sem_nome_completo = {"id": "x", "nome": "Zeca"}
msg_sem_nome_completo = m.montar_mensagem_diaria(pessoa_sem_nome_completo, "2026-08-20", turnos_20)
caso('sem nomeCompleto cadastrado, a mensagem cai para o `nome` curto', "Zeca" in msg_sem_nome_completo)

# ---- montar_mensagem_semanal — lista ORDENADA por data, mesmo se os turnos chegarem fora de ordem
turnos_fora_de_ordem = [
    {"data": "2026-08-22", "tipo": "NOITE", "pessoas": ["com_fone"]},
    {"data": "2026-08-16", "tipo": "MANHA", "pessoas": ["com_fone"], "rotulo": "Culto de oração"},
]
msg_semanal = m.montar_mensagem_semanal(pessoa_com_fone, "2026-08-16", turnos_fora_de_ordem)
pos_16 = msg_semanal.find("16/08")
pos_22 = msg_semanal.find("22/08")
caso(
    'mensagem semanal lista os turnos em ORDEM DE DATA, não na ordem em que chegaram',
    pos_16 != -1 and pos_22 != -1 and pos_16 < pos_22,
    f"posições: 16/08={pos_16}, 22/08={pos_22}",
)
caso('mensagem semanal usa o rótulo do turno quando existe ("Culto de oração")', "Culto de oração" in msg_semanal)
caso('mensagem semanal informa o intervalo completo (16/08 a 23/08)', "16/08/2026 a 23/08/2026" in msg_semanal)

total = 19
print(f"\n  {'🔴' if falhas else '✅'} {total - falhas} de {total} casos corretos")
if falhas:
    print("  A seleção ou a composição da mensagem NÃO fazem o que dizem fazer.")
sys.exit(1 if falhas else 0)
