/**
 * 🔍 AUDITORIA ADVERSARIAL — mandado de ACHAR DEFEITO, não de confirmar.
 *
 * ⚠️ LIMITE DECLARADO, e ele é estrutural. Esta auditoria é feita por quem escreveu o código, e o
 * próprio método do Flavio diz por que isso não basta: *"quem escreveu carrega os mesmos pontos
 * cegos ao testá-lo"*. Num dia, três auditores independentes acharam 23 defeitos que a
 * autoverificação não tinha visto.
 *
 * O que isto **é**: um ataque sistemático aos pontos onde este projeto tem mais chance de estar
 * errado, com infrator injetado e medição — não leitura de código.
 * O que isto **não é**: substituto de auditor independente. Fica registrado como pendência.
 *
 * Uso: node scripts/auditoria-adversarial.mjs
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { extname, join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(import.meta.url)
const esbuild = require('esbuild')

// Compila o domínio para atacá-lo com o MESMO código que roda em produção.
const entrada = join(RAIZ, 'node_modules', '.auditoria-entrada.ts')
const saida = join(RAIZ, 'node_modules', '.auditoria.mjs')
require('node:fs').writeFileSync(
  entrada,
  [
    ...['datas', 'malha', 'regras', 'validacao', 'gerador'].map(
      (m) => `export * from '../src/dominio/${m}'`,
    ),
    // A ponte para a interface entra no pacote atacado: foi lá que nasceu o defeito de
    // 04/08/2026 — uma regra do domínio ("nunca apagar quem saiu") violada três camadas
    // acima, na tela, onde nenhum teste de domínio alcançava.
    "export { BROTHERS, definirPessoas } from '../src/types/scheduler'",
  ].join('\n'),
  'utf8',
)
esbuild.buildSync({ entryPoints: [entrada], outfile: saida, format: 'esm', platform: 'node', bundle: true })
const D = await import(pathToFileURL(saida).href)

const achados = []
const ok = []
function conferir(frente, pergunta, fn) {
  try {
    const r = fn()
    if (r.defeito) achados.push({ frente, pergunta, ...r })
    else ok.push({ frente, pergunta, detalhe: r.detalhe })
  } catch (e) {
    achados.push({ frente, pergunta, defeito: true, detalhe: `a própria checagem quebrou: ${e.message}` })
  }
}

const pessoa = (id, r = {}) => ({ id, nome: id, ativo: true, restricoes: r })
const turno = (data, tipo, pessoas, extras = {}) => ({ data, tipo, pessoas, capacidade: 3, ...extras })
const bloco = (turnos, elenco, piso = null) => ({
  id: 'auditoria', inicio: turnos[0]?.data ?? '2026-09-01', fim: turnos.at(-1)?.data ?? '2026-09-30',
  geradoEm: '2026-08-04', origem: 'algoritmo', pisoAlcancado: piso, elenco,
  malha: { regras: [] }, turnos,
})

/**
 * Configuração dos cenários sintéticos. Entrou em 04/08/2026, junto com D9 (que agora confere o
 * bloco contra o CALENDÁRIO, não contra si mesmo) e D11 (que confere se o bloco cobre o período).
 *
 * `santaCeia: []` e malha vazia de propósito: estes cenários exercitam OUTRAS regras, e uma
 * configuração casada com cada fixture só acrescentaria ruído. Sem configuração NENHUMA, porém, as
 * duas regras REPROVAM — falha fechada — e todo cenário daqui viraria falso vermelho.
 */
const CONFIG_TESTE = {
  versao: 1,
  capacidadePadrao: 3,
  malhaPadrao: { regras: [] },
  santaCeia: [],
  identidade: { titulo: 'auditoria', subtitulo: 'auditoria' },
}

/** A configuração REAL, para as checagens que rodam contra o dado publicado. */
const CONFIG_REAL = JSON.parse(readFileSync(join(RAIZ, 'public/dados/config.json'), 'utf8'))

// ═══ FRENTE 1 — a validação pode ser enganada? ═════════════════════════════
const F1 = 'validação'

