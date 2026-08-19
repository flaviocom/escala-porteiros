/**
 * AJUSTE MANUAL — trocar uma pessoa num turno específico.
 *
 * O gerador acerta a distribuição, mas não sabe de tudo: um irmão avisa na véspera que não pode,
 * outro se oferece para cobrir. Essa troca é de quem administra, não do algoritmo.
 *
 * 🔴 O QUE ESTA TELA FAZ DE DIFERENTE: ela mostra **por que** cada pessoa pode ou não entrar, ANTES
 * do clique. Uma lista que simplesmente esconde quem não pode obriga o Flavio a adivinhar o motivo —
 * e uma que deixa escolher qualquer um transforma o ajuste manual na porta dos fundos por onde as
 * regras vazam. Aqui quem não pode aparece **desabilitado e com a razão escrita**.
 *
 * A validação da escala inteira recalcula a cada troca, então o efeito colateral aparece na hora —
 * não na hora de publicar.
 */
import React, { useMemo, useState } from 'react'
import { AlertTriangle, ArrowLeftRight, CheckCircle, RotateCcw, XCircle } from 'lucide-react'
import { clsx } from 'clsx'
import type { Bloco, Configuracao, Pessoa, Turno } from '../dominio/tipos'
import { ROTULO_TURNO } from '../dominio/tipos'
import { podeAssumir } from '../dominio/regras'
import { validar } from '../dominio/validacao'
import { diferencaEmDias, formatarBR, mesDe, NOMES_DIA_CURTO, diaDaSemana } from '../dominio/datas'

interface Props {
  bloco: Bloco
  pessoas: Pessoa[]
  fronteira: Record<string, string>
  aoAlterar: (b: Bloco) => void
  blocoOriginal: Bloco
  /** O calendário e a malha vigentes — D9 e D11 conferem o bloco CONTRA ela, não contra si mesmo. */
  config: Configuracao
}

