/**
 * PORTÃO — todo comando citado na documentação existe de verdade?
 *
 * 🔴 POR QUE ESTE PORTÃO EXISTE. Documentação de reconstrução vale pelo que o leitor consegue
 * EXECUTAR. Um `npm run alguma-coisa` que não existe é pior que uma frase vaga: a pessoa digita,
 * recebe "Missing script", e passa a desconfiar do documento inteiro — inclusive das partes certas.
 *
 * Este projeto já teve, no `docs/historico/INDICE.md`, a promessa de dois portões *"no GATE"* que
 * não existiam em `scripts/` nem em `package.json`. A auditoria externa pegou. Regra afirmada com
 * portão inexistente é o padrão de falha que o método nomeia — e um comando inexistente é a mesma
 * coisa, só que mais barata de conferir.
 *
 * O QUE ELE MEDE: todo `npm run <nome>` citado em qualquer `.md` **vivo** existe no `package.json`,
 * e todo `node scripts/<arquivo>` citado existe em disco.
 *
 * Uso: node scripts/conferir-comandos-da-documentacao.mjs [--json]
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')

/*
  Append-only: registram o que era verdade então. Um handoff de 04/08 pode citar um comando que foi
  renomeado depois, e reescrever o registro seria falsificá-lo.
*/
const HISTORICOS = ['AI_MASTER_LOG.md', 'DIARIO_DE_BORDO.md', 'docs/handoff/', 'docs/historico/']

function documentos(dir = RAIZ, acc = []) {
  for (const item of readdirSync(dir, { withFileTypes: true })) {
    // 🔴 `item.name` é o nome-base, então 'docs/assets' NUNCA casava — exclusão que o autor
    //    acreditava ter e não tinha. Sem efeito hoje (não há `.md` lá), mas a crença era falsa.
    if (['node_modules', '.git', 'capturas', 'assets'].includes(item.name)) continue
    const abs = join(dir, item.name)
    if (item.isDirectory()) { documentos(abs, acc); continue }
    if (!item.name.endsWith('.md')) continue
    const rel = relative(RAIZ, abs).split(sep).join('/')
    if (HISTORICOS.some((h) => rel === h || rel.startsWith(h))) continue
    acc.push(rel)
  }
  return acc
}

const scripts = JSON.parse(readFileSync(join(RAIZ, 'package.json'), 'utf8')).scripts ?? {}
const vivos = documentos().sort()

const achados = []
let citacoes = 0

for (const rel of vivos) {
  const texto = readFileSync(join(RAIZ, rel), 'utf8')
  const linhas = texto.split(/\r?\n/)

  linhas.forEach((linha, i) => {
    // `npm run <nome>` — o nome vai até espaço, crase, aspas ou fim.
    for (const m of linha.matchAll(/npm run ([a-z0-9:_-]+)/gi)) {
      citacoes++
      if (!(m[1] in scripts)) {
        achados.push({ arquivo: rel, linha: i + 1, o: `npm run ${m[1]}`, motivo: 'não existe em package.json' })
      }
    }
    // `node scripts/<arquivo>.mjs`
    for (const m of linha.matchAll(/node (scripts\/[a-z0-9._-]+\.mjs)/gi)) {
      citacoes++
      if (!existsSync(join(RAIZ, m[1]))) {
        achados.push({ arquivo: rel, linha: i + 1, o: `node ${m[1]}`, motivo: 'arquivo não existe' })
      }
    }
  })
}

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ vivos: vivos.length, citacoes, achados }, null, 2))
} else {
  console.log('COMANDOS CITADOS NA DOCUMENTAÇÃO\n')
  console.log(`  documentos vivos varridos ... ${vivos.length}`)
  console.log(`  isentos ..................... ${HISTORICOS.join(', ')} (append-only)`)
  console.log(`  comandos citados ............ ${citacoes}`)
  console.log(`  comandos que NÃO existem .... ${achados.length}\n`)
  for (const a of achados) {
    console.log(`  🔴 ${a.arquivo}:${a.linha} — \`${a.o}\` ${a.motivo}`)
  }
  if (!achados.length) console.log('  ✅ Todo comando citado na documentação existe e pode ser rodado.')
  else console.log('\n   Comando citado e inexistente faz o leitor desconfiar do documento inteiro.')
}

process.exit(achados.length ? 1 : 0)