conferir(F1, 'turno com gente A MAIS passa?', () => {
  const ps = [pessoa('a'), pessoa('b'), pessoa('c'), pessoa('d')]
  const rel = D.validar({
    bloco: bloco([turno('2026-09-06', 'NOITE', ['a', 'b', 'c', 'd'])], ['a', 'b', 'c', 'd']),
    pessoas: ps, ultimaEscalaAnterior: {}, config: CONFIG_TESTE,
  })
  return rel.aprovada
    ? { defeito: true, detalhe: '4 pessoas num turno de 3 vagas foi APROVADO — D1 só olha "menor que"' }
    : { detalhe: 'reprovado corretamente' }
})

conferir(F1, 'pessoa repetida DENTRO do mesmo turno passa?', () => {
  const ps = [pessoa('a'), pessoa('b')]
  const rel = D.validar({
    bloco: bloco([turno('2026-09-06', 'NOITE', ['a', 'a', 'b'])], ['a', 'b']),
    pessoas: ps, ultimaEscalaAnterior: {}, config: CONFIG_TESTE,
  })
  return rel.aprovada
    ? { defeito: true, detalhe: 'a mesma pessoa DUAS VEZES no mesmo turno foi aprovada' }
    : { detalhe: 'reprovado' }
})

conferir(F1, 'pessoa INATIVA escalada passa?', () => {
  const ps = [pessoa('a'), pessoa('b'), { ...pessoa('c'), ativo: false }]
  const rel = D.validar({
    bloco: bloco([turno('2026-09-06', 'NOITE', ['a', 'b', 'c'])], ['a', 'b', 'c']),
    pessoas: ps, ultimaEscalaAnterior: {}, config: CONFIG_TESTE,
  })
  return rel.aprovada
    ? { defeito: true, detalhe: 'pessoa DESATIVADA escalada foi aprovada — D8 confere o elenco do bloco, não o campo ativo' }
    : { detalhe: 'reprovado' }
})

conferir(F1, 'lista de dias permitidos VAZIA é tratada como "todos"?', () => {
  const ps = [pessoa('a', { diasPermitidos: [] }), pessoa('b'), pessoa('c')]
  const rel = D.validar({
    bloco: bloco([turno('2026-09-06', 'NOITE', ['a', 'b', 'c'])], ['a', 'b', 'c']),
    pessoas: ps, ultimaEscalaAnterior: {}, config: CONFIG_TESTE,
  })
  return rel.aprovada
    ? { defeito: true, detalhe: 'lista VAZIA deveria significar "nenhum dia", e foi tratada como "sem restrição"' }
    : { detalhe: 'lista vazia barra corretamente' }
})

conferir(F1, 'ausência com fim ANTES do início barra alguém indevidamente?', () => {
  const ps = [pessoa('a', { ausencias: [{ inicio: '2026-09-20', fim: '2026-09-10' }] }), pessoa('b'), pessoa('c')]
  const rel = D.validar({
    bloco: bloco([turno('2026-09-15', 'NOITE', ['a', 'b', 'c'])], ['a', 'b', 'c']),
    pessoas: ps, ultimaEscalaAnterior: {}, config: CONFIG_TESTE,
  })
  return rel.aprovada
    ? { detalhe: 'intervalo invertido não barra ninguém (comportamento defensável)' }
    : { defeito: true, detalhe: 'intervalo INVERTIDO barrou alguém — a tela precisa impedir isso na entrada' }
})

// ═══ FRENTE 2 — o gerador cumpre o que declara? ════════════════════════════
const F2 = 'gerador'

conferir(F2, 'com elenco no limite, o piso declarado é real?', () => {
  const ps = Array.from({ length: 6 }, (_, i) => pessoa(`p${i}`))
  const grade = D.construirGrade({ inicio: '2026-09-01', fim: '2026-10-31', malha: D.MALHA_ATUAL, capacidadePadrao: 3 })
  const r = D.gerar({ inicio: '2026-09-01', fim: '2026-10-31', grade, pessoas: ps, elenco: ps.map((p) => p.id), malha: D.MALHA_ATUAL })
  if (!r.ok) return { detalhe: `não gerou com 6 pessoas, e disse por quê (correto)` }
  const ctx = { bloco: r.bloco, pessoas: ps, ultimaEscalaAnterior: {}, config: CONFIG_TESTE }
  const abaixo = ps.filter((p) => {
    const m = D.menorIntervalo(ctx, p.id)
    return m != null && m < r.pisoAlcancado
  })
  return abaixo.length
    ? { defeito: true, detalhe: `${abaixo.length} pessoa(s) abaixo do piso declarado de ${r.pisoAlcancado}` }
    : { detalhe: `piso ${r.pisoAlcancado} é real para as 6 pessoas` }
})

