/**
 * 🌐 PORTÃO — TODAS as validações de navegador rodam, e nenhuma fica esquecida.
 *
 * 🔴 POR QUE ESTE PORTÃO EXISTE. Em 06/08/2026 medi quais dos `vivo:*` o gate realmente executava.
 * De dezesseis, **um**. Os outros quinze abriam navegador, mediam a tela de verdade, provavam coisas
 * que nenhum teste unitário alcança — e **só rodavam quando alguém lembrava de rodar**.
 *
 * O projeto já tem a frase para isso: **portão sem gatilho é regra sem portão, um nível acima.** Um
 * validador que não roda é pior que não existir, porque fica no `package.json` parecendo cobertura.
 *
 * A prova de que isto não era teórico: o `vivo:gerar` estava **vermelho** e ninguém sabia. Ele
 * quebrou quando um campo novo entrou no meio da tela, e passou dias assim.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔴 SÃO DUAS FAMÍLIAS, E MISTURÁ-LAS NUM PASSO SÓ FOI O PRIMEIRO ERRO DESTE SCRIPT
 *
 * **LOCAL** — sobe um servidor com o build da árvore atual e mede a tela ali. Pode rodar no gate:
 * é justamente a árvore que se quer aprovar.
 *
 * **NO AR** — abre `flaviocom.github.io` e compara com o que está commitado. **Não pode rodar no
 * gate**: o gate roda ANTES de commitar, então o pacote local está, por construção, à frente do
 * publicado. Posto no gate, este grupo ficaria *estruturalmente vermelho* — e portão que sempre
 * reprova é portão que se aprende a ignorar.
 *
 * Por isso: `--local` (o que o gate roda) e `--no-ar` (o que se roda DEPOIS do push). Sem bandeira,
 * roda os dois — é o gesto de quem está conferindo tudo à mão. Os dois grupos são **impressos**,
 * com quem entrou em cada um, para ninguém ler o verde de um como cobertura do outro.
 *
 * ⚠️ **O que ele NUNCA roda, declarado:** `vivo:divulgado` exige `--antigo <url>`, o endereço do
 * site que a congregação já tem. Comparar com o site antigo é gesto de migração, feito uma vez, com
 * a URL na mão. Fica **nomeado na saída**.
 *
 * Uso: node scripts/rodar-validacoes-ao-vivo.mjs [--local | --no-ar]
 */
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')
const bandeira = process.argv.find((a) => a === '--local' || a === '--no-ar')

/** Medem o SITE PUBLICADO. Rodam depois do push, nunca no gate. */
const NO_AR = new Set(['vivo', 'vivo:conferir', 'vivo:conferir-passado'])
/** Exigem argumento que só uma pessoa tem. */
const PRECISA_DE_ARGUMENTO = { 'vivo:divulgado': 'exige `--antigo <url>` — o site que a congregação já tem o link' }
// A lista é LIDA do `package.json`, não escrita aqui. Validação nova entra sozinha — e uma lista à
// mão envelheceria calada, que é exatamente o defeito que este portão fecha.
const scripts = JSON.parse(readFileSync(join(RAIZ, 'package.json'), 'utf8')).scripts

/**
 * 🔴 O DISPARADOR NÃO DISPARA A SI MESMO — nem aos irmãos dele.
 *
 * A primeira versão excluía o nome `vivo:tudo` à mão. Aí nasceu o `vivo:no-ar`, que chama ESTE mesmo
 * script com outra bandeira, e ele entrou na lista como se fosse uma validação: rodou 148 segundos
 * dentro do grupo errado e arrastou o resultado junto.
 *
 * Excluir por NOME é lista à mão com outra roupa. O que identifica um disparador não é como ele se
 * chama: é o fato de chamar **este arquivo**.
 */
const EU_MESMO = 'rodar-validacoes-ao-vivo.mjs'
const todas = Object.keys(scripts).filter(
  (n) => (n === 'vivo' || n.startsWith('vivo:')) && !scripts[n].includes(EU_MESMO),
)
const pulados = todas.filter((n) => n in PRECISA_DE_ARGUMENTO)
const candidatas = todas.filter((n) => !(n in PRECISA_DE_ARGUMENTO))
const local = candidatas.filter((n) => !NO_AR.has(n))
const noAr = candidatas.filter((n) => NO_AR.has(n))
const rodar = bandeira === '--local' ? local : bandeira === '--no-ar' ? noAr : candidatas

console.log('🌐 VALIDAÇÕES DE NAVEGADOR\n')
console.log(`  encontradas no package.json  ${todas.length}`)
console.log(`  grupo LOCAL (cabe no gate) . ${local.length} — ${local.join(', ')}`)
console.log(`  grupo NO AR (depois do push) ${noAr.length} — ${noAr.join(', ')}`)
for (const p of pulados) console.log(`  nunca roda ................. ${p} — ${PRECISA_DE_ARGUMENTO[p]}`)
console.log(`  vão rodar agora ............ ${rodar.length}${bandeira ? ` (${bandeira})` : ' (os dois grupos)'}`)
console.log('')

const falharam = []
const t0Total = process.hrtime.bigint()
for (const nome of rodar) {
  const t0 = process.hrtime.bigint()
  let ok = true
  let saida = ''
  try {
    saida = execFileSync('npm', ['run', nome], { cwd: RAIZ, encoding: 'utf8', shell: true, stdio: 'pipe' })
  } catch (e) {
    ok = false
    saida = (e.stdout ?? '') + (e.stderr ?? '')
    falharam.push({ nome, saida })
  }
  console.log(`  ${ok ? '✅' : '🔴'} ${nome.padEnd(24)} ${(Number(process.hrtime.bigint() - t0) / 1e9).toFixed(1)}s`)
}

console.log('')
console.log(`  tempo total ................ ${(Number(process.hrtime.bigint() - t0Total) / 1e9).toFixed(0)}s`)
if (rodar.length === 0) {
  console.log('🔴 nenhuma validação foi encontrada — o padrão de nome mudou, e isso é defeito de população.')
  process.exit(1)
}
if (falharam.length) {
  console.log(`\n🔴 ${falharam.length} validação(ões) reprovaram:\n`)
  for (const f of falharam) {
    console.log(`  ── ${f.nome} ──`)
    for (const l of f.saida.split(/\r?\n/).filter((l) => l.trim()).slice(-8)) console.log(`     ${l}`)
    console.log('')
  }
  process.exit(1)
}
const resto = bandeira === '--local' ? ` (faltam as ${noAr.length} do grupo NO AR, depois do push)` : ''
console.log(`\n✅ as ${rodar.length} validações passaram${resto}.`)
