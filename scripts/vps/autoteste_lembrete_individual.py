#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AUTOTESTE — `lembrete_individual.py` seleciona e escreve certo, sem tocar rede nem WhatsApp
(S-064, 19/08/2026 · redação/formatação atualizada e testada em S-065, mesmo dia).

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
total = 0  # 🔴 CONTADO, NUNCA ESCRITO À MÃO — achado em 19/08/2026, no próprio autoteste que
# prega essa regra: um `total = N` fixo no fim do arquivo desatualizava toda vez que um caso novo
# entrava (chegou a ficar em "26 de 26" com 32 casos realmente rodando — os 6 mais novos passavam
# em silêncio, sem contar para nada). "Número escrito à mão apodrece" vale para o próprio autoteste.


def caso(nome, ok, detalhe=""):
    global falhas, total
    total += 1
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
# Disparo caindo no PRÓPRIO domingo (era o comportamento único até o cron mudar para segunda,
# S-065) — `inicio` é o domingo mesmo, sem corte, porque `alvo == domingo_da_semana(alvo)`.
inicio_dom, fim_dom, sel_dom = m.selecionar_semanal("2026-08-16", PESSOAS, BLOCOS)
caso('semanal, disparo NO domingo: início é o próprio domingo, sem corte', inicio_dom == "2026-08-16")
caso('semanal, disparo no domingo: fim é o domingo seguinte (8 dias)', fim_dom == "2026-08-23")
caso(
    'semanal, disparo no domingo: junta os turnos de "com_fone" na semana — 19/08 e 20/08 (16/08 é Santa Ceia, ignorada)',
    len(sel_dom) == 1 and {t["data"] for t in sel_dom[0][1]} == {"2026-08-19", "2026-08-20"},
    f"selecionou {sel_dom}",
)

_, _, sel_semana_vazia = m.selecionar_semanal("2026-09-01", PESSOAS, BLOCOS)
caso('semanal: sem ninguém escalado naquela semana → seleção vazia', sel_semana_vazia == [])

# ---- 🔴 selecionar_semanal, disparo na SEGUNDA-FEIRA — achado ao vivo em 19/08/2026, no mesmo
#      dia em que o cron mudou de domingo para segunda (S-065). Sem o corte, alguém cujo único
#      turno da semana fosse justamente domingo (JÁ REALIZADO) recebia uma mensagem sobre um turno
#      que já tinha acontecido. `inicio` tem de ser HOJE, não o domingo que já passou. -------------
PESSOA_SEGUNDA = {"pessoas": [{"id": "zeca", "nome": "Zeca", "telefone": "5511777777777"}]}

so_domingo_passado = {"blocos": [{"turnos": [{"data": "2026-08-23", "tipo": "NOITE", "pessoas": ["zeca"]}]}]}
inicio_seg, fim_seg, sel_seg = m.selecionar_semanal("2026-08-24", PESSOA_SEGUNDA, so_domingo_passado)  # segunda-feira
caso('semanal, disparo na SEGUNDA: início é hoje, não o domingo anterior (que já passou)', inicio_seg == "2026-08-24")
caso(
    '🔴 semanal, disparo na segunda: turno de domingo JÁ REALIZADO não gera seleção — pessoa não recebe mensagem sobre o próprio passado',
    sel_seg == [],
    f"selecionou {sel_seg}, deveria ser vazio (o único turno dela já aconteceu ontem)",
)

domingo_passado_e_futuro = {"blocos": [{"turnos": [
    {"data": "2026-08-23", "tipo": "NOITE", "pessoas": ["zeca"]},  # domingo, já passou
    {"data": "2026-08-26", "tipo": "NOITE", "pessoas": ["zeca"]},  # quarta, ainda vem
]}]}
_, _, sel_seg2 = m.selecionar_semanal("2026-08-24", PESSOA_SEGUNDA, domingo_passado_e_futuro)
caso(
    'semanal, disparo na segunda: turno FUTURO da mesma pessoa aparece; o de domingo (passado) some da lista',
    len(sel_seg2) == 1 and {t["data"] for t in sel_seg2[0][1]} == {"2026-08-26"},
    f"selecionou {sel_seg2}",
)

# ---- 🔴 achado da AUDITORIA CEGA (19/08/2026, mesmo dia): `fim` tem de ser DEVOLVIDO por
#      `selecionar_semanal`, nunca recalculado por quem monta a mensagem — as duas fórmulas
#      divergiam sempre que o disparo não caía num domingo, e a mensagem prometia um dia que o
#      filtro nunca tinha buscado (achado ao vivo: turno em 31/08 dentro do "De 24/08 a 31/08" do
#      texto, ausente da lista, porque o filtro só ia até 30/08). ---------------------------------
turno_no_ultimo_dia_prometido_pela_versao_antiga = {"blocos": [{"turnos": [
    {"data": "2026-08-31", "tipo": "NOITE", "pessoas": ["zeca"]},  # o dia que "inicio+7" prometeria
]}]}
fim_real, sel_limite = m.selecionar_semanal("2026-08-24", PESSOA_SEGUNDA, turno_no_ultimo_dia_prometido_pela_versao_antiga)[1:]
caso(
    '🔴 fim do FILTRO (domingo+7) é o mesmo fim que a mensagem vai anunciar — não "início+7"',
    fim_real == "2026-08-30",
    f"fim devolvido: {fim_real} (a versão com o defeito prometeria 2026-08-31 e não acharia o turno)",
)
caso(
    'turno no dia que SÓ a fórmula antiga prometia (31/08) fica de fora, coerente com o fim real (30/08)',
    sel_limite == [],
    f"selecionou {sel_limite} — se achou algo, o filtro está buscando além do que deveria",
)

