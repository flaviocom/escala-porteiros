/**
 * O MOTOR — propõe uma distribuição, explica o que fez e audita o resultado.
 *
 * 🔴 ONDE ELE FICA NA CADEIA, E POR QUÊ.
 *
 * O Flavio pediu que o motor distribuísse também, e não só explicasse. A recomendação inicial era
 * outra — são 549 vagas, 16 pessoas e 5 famílias de restrição, e um modelo de linguagem acerta quase
 * sempre e erra **em silêncio**. Erro silencioso numa escala é o pior defeito possível: ninguém
 * audita 549 linhas à mão.
 *
 * A forma de atender o pedido sem abrir mão da garantia é o **portão ficar entre o motor e a
 * publicação**, nunca depois dela:
 *
 *     motor propõe → validação determinística julga → reprovou? devolve as violações e ele tenta
 *     de novo (até 3 vezes) → passou? entra no placar, ao lado da proposta do algoritmo → o Flavio
 *     escolhe qual publicar
 *
 * A base do algoritmo **nunca sai da mesa**. Se o motor falhar, ficar sem crédito ou devolver lixo,
 * há sempre uma escala válida pronta.
 *
 * ⚠️ FATIADO POR MÊS. Pedir 88 turnos de uma vez é pedir ~264 nomes numa resposta só — e a taxa de
 * erro cresce com o tamanho. Mês a mês, cada fatia é pequena, a correção é barata, e o estado
 * acumulado (quem já pegou quanto, quando foi a última vez) segue adiante.
 *
 * ⚠️ A CHAVE VIVE NO NAVEGADOR DO ADMINISTRADOR, cifrada pela senha dele — nunca no site público.
 * `anthropic-dangerous-direct-browser-access` é o que a API exige para aceitar chamada de navegador.
 */
import type { Bloco, Pessoa, Turno } from '../dominio/tipos'
import { ROTULO_TURNO } from '../dominio/tipos'
import { validar } from '../dominio/validacao'
import { menorIntervalo } from '../dominio/regras'
import { diferencaEmDias, formatarBR, mesDe, NOMES_DIA, diaDaSemana, type DataISO } from '../dominio/datas'

const URL_API = 'https://api.anthropic.com/v1/messages'
const MODELO = 'claude-sonnet-5'
const MAX_TENTATIVAS = 3

export interface ProgressoMotor {
  fase: string
  detalhe: string
}

export interface PropostaMotor {
  bloco: Bloco
  explicacao: string
  tentativasPorMes: Record<string, number>
}

export interface FalhaMotor {
  motivo: string
  /** Onde parou, para o Flavio saber se foi crédito, rede ou o próprio modelo. */
  causa: 'sem-chave' | 'sem-credito' | 'rede' | 'nao-convergiu' | 'resposta-invalida'
}

export type ResultadoMotor = { ok: true; proposta: PropostaMotor } | { ok: false } & FalhaMotor

// ---------------------------------------------------------------------------

async function chamar(chave: string, prompt: string, maxTokens = 8000): Promise<string> {
  const r = await fetch(URL_API, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': chave,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODELO,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!r.ok) {
    const corpo = await r.text()
    if (r.status === 401) throw Object.assign(new Error('A chave do motor foi recusada.'), { causa: 'sem-chave' })
    if (r.status === 400 && /credit balance/i.test(corpo))
      throw Object.assign(new Error('O motor está sem crédito. Recarregue para voltar a usá-lo.'), { causa: 'sem-credito' })
    if (r.status === 429)
      throw Object.assign(new Error('O motor recusou por excesso de chamadas. Tente daqui a pouco.'), { causa: 'rede' })
    throw Object.assign(new Error(`O motor respondeu HTTP ${r.status}.`), { causa: 'rede' })
  }

  const j = await r.json()
  const texto = (j.content ?? []).filter((b: { type: string }) => b.type === 'text').map((b: { text: string }) => b.text).join('')
  if (!texto) throw Object.assign(new Error('O motor devolveu resposta vazia.'), { causa: 'resposta-invalida' })
  return texto
}