conferir(F2, 'elenco VAZIO trava ou devolve escala vazia em silêncio?', () => {
  const grade = D.construirGrade({ inicio: '2026-09-01', fim: '2026-09-30', malha: D.MALHA_ATUAL, capacidadePadrao: 3 })
  const r = D.gerar({ inicio: '2026-09-01', fim: '2026-09-30', grade, pessoas: [], elenco: [], malha: D.MALHA_ATUAL })
  return r.ok
    ? { defeito: true, detalhe: 'gerou com elenco VAZIO — deveria declarar que não foi possível' }
    : { detalhe: 'declarou que não foi possível, com o turno que travou' }
})

conferir(F2, 'todo mundo ausente no período: declara ou finge?', () => {
  const ps = Array.from({ length: 16 }, (_, i) =>
    pessoa(`p${i}`, { ausencias: [{ inicio: '2026-09-01', fim: '2026-09-30' }] }))
  const grade = D.construirGrade({ inicio: '2026-09-01', fim: '2026-09-30', malha: D.MALHA_ATUAL, capacidadePadrao: 3 })
  const r = D.gerar({ inicio: '2026-09-01', fim: '2026-09-30', grade, pessoas: ps, elenco: ps.map((p) => p.id), malha: D.MALHA_ATUAL })
  return r.ok
    ? { defeito: true, detalhe: 'gerou escala com TODOS ausentes' }
    : { detalhe: 'declarou impossível' }
})

conferir(F2, 'período de um dia só quebra?', () => {
  const ps = Array.from({ length: 16 }, (_, i) => pessoa(`p${i}`))
  const grade = D.construirGrade({ inicio: '2026-09-06', fim: '2026-09-06', malha: D.MALHA_ATUAL, capacidadePadrao: 3 })
  const r = D.gerar({ inicio: '2026-09-06', fim: '2026-09-06', grade, pessoas: ps, elenco: ps.map((p) => p.id), malha: D.MALHA_ATUAL })
  return r.ok && r.bloco.turnos.length === 2
    ? { detalhe: 'um domingo isolado gera manhã + noite' }
    : { defeito: true, detalhe: `período de 1 dia devolveu ${r.ok ? r.bloco.turnos.length + ' turnos' : 'falha'}` }
})

conferir(F2, 'a fronteira é respeitada mesmo com o elenco apertado?', () => {
  const ps = Array.from({ length: 16 }, (_, i) => pessoa(`p${i}`))
  const grade = D.construirGrade({ inicio: '2026-09-01', fim: '2026-09-30', malha: D.MALHA_ATUAL, capacidadePadrao: 3 })
  const fronteira = Object.fromEntries(ps.map((p) => [p.id, '2026-08-31']))
  const r = D.gerar({
    inicio: '2026-09-01', fim: '2026-09-30', grade, pessoas: ps,
    elenco: ps.map((p) => p.id), malha: D.MALHA_ATUAL, ultimaEscalaAnterior: fronteira,
  })
  if (!r.ok) return { detalhe: 'com todos trabalhando na véspera, declarou impossível (correto)' }
  const ctx = { bloco: r.bloco, pessoas: ps, ultimaEscalaAnterior: fronteira, config: CONFIG_TESTE }
  const violando = ps.filter((p) => {
    const m = D.menorIntervalo(ctx, p.id)
    return m != null && m < r.pisoAlcancado
  })
  return violando.length
    ? { defeito: true, detalhe: `${violando.length} pessoa(s) violam o piso considerando a fronteira` }
    : { detalhe: `piso ${r.pisoAlcancado} respeitado inclusive contra a véspera` }
})

// ═══ FRENTE 3 — o que está publicado bate com o que está no ar? ═══════════
const F3 = 'dados publicados'

