/**
 * AUTOTESTE — o selo (`selar-arvore.mjs`) mede o que diz medir, nas duas pontas: acusa mutação
 * real E não acusa uma transição inofensiva de staged/unstaged.
 *
 * 🔴 POR QUE ESTE ARQUIVO EXISTE. O selo nunca teve autoteste (achado em 19/08/2026, retomada de
 * sessão) — e foi exatamente por faltar um que o segundo defeito dele sobreviveu sem ninguém notar:
 * `git ls-files -s` (índice, LF-normalizado por `core.autocrlf`) e `readFileSync` de arquivo
 * modificado (disco, CRLF no Windows) misturados na mesma impressão digital. O fluxo comum deste
 * projeto — `npm run gate` (termina em `selo:gravar`) ANTES de `git add` — trocava um arquivo de
 * representação entre o `--gravar` e o `--conferir` seguinte, e o selo gritava "árvore mudou" sobre
 * zero bytes de diferença real. Regra do método: *toda trava nova nasce com autoteste, no mesmo
 * commit que a prova*.
 *
 * 🔴 CASO G ACRESCENTADO NO MESMO DIA, pela auditoria cega independente do conserto acima: ela achou
 * que renomear um arquivo staged fazia `l.slice(3).trim()` tratar a linha inteira do `git status`
 * (`"antigo.txt -> novo.txt"`) como nome de arquivo — um caminho fantasma que não existe no disco.
 * Isso é higiene de parsing, NÃO o mesmo defeito dos casos A-F: uma renomeação MUDA o caminho de
 * verdade (`antigo.txt` some, `novo.txt` aparece), então o selo deve continuar acusando — e o caso G
 * prova exatamente isso, com o candidato real no lugar do fantasma. Ver o comentário em
 * `selar-arvore.mjs` sobre por que isto não é "a mesma classe" do defeito de staged/unstaged.
 *
 * Uso: node scripts/autoteste-selar-arvore.mjs
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const AQUI = dirname(fileURLToPath(import.meta.url))
const SELO = join(AQUI, 'selar-arvore.mjs')

function repoTemporario() {
  const raiz = mkdtempSync(join(tmpdir(), 'selo-arvore-'))
  mkdirSync(join(raiz, 'node_modules'), { recursive: true })
  // 🔴 SEM ISTO, O TESTE MENTE PARA SI MESMO: sem `.gitignore`, `node_modules/.selo-do-gate` (escrito
  // pelo `--gravar`) vira arquivo NÃO RASTREADO — e a PRÓPRIA gravação do selo passaria a mudar a
  // impressão digital seguinte, sempre, mesmo sem nenhuma mutação real. No projeto de verdade
  // `node_modules/` já é ignorado; aqui o `.gitignore` só reproduz essa condição real.
  writeFileSync(join(raiz, '.gitignore'), 'node_modules/\n')
  execFileSync('git', ['init', '-q'], { cwd: raiz })
  execFileSync('git', ['-c', 'user.email=teste@teste.local', '-c', 'user.name=teste', 'config', 'commit.gpgsign', 'false'], { cwd: raiz })
  return raiz
}

function commitar(raiz, arquivos) {
  for (const [nome, conteudo] of Object.entries(arquivos)) {
    mkdirSync(dirname(join(raiz, nome)), { recursive: true })
    writeFileSync(join(raiz, nome), conteudo)
  }
  execFileSync('git', ['add', '-A'], { cwd: raiz })
  execFileSync('git', ['-c', 'user.email=teste@teste.local', '-c', 'user.name=teste', 'commit', '-q', '-m', 'commit de teste'], { cwd: raiz })
}

function gravar(raiz) {
  execFileSync(process.execPath, [SELO, '--gravar', '--raiz', raiz], { encoding: 'utf8' })
}

/** `true` = árvore íntegra (exit 0) · `false` = selo acusou mudança (exit 1). */
function conferir(raiz) {
  try {
    execFileSync(process.execPath, [SELO, '--conferir', '--raiz', raiz], { encoding: 'utf8' })
    return true
  } catch (e) {
    if (e.status === 1) return false
    throw e // saída inesperada (2, crash) — não é "mudou", é o script quebrado
  }
}

console.log('AUTOTESTE — selo da árvore (selar-arvore.mjs)\n')
let falhas = 0
// 🔴 CONTADO, NUNCA ESCRITO À MÃO — achado em 19/08/2026 no autoteste irmão
// (autoteste_lembrete_individual.py): um `total` fixo no fim do arquivo desatualiza toda vez que um
// caso novo entra, e passa em silêncio contando de menos. "Número escrito à mão apodrece" vale para
// o próprio autoteste.
let total = 0
const caso = (nome, ok, detalhe) => {
  total++
  if (!ok) falhas++
  console.log(`  ${ok ? '✅' : '🔴'} ${nome}`)
  if (!ok && detalhe) console.log(`       ${detalhe}`)
}

// ---- A: árvore limpa logo após gravar → OK -----------------------------------------------------
{
  const raiz = repoTemporario()
  try {
    commitar(raiz, { 'a.txt': 'conteudo A\r\n' })
    gravar(raiz)
    const ok = conferir(raiz)
    caso('árvore limpa, gravar seguido de conferir → OK', ok)
  } finally {
    rmSync(raiz, { recursive: true, force: true })
  }
}

