/**
 * PORTÃO — o dado publicado cabe onde vai ser servido? (P5.3)
 *
 * 🔴 POR QUE ESTE PORTÃO EXISTE. `blocos.json` **só cresce**: cada escala publicada acrescenta
 * turnos, e nada é arquivado. Ninguém sabia quanto tempo isso aguenta — o `BACKLOG.md` declarava o
 * risco sem um número.
 *
 * Um limite que ninguém mediu não é limite: é uma preocupação. E preocupação não avisa quando o dia
 * chega — o sintoma seria a API do GitHub recusando a publicação, num dia em que alguém precisa
 * publicar.
 *
 * OS TETOS REAIS, que é o que faltava:
 *   · **1 MB** — a Contents API do GitHub (a que a área administrativa usa para publicar) recusa
 *     arquivos maiores. É este que morde primeiro, e é o que este portão vigia.
 *   · 100 MB — o teto do repositório por arquivo. Longe demais para importar.
 *
 * O alarme dispara em **60%** do teto: sobra ano suficiente para arquivar sem pressa, e não tão
 * cedo a ponto de virar ruído. Alarme que grita cedo demais é alarme que alguém desliga.
 *
 * Uso: node scripts/medir-crescimento.mjs [--json]
 */
import { readFileSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')
const TETO_API = 1024 * 1024
const ALARME = 0.60

/*
  🔴 MEDIA SÓ `public/dados/`, E QUEM É SERVIDO É `docs/dados/` — sexta auditoria externa, 05/08/2026.

  As duas pastas são gêmeas por construção (o botão Publicar grava nas duas), mas o portão que
  pergunta *"o dado ainda cabe onde vai ser servido?"* olhava para a que **não** é servida. Medido:
  inflar `docs/dados/blocos.json` para 900 KB saía `EXIT=0`.

  Mitigado pela auditoria adversarial, que compara os dois diretórios e morde — mas depender de outro
  portão para cobrir o buraco deste é como não ter fronteira nenhuma. Agora ele mede as duas, e o
  arquivo maior de cada par é o que vale.
*/
const arquivos = [
  'public/dados/blocos.json', 'public/dados/pessoas.json', 'public/dados/config.json',
  'docs/dados/blocos.json', 'docs/dados/pessoas.json', 'docs/dados/config.json',
]
const linhas = []
let estourou = false

for (const rel of arquivos) {
  const abs = join(RAIZ, rel)
  const bytes = statSync(abs).size
  const proporcao = bytes / TETO_API
  const passou = proporcao >= ALARME
  if (passou) estourou = true
  linhas.push({ rel, bytes, proporcao, passou })
}

// Quanto tempo ainda cabe, no ritmo medido do próprio dado.
const blocos = JSON.parse(readFileSync(join(RAIZ, 'public/dados/blocos.json'), 'utf8')).blocos
const turnos = blocos.flatMap((b) => b.turnos)
const maiorBlocos = Math.max(
  statSync(join(RAIZ, 'public/dados/blocos.json')).size,
  statSync(join(RAIZ, 'docs/dados/blocos.json')).size,
)
const bytesPorTurno = maiorBlocos / Math.max(1, turnos.length)

// Ritmo anual: conta os turnos do ano com mais dados, e não a média de um período parcial.
const porAno = {}
for (const t of turnos) porAno[t.data.slice(0, 4)] = (porAno[t.data.slice(0, 4)] ?? 0) + 1
const turnosPorAno = Math.max(...Object.values(porAno), 1)
const bytesPorAno = bytesPorTurno * turnosPorAno
const anosAteOTeto = Math.floor((TETO_API - maiorBlocos) / bytesPorAno)

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ linhas, turnos: turnos.length, turnosPorAno, bytesPorAno, anosAteOTeto }, null, 2))
} else {
  console.log('CRESCIMENTO DO DADO PUBLICADO\n')
  for (const l of linhas) {
    console.log(`  ${l.passou ? '🔴' : '✅'} ${l.rel.padEnd(28)} ${(l.bytes / 1024).toFixed(1).padStart(7)} KB  (${(l.proporcao * 100).toFixed(1)}% do teto de 1 MB)`)
  }
  console.log(`\n  turnos publicados ......... ${turnos.length}`)
  console.log(`  ritmo medido .............. ${turnosPorAno} turnos/ano ≈ ${(bytesPorAno / 1024).toFixed(0)} KB/ano`)
  console.log(`  anos até o teto da API .... ~${anosAteOTeto}`)
  console.log(`  alarme em ................. ${ALARME * 100}% do teto\n`)
  if (estourou) {
    console.log('  🔴 Passou do alarme. É hora de arquivar: mova os blocos antigos para um arquivo')
    console.log('     separado (ex.: `blocos-2026.json`) e deixe em `blocos.json` só o que ainda é consultado.')
  } else {
    console.log('  ✅ Folga confortável. Nada a fazer agora — e o dia em que houver, este portão avisa.')
  }
}

process.exit(estourou ? 1 : 0)