export const AbaAjustar: React.FC<Props> = ({ bloco, pessoas, fronteira, aoAlterar, blocoOriginal, config }) => {
  const [selecionado, setSelecionado] = useState<{ turno: number; pessoa: string } | null>(null)
  const [filtro, setFiltro] = useState('')

  const relatorio = useMemo(
    () => validar({ bloco, pessoas, ultimaEscalaAnterior: fronteira, config }),
    [bloco, pessoas, fronteira, config],
  )

  const alterados = useMemo(() => {
    const n = new Set<string>()
    bloco.turnos.forEach((t, i) => {
      const o = blocoOriginal.turnos[i]
      if (!o || o.pessoas.join('|') !== t.pessoas.join('|')) n.add(`${t.data}|${t.tipo}`)
    })
    return n
  }, [bloco, blocoOriginal])

  const visiveis = useMemo(() => {
    const f = filtro.trim().toLowerCase()
    return bloco.turnos
      .map((t, i) => ({ t, i }))
      .filter(({ t }) => {
        if (!f) return true
        if (t.data.includes(f) || formatarBR(t.data).includes(f)) return true
        return t.pessoas.some((id) => (pessoas.find((p) => p.id === id)?.nome ?? '').toLowerCase().includes(f))
      })
  }, [bloco, filtro, pessoas])

  /** Quem pode entrar neste turno, e o motivo de quem não pode. */
  const candidatas = (indice: number, saindo: string) => {
    const turno = bloco.turnos[indice]
    const noDia = new Set(bloco.turnos.filter((t) => t.data === turno.data).flatMap((t) => t.pessoas))
    noDia.delete(saindo)

    return pessoas
      .filter((p) => bloco.elenco.includes(p.id))
      .map((p) => {
        if (p.id === saindo) return null
        if (turno.pessoas.includes(p.id)) return { p, pode: false, motivo: 'já está neste turno' }

        const noMes = bloco.turnos.filter(
          (t) => mesDe(t.data) === mesDe(turno.data) && t.pessoas.includes(p.id),
        ).length
        const r = podeAssumir(p, turno, noDia.has(p.id), noMes)
        if (!r.pode) return { p, pode: false, motivo: r.motivo ?? 'restrição' }

        // Distância: não barra, mas avisa. É a diferença entre "não pode" e "não é o ideal".
        const datas = bloco.turnos
          .filter((t) => t.pessoas.includes(p.id) && t.data !== turno.data)
          .map((t) => t.data)
        if (fronteira[p.id]) datas.push(fronteira[p.id])
        const perto = datas
          .map((d) => Math.abs(diferencaEmDias(d, turno.data)))
          .sort((a, b) => a - b)[0]
        /*
          🔴 O LIMIAR ERA 3, E QUEM REPROVA COMPARA COM O PISO DO BLOCO — sétima auditoria externa,
          05/08/2026.

          A legenda desta tela promete: *"quem está em âmbar pode, mas ficaria perto de outra escala"*
          — logo, verde significa "pode, sem ressalva". Só que o âmbar era pintado com `perto <= 3`
          cravado, enquanto D10 reprova quem fica **abaixo do `pisoAlcancado` que o bloco declara**
          (7, na escala de hoje). Tudo entre 4 e 6 dias saía **VERDE** e quebrava a escala.

          Medido pelo auditor: 4 turnos × 8 candidatas = **32 trocas, 32 inválidas, 0 utilizáveis** —
          duas delas oferecidas em verde. O passo "trocar uma pessoa" não concluía de jeito nenhum.

          Duas réguas para a mesma pergunta, e a que o usuário vê era a frouxa. O piso vem do bloco,
          que é quem sabe qual promessa ele fez.
        */
        const pisoDoBloco = bloco.pisoAlcancado ?? 3
        return {
          p,
          pode: true,
          abaixoDoPiso: perto != null && perto < pisoDoBloco,
          motivo:
            perto != null && perto < pisoDoBloco
              ? `ficaria a ${perto} dia(s) de outra escala — o bloco declara piso de ${pisoDoBloco}, e publicar ficaria bloqueado`
              : '',
        }
      })
      .filter((x): x is { p: Pessoa; pode: boolean; motivo: string; abaixoDoPiso?: boolean } => x !== null)
      .sort((a, b) => (a.pode === b.pode ? a.p.nome.localeCompare(b.p.nome) : a.pode ? -1 : 1))
  }

  const trocar = (indice: number, saindo: string, entrando: string) => {
    const turnos = bloco.turnos.map((t, i) =>
      i === indice ? { ...t, pessoas: t.pessoas.map((id) => (id === saindo ? entrando : id)) } : t,
    )
    aoAlterar({ ...bloco, turnos, origem: 'manual' })
    setSelecionado(null)
  }

  const desfazerTudo = () => {
    aoAlterar(blocoOriginal)
    setSelecionado(null)
  }

  const nome = (id: string) => pessoas.find((p) => p.id === id)?.nome ?? id

  return (
    <>
      <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div
          className={clsx(
            'px-5 py-4 border-b flex items-start gap-3',
            relatorio.aprovada ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100',
          )}
        >
          {relatorio.aprovada ? (
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            <h2 className="font-bold text-gray-900">
              {relatorio.aprovada ? 'A escala continua válida' : 'A escala ficou inválida'}
            </h2>
            <p className="text-xs text-gray-600 mt-0.5">
              {alterados.size === 0
                ? 'Nenhuma troca feita ainda.'
                : `${alterados.size} turno(s) alterado(s) à mão.`}{' '}
              {!relatorio.aprovada &&
                relatorio.falhasDuras.map((f) => f.id).join(', ') + ' violada(s) — publicar fica bloqueado.'}
            </p>
          </div>
          {alterados.size > 0 && (
            <button title="Descarta as trocas manuais e volta à escala que o gerador entregou"
              onClick={desfazerTudo}
              className="shrink-0 px-3 py-1.5 text-xs font-semibold text-gray-600 border border-gray-300 rounded-lg hover:bg-white flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Desfazer tudo
            </button>
          )}
        </div>

        {!relatorio.aprovada && (
          <div className="px-5 py-3 bg-red-50/50 border-b border-red-100 space-y-1">
            {relatorio.falhasDuras.flatMap((f) =>
              f.violacoes.slice(0, 3).map((v, i) => (
                <p key={`${f.id}-${i}`} className="text-xs text-red-800">
                  <span className="font-mono font-bold">{f.id}</span> · {v.mensagem}
                </p>
              )),
            )}
          </div>
        )}

        <div className="p-5">
          <input
            id="filtro-ajustar"
            name="filtro-ajustar"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            placeholder="Filtrar por data (16/08) ou por nome"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />

          <p className="text-xs text-gray-500 mb-3">
            Clique num nome para trocar. Mostrando {visiveis.length} de {bloco.turnos.length} turnos.
          </p>

          <div className="space-y-2 max-h-[32rem] overflow-y-auto pr-1">
            {visiveis.map(({ t, i }) => (
              <LinhaTurno
                key={`${t.data}-${t.tipo}`}
                turno={t}
                alterado={alterados.has(`${t.data}|${t.tipo}`)}
                nome={nome}
                selecionado={selecionado?.turno === i ? selecionado.pessoa : null}
                aoSelecionar={(pessoa) =>
                  setSelecionado(selecionado?.turno === i && selecionado.pessoa === pessoa ? null : { turno: i, pessoa })
                }
                candidatas={selecionado?.turno === i ? candidatas(i, selecionado.pessoa) : []}
                vocabulario={config.identidade.pessoa}
                aoTrocar={(entrando) => selecionado && trocar(i, selecionado.pessoa, entrando)}
              />
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

const LinhaTurno: React.FC<{
  turno: Turno
  alterado: boolean
  nome: (id: string) => string
  selecionado: string | null
  aoSelecionar: (pessoa: string) => void
  candidatas: { p: Pessoa; pode: boolean; motivo: string }[]
  aoTrocar: (entrando: string) => void
  /** Como este cliente chama quem é escalado — vem de `config.identidade.pessoa`. */
  vocabulario: { singular: string; plural: string }
}> = ({ turno, alterado, nome, selecionado, aoSelecionar, candidatas, aoTrocar, vocabulario }) => {
  if (turno.santaCeia) {
    return (
      <div className="px-4 py-3 rounded-xl border border-amber-200 bg-amber-50 text-sm">
        <span className="font-semibold text-amber-900">
          {formatarBR(turno.data)} · SANTA CEIA
        </span>
        <span className="text-amber-700 text-xs ml-2">sem {vocabulario.singular.toLowerCase()} escalado — não há o que ajustar</span>
      </div>
    )
  }

  return (
    <div className={clsx('rounded-xl border overflow-hidden', alterado ? 'border-indigo-300 bg-indigo-50/40' : 'border-gray-200')}>
      <div className="px-4 py-2.5 flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-gray-800 shrink-0">
          {formatarBR(turno.data)}
          <span className="text-gray-400 font-normal ml-1.5">
            {NOMES_DIA_CURTO[diaDaSemana(turno.data)]} · {ROTULO_TURNO[turno.tipo]}
          </span>
          {turno.rotulo && (
            <span className="ml-1.5 text-[10px] uppercase tracking-wider bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">
              {turno.rotulo}
            </span>
          )}
        </span>
        <div className="flex flex-wrap gap-1.5 flex-1 justify-end">
          {turno.pessoas.map((id) => (
            <button title="Clique para ver quem pode substituir esta pessoa neste turno"
              key={id}
              onClick={() => aoSelecionar(id)}
              className={clsx(
                'px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors',
                selecionado === id
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-400',
              )}
            >
              {nome(id)}
            </button>
          ))}
          {turno.pessoas.length < turno.capacidade && (
            <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
              falta {turno.capacidade - turno.pessoas.length}
            </span>
          )}
        </div>
      </div>

      {selecionado && (
        <div className="px-4 pb-3 pt-1 border-t border-gray-100 bg-white">
          <p className="text-xs text-gray-500 mb-2 flex items-center gap-1.5">
            <ArrowLeftRight className="w-3.5 h-3.5" />
            Trocar <strong className="text-gray-800">{nome(selecionado)}</strong> por:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {candidatas.map(({ p, pode, motivo }) => (
              <button
                key={p.id}
                disabled={!pode}
                onClick={() => aoTrocar(p.id)}
                title={motivo || undefined}
                className={clsx(
                  'px-2.5 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1',
                  pode
                    ? motivo
                      ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                      : 'bg-green-50 text-green-800 border-green-300 hover:bg-green-100'
                    : 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed',
                )}
              >
                {pode && motivo && <AlertTriangle className="w-3 h-3" />}
                {p.nome}
                {!pode && <span className="font-normal opacity-80">· {motivo}</span>}
                {pode && motivo && <span className="font-normal opacity-80">· {motivo}</span>}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-gray-400 mt-2">
            {/*
              🔴 Aqui estava `**abaixo do piso que este bloco declara**` — e o JSX não é markdown:
              os asteriscos apareciam CRUS na tela. Achado em 06/08/2026 ao OLHAR a captura, não ao
              medir o DOM: toda checagem de texto casava normalmente, porque o texto está lá — só
              está feio. É o tipo de defeito que só o olho pega, e a razão de a verificação visual
              não poder ser substituída por medição.
            */}
            Quem está em cinza não pode entrar, e o motivo está escrito ao lado. Quem está em âmbar
            pode pelas restrições dela, mas ficaria <strong>abaixo do piso que este bloco declara</strong> — e aí
            a escala fica inválida e o Publicar trava. A cor não é gosto: é o que vai acontecer.
          </p>
        </div>
      )}
    </div>
  )
}