// ---- B: mutação REAL depois de gravar → tem de acusar (a razão de o selo existir) --------------
{
  const raiz = repoTemporario()
  try {
    commitar(raiz, { 'a.txt': 'conteudo original\r\n' })
    gravar(raiz)
    writeFileSync(join(raiz, 'a.txt'), 'conteudo MUTANTE\r\n') // unstaged, de propósito
    const ok = conferir(raiz)
    caso('mutação real (arquivo editado, sem stage) → ACUSA', !ok, ok ? 'o selo aprovou uma árvore que mudou de verdade' : undefined)
  } finally {
    rmSync(raiz, { recursive: true, force: true })
  }
}

// ---- C: o defeito de 19/08/2026 — transição staged/unstaged SEM mudar conteúdo → não pode acusar
{
  const raiz = repoTemporario()
  try {
    commitar(raiz, { 'b.txt': 'linha 1\r\nlinha 2\r\n' })
    // edita SEM dar `git add` — é o estado em que `npm run gate` roda antes do `git add` real
    writeFileSync(join(raiz, 'b.txt'), 'linha 1\r\nlinha 2\r\nlinha 3\r\n')
    gravar(raiz) // selo:gravar, fim do gate — arquivo ainda "modified", não staged
    execFileSync('git', ['add', '-A'], { cwd: raiz }) // agora sim, git add — MESMO conteúdo, só mudou o status
    const ok = conferir(raiz)
    caso(
      '🔴 mesmo conteúdo, só staged depois de gravar (defeito de 19/08) → NÃO acusa',
      ok,
      ok ? undefined : 'falso positivo reproduzido: o selo confundiu "mudou de status" com "mudou de conteúdo"',
    )
  } finally {
    rmSync(raiz, { recursive: true, force: true })
  }
}

// ---- D: arquivo novo, não rastreado, aparece depois de gravar → tem de acusar ------------------
{
  const raiz = repoTemporario()
  try {
    commitar(raiz, { 'c.txt': 'c\r\n' })
    gravar(raiz)
    writeFileSync(join(raiz, 'novo-nao-rastreado.txt'), 'surpresa\r\n')
    const ok = conferir(raiz)
    caso('arquivo novo não rastreado depois de gravar → ACUSA', !ok, ok ? 'arquivo novo passou despercebido' : undefined)
  } finally {
    rmSync(raiz, { recursive: true, force: true })
  }
}

// ---- E: arquivo rastreado apagado do disco (sem `git rm`) depois de gravar → tem de acusar ------
{
  const raiz = repoTemporario()
  try {
    commitar(raiz, { 'd.txt': 'd\r\n' })
    gravar(raiz)
    rmSync(join(raiz, 'd.txt'))
    const ok = conferir(raiz)
    caso('arquivo rastreado apagado do disco depois de gravar → ACUSA', !ok, ok ? 'sumiço de arquivo passou despercebido' : undefined)
  } finally {
    rmSync(raiz, { recursive: true, force: true })
  }
}

// ---- F: nunca gravou selo → recusa com a mensagem certa, não um falso "OK" ----------------------
{
  const raiz = repoTemporario()
  try {
    commitar(raiz, { 'e.txt': 'e\r\n' })
    let saida
    let codigo = 0
    try {
      saida = execFileSync(process.execPath, [SELO, '--conferir', '--raiz', raiz], { encoding: 'utf8' })
    } catch (e) {
      codigo = e.status
      saida = e.stderr
    }
    const ok = codigo === 1 && /não há selo/i.test(saida)
    caso('nunca gravou selo → recusa (não finge que está tudo bem)', ok, `saída: ${codigo}, mensagem: ${String(saida).slice(0, 80)}`)
  } finally {
    rmSync(raiz, { recursive: true, force: true })
  }
}

// ---- G: renomear um arquivo staged → TEM de acusar (o caminho mudou de verdade), mas com o
//         candidato real (novo.txt), não com o texto fantasma "antigo -> novo" que o parser antigo
//         produzia (achado pela auditoria cega, 19/08/2026) --------------------------------------
{
  const raiz = repoTemporario()
  try {
    commitar(raiz, { 'antigo.txt': 'conteúdo estável, nunca muda\r\n' })
    gravar(raiz)
    renameSync(join(raiz, 'antigo.txt'), join(raiz, 'novo.txt')) // mv, sem `git add` ainda
    execFileSync('git', ['add', '-A'], { cwd: raiz }) // git detecta a renomeação: "R  antigo.txt -> novo.txt"
    const ok = conferir(raiz)
    caso(
      'arquivo renomeado e staged → ACUSA (o caminho mudou; não é o defeito de staged/unstaged)',
      !ok,
      ok ? 'renomeação passou despercebida — o selo deveria pedir novo gate' : undefined,
    )
  } finally {
    rmSync(raiz, { recursive: true, force: true })
  }
}

console.log(`\n  ${falhas ? '🔴' : '✅'} ${total - falhas} de ${total} casos corretos`)
if (falhas) console.log('  O selo NÃO está medindo o que diz medir.')
process.exit(falhas ? 1 : 0)