# `fim` sempre bate com `domingo_da_semana(alvo) + 7`, para qualquer dia da semana que o disparo
# caia — não só domingo e segunda (a auditoria apontou que só esses dois tinham cobertura).
for alvo_dia, rotulo_dia in [("2026-08-18", "terça"), ("2026-08-22", "sábado")]:
    _, fim_dia, _ = m.selecionar_semanal(alvo_dia, PESSOA_SEGUNDA, {"blocos": [{"turnos": []}]})
    caso(f'semanal, disparo na {rotulo_dia}: fim continua sendo o domingo seguinte (2026-08-23)', fim_dia == "2026-08-23")

# ---- montar_mensagem_diaria — conteúdo da mensagem ------------------------------------------------
TITULO = "Escala de Teste"
pessoa_com_fone = PESSOAS["pessoas"][0]
turnos_20 = [t for t in BLOCOS["blocos"][0]["turnos"] if t["data"] == "2026-08-20"]
msg_diaria = m.montar_mensagem_diaria(pessoa_com_fone, "2026-08-20", turnos_20, TITULO)
caso('mensagem diária saúda pelo NOME COMPLETO, não pelo nome curto', "Carlos Henrique" in msg_diaria)
caso('mensagem diária cita o DIA DA SEMANA certo (20/08/2026 é quinta-feira)', "quinta-feira" in msg_diaria)
caso('mensagem diária cita a DATA em formato BR', "20/08/2026" in msg_diaria)
caso('mensagem diária cita o TURNO', "noite" in msg_diaria.lower())
caso('mensagem diária traz o link do site', m.SITE in msg_diaria)
caso(
    '🔴 mensagem diária se IDENTIFICA na primeira linha (achado da pesquisa: sem remetente, parece spam)',
    msg_diaria.startswith(f"🔔 *{TITULO}*"),
    f"primeira linha: {msg_diaria.splitlines()[0]!r}",
)
caso('mensagem diária usa negrito nos RÓTULOS (Data/Turno), não na frase inteira', "*Data:*" in msg_diaria and "*Turno:*" in msg_diaria)

pessoa_sem_nome_completo = {"id": "x", "nome": "Zeca"}
msg_sem_nome_completo = m.montar_mensagem_diaria(pessoa_sem_nome_completo, "2026-08-20", turnos_20, TITULO)
caso('sem nomeCompleto cadastrado, a mensagem cai para o `nome` curto', "Zeca" in msg_sem_nome_completo)

# ---- montar_mensagem_semanal — lista ORDENADA por data, mesmo se os turnos chegarem fora de ordem
turnos_fora_de_ordem = [
    {"data": "2026-08-22", "tipo": "NOITE", "pessoas": ["com_fone"]},
    {"data": "2026-08-16", "tipo": "MANHA", "pessoas": ["com_fone"], "rotulo": "Culto de oração"},
]
msg_semanal = m.montar_mensagem_semanal(pessoa_com_fone, "2026-08-16", "2026-08-23", turnos_fora_de_ordem, TITULO)
pos_16 = msg_semanal.find("16/08")
pos_22 = msg_semanal.find("22/08")
caso(
    'mensagem semanal lista os turnos em ORDEM DE DATA, não na ordem em que chegaram',
    pos_16 != -1 and pos_22 != -1 and pos_16 < pos_22,
    f"posições: 16/08={pos_16}, 22/08={pos_22}",
)
caso('mensagem semanal usa o rótulo do turno quando existe ("Culto de oração")', "Culto de oração" in msg_semanal)
caso('mensagem semanal informa o intervalo completo (16/08 a 23/08)', "16/08/2026 a 23/08/2026" in msg_semanal)
caso(
    '🔴 mensagem semanal também se IDENTIFICA na primeira linha',
    msg_semanal.startswith(f"📅 *{TITULO}*"),
    f"primeira linha: {msg_semanal.splitlines()[0]!r}",
)
# ---- 🔴 integração — seleciona E monta a mensagem para o disparo real (segunda-feira), prova que
#      o TEXTO da mensagem promete exatamente o que foi buscado, ponta a ponta ---------------------
inicio_int, fim_int, sel_int = m.selecionar_semanal("2026-08-24", PESSOA_SEGUNDA, {"blocos": [{"turnos": [
    {"data": "2026-08-27", "tipo": "NOITE", "pessoas": ["zeca"]},
]}]})
msg_int = m.montar_mensagem_semanal(sel_int[0][0], inicio_int, fim_int, sel_int[0][1], TITULO)
caso(
    'ponta a ponta (segunda-feira): a mensagem promete "de 24/08 a 30/08" — o mesmo fim que o filtro usou, não "31/08"',
    "24/08/2026 a 30/08/2026" in msg_int,
    f"mensagem: {msg_int!r}",
)

caso(
    'nenhuma das duas mensagens usa sintaxe de lista do WhatsApp ("- item") — só "•" à mão, o único formato confirmado pela pesquisa',
    "\n- " not in msg_diaria and "\n- " not in msg_semanal,
)

print(f"\n  {'🔴' if falhas else '✅'} {total - falhas} de {total} casos corretos")
if falhas:
    print("  A seleção ou a composição da mensagem NÃO fazem o que dizem fazer.")
sys.exit(1 if falhas else 0)
