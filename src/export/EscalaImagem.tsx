/**
 * 🖼️ O LAYOUT DA IMAGEM QUE VAI PARA O WHATSAPP.
 *
 * 🔴 Isto **não é a tela**. Até 04/08/2026 a exportação fotografava o `ScheduleTable` com um modo
 * `is-exporting` que sobrescrevia largura, cores e pesos de fonte — e ainda fatiava a lista em 10
 * dias, com um alerta pedindo "filtre um período menor". A imagem saía parecida com um site, não
 * com um documento.
 *
 * O modelo é o arquivo que o Flavio usa de referência
 * (`D:\Documentos\CCB_Escalas\Porteiros\escalaagosto2026.png`): cartão por **dia** — não por turno —,
 * bloco colorido à esquerda com mês/dia/dia-da-semana, pílula do turno, nomes em fichas com a
 * inicial num círculo, tracejado separando turnos do mesmo dia, e rodapé com a data de geração.
 *
 * **Estilos em linha, de propósito.** O CSS do aplicativo (incluindo `is-exporting`) não pode
 * alcançar este componente: a imagem precisa ser sempre a mesma, independentemente do que mude na
 * interface. Foi o acoplamento com a tela que fez a imagem antiga envelhecer junto com o site.
 */
import type { Shift, ShiftType } from '../types/scheduler'
import { BROTHERS } from '../types/scheduler'

const MESES = ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO']
const MES_CURTO = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ']
const DIA_CURTO = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB']

const FONTE = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'

/** Cada turno tem uma família de cor — a mesma da tela, para quem vê os dois reconhecer. */
const TURNO = {
  'MANHÃ': { rotulo: 'MANHÃ', pilula: '#fffbeb', borda: '#fcd34d', texto: '#b45309', bloco: 'linear-gradient(160deg,#fbbf24,#f59e0b)' },
  'TARDE': { rotulo: 'TARDE\nENSAIO', pilula: '#fff7ed', borda: '#fdba74', texto: '#c2410c', bloco: 'linear-gradient(160deg,#fb923c,#ef4444)' },
  'NOITE': { rotulo: 'NOITE', pilula: '#eef2ff', borda: '#c7d2fe', texto: '#4338ca', bloco: 'linear-gradient(160deg,#6366f1,#4f46e5)' },
  'SANTA_CEIA': { rotulo: 'SANTA CEIA', pilula: '#fef2f2', borda: '#fca5a5', texto: '#b91c1c', bloco: 'linear-gradient(160deg,#ef4444,#b91c1c)' },
} satisfies Record<ShiftType, { rotulo: string; pilula: string; borda: string; texto: string; bloco: string }>