/** Extrai o JSON da resposta, tolerando cerca de texto ou blocos de código em volta. */
function extrairJSON<T>(texto: string): T {
  const semCerca = texto.replace(/```(?:json)?/g, '')
  const ini = semCerca.indexOf('{')
  const fim = semCerca.lastIndexOf('}')
  if (ini < 0 || fim < ini) throw Object.assign(new Error('O motor não devolveu JSON.'), { causa: 'resposta-invalida' })
  return JSON.parse(semCerca.slice(ini, fim + 1)) as T
}

// ---------------------------------------------------------------------------
// O contexto que o motor recebe
// ---------------------------------------------------------------------------

function descreverPessoa(p: Pessoa): string {
  const r = p.restricoes
  const partes: string[] = []
  if (r.diasPermitidos?.length) partes.push(`só pode em ${r.diasPermitidos.map((d) => NOMES_DIA[d]).join(', ')}`)
  if (r.diasProibidos?.length) partes.push(`nunca pode em ${r.diasProibidos.map((d) => NOMES_DIA[d]).join(', ')}`)
  if (r.turnosPermitidos?.length) partes.push(`só nos turnos ${r.turnosPermitidos.map((t) => ROTULO_TURNO[t]).join(', ')}`)
  if (r.tetoMensal != null) partes.push(`no máximo ${r.tetoMensal} vezes por mês`)
  for (const a of r.ausencias ?? []) partes.push(`ausente de ${formatarBR(a.inicio)} a ${formatarBR(a.fim)}`)
  return `- ${p.id} (${p.nome}): ${partes.length ? partes.join('; ') : 'sem restrição'}`
}

function descreverTurno(t: Turno): string {
  return `- ${t.data} (${NOMES_DIA[diaDaSemana(t.data)]}, ${ROTULO_TURNO[t.tipo]}${t.rotulo ? `, ${t.rotulo}` : ''}): ${t.capacidade} vagas`
}

function promptDoMes(
  mes: string,
  turnos: Turno[],
  pessoas: Pessoa[],
  ultimaEscala: Record<string, DataISO>,
  totalAcumulado: Record<string, number>,
  violacoesAnteriores?: string[],
): string {
  const elenco = pessoas.map(descreverPessoa).join('\n')
  const grade = turnos.map(descreverTurno).join('\n')
  const historico = pessoas
    .map((p) => `- ${p.id}: ${totalAcumulado[p.id] ?? 0} escalas até aqui; última em ${ultimaEscala[p.id] ?? 'nenhuma'}`)
    .join('\n')

  const correcao = violacoesAnteriores?.length
    ? `\n\nATENÇÃO — a sua proposta anterior foi REPROVADA. Corrija exatamente isto:\n${violacoesAnteriores.map((v) => `- ${v}`).join('\n')}\n`
    : ''

  return `Você está montando a escala de porteiros de uma congregação, para o mês ${mes}.

ELENCO E RESTRIÇÕES (obrigatórias, sem exceção):
${elenco}

TURNOS DESTE MÊS:
${grade}

SITUAÇÃO DE CADA UM ATÉ AQUI (considere para equilibrar e para o distanciamento):
${historico}

REGRAS QUE NÃO PODEM SER VIOLADAS:
1. Cada turno recebe EXATAMENTE o número de vagas indicado.
2. Ninguém aparece duas vezes no MESMO DIA (nem em turnos diferentes do mesmo dia).
3. Respeite dias permitidos, dias proibidos, turnos permitidos, teto mensal e ausências.
4. Use APENAS os identificadores listados no elenco.

O QUE JULGAR BEM (é aqui que você agrega):
- Cada pessoa o MAIS DISTANTE POSSÍVEL da própria escala anterior. Evite intervalos curtos.
- Carga equilibrada: quem tem menos escalas acumuladas deve ser preferido.
- Varie a companhia: evite repetir sempre o mesmo grupo junto.
- Varie o dia da semana de cada pessoa, quando as restrições permitirem.
${correcao}
Responda SOMENTE com JSON, sem texto em volta, neste formato exato:
{
  "turnos": [
    { "data": "AAAA-MM-DD", "tipo": "MANHA|TARDE|NOITE", "pessoas": ["id1", "id2", "id3"] }
  ],
  "raciocinio": "duas ou três frases, em português, sobre as escolhas que você fez neste mês"
}`
}

// ---------------------------------------------------------------------------
// A proposta
// ---------------------------------------------------------------------------

interface RespostaMes {
  turnos: { data: string; tipo: string; pessoas: string[] }[]
  raciocinio?: string
}

/**
 * Pede ao motor uma escala para o bloco inteiro, mês a mês, com o portão entre cada tentativa.
 */
export async function pedirProposta(
  chave: string,
  base: Bloco,
  pessoas: Pessoa[],
  fronteira: Record<string, DataISO>,
  aoProgredir?: (p: ProgressoMotor) => void,
): Promise<ResultadoMotor> {
  if (!chave) return { ok: false, motivo: 'Não há chave do motor guardada neste navegador.', causa: 'sem-chave' }

  const meses = [...new Set(base.turnos.map((t) => mesDe(t.data)))].sort()
  const ultimaEscala: Record<string, DataISO> = { ...fronteira }
  const total: Record<string, number> = {}
  const tentativasPorMes: Record<string, number> = {}
  const raciocinios: string[] = []
  const turnosFinais: Turno[] = []

  for (const mes of meses) {
    const doMes = base.turnos.filter((t) => mesDe(t.data) === mes)
    const paraEscalar = doMes.filter((t) => !t.santaCeia && t.capacidade > 0)
    turnosFinais.push(...doMes.filter((t) => t.santaCeia || t.capacidade === 0).map((t) => ({ ...t, pessoas: [] })))

    if (!paraEscalar.length) continue

    let violacoes: string[] | undefined
    let aceito: Turno[] | null = null

    for (let tentativa = 1; tentativa <= MAX_TENTATIVAS && !aceito; tentativa++) {
      tentativasPorMes[mes] = tentativa
      aoProgredir?.({
        fase: `Mês ${mes}`,
        detalhe: tentativa === 1 ? 'pedindo a proposta…' : `corrigindo (tentativa ${tentativa} de ${MAX_TENTATIVAS})…`,
      })

      let resposta: RespostaMes
      try {
        const texto = await chamar(chave, promptDoMes(mes, paraEscalar, pessoas, ultimaEscala, total, violacoes))
        resposta = extrairJSON<RespostaMes>(texto)
      } catch (e) {
        const causa = (e as { causa?: FalhaMotor['causa'] }).causa ?? 'rede'
        return { ok: false, motivo: e instanceof Error ? e.message : String(e), causa }
      }

      // Reconstrói os turnos a partir da resposta, ignorando o que o motor tenha inventado.
      const porChave = new Map(resposta.turnos?.map((t) => [`${t.data}|${t.tipo}`, t.pessoas ?? []]) ?? [])
      const candidatos: Turno[] = paraEscalar.map((t) => ({
        ...t,
        pessoas: (porChave.get(`${t.data}|${t.tipo}`) ?? []).filter((id) => base.elenco.includes(id)),
      }))

      // 🔒 O PORTÃO. A proposta é julgada pelas mesmas regras da escala do algoritmo.
      const parcial: Bloco = { ...base, turnos: [...turnosFinais, ...candidatos], origem: 'motor' }
      const rel = validar({ bloco: parcial, pessoas, ultimaEscalaAnterior: fronteira })
      const duras = rel.falhasDuras.flatMap((f) => f.violacoes.map((v) => `${f.id}: ${v.mensagem}`))

      if (duras.length === 0) {
        aceito = candidatos
        if (resposta.raciocinio) raciocinios.push(`**${mes}** — ${resposta.raciocinio}`)
      } else {
        violacoes = duras.slice(0, 12)
      }
    }

    if (!aceito) {
      return {
        ok: false,
        causa: 'nao-convergiu',
        motivo:
          `O motor não conseguiu montar ${mes} sem violar regra, em ${MAX_TENTATIVAS} tentativas. ` +
          `Últimas violações: ${(violacoes ?? []).slice(0, 3).join(' · ')}. ` +
          'A escala do algoritmo continua disponível e válida.',
      }
    }

    turnosFinais.push(...aceito)
    for (const t of aceito) {
      for (const id of t.pessoas) {
        total[id] = (total[id] ?? 0) + 1
        if (!ultimaEscala[id] || t.data > ultimaEscala[id]) ultimaEscala[id] = t.data
      }
    }
  }

  const ordenado = [...turnosFinais].sort((a, b) =>
    a.data === b.data ? a.tipo.localeCompare(b.tipo) : a.data < b.data ? -1 : 1,
  )
  const bloco: Bloco = { ...base, turnos: ordenado, origem: 'motor', pisoAlcancado: null }

  // O piso real desta proposta, medido — não declarado.
  const ctx = { bloco, pessoas, ultimaEscalaAnterior: fronteira }
  const minimos = pessoas.map((p) => menorIntervalo(ctx, p.id)).filter((n): n is number => n != null)
  bloco.pisoAlcancado = minimos.length ? Math.min(...minimos) : null

  return {
    ok: true,
    proposta: { bloco, explicacao: raciocinios.join('\n\n'), tentativasPorMes },
  }
}

// ---------------------------------------------------------------------------
// Auditoria e arbitragem
// ---------------------------------------------------------------------------

/** Segunda opinião sobre uma escala já válida: o que a regra não pega. */
export async function auditar(chave: string, bloco: Bloco, pessoas: Pessoa[]): Promise<string> {
  const resumo = pessoas
    .map((p) => {
      const datas = bloco.turnos.filter((t) => t.pessoas.includes(p.id)).map((t) => t.data)
      return `- ${p.nome}: ${datas.length} escalas${datas.length ? ` (${datas.slice(0, 8).join(', ')}${datas.length > 8 ? '…' : ''})` : ''}`
    })
    .join('\n')

  const texto = await chamar(
    chave,
    `Esta escala de porteiros JÁ PASSOU em todas as regras obrigatórias. Seu trabalho é uma segunda opinião: procurar o que uma regra não pega.

${resumo}

Procure especificamente:
- alguém sempre no mesmo dia da semana, sem que a restrição obrigue;
- o mesmo grupo de pessoas se repetindo demais;
- um mês pesado demais para alguém, mesmo dentro do limite;
- concentração ou vazio grande no calendário de alguém.

Seja específico e cite nomes e datas. Se não houver nada relevante, diga isso — em português, em no máximo 5 linhas. Não invente problema para parecer útil.`,
    2000,
  )
  return texto.trim()
}

/** Quando a escala não fecha: o que afrouxar, em que ordem, e a que custo. */
export async function arbitrar(
  chave: string,
  motivoFalha: string,
  pessoas: Pessoa[],
  turnoQueTravou?: { data: string; tipo: string; faltaram: number },
): Promise<string> {
  const texto = await chamar(
    chave,
    `A escala de porteiros não pôde ser gerada.

Motivo: ${motivoFalha}
${turnoQueTravou ? `Travou em ${formatarBR(turnoQueTravou.data)}, turno da ${turnoQueTravou.tipo}: faltaram ${turnoQueTravou.faltaram} pessoa(s).` : ''}

Elenco e restrições:
${pessoas.filter((p) => p.ativo).map(descreverPessoa).join('\n')}

Diga, em português e em no máximo 6 linhas, QUAIS caminhos existem para destravar — em ordem do menos custoso ao mais custoso — e o que cada um custa na prática. Exemplos de caminho: acrescentar alguém ao elenco, afrouxar uma restrição específica, reduzir a capacidade de um turno, encurtar o período. Seja concreto: diga de QUEM é a restrição e qual é.`,
    1500,
  )
  return texto.trim()
}

/** Compara duas escalas válidas pelos números que importam. Determinístico, sem motor. */
export interface Placar {
  rotulo: string
  menorIntervalo: number | null
  intervaloMedio: number
  amplitudeCarga: number
  gruposRepetidos: number
  turnosCompletos: string
}

export function medir(rotulo: string, bloco: Bloco, pessoas: Pessoa[], fronteira: Record<string, DataISO>): Placar {
  const ctx = { bloco, pessoas, ultimaEscalaAnterior: fronteira }
  const minimos = pessoas.map((p) => menorIntervalo(ctx, p.id)).filter((n): n is number => n != null)

  const intervalos: number[] = []
  for (const p of pessoas) {
    const datas = bloco.turnos.filter((t) => t.pessoas.includes(p.id)).map((t) => t.data).sort()
    for (let i = 1; i < datas.length; i++) intervalos.push(diferencaEmDias(datas[i - 1], datas[i]))
  }

  const cargas = pessoas
    .filter((p) => p.restricoes.tetoMensal == null && bloco.elenco.includes(p.id))
    .map((p) => bloco.turnos.filter((t) => t.pessoas.includes(p.id)).length)

  const freq = new Map<string, number>()
  for (const t of bloco.turnos) {
    if (t.pessoas.length < 2) continue
    const k = [...t.pessoas].sort().join('|')
    freq.set(k, (freq.get(k) ?? 0) + 1)
  }

  const comGente = bloco.turnos.filter((t) => !t.santaCeia)
  return {
    rotulo,
    menorIntervalo: minimos.length ? Math.min(...minimos) : null,
    intervaloMedio: intervalos.length ? Math.round((intervalos.reduce((a, b) => a + b, 0) / intervalos.length) * 10) / 10 : 0,
    amplitudeCarga: cargas.length ? Math.max(...cargas) - Math.min(...cargas) : 0,
    gruposRepetidos: [...freq.values()].filter((n) => n >= 3).length,
    turnosCompletos: `${comGente.filter((t) => t.pessoas.length === t.capacidade).length}/${comGente.length}`,
  }
}
