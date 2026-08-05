/**
 * Prova que a conferência por turno MORDE onde a por dia era cega.
 *
 * Injeta uma troca de gente entre MANHÃ e NOITE de um domingo no DADO esperado (o site fica
 * intacto) e mede as duas versões do script:
 *   · versão por dia   → deve APROVAR (os nomes estão todos lá, só no lugar errado) = a cegueira
 *   · versão por turno → deve REPROVAR
 *
 * Um caso que reprova nas duas não prova melhora nenhuma.
 */
import { readFileSync, writeFileSync, copyFileSync, rmSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'

const RAIZ = 'C:/Users/oflav/AppData/Local/Temp/build-escala-porteiros'
const DADOS = join(RAIZ, 'docs/dados/blocos.json')
const BACKUP = join(RAIZ, 'docs/dados/.blocos.json.prova')
const SCRIPT = join(RAIZ, 'scripts/conferir-site-contra-dados.mjs')

const rodar = () => {
  try {
    execFileSync(process.execPath, [SCRIPT], { cwd: RAIZ, encoding: 'utf8', stdio: 'pipe' })
    return { codigo: 0 }
  } catch (e) {
    return { codigo: e.status ?? -1, saida: (e.stdout ?? '') + (e.stderr ?? '') }
  }
}

copyFileSync(DADOS, BACKUP)
try {
  const arq = JSON.parse(readFileSync(DADOS, 'utf8'))
  const bloco = arq.blocos.find((b) => b.origem === 'algoritmo')

  // Acha um domingo com MANHA e NOITE e TROCA a gente entre os dois turnos.
  const porData = new Map()
  for (const t of bloco.turnos) {
    if (t.santaCeia) continue
    if (!porData.has(t.data)) porData.set(t.data, [])
    porData.get(t.data).push(t)
  }
  const alvo = [...porData.entries()].find(([, ts]) => ts.length === 2 && ts.some((t) => t.tipo === 'MANHA'))
  if (!alvo) throw new Error('não achei um dia com dois turnos')
  const [data, ts] = alvo
  const [a, b] = ts
  console.log(`INFRATOR INJETADO — ${data}: gente da ${a.tipo} trocada com a da ${b.tipo}`)
  console.log(`  ${a.tipo}: ${a.pessoas.join(', ')}`)
  console.log(`  ${b.tipo}: ${b.pessoas.join(', ')}\n`)
  const guarda = a.pessoas
  a.pessoas = b.pessoas
  b.pessoas = guarda
  writeFileSync(DADOS, JSON.stringify(arq, null, 2), 'utf8')

  const novo = rodar()
  console.log(`  versão POR TURNO ..... exit ${novo.codigo} ${novo.codigo === 1 ? '✅ reprovou (certo)' : '🔴 APROVOU a troca'}`)
  if (novo.codigo === 1) {
    const linha = (novo.saida ?? '').split('\n').find((l) => l.includes('nome ausente OU no turno errado'))
    if (linha) console.log(`       ${linha.trim()}`)
  }

  // A versão anterior, tirada do git, medindo o MESMO infrator.
  const antigo = execFileSync('git', ['show', 'HEAD:scripts/conferir-site-contra-dados.mjs'], { cwd: RAIZ, encoding: 'utf8' })
  const tmp = join(RAIZ, 'scripts/.conferir-antigo.mjs')
  writeFileSync(tmp, antigo, 'utf8')
  let velho
  try {
    execFileSync(process.execPath, [tmp], { cwd: RAIZ, encoding: 'utf8', stdio: 'pipe' })
    velho = 0
  } catch (e) { velho = e.status ?? -1 }
  rmSync(tmp, { force: true })
  console.log(`  versão POR DIA ....... exit ${velho} ${velho === 0 ? '🔴 aprovou — era esta a cegueira' : '(também reprovou)'}`)

  console.log()
  if (novo.codigo === 1 && velho === 0) {
    console.log('✅ A régua nova pega o que a antiga deixava passar. Melhora provada, não afirmada.')
    process.exitCode = 0
  } else {
    console.error('🔴 A prova não se sustenta: o caso precisa reprovar SÓ na versão nova.')
    process.exitCode = 1
  }
} finally {
  if (existsSync(BACKUP)) {
    copyFileSync(BACKUP, DADOS)
    rmSync(BACKUP, { force: true })
    console.log('(dados publicados restaurados)')
  }
}
