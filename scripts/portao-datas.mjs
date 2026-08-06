/**
 * PORTÃO — `toISOString()` não decide dia nem mês. Nunca.
 *
 * 🔴 POR QUE ESTE PORTÃO EXISTE, e por que ele demorou tanto.
 *
 * *"`toISOString()` é proibido"* é a regra mais repetida deste projeto: está no cabeçalho de
 * `datas.ts`, na lista de decisões inegociáveis do `RECONSTRUIR.md`, no `AGENTS.md` e em três
 * comentários de teste. **E não havia nada que a cobrasse.**
 *
 * Quando alguém finalmente foi olhar (05/08/2026), havia **quatro** usos no repositório — e o
 * `BACKLOG.md` declarava **um**. O declarado (`carga-inicial.mjs`) era o perigoso de verdade:
 * `new Date().toISOString().slice(0, 10)` lê o dia em **UTC**, e às 21h de São Paulo já é amanhã.
 *
 * Regra sem portão é disciplina, e disciplina falha — inclusive a disciplina de quem escreveu a regra.
 *
 * ── O QUE É PROIBIDO, E O QUE NÃO É ──────────────────────────────────────────────────────────────
 *
 * 🔴 **PROIBIDO: fatiar o resultado.** `toISOString().slice(0, 10)` e `.slice(0, 7)` extraem dia e
 *    mês **em UTC**. É a forma que quebrou o site anterior.
 *
 * ✅ **PERMITIDO: usar a cadeia INTEIRA como chave opaca**, desde que ela volte por `parseISO` e
 *    seja formatada em hora local. Aí não há extração de campo: o instante sai e volta igual.
 *    Medido em 05/08/2026 nos três fusos (São Paulo −3, Berlim +2, Tóquio +9): o rótulo do mês sai
 *    correto nos três. Cada um destes usos tem de estar declarado em `PERMITIDOS` abaixo, com o
 *    motivo — permissão sem motivo escrito é permissão que ninguém revisita.
 *
 * Uso: node scripts/portao-datas.mjs [--json]
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const argRaiz = process.argv.indexOf('--raiz')
const RAIZ = argRaiz >= 0 ? process.argv[argRaiz + 1] : path.join(path.dirname(fileURLToPath(import.meta.url)), '..')

/**
 * Os usos de cadeia opaca que estão liberados, cada um com o porquê.
 *
 * ⚠️ Acrescentar linha aqui é uma decisão, não um conserto. Se o uso novo EXTRAI campo, ele não
 * entra nesta lista — ele é o defeito que este portão existe para pegar.
 */
const PERMITIDOS = new Map([
  ['src/App.tsx', 'valor de <option> do seletor de meses: sai por toISOString e volta por parseISO, sem fatiar'],
  ['src/components/ScheduleTable.tsx', 'chave do agrupamento por mês: opaca, e o rótulo vem de parseISO + format local'],
  ['src/export/EscalaImagem.tsx', 'apenas `key` de lista no React — nunca lido como data'],
  ['src/admin/rascunho.ts', 'carimbo de INSTANTE do rascunho local ("guardado às 18h04"), não data de calendário: nunca fatiado, nunca comparado com dia de escala — só formatado para a tela'],
])

