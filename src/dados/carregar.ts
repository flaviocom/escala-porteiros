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
import { diferencaEmDias, ehDataValida, type DataISO } from '../dominio/datas'
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
  identidade: { titulo: 'Escala de plantões', subtitulo: '', logo: '', pessoa: { singular: 'Pessoa', plural: 'pessoas' } },
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
      // Vazio é uma ESCOLHA (sem emblema), então `??` e não `||` — mesma razão do subtítulo.
      logo: id.logo ?? CONFIG_PADRAO.identidade.logo,
      pessoa: {
        singular: pessoa.singular?.trim() || CONFIG_PADRAO.identidade.pessoa.singular,
        plural: pessoa.plural?.trim() || CONFIG_PADRAO.identidade.pessoa.plural,
      },
    },
  }
}

/**
 * 🔴 TENTA DE NOVO ANTES DE DESISTIR — 05/08/2026.
 *
 * Um HTTP **503** do GitHub Pages, durante um deploy, apareceu numa validação ao vivo. Naquele
 * instante o `config.json` não carregou e o site mostrou o nome GENÉRICO com a escala certa —
 * meio estado esquisito, mas inofensivo.
 *
 * O que importa é o irmão: se o soluço tivesse pegado `blocos.json`, que **não tem padrão**, a tela
 * teria mostrado **erro** para quem só queria saber se está escalado no domingo. Um blip de CDN
 * dura menos de um segundo, e desistir na primeira tentativa transforma-o em tela de erro.
 *
 * Só repete o que **pode melhorar sozinho**: erro de rede e 5xx. Um **404 não se repete** — o
 * arquivo não existe, e insistir três vezes só faz a pessoa esperar mais para ver a mesma coisa.
 */
const TENTATIVAS = 3
const ESPERA_MS = 400

async function buscarJSON<T>(caminho: string, padrao: T | null = null): Promise<T> {
  let ultimoErro: unknown = null

  for (let tentativa = 1; tentativa <= TENTATIVAS; tentativa++) {
    try {
      // `?v=` novo a cada tentativa: sem isso a segunda poderia ser servida do cache da primeira.
      const url = `${import.meta.env.BASE_URL}dados/${caminho}?v=${Date.now()}-${tentativa}`
      const resp = await fetch(url, { cache: 'no-store' })

      if (resp.ok) return (await resp.json()) as T

      // 🔴 `fetch` NÃO rejeita em erro de HTTP: 404 e 503 chegam aqui como resposta resolvida.
      //    Sem este `if`, os dois seguiriam para o `.json()` e virariam erro de sintaxe.
      ultimoErro = new Error(`Não foi possível carregar ${caminho} (HTTP ${resp.status})`)
      if (resp.status < 500) break // 404, 403… não melhoram com insistência
    } catch (e) {
      ultimoErro = e // rede fora, DNS, conexão cortada — exatamente o que pode melhorar sozinho
    }

    if (tentativa < TENTATIVAS) await new Promise((r) => setTimeout(r, ESPERA_MS * tentativa))
  }

  if (padrao !== null) return padrao
  throw ultimoErro instanceof Error ? ultimoErro : new Error(`Não foi possível carregar ${caminho}`)
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
      /*
        🔴 A CHAVE É DATA + TIPO. E SÓ — achado da auditoria externa de 05/08/2026.

        Ela incluía `santaCeia`, então o MESMO dia e turno, marcado num bloco e não marcado no
        outro, tinha duas chaves e **os dois sobreviviam à emenda**. Resultado medido: 16/08 MANHÃ
        aparecendo duas vezes — uma como Santa Ceia vazia, outra com três pessoas escaladas ao lado.
        Que é a forma exata do defeito que originou este projeto.

        A regra desta função é uma só, e está escrita no `MODELO_DE_DADOS.md`: **o bloco que começa
        depois manda no trecho compartilhado**. Qualquer coisa a mais na chave é uma exceção
        silenciosa a ela.

        ⚠️ E ninguém validava o resultado: D9 julga um bloco por vez, e `vivo:conferir` compara a
        tela com o dado **já emendado** — coerência interna perfeita sobre um dia duplicado. Hoje o
        botão Publicar poda o bloco anterior, então não estava no ar; bloco importado e JSON editado
        à mão são caminhos que o produto prevê.
      */
      porChave.set(`${t.data}|${t.tipo}`, t)
    }
  }
  const peso: Record<Turno['tipo'], number> = { MANHA: 0, TARDE: 1, NOITE: 2 }
  return [...porChave.values()].sort((a, b) =>
    a.data === b.data ? peso[a.tipo] - peso[b.tipo] : a.data < b.data ? -1 : 1,
  )
}

/**
 * 🔴 O RETRATO DO QUE ACABOU DE SER GRAVADO — quinta auditoria externa, 05/08/2026.
 *
 * `carregarDados()` roda **uma vez**, no topo do módulo. O objeto que ela devolve ficava congelado
 * no closure da tela, e a área administrativa media tudo contra ele: a montagem dos blocos, o guarda
 * do passado e a fronteira ("quem trabalhou na véspera não entra no dia 1").
 *
 * Medido: publicar out→dez e, **sem recarregar**, publicar jan→jun apagava out→dez inteiro — 55
 * turnos — e o guarda criado para impedir exatamente isso dizia `ok: true, perdidos: 0`. Ele não
 * errou: recebeu o retrato de antes da primeira publicação, onde aqueles turnos ainda não existiam.
 * **Um guarda só é tão bom quanto o argumento que lhe entregam.**
 *
 * Recarregar da rede seria pior: o GitHub Pages leva cerca de um minuto para servir o arquivo novo,
 * então buscar de novo logo depois de publicar traria de volta o dado ANTIGO. Quem sabe a verdade,
 * neste instante, é quem acabou de gravar — e é isto que esta função monta.
 */