conferir(F3, 'os dois arquivos de dados (public e docs) são iguais?', () => {
  // 🔴 COMPARA TODOS OS ARQUIVOS, não só o `blocos.json` — corrigido em 04/08/2026 por auditoria.
  //
  // A pergunta diz "os dois arquivos de dados", no plural, e a checagem olhava UM. Um auditor
  // trocou `"ativo": true` por `false` no `docs/dados/pessoas.json`, deixando o `public/` intacto,
  // e esta linha respondeu "✅ idênticos". Na tela isso é um irmão aparecendo como fora da escala
  // no site publicado enquanto a cópia local ainda o tem ativo — exatamente a divergência
  // silenciosa que o nome da checagem promete cobrir.
  //
  // A lista vem de VARREDURA, não escrita à mão: arquivo de dados novo entra sozinho. Lista
  // manual é como o portão fica desatualizado sem ninguém notar.
  const nomes = [...new Set([
    ...readdirSync(join(RAIZ, 'public/dados')),
    ...readdirSync(join(RAIZ, 'docs/dados')),
  ])].filter((n) => n.endsWith('.json')).sort()

  const divergentes = []
  const ausentes = []
  for (const nome of nomes) {
    const pa = join(RAIZ, 'public/dados', nome)
    const pb = join(RAIZ, 'docs/dados', nome)
    if (!existsSync(pa) || !existsSync(pb)) { ausentes.push(nome); continue }
    /*
      🔴 COMPARA CONTEÚDO, NÃO BYTES — corrigido em 05/08/2026, depois de um alarme falso REAL.

      A comparação byte a byte acusou `config.json` como divergente: 800 bytes contra 753. O
      conteúdo era **idêntico** — a diferença eram 47 fins de linha, CRLF de um lado e LF do outro,
      porque o git normaliza no `checkout` e os scripts gravam com `
`.

      No Windows, byte-igualdade entre as duas pastas é inalcançável. Um portão que exige o
      inalcançável fica **cronicamente vermelho** — e vermelho crônico ensina a ignorar vermelho,
      que é como um dia se ignora a divergência de verdade. Este projeto já pagou por isso hoje
      (`vivo:admin` gritou por um dia inteiro sobre um produto certo).

      Fim de linha normalizado, o resto comparado inteiro: um `"ativo": true` virando `false` de um
      lado só continua sendo acusado — é o caso que originou esta checagem.
    */
    // Construído por código, sem barra invertida: este arquivo já foi reescrito por script hoje, e
    // a barra some no caminho — virando quebra de linha de verdade dentro da expressão.
    const CR = String.fromCharCode(13)
    const normalizar = (caminho) => readFileSync(caminho, 'utf8').split(CR).join('')
    if (normalizar(pa) !== normalizar(pb)) divergentes.push(nome)
  }
  if (ausentes.length || divergentes.length)
    return {
      defeito: true,
      detalhe:
        `public/dados e docs/dados DIVERGEM — o site serviria o antigo` +
        (divergentes.length ? ` · conteúdo diferente: ${divergentes.join(', ')}` : '') +
        (ausentes.length ? ` · só existe de um lado: ${ausentes.join(', ')}` : ''),
    }
  return { detalhe: `idênticos nos ${nomes.length} arquivo(s): ${nomes.join(', ')}` }
})

conferir(F3, 'a escala publicada passa na própria validação?', () => {
  const blocos = JSON.parse(readFileSync(join(RAIZ, 'docs/dados/blocos.json'), 'utf8')).blocos
  const pessoas = JSON.parse(readFileSync(join(RAIZ, 'docs/dados/pessoas.json'), 'utf8')).pessoas
  const problemas = []
  for (let i = 0; i < blocos.length; i++) {
    const b = blocos[i]
    const fronteira = {}
    for (const ant of blocos.slice(0, i)) {
      for (const t of ant.turnos) for (const id of t.pessoas) {
        if (!fronteira[id] || t.data > fronteira[id]) fronteira[id] = t.data
      }
    }
    const rel = D.validar({ bloco: b, pessoas, ultimaEscalaAnterior: fronteira, config: CONFIG_REAL })
    if (!rel.aprovada) problemas.push(`${b.id}: ${rel.falhasDuras.map((f) => f.id).join(', ')}`)
  }
  return problemas.length
    ? { defeito: true, detalhe: `a escala NO AR reprova: ${problemas.join(' · ')}` }
    : { detalhe: `${blocos.length} bloco(s) publicados passam nas ${D.CATALOGO.length} regras` }
})

