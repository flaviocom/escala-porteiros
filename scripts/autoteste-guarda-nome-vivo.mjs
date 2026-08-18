/**
 * AUTOTESTE — `exigirNomeValido` reprova o infrator E aprova o limpo.
 *
 * Nasceu junto da correção do DEP0190 em `rodar-validacoes-ao-vivo.mjs` (troca de
 * `execFileSync(file, args, {shell:true})` por `execSync` de string única). A garantia de que
 * `nome` nunca carrega metacaractere de shell hoje é só o fato de vir de
 * `Object.keys(package.json.scripts)` — este autoteste prova que, se essa garantia um dia
 * quebrar (nome vindo de outro lugar, script malicioso no `package.json`), a trava BARRA antes
 * de a string chegar ao `execSync`, em vez de deixar passar calado.
 *
 * Uso: node scripts/autoteste-guarda-nome-vivo.mjs
 */
import { exigirNomeValido } from './lib/guarda-nome-vivo.mjs'

const LIMPOS = ['vivo', 'vivo:conferir', 'vivo:conferir-passado', 'vivo:auditoria', 'vivo:veredito', 'vivo:no-ar']
const INFRATORES = [
  'vivo:conferir; rm -rf /',
  'vivo:conferir && calc.exe',
  'vivo:conferir`whoami`',
  'vivo:conferir$(whoami)',
  'vivo:conferir & echo pwned',
  'vivo:conferir"',
  "vivo:conferir'",
  'vivo:CONFERIR',
  '',
  'npm run vivo:conferir',
]

let falhas = 0

for (const nome of LIMPOS) {
  try {
    exigirNomeValido(nome)
  } catch (e) {
    falhas++
    console.log(`🔴 aprovação falsa-negativa — nome LIMPO foi barrado: "${nome}" (${e.message})`)
  }
}

for (const nome of INFRATORES) {
  let barrou = false
  try {
    exigirNomeValido(nome)
  } catch {
    barrou = true
  }
  if (!barrou) {
    falhas++
    console.log(`🔴 a trava NÃO mordeu — passou um nome hostil: ${JSON.stringify(nome)}`)
  }
}

if (falhas) {
  console.log(`\n🔴 ${falhas} caso(s) falharam — a trava não prova as duas pontas.`)
  process.exit(1)
}
console.log(`✅ exigirNomeValido: ${LIMPOS.length} limpos aprovados, ${INFRATORES.length} infratores barrados.`)