export function retratoPublicado(pessoas: Pessoa[], blocos: Bloco[], config: Configuracao): DadosPublicados {
  // `BROTHERS` alimenta as telas herdadas: sem isto, um nome recém-publicado sairia como id cru.
  definirPessoas(pessoas)
  return { pessoas, blocos, config, turnos: emendarBlocos(blocos) }
}

export async function carregarDados(): Promise<DadosPublicados> {
  const [arqPessoas, arqBlocos, config] = await Promise.all([
    buscarJSON<ArquivoPessoas>('pessoas.json'),
    buscarJSON<ArquivoBlocos>('blocos.json'),
    buscarJSON<ConfigLida>('config.json', CONFIG_PADRAO),
  ])
  const pessoas = arqPessoas?.pessoas ?? []
  const blocos = arqBlocos?.blocos ?? []
  conferirEsquema(pessoas, blocos)
  definirPessoas(pessoas)
  return { pessoas, blocos, config: completarConfig(config), turnos: emendarBlocos(blocos) }
}

/**
 * 🔴 O DADO PUBLICADO É COERENTE? — P5.4, fechado em 05/08/2026.
 *
 * `config.json` tinha `completarConfig`. `pessoas.json` e `blocos.json` não tinham nada: um `id`
 * duplicado, ou um turno citando alguém que não existe no elenco, passava direto — e o sintoma
 * conhecido é o **id cru aparecendo na tela** no lugar do nome, que já aconteceu neste projeto.
 *
 * ⚠️ **NÃO derruba o site.** Estes são defeitos de dado, não de código: quem abre o link quer ver
 * a escala, e uma tela branca por causa de um id repetido seria uma cura pior que a doença. O
 * aviso vai para o **console**, onde quem administra encontra, e a tela continua servindo o que
 * dá para servir.
 *
 * O que ele NÃO faz: julgar regra de escala. Isso é do catálogo (`regras.ts`). Aqui só se
 * pergunta se o arquivo é internamente coerente.
 */
export function conferirEsquema(pessoas: Pessoa[], blocos: Bloco[]): string[] {
  // Construída assim, e não com `\n` literal, porque este arquivo já foi reescrito por script mais
  // de uma vez hoje — e a barra invertida some no caminho, virando quebra de linha de verdade.
  const quebra = String.fromCharCode(10)
  const problemas: string[] = []
  const vistos = new Set<string>()

  for (const p of pessoas) {
    if (!p?.id) { problemas.push(`pessoa sem \`id\`: ${JSON.stringify(p)?.slice(0, 60)}`); continue }
    if (vistos.has(p.id)) problemas.push(`\`id\` repetido em pessoas.json: "${p.id}"`)
    vistos.add(p.id)
    if (!p.nome?.trim()) problemas.push(`"${p.id}" está sem nome — a tela mostraria o id cru`)
  }

  /*
    🔴 `ehDataValida` TINHA 4 TESTES E NENHUM CHAMADOR — quinta auditoria externa, 05/08/2026.

    Ela existe, está certa, é exportada, é provada nos dois lados — e nunca era chamada em produção.
    Código inerte que parece cobertura. Medido pelo auditor: com `inicio = "2026-02-31"`, o produto
    **gera um turno em 31/02/2026** (data que não existe), pula 01 a 03 de março, e o veredito sai
    *"Aprovada, sem ressalvas."* Nenhuma das 17 regras confere se a data existe; nenhuma tem por quê.

    Aqui é o lugar: este é o portão que pergunta se o arquivo publicado é internamente coerente.
  */
  for (const b of blocos) {
    if (b.inicio && !ehDataValida(b.inicio)) problemas.push(`bloco "${b.id}": início "${b.inicio}" não é uma data que existe`)
    if (b.fim && !ehDataValida(b.fim)) problemas.push(`bloco "${b.id}": fim "${b.fim}" não é uma data que existe`)
    for (const t of b.turnos ?? []) {
      if (!ehDataValida(t.data)) problemas.push(`turno com data "${t.data}", que não existe no calendário`)
      for (const id of t.pessoas ?? []) {
        if (!vistos.has(id)) problemas.push(`${t.data} ${t.tipo}: escala "${id}", que não existe em pessoas.json`)
      }
      const repetidos = (t.pessoas ?? []).filter((x, i, a) => a.indexOf(x) !== i)
      if (repetidos.length) problemas.push(`${t.data} ${t.tipo}: "${repetidos[0]}" aparece duas vezes no mesmo turno`)
    }
  }

  if (problemas.length) {
    console.warn(
      `🔴 O dado publicado tem ${problemas.length} incoerência(s). A escala continua sendo mostrada; ` +
        'conserte no arquivo e publique de novo:' +
        problemas.slice(0, 20).map((p) => `${quebra}  · ${p}`).join(''),
    )
  }
  return problemas
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
    // A etiqueta do dado, e não uma cravada no componente. Ver `Shift.rotulo`.
    ...(t.rotulo ? { rotulo: t.rotulo } : {}),
  }))
}

function dataLocal(d: DataISO): Date {
  const [a, m, dia] = d.split('-').map(Number)
  return new Date(a, m - 1, dia)
}
