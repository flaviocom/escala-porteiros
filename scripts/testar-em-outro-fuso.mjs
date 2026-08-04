/**
 * 🔒 PORTÃO DE FUSO — roda a suíte de novo, num fuso POSITIVO.
 *
 * Por que existe: `America/Sao_Paulo` é UTC−3, e nesse fuso `data.toISOString().slice(0,7)` concorda
 * com o mês local. Ou seja, o defeito de ler o mês em UTC **não aparece daqui**. Um portão que só
 * roda no fuso da casa aprovaria o defeito todos os dias, com cara de verde.
 *
 * Este script roda a mesma suíte com `TZ=Europe/Berlin` (UTC+1/+2), onde a meia-noite do dia 1º cai
 * no mês anterior em UTC. É lá que a régua morde.
 *
 * ⚠️ Ele também PROVA que a troca de fuso surtiu efeito, antes de confiar no resultado. Sem isso, um
 * `TZ` ignorado pelo sistema operacional faria o portão passar sem ter testado nada — que é a forma
 * mais silenciosa de teste inerte.
 */
import { spawnSync } from 'node:child_process'

const FUSO = 'Europe/Berlin'

// 1. A troca de fuso funcionou mesmo?
const prova = spawnSync(
  process.execPath,
  ['-e', 'process.stdout.write(String(new Date(2026,7,1).getTimezoneOffset()))'],
  { env: { ...process.env, TZ: FUSO }, encoding: 'utf8' },
)
const offset = Number(prova.stdout)
if (!Number.isFinite(offset)) {
  console.error(`🔴 não consegui medir o fuso (saída: ${JSON.stringify(prova.stdout)})`)
  process.exit(1)
}
if (offset >= 0) {
  console.error(
    `🔴 TZ=${FUSO} NÃO surtiu efeito: o deslocamento medido foi ${offset} min (esperado negativo).\n` +
      '   Rodar a suíte assim provaria nada — é melhor falhar do que dar um verde vazio.',
  )
  process.exit(1)
}
console.log(`Fuso ${FUSO} ativo (deslocamento ${offset} min). Rodando a suíte…\n`)

// 2. A suíte inteira, no fuso positivo.
const r = spawnSync('npx', ['vitest', 'run'], {
  env: { ...process.env, TZ: FUSO },
  stdio: 'inherit',
  shell: process.platform === 'win32',
})
process.exit(r.status ?? 1)
