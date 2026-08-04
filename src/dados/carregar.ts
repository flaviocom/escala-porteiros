/**
 * CARREGAMENTO — busca os dados publicados e os entrega prontos para a tela.
 *
 * Antes, a escala era **recalculada no navegador** a cada abertura. Agora ela é lida de arquivos
 * JSON servidos estaticamente pelo GitHub Pages. A diferença prática: dá para editar, versionar e
 * reverter — e uma alteração publicada não exige rebuild, porque dado não é código.
 *
 * ⚠️ CACHE. O GitHub Pages serve com cache curto, e um administrador que acabou de publicar precisa
 * ver a mudança. Por isso a busca vai com `no-store` e uma marca de tempo na URL. Sem isso, o
 * "publiquei e não mudou nada" viraria o bug mais comum do produto.
 */
import type { ArquivoBlocos, ArquivoPessoas, Bloco, Configuracao, Pessoa, Turno } from '../dominio/tipos'
import { diferencaEmDias, type DataISO } from '../dominio/datas'
import { definirPessoas, type Shift, type ShiftType } from '../types/scheduler'

export interface DadosPublicados {
  pessoas: Pessoa[]
  blocos: Bloco[]
  config: Configuracao
  /** Todos os turnos de todos os blocos, em ordem cronológica e sem sobreposição. */
  turnos: Turno[]
}

const CONFIG_PADRAO: Configuracao = {
  versao: 1,
  capacidadePadrao: 3,
  malhaPadrao: { regras: [] },
  santaCeia: [],
  identidade: { titulo: 'Escala Porteiros', subtitulo: 'JD. São Luiz' },
}

async function buscarJSON<T>(caminho: string, padrao: T | null = null): Promise<T> {
  const url = `${import.meta.env.BASE_URL}dados/${caminho}?v=${Date.now()}`
  const resp = await fetch(url, { cache: 'no-store' })
  if (!resp.ok) {
    if (padrao !== null) return padrao
    throw new Error(`Não foi possível carregar ${caminho} (HTTP ${resp.status})`)
  }
  return (await resp.json()) as T
}

/**
 * Emenda os blocos em ordem cronológica.
 *
 * Blocos publicados podem se sobrepor: gerar `01/09 → 30/12` trunca o anterior em 31/08. A regra de
 * desempate é simples e vale sempre: **o bloco que começa depois manda no trecho compartilhado.**
 * É o que preserva o passado e deixa o futuro ser regerado.
 */
export function emendarBlocos(blocos: Bloco[]): Turno[] {
  const ordenados = [...blocos].sort((a, b) => (a.inicio < b.inicio ? -1 : 1))
  const porChave = new Map<string, Turno>()
  for (const bloco of ordenados) {
    for (const t of bloco.turnos) {
      // Um bloco só governa o que está dentro do próprio intervalo.
      if (diferencaEmDias(bloco.inicio, t.data) < 0) continue
      if (diferencaEmDias(t.data, bloco.fim) < 0) continue
      porChave.set(`${t.data}|${t.tipo}|${t.santaCeia ? 'sc' : ''}`, t)
    }
  }
  const peso: Record<Turno['tipo'], number> = { MANHA: 0, TARDE: 1, NOITE: 2 }
  return [...porChave.values()].sort((a, b) =>
    a.data === b.data ? peso[a.tipo] - peso[b.tipo] : a.data < b.data ? -1 : 1,
  )
}

export async function carregarDados(): Promise<DadosPublicados> {
  const [arqPessoas, arqBlocos, config] = await Promise.all([
    buscarJSON<ArquivoPessoas>('pessoas.json'),
    buscarJSON<ArquivoBlocos>('blocos.json'),
    buscarJSON<Configuracao>('config.json', CONFIG_PADRAO),
  ])
  const pessoas = arqPessoas.pessoas
  definirPessoas(pessoas)
  return { pessoas, blocos: arqBlocos.blocos, config, turnos: emendarBlocos(arqBlocos.blocos) }
}

// ---------------------------------------------------------------------------
// Adaptação para os componentes de tela que já existiam
// ---------------------------------------------------------------------------

/**
 * Converte o modelo novo para a forma que a interface herdada espera.
 *
 * Por que um adaptador em vez de reescrever as telas: a interface do site atual **funciona e o
 * Flavio gosta dela** — filtros, "Minha Escala", estatísticas, exportação para o WhatsApp. Trocar o
 * motor por baixo sem mexer nela é o menor caminho que entrega o valor, e não arrisca uma regressão
 * visual em algo que já está bom.
 */
const TIPO_PARA_TELA: Record<Turno['tipo'], ShiftType> = {
  MANHA: 'MANHÃ',
  TARDE: 'TARDE',
  NOITE: 'NOITE',
}

export function paraShifts(turnos: Turno[]): Shift[] {
  return turnos.map((t, i) => ({
    id: `t-${i + 1}`,
    date: dataLocal(t.data),
    type: t.santaCeia ? 'SANTA_CEIA' : TIPO_PARA_TELA[t.tipo],
    assignedBrothers: t.pessoas,
  }))
}

function dataLocal(d: DataISO): Date {
  const [a, m, dia] = d.split('-').map(Number)
  return new Date(a, m - 1, dia)
}