const nomeDe = (id: string) => BROTHERS.find((b) => b.id === id)?.name ?? id
const br = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`

/** Agrupa por dia, preservando a ordem dos turnos — manhã antes de noite. */
export function porDia(shifts: Shift[]) {
  const ordem: Record<ShiftType, number> = { 'MANHÃ': 0, TARDE: 1, NOITE: 2, SANTA_CEIA: 3 }
  const mapa = new Map<string, Shift[]>()
  for (const s of [...shifts].sort((a, b) => a.date.getTime() - b.date.getTime() || ordem[a.type] - ordem[b.type])) {
    const k = s.date.toDateString()
    if (!mapa.has(k)) mapa.set(k, [])
    mapa.get(k)!.push(s)
  }
  return [...mapa.values()]
}

function Ficha({ nome }: { nome: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: '2px solid #dbeafe',
      borderRadius: 999, padding: '7px 18px 7px 8px', boxShadow: '0 1px 2px rgba(15,23,42,.04)',
      // Ocupa a coluna inteira da grade: é o que deixa os nomes alinhados de uma linha para outra.
      minWidth: 0, overflow: 'hidden',
    }}>
      <div style={{
        width: 30, height: 30, borderRadius: 999, background: '#dbeafe', color: '#2563eb',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, flexShrink: 0,
      }}>
        {nome.charAt(0).toUpperCase()}
      </div>
      <span style={{
        fontSize: 21, fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap',
        overflow: 'hidden', textOverflow: 'ellipsis',
      }}>{nome}</span>
    </div>
  )
}

/**
 * O que o cabeçalho e a legenda dizem sobre o período. Função pura, separada do desenho: é a parte
 * que pode estar ERRADA (contar um turno vazio como turno, esconder a Santa Ceia da legenda), e a
 * única que dá para provar sem comparar pixel.
 */
export function resumirPeriodo(shifts: Shift[]) {
  const datas = shifts.map((s) => s.date).sort((a, b) => a.getTime() - b.getTime())
  const inicio = datas[0]
  const fim = datas[datas.length - 1]

  const presentes = (['MANHÃ', 'TARDE', 'NOITE', 'SANTA_CEIA'] as const).filter((t) =>
    shifts.some((s) => s.type === t),
  )

  // 🔴 Santa Ceia NÃO é turno: é um dia sem porteiros. Somá-la infla um número que alguém repete
  // depois como se fosse trabalho escalado.
  const comGente = shifts.filter((s) => s.assignedBrothers.length > 0).length
  const ceias = shifts.filter((s) => s.type === 'SANTA_CEIA').length
  const resumo = `${comGente} turnos${ceias ? ` · ${ceias} Santa Ceia` : ''}`

  const mesmoMes = inicio && fim && inicio.getFullYear() === fim.getFullYear() && inicio.getMonth() === fim.getMonth()
  const titulo = !inicio
    ? { linha1: '', linha2: '' }
    : mesmoMes
      ? { linha1: MESES[inicio.getMonth()], linha2: String(inicio.getFullYear()) }
      : { linha1: `${MES_CURTO[inicio.getMonth()]} – ${MES_CURTO[fim.getMonth()]}`, linha2: String(fim.getFullYear()) }

  return { inicio, fim, presentes, resumo, titulo }
}

export interface DadosImagem {
  shifts: Shift[]
  geradoEm: Date
  /** Quantas vagas por turno — sai no rodapé, e muda se a congregação mudar a regra. */
  porTurno?: number
}

export function EscalaImagem({ shifts, geradoEm, porTurno = 3 }: DadosImagem) {
  const dias = porDia(shifts)

  /**
   * Uma contagem de colunas para a imagem inteira — a do turno mais cheio. É isto que alinha os
   * nomes verticalmente de um cartão para o outro, em vez de cada linha se arranjar sozinha.
   */
  const colunas = Math.max(porTurno, ...shifts.map((s) => s.assignedBrothers.length), 1)
  const { inicio, fim, presentes, resumo, titulo } = resumirPeriodo(shifts)

  return (
    <div style={{ width: 1440, background: '#eceff5', padding: 28, fontFamily: FONTE, boxSizing: 'border-box' }}>
      {/* Cabeçalho */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'linear-gradient(105deg,#2947d6,#4a72e8)', borderRadius: 26, padding: '34px 44px',
        boxShadow: '0 10px 24px rgba(41,71,214,.22)',
      }}>
        <div>
          <div style={{ fontSize: 46, fontWeight: 800, color: '#fff', letterSpacing: -0.5, lineHeight: 1.05 }}>
            Escala de Porteiros
          </div>
          <div style={{ fontSize: 21, fontWeight: 600, color: 'rgba(255,255,255,.88)', marginTop: 8 }}>
            Congregação Cristã no Brasil · JD. São Luiz
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 23, fontWeight: 800, color: 'rgba(255,255,255,.92)', letterSpacing: 4 }}>{titulo.linha1}</div>
          <div style={{ fontSize: 48, fontWeight: 800, color: '#fff', lineHeight: 1.05 }}>{titulo.linha2}</div>
        </div>
      </div>

      {/* Legenda + período */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 10px 18px' }}>
        <div style={{ display: 'flex', gap: 12 }}>
          {presentes.map((t) => (
            <div key={t} style={{
              background: TURNO[t].pilula, border: `2px solid ${TURNO[t].borda}`, color: TURNO[t].texto,
              borderRadius: 999, padding: '7px 18px', fontSize: 16, fontWeight: 800, letterSpacing: 0.6,
            }}>
              {t === 'TARDE' ? 'TARDE (ENSAIO)' : t === 'SANTA_CEIA' ? 'SANTA CEIA' : t}
            </div>
          ))}
        </div>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#64748b' }}>
          {inicio ? `${br(inicio)} a ${br(fim)} · ${resumo}` : 'sem turnos no período'}
        </div>
      </div>

      {/* Um cartão por DIA */}
      {dias.map((turnosDoDia) => {
        const d = turnosDoDia[0].date
        const cor = TURNO[turnosDoDia[0].type]
        return (
          <div key={d.toISOString()} style={{
            display: 'flex', background: '#fff', borderRadius: 22, marginBottom: 14, overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(15,23,42,.06)',
          }}>
            {/* Bloco do dia */}
            <div style={{
              width: 168, flexShrink: 0, background: cor.bloco, color: '#fff',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '22px 0',
            }}>
              <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: 2, color: 'rgba(255,255,255,.92)' }}>
                {MES_CURTO[d.getMonth()]}
              </div>
              <div style={{ fontSize: 56, fontWeight: 900, lineHeight: 1, margin: '2px 0 8px' }}>
                {String(d.getDate()).padStart(2, '0')}
              </div>
              <div style={{
                background: 'rgba(0,0,0,.16)', borderRadius: 8, padding: '3px 12px',
                fontSize: 15, fontWeight: 800, letterSpacing: 1.4,
              }}>
                {DIA_CURTO[d.getDay()]}
              </div>
            </div>

            {/* Turnos do dia */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              {turnosDoDia.map((t, i) => (
                <div key={t.id} style={{
                  display: 'flex', alignItems: 'center', gap: 16, padding: '18px 26px',
                  borderTop: i > 0 ? '2px dashed #e8edf5' : 'none',
                }}>
                  <div style={{
                    background: TURNO[t.type].pilula, border: `2px solid ${TURNO[t.type].borda}`, color: TURNO[t.type].texto,
                    borderRadius: 12, padding: '9px 0', width: 118, flexShrink: 0, textAlign: 'center',
                    fontSize: 15, fontWeight: 800, letterSpacing: 0.8, lineHeight: 1.25, whiteSpace: 'pre-line',
                  }}>
                    {TURNO[t.type].rotulo}
                  </div>
                  {t.assignedBrothers.length === 0 ? (
                    <span style={{ fontSize: 20, fontWeight: 700, color: '#94a3b8' }}>
                      sem porteiros escalados
                    </span>
                  ) : (
                    /*
                     * 🔴 GRADE DE COLUNAS FIXAS, não `flex-wrap`.
                     *
                     * Com `flex-wrap`, o terceiro nome caía para uma segunda linha e **encavalava**
                     * o turno seguinte na imagem — mas só na IMAGEM. Medido no navegador em
                     * 04/08/2026: no DOM as linhas encostavam sem sobrepor (fim 351 → topo 351).
                     * A captura reproduz o layout num clone, e o ponto de quebra do wrap diverge lá.
                     *
                     * Consertar a quebra seria perseguir o sintoma. Coluna fixa **elimina a quebra**:
                     * não há ponto de decisão para o clone discordar, e a altura da linha vira
                     * determinística. De quebra, é o que o Flavio pediu — nomes na mesma linha e
                     * alinhados de um turno para o outro, porque todas as linhas usam a MESMA
                     * contagem de colunas (a do maior turno da imagem).
                     */
                    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${colunas}, 1fr)`, gap: 12, flex: 1, minWidth: 0 }}>
                      {t.assignedBrothers.map((id) => <Ficha key={id} nome={nomeDe(id)} />)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })}

      <div style={{ textAlign: 'center', fontSize: 17, fontWeight: 700, color: '#64748b', padding: '14px 0 6px' }}>
        Gerado em {br(geradoEm)} · {porTurno} irmãos por turno
      </div>
    </div>
  )
}