/** A forma perigosa: extrair campo do resultado. */
const RE_FATIA = /toISOString\(\)\s*\.\s*(slice|substring|substr|split)/
/** Qualquer uso, para saber quem precisa de permissão declarada. */
const RE_QUALQUER = /toISOString\s*\(/

/**
 * 🔴 `getUTC*` — a MESMA classe de defeito, com outro nome.
 *
 * A regra do projeto foi escrita como *"`toISOString()` é proibido"*, mas o dano real é
 * **"campo de data não se lê em UTC"**. `d.getUTCMonth()` erra exatamente igual, e passava direto.
 * Nomear a regra pelo sintoma mais famoso deixou o resto da classe descoberto — achado da auditoria
 * externa de 05/08/2026.
 */
const RE_GET_UTC = /\.\s*getUTC(FullYear|Month|Date|Day|Hours)\s*\(/

/**
 * 🔴 `Date.UTC(...)` — A FORMA QUE O DEFEITO REAL TINHA, e a régua não a procurava.
 *
 * Sexta auditoria externa, 05/08/2026. O defeito de 05/08 que devolvia o **penúltimo** dia de todo
 * mês era `deData(new Date(Date.UTC(ano, m, 0)))`: constrói o instante em UTC e lê com getters
 * locais. Este portão procurava `toISOString().slice` e `.getUTC*` — e `Date.UTC(` não estava na
 * lista.
 *
 * Medido: `new Date(Date.UTC(2026, 12, 0)).getDate()` injetado em código sai `achados 0`, EXIT=0.
 * Quem matava esse mutante era **um teste de uma função específica** (`ultimo-dia-do-mes.test.ts`),
 * e ele é cego em fuso positivo — a CLASSE continuava aberta para a próxima função que alguém
 * escrevesse.
 */
const RE_DATE_UTC = new RegExp(String.raw`(?<![-\w])Date\s*\.\s*UTC\s*\(`)

/**
 * 🔒 SINAL DE VIDA DAS PRÓPRIAS RÉGUAS — nasceu por necessidade, não por zelo.
 *
 * A régua de `Date.UTC` foi escrita, na primeira tentativa, por um script cujo escape virou um byte
 * de **backspace (0x08)** dentro da expressão. O portão continuou imprimindo "achados 0" com o
 * infrator injetado na frente dele — QUARTA vez que este projeto vê exatamente essa falha.
 *
 * Caractere de controle no meio de uma expressão regular é sempre defeito, nunca intenção. Isto roda
 * antes de qualquer varredura e mata o processo: régua corrompida que devolve verde é pior que régua
 * ausente, porque ocupa o lugar dela.
 */
/**
 * `Date.UTC` NÃO é sempre errado — e o portão precisa saber a diferença.
 *
 * ✅ **ARITMÉTICA entre dois instantes** é o uso CERTO: `Date.UTC(a2,…) - Date.UTC(a1,…)` conta dias
 *    de calendário sem que horário de verão some ou tire uma hora no meio. Nenhum campo é lido de
 *    volta, então não há o que sair em fuso errado.
 *
 * 🔴 **CONSTRUIR e depois LER com getter local** é o defeito: `new Date(Date.UTC(ano, m, 0)).getDate()`
 *    foi exatamente o que fez `ultimoDiaDoMes` devolver o penúltimo dia de todo mês.
 *
 * Cada permissão vem com o motivo escrito — permissão sem motivo é permissão que ninguém revisita.
 */
const UTC_PERMITIDO = new Map([
  ['src/dominio/datas.ts', 'diferença entre duas datas: subtrai dois instantes, e nenhum campo é lido de volta'],
  ['scripts/carga-inicial.mjs', 'a mesma aritmética de diferença, na ferramenta de carga'],
])

for (const [nome, re] of Object.entries({ RE_FATIA, RE_QUALQUER, RE_GET_UTC, RE_DATE_UTC })) {
  if ([...re.source].some((c) => c.charCodeAt(0) < 32)) {
    console.error(`🔴 A régua ${nome} tem caractere de controle na expressão — ela está INERTE.`)
    console.error(`   fonte: ${JSON.stringify(re.source)}`)
    process.exit(2)
  }
}

function semComentarios(texto) {
  return texto
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:])\/\/[^\n]*/g, (m, p) => p + ' '.repeat(m.length - p.length))
}

function arquivos(dir, acc = []) {
  for (const nome of readdirSync(dir)) {
    if (['node_modules', '.git', 'capturas', 'dist'].includes(nome)) continue
    const p = path.join(dir, nome)
    if (statSync(p).isDirectory()) { arquivos(p, acc); continue }
    // 🔴 Os testes de `datas.ts` CITAM o antipadrão para provar que ele erra — é o trabalho deles.
    if (/datas\.test\.ts$/.test(nome)) continue
    if (/\.(ts|tsx|mjs|js)$/.test(nome)) acc.push(p.split(path.sep).join('/'))
  }
  return acc
}

// A árvore de teste do autoteste pode não ter `scripts/` — pasta ausente não é defeito.
const seExistir = (dir) => (existsSync(dir) ? arquivos(dir) : [])
const alvos = [
  ...seExistir(path.join(RAIZ, 'src')),
  ...seExistir(path.join(RAIZ, 'scripts')).filter((a) => !a.endsWith('portao-datas.mjs')),
]

const achados = []
let usos = 0