conferir(F3, 'há buraco ou sobreposição entre os blocos?', () => {
  const blocos = JSON.parse(readFileSync(join(RAIZ, 'docs/dados/blocos.json'), 'utf8')).blocos
    .slice().sort((a, b) => (a.inicio < b.inicio ? -1 : 1))
  const problemas = []
  for (let i = 1; i < blocos.length; i++) {
    const gap = D.diferencaEmDias(blocos[i - 1].fim, blocos[i].inicio)
    if (gap > 1) problemas.push(`buraco de ${gap - 1} dia(s) entre ${blocos[i - 1].fim} e ${blocos[i].inicio}`)
    if (gap < 1) problemas.push(`sobreposição entre ${blocos[i - 1].id} e ${blocos[i].id}`)
  }
  return problemas.length
    ? { defeito: true, detalhe: problemas.join(' · ') }
    : { detalhe: 'os blocos se emendam sem buraco nem sobreposição' }
})

conferir(F3, '16/08 está mesmo vazio no dado publicado?', () => {
  const t = JSON.parse(readFileSync(join(RAIZ, 'docs/dados/blocos.json'), 'utf8'))
    .blocos.flatMap((b) => b.turnos).filter((x) => x.data === '2026-08-16')
  if (t.length !== 1) return { defeito: true, detalhe: `16/08 tem ${t.length} turno(s), esperado 1` }
  return t[0].santaCeia && t[0].pessoas.length === 0
    ? { detalhe: 'um marcador de Santa Ceia, sem ninguém' }
    : { defeito: true, detalhe: `16/08 com ${t[0].pessoas.length} pessoa(s)` }
})

// ═══ FRENTE 4 — código produzido e não ligado ══════════════════════════════
const F4 = 'código morto'

/**
 * 🔴 A PRIMEIRA VERSÃO DESTE DETECTOR ERA FROUXA — acusou 8 funções, quase todas inocentes.
 *
 * Ela ignorava dois consumidores legítimos: o **próprio arquivo** (uma função pode ser exportada e
 * usada ao lado, como `lerDadosNoCommit` dentro de `reverterPara`) e os **testes** (`ehDataValida` e
 * `pisoTeorico` existem justamente para serem testados).
 *
 * Régua frouxa não é conservadora: é **ruidosa**. E ruído em portão é o que faz alguém desligá-lo —
 * levando junto a proteção. O que sobra depois de contar direito é o achado de verdade.
 */
conferir(F4, 'alguma função exportada não tem consumidor NENHUM (nem teste, nem o próprio arquivo)?', () => {
  const arquivos = []
  ;(function andar(dir) {
    for (const n of readdirSync(dir)) {
      const c = join(dir, n)
      if (statSync(c).isDirectory()) andar(c)
      else if (['.ts', '.tsx'].includes(extname(c))) arquivos.push(c)
    }
  })(join(RAIZ, 'src'))

  // 🔴 DOIS PONTOS CEGOS QUE SE SOMAVAM — corrigidos em 04/08/2026 por auditoria independente.
  //
  // 1. A busca só casava `export function nome`. Mas o estilo dominante NESTE projeto é
  //    `export const nome = (...) => ...` — é assim que `Admin`, `AbaAjustar`, `DateSearch`,
  //    `StatsView` e `ValidationView` são exportados. A forma mais comum era invisível.
  // 2. A contagem de uso rodava sobre o TEXTO BRUTO. Um `// TODO: tirar calcularPesoSazonal`
  //    contava como uso — bastava a função ser CITADA num comentário para deixar de ser órfã.
  //
  // Um auditor injetou duas funções 100% órfãs, uma por cada ponto cego, e esta checagem
  // respondeu "toda função exportada é usada", exit 0. Um detector que nunca foi visto achando é
  // indistinguível de um detector quebrado.
  const semComentarios = (t) =>
    t.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(?<!:)\/\/[^\n]*/g, ' ')

  const fontes = arquivos.map((a) => ({ caminho: a, texto: semComentarios(readFileSync(a, 'utf8')) }))
  const orfas = []
  let medidas = 0
  for (const f of fontes) {
    if (f.caminho.endsWith('.test.ts')) continue
    // `function`, `const`/`let` e `class` — as três formas de exportar algo com nome. `type` e
    // `interface` ficam de fora de propósito: some no compilado, não vira código morto em produção.
    const declaracoes = /export\s+(?:async\s+function|function|const|let|class)\s+(\w+)/g
    for (const m of f.texto.matchAll(declaracoes)) {
      const nome = m[1]
      medidas++
      // Mais de uma ocorrência no próprio arquivo = a declaração + pelo menos um uso.
      const noProprio = (f.texto.match(new RegExp(`\\b${nome}\\b`, 'g')) ?? []).length > 1
      const noutro = fontes.some(
        (o) => o.caminho !== f.caminho && new RegExp(`\\b${nome}\\b`).test(o.texto),
      )
      if (!noProprio && !noutro) orfas.push(`${f.caminho.replace(RAIZ, '').replace(/\\/g, '/')}:${nome}`)
    }
  }
  return orfas.length
    ? { defeito: true, detalhe: `sem consumidor NENHUM: ${orfas.join(', ')}` }
    : { detalhe: `${medidas} exportação(ões) medida(s) — todas usadas, e comentário não conta como uso` }
})

