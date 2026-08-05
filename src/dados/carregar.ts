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

/**
 * O padrão é GENÉRICO de propósito.
 *
 * Este é o único lugar do código onde um nome de escala pode aparecer — e por isso ele não pode ser
 * o nome de um cliente. Quem instala o produto do zero e ainda não configurou nada tem de ver algo
 * que não é de mais ninguém. O nome deste cliente mora em `public/dados/config.json`, que é dado.
 */
const CONFIG_PADRAO: Configuracao = {
  versao: 1,
  capacidadePadrao: 3,
  malhaPadrao: { regras: [] },
  santaCeia: [],
  identidade: { titulo: 'Escala de plantões', subtitulo: '', pessoa: { singular: 'Pessoa', plural: 'pessoas' } },
}

/**
 * 🔴 COMPLETA O QUE O ARQUIVO PUBLICADO NÃO TROUXER — achado de 05/08/2026.
 *
 * `buscarJSON<Configuracao>('config.json', CONFIG_PADRAO)` só usa o padrão quando o download
 * FALHA. Um `config.json` que baixa bem mas não tem um campo entrega `undefined` — com o
 * TypeScript afirmando, na cara, que ali existe uma `string`. É a mentira mais cara que um tipo
 * pode contar, porque some na revisão e aparece como "undefined" impresso na tela do usuário.
 *
 * Não é hipótese: o `config.json` que está no ar HOJE não tem `identidade.pessoa` — o campo nasceu
 * agora. Sem esta função, a primeira abertura do site depois deste commit mostraria
 * "Total de turnos por undefined". Publicar o dado novo conserta o sintoma; isto conserta a classe.
 *
 * Campo a campo, e não `{...padrao, ...lido}`: a mescla rasa devolveria `identidade` INTEIRO do
 * arquivo — logo, sem `pessoa` — e o defeito passaria igual.
 */
export type ConfigLida = Omit<Partial<Configuracao>, 'identidade'> & {
  // `Partial<T>` só afrouxa o primeiro nível: `identidade` viraria opcional, mas os campos DENTRO
  // dela continuariam obrigatórios — que é exatamente o caso que esta função existe para tratar.
  identidade?: Partial<Configuracao['identidade']> & { pessoa?: Partial<Configuracao['identidade']['pessoa']> }
}

export function completarConfig(lido: ConfigLida | null | undefined): Configuracao {
  const c = lido ?? {}
  const id = c.identidade ?? {}
  const pessoa = id.pessoa ?? ({} as Partial<Configuracao['identidade']['pessoa']>)
  return {
    versao: c.versao ?? CONFIG_PADRAO.versao,
    capacidadePadrao: c.capacidadePadrao ?? CONFIG_PADRAO.capacidadePadrao,
    malhaPadrao: c.malhaPadrao ?? CONFIG_PADRAO.malhaPadrao,
    santaCeia: c.santaCeia ?? CONFIG_PADRAO.santaCeia,
    identidade: {
      titulo: id.titulo?.trim() || CONFIG_PADRAO.identidade.titulo,
      // O subtítulo pode ser vazio DE PROPÓSITO (nem todo cliente tem uma segunda linha), então
      // aqui `??` e não `||`: string vazia é uma escolha, ausência é que não é.
      subtitulo: id.subtitulo ?? CONFIG_PADRAO.identidade.subtitulo,
      pessoa: {
        singular: pessoa.singular?.trim() || CONFIG_PADRAO.identidade.pessoa.singular,
        plural: pessoa.plural?.trim() || CONFIG_PADRAO.identidade.pessoa.plural,
      },
    },
  }
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
    buscarJSON<ConfigLida>('config.json', CONFIG_PADRAO),
  ])
  const pessoas = arqPessoas.pessoas
  definirPessoas(pessoas)
  return { pessoas, blocos: arqBlocos.blocos, config: completarConfig(config), turnos: emendarBlocos(arqBlocos.blocos) }
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