for (const abs of alvos) {
  const rel = path.relative(RAIZ, abs).split(path.sep).join('/')
  const linhas = semComentarios(readFileSync(abs, 'utf8')).split(/\r?\n/)
  /*
    🔴 A FATIA EM DUAS LINHAS — achado da auditoria externa de 05/08/2026.

    `RE_FATIA` exigia tudo na mesma linha, e a permissão é por ARQUIVO. Nos três arquivos
    permitidos, isto passava com "0 achados":

        const iso = new Date().toISOString()
        const mes = iso.slice(0, 7)      // ← UTC

    Permissão por arquivo com padrão por linha é uma imunidade que ninguém pediu. Agora as variáveis
    que receberam um `toISOString()` ficam marcadas, e fatiar qualquer uma delas acusa.
  */
  const contaminadas = new Set()

  linhas.forEach((linha, i) => {
    const guardou = linha.match(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=[^=]*toISOString\s*\(/)
    if (guardou) contaminadas.add(guardou[1])
    for (const v of contaminadas) {
      const fatiaDepois = new RegExp('(?<![\\w$])' + v + '\\s*\\.\\s*(slice|substring|substr|split)\\s*\\(')
      if (fatiaDepois.test(linha)) {
        achados.push({
          arquivo: rel, linha: i + 1, gravidade: 'FATIA (em duas linhas)',
          detalhe: `\`${v}\` guardou um toISOString() e está sendo fatiada — é UTC, e às 21h em São Paulo já é amanhã`,
          texto: linha.trim().slice(0, 100),
        })
      }
    }

    /*
      🔴 `getUTC*` — a MESMA classe, com outro nome, e o portão não a procurava.

      A regra do projeto está escrita como *"`toISOString()` é proibido"*, mas o dano real é
      **"campo de data não se lê em UTC"**. `d.getUTCMonth()` erra exatamente igual, e passava
      direto. Nomear a regra pelo sintoma mais famoso deixa o resto da classe descoberto.
    */
    if (RE_DATE_UTC.test(linha) && !UTC_PERMITIDO.has(rel)) {
      achados.push({
        arquivo: rel, linha: i + 1, gravidade: 'Date.UTC',
        detalhe: 'constrói o instante em UTC — lido depois com getter local, devolve o dia errado (foi assim que `ultimoDiaDoMes` deu o penúltimo dia de todo mês)',
        texto: linha.trim().slice(0, 100),
      })
      return
    }

    if (RE_GET_UTC.test(linha)) {
      achados.push({
        arquivo: rel, linha: i + 1, gravidade: 'getUTC',
        detalhe: 'lê campo de data em UTC — mesmo defeito do toISOString fatiado, com outro nome',
        texto: linha.trim().slice(0, 100),
      })
      return
    }

    if (!RE_QUALQUER.test(linha)) return
    usos++
    if (RE_FATIA.test(linha)) {
      achados.push({
        arquivo: rel, linha: i + 1, gravidade: 'FATIA',
        detalhe: 'extrai dia ou mês do resultado — isso é UTC, e às 21h em São Paulo já é amanhã',
        texto: linha.trim().slice(0, 100),
      })
    } else if (!PERMITIDOS.has(rel)) {
      achados.push({
        arquivo: rel, linha: i + 1, gravidade: 'NÃO DECLARADO',
        detalhe: 'uso de cadeia opaca sem permissão declarada — se ele volta por parseISO, declare em PERMITIDOS com o motivo',
        texto: linha.trim().slice(0, 100),
      })
    }
  })
}

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ arquivos: alvos.length, usos, achados }, null, 2))
} else {
  console.log('PORTÃO — `toISOString()` não decide dia nem mês\n')
  console.log(`  arquivos varridos ......... ${alvos.length} (src/ e scripts/)`)
  console.log(`  isentos ................... datas.test.ts (cita o antipadrão para provar que erra)`)
  console.log(`  usos encontrados .......... ${usos}`)
  console.log(`  permitidos declarados ..... ${PERMITIDOS.size}`)
  console.log(`  achados ................... ${achados.length}\n`)
  for (const a of achados) {
    console.log(`  🔴 ${a.arquivo}:${a.linha} — ${a.gravidade}`)
    console.log(`     ${a.detalhe}`)
    console.log(`     ${a.texto}`)
  }
  if (!achados.length) {
    console.log('  ✅ Nenhuma data ou mês é extraído de `toISOString()`, e nenhum `Date.UTC` é lido com getter local.')
    for (const [arq, motivo] of UTC_PERMITIDO) console.log(`     · ${arq} — Date.UTC: ${motivo}`)
    for (const [arq, motivo] of PERMITIDOS) console.log(`     · ${arq} — ${motivo}`)
  }
}

process.exit(achados.length ? 1 : 0)