// ═══ FRENTE 5 — os portões mordem mesmo? ═══════════════════════════════════
const F5 = 'portões'

/*
  🔴 A MATRIZ INTEIRA, NÃO UMA CÉLULA — 06/08/2026.

  Esta checagem injetava **um** termo ("inteligência artificial") em **um** tipo de arquivo (`.tsx`).
  O portão de denominação procura **11 termos** em **3 extensões**. Ou seja: a auditoria dizia "o
  portão reprova infrator" tendo provado 1 de 33 combinações — e as outras 32 podiam estar mortas
  (uma regex quebrada por caractere de controle já aconteceu três vezes neste projeto).

  A lista de termos é **lida do próprio portão**, por texto, sem importá-lo — importá-lo o
  EXECUTARIA, e uma lista copiada aqui apodreceria em silêncio no dia em que um termo novo entrasse
  lá. Se a leitura falhar, isso é defeito, não "0 termos verificados".
*/
conferir(F5, 'o portão de denominação reprova TODOS os termos, em TODAS as extensões?', () => {
  const fs = require('node:fs')
  const fonte = fs.readFileSync(join(RAIZ, 'scripts', 'medir-denominacao-sem-ia.mjs'), 'utf8')
  const termos = [...fonte.matchAll(/termo: '([^']+)'/g)].map((m) => m[1])
  if (termos.length < 5) {
    return { defeito: true, detalhe: `só ${termos.length} termo(s) lidos do portão — o formato da lista mudou e esta checagem ficaria vazia` }
  }
  const extensoes = ['.tsx', '.ts', '.html']
  const escaparam = []
  let testadas = 0
  for (const termo of termos) {
    for (const ext of extensoes) {
      const alvo = join(RAIZ, 'src', `__infrator_temporario${ext}`)
      const corpo =
        ext === '.tsx' ? `export const X = () => <p>Feito por ${termo} aqui</p>${String.fromCharCode(10)}`
        : ext === '.html' ? `<p>Feito por ${termo} aqui</p>${String.fromCharCode(10)}`
        // ⚠️ Em `.ts`, texto de tela mora em CAMPO de objeto — foi assim que se mediu: `grep` por
        // prosa em constante solta em todo o `src/` devolveu **zero**. A primeira sonda usava
        // `const aviso = '…'` e acusava 12 escapes que eram, na verdade, uma forma que o produto não
        // usa. Sonda com forma inventada mede o vazio e chama de buraco.
        : `export const R = {${String.fromCharCode(10)}  explicacao: 'Feito por ${termo} aqui',${String.fromCharCode(10)}}${String.fromCharCode(10)}`
      fs.writeFileSync(alvo, corpo, 'utf8')
      let saiu = 0
      try { execFileSync('node', [join(RAIZ, 'scripts', 'medir-denominacao-sem-ia.mjs')], { stdio: 'pipe' }) }
      catch (e) { saiu = e.status ?? 1 }
      finally { fs.unlinkSync(alvo) }
      testadas++
      if (saiu === 0) escaparam.push(`${termo} em ${ext}`)
    }
  }
  return escaparam.length
    ? { defeito: true, detalhe: `${escaparam.length} de ${testadas} combinações PASSARAM: ${escaparam.slice(0, 6).join(' · ')}${escaparam.length > 6 ? '…' : ''}` }
    : { detalhe: `${testadas} combinações (${termos.length} termos × ${extensoes.length} extensões), todas reprovadas` }
})

/*
  A ISENÇÃO DO PORTÃO DE DENOMINAÇÃO, MEDIDA — não declarada e esquecida.

  Ele procura texto de tela em JSX, em props, em campo de objeto e em parâmetro de URL. **Prosa
  numa constante solta (`const aviso = 'Feito por …'`) fica de fora.** Isso é escolha, e é defensável
  enquanto o produto não guardar texto assim — hoje são **zero** ocorrências em `src/`.
  No dia em que a primeira aparecer, a isenção deixa de ser defensável **em silêncio**. Esta checagem
  é o barulho.
*/
conferir(F5, 'a isenção do portão de denominação (prosa em constante solta) continua vazia?', () => {
  const fs = require('node:fs')
  const RE = /^\s*(?:export\s+)?(?:const|let|var)\s+[A-Za-z_][A-Za-z0-9_]*\s*=\s*(["'`])([^"'`]*[a-zà-ÿ]+\s+[a-zà-ÿ]+[^"'`]*)\1/gm
  const encontrados = []
  const varrer = (dir) => {
    for (const nome of fs.readdirSync(dir)) {
      const caminho = join(dir, nome)
      if (fs.statSync(caminho).isDirectory()) { varrer(caminho); continue }
      if (!/\.tsx?$/.test(nome) || /\.test\.tsx?$/.test(nome)) continue
      for (const m of fs.readFileSync(caminho, 'utf8').matchAll(RE)) {
        encontrados.push(`${nome}: "${m[2].slice(0, 40)}"`)
      }
    }
  }
  varrer(join(RAIZ, 'src'))
  return encontrados.length
    ? { defeito: true, detalhe: `${encontrados.length} prosa(s) em constante solta — fora do alcance do portão: ${encontrados.slice(0, 3).join(' · ')}` }
    : { detalhe: 'zero — a isenção continua defensável' }
})

conferir(F5, 'o portão de fontes reprova um host não declarado?', () => {
  const alvo = join(RAIZ, 'src', '__fonte_temporaria.ts')
  // ⚠️ DUAS SUTILEZAS, as duas descobertas em 04/08/2026 ao consertar o portão de fontes:
  //
  // 1. O host NÃO pode ser `*.example.com`: a RFC 2606 reserva esses domínios para documentação, e
  //    o portão passou a tratá-los como fora de escopo — com um deles aqui, o infrator ficava
  //    invisível e esta checagem acusava o portão de aprovar quando ele estava certo.
  // 2. A URL é montada por CONCATENAÇÃO. Escrita inteira, o literal ficaria neste arquivo — que
  //    agora também é varrido — e o portão apontaria um host não declarado para sempre. O
  //    arquivo-alvo recebe a URL completa; a fonte deste script, não.
  const hospedeiro = 'fonte-que-ninguem-declarou.dominio-de-teste.net'
  require('node:fs').writeFileSync(alvo, `export const u = 'https://${hospedeiro}/x'\n`, 'utf8')
  let saiu = 0
  try {
    execFileSync('node', [join(RAIZ, 'scripts', 'inventariar-fontes.mjs'), '--conferir'], { stdio: 'pipe' })
  } catch (e) {
    saiu = e.status ?? 1
  } finally {
    require('node:fs').unlinkSync(alvo)
  }
  return saiu === 0
    ? { defeito: true, detalhe: 'o portão APROVOU um host não declarado' }
    : { detalhe: 'reprovou o host não declarado' }
})

// ═══ Relatório ═════════════════════════════════════════════════════════════
console.log('🔍 AUDITORIA ADVERSARIAL — mandado de achar defeito\n')
// ---------------------------------------------------------------------------
const F6 = 'camada de tela'

conferir(F6, 'quem SAIU do elenco some da lista que a tela usa?', () => {
  D.definirPessoas([
    { id: 'fica', nome: 'Fica', ativo: true, restricoes: {} },
    { id: 'saiu', nome: 'Saiu', ativo: false, restricoes: {} },
  ])
  const achou = D.BROTHERS.find((b) => b.id === 'saiu')
  return achou
    ? { detalhe: `quem saiu continua nomeável ("${achou.name}"), marcado com ativo: ${achou.ativo}` }
    : {
        defeito: true,
        detalhe:
          'quem tem `ativo: false` sumiu de BROTHERS — na tela o passado dele vira id cru, ' +
          'some das estatísticas e a busca por nome não o encontra',
      }
})

conferir(F6, 'a tela consegue distinguir quem saiu de quem está no elenco?', () => {
  D.definirPessoas([{ id: 'x', nome: 'X', ativo: false, restricoes: {} }])
  const b = D.BROTHERS[0]
  return b && b.ativo === false
    ? { detalhe: 'o campo `ativo` atravessa a ponte' }
    : { defeito: true, detalhe: 'sem `ativo` na ponte, quem saiu aparece como se ainda escalasse' }
})

conferir(F6, 'a contagem de estatísticas descarta turno de id desconhecido em silêncio?', () => {
  const bruto = require('node:fs').readFileSync(join(RAIZ, 'src/components/StatsView.tsx'), 'utf8')

  // 🔴 COMENTÁRIO NÃO É CÓDIGO. A primeira versão desta checagem acusou o próprio comentário que
  // documenta o defeito — o texto "Sem `if (counts[bId])`" escrito para explicar por que o guard
  // saiu. É a mesma família do portão de denominação que reprovava "SANTA CEIA" por conter "IA":
  // régua que lê texto sobre código como se fosse código.
  //
  // O `(?<!:)` antes de `//` é deliberado: sem ele, o `//` de uma URL vira início de comentário e
  // engole o resto da linha — foi assim que o portão de inventário de fontes nasceu sempre-verde.
  const fonte = bruto.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(?<!:)\/\/[^\n]*/g, ' ')

  return /if\s*\(\s*counts\[bId\]\s*\)/.test(fonte)
    ? { defeito: true, detalhe: 'o guard `if (counts[bId])` voltou: turno de id fora da lista some do total' }
    : { detalhe: 'a contagem cria o contador sob demanda — nada é descartado calado' }
})

console.log('─'.repeat(74))
for (const frente of ['validação', 'gerador', 'dados publicados', 'código morto', 'portões', 'camada de tela']) {
  const doGrupo = [...ok, ...achados].filter((x) => x.frente === frente)
  if (!doGrupo.length) continue
  console.log(`\n${frente.toUpperCase()}`)
  for (const x of doGrupo) {
    const ehAchado = achados.includes(x)
    console.log(`  ${ehAchado ? '🔴' : '✅'} ${x.pergunta}`)
    console.log(`       ${x.detalhe}`)
  }
}
console.log('\n' + '─'.repeat(74))
console.log(`\n${ok.length} checagem(ns) sem achado · ${achados.length} ACHADO(S)\n`)

if (achados.length) {
  console.log('ACHADOS, em ordem:')
  achados.forEach((a, i) => console.log(`  ${i + 1}. [${a.frente}] ${a.pergunta}\n     ${a.detalhe}`))
} else {
  console.log('⚠️ NENHUM ACHADO — e um relatório de auditoria sem achados é SUSPEITO.')
  console.log('   Ou a instrução foi frouxa, ou o auditor não procurou direito. Aqui há um motivo')
  console.log('   estrutural: quem auditou escreveu o código, e carrega os mesmos pontos cegos.')
  // 🔴 Esta mensagem anunciou uma pendência JÁ FECHADA por um dia inteiro. P2.10 virou
  //    `src/dominio/conferencia-independente.ts` + a aba "Conferir por fora" em 05/08/2026 — e o
  //    script seguiu imprimindo "PENDENTE", que é a forma mais barata de um projeto mentir sobre si.
  console.log('   A segunda régua independente EXISTE desde 05/08/2026 (`conferencia-independente.ts`,')
  console.log('   aba "Conferir por fora"): ela reimplementa as regras por outro caminho, sem importar')
  console.log('   `regras.ts`. Rode-a também — este arquivo aqui não a substitui.')
}

process.exit(achados.length ? 1 : 0)
