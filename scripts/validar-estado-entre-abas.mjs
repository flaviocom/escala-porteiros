/**
 * O QUE A TELA DIZ SOBRE A ESCALA SOBREVIVE À TROCA DE ABA?
 *
 * 🔴 POR QUE ESTE ARQUIVO EXISTE. Em 05/08/2026, uma verificação visual da área administrativa
 * mostrou a frase *"esta escala é a melhor de **0** versões"* embaixo de uma escala que existia e
 * tinha sido escolhida entre oito.
 *
 * A causa: o número vivia dentro de `AbaGerar`, que é montada por condição. **Trocar de aba
 * desmonta o componente**, e ao voltar uma instância nova nascia com `0` — enquanto a escala, que
 * mora no `Admin`, sobrevivia. A tela passava a mentir sobre um dado que continuava lá.
 *
 * ⚠️ **Nenhum teste pegava, e nenhum ia pegar**: o defeito só existe depois de NAVEGAR. Teste de
 * unidade monta o componente uma vez; o usuário troca de aba o tempo todo. É a mesma classe do
 * P4.1 (a publicação em voo que se perdia ao trocar de aba) — **estado que descreve o bloco tem de
 * viver onde o bloco vive**.
 *
 * Este script existe para que a classe inteira não volte: gera, anota o que a tela afirma, passeia
 * pelas outras abas, volta, e exige que continue afirmando o mesmo.
 *
 * Uso: node scripts/validar-estado-entre-abas.mjs
 */
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { subirServidor } from './lib/servidor-de-teste.mjs'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')
const { chromium } = await import(`file:///${RAIZ.replace(/\\/g, '/')}/node_modules/playwright/index.mjs`)
const PORTA = 4187

const servidor = await subirServidor({ raiz: RAIZ, porta: PORTA, modo: 'preview' })
const navegador = await chromium.launch()
const problemas = []

/** O que a aba Gerar afirma sobre a escala, em números — é isso que não pode mudar sozinho. */
async function afirmacoes(p) {
  const t = await p.locator('body').innerText()
  return {
    versoes: t.match(/melhor de\s+(\d+)\s+vers/i)?.[1] ?? null,
    piso: t.match(/[Pp]iso alcançado:\s*(\d+)/)?.[1] ?? null,
    turnos: t.match(/(\d+)\s*\n?\s*TURNOS/i)?.[1] ?? null,
    regras: t.match(/(\d+\/\d+)\s*\n?\s*REGRAS/i)?.[1] ?? null,
  }
}

try {
  const p = await navegador.newPage({ viewport: { width: 1440, height: 1100 } })
  await p.goto(servidor.url + '#/admin', { waitUntil: 'networkidle', timeout: 30000 })
  await p.waitForTimeout(700)
  await p.locator('button', { hasText: /Entrar agora/i }).first().click()
  await p.waitForTimeout(900)

  await p.locator('button', { hasText: /^Gerar escala$/i }).first().click()
  await p.waitForTimeout(500)
  const botoes = p.locator('button', { hasText: /Gerar escala/i })
  await botoes.nth((await botoes.count()) - 1).click()
  await p.waitForTimeout(6000)

  const antes = await afirmacoes(p)
  console.log('DEPOIS DE GERAR')
  for (const [k, v] of Object.entries(antes)) console.log(`  ${k.padEnd(8)} ${v ?? '(não encontrado)'}`)

  // Toda medição precisa EXISTIR logo após gerar. Sem isto, um rótulo que mudou de texto vira
  // "não encontrado" nas duas leituras, e o portão acabaria aprovando a própria cegueira.
  for (const [k, v] of Object.entries(antes)) {
    if (v == null) problemas.push(`"${k}" não foi encontrado logo após gerar — o rótulo mudou na tela?`)
  }
  if (antes.versoes === '0') {
    problemas.push('logo após gerar, a tela já diz "melhor de 0 versões"')
  }

  // Passeia por todas as outras abas e volta.
  for (const aba of ['Ajustar', 'Conferir por fora', 'Publicar', 'Elenco']) {
    const b = p.locator('button', { hasText: new RegExp(aba, 'i') }).first()
    if (await b.count()) { await b.click(); await p.waitForTimeout(700) }
  }
  await p.locator('button', { hasText: /^Gerar escala$/i }).first().click()
  await p.waitForTimeout(1200)

  const depois = await afirmacoes(p)
  console.log('\nDEPOIS DE PASSEAR POR 4 ABAS E VOLTAR')
  for (const [k, v] of Object.entries(depois)) {
    /*
      🔴 AUSENTE NÃO É IGUAL — achado da auditoria externa de 05/08/2026.

      A primeira versão comparava só `v === antes[k]`. Quando o texto da tela muda e o regex deixa
      de casar, os dois lados viram `null`, e `null === null` contava como ✅. Três das quatro
      medições podiam virar inertes **em silêncio**, imprimindo "✅ piso (não encontrado)".

      Provado pelo auditor: renomear "Piso alcançado:" na tela fez este portão sair 0, com o próprio
      rótulo dizendo que não achou. É o padrão que o `RECONSTRUIR.md` batiza de "portão que mede
      menos do que diz" — vivo dentro do portão mais novo do projeto.
    */
    if (v == null) {
      problemas.push(`"${k}" não foi encontrado na tela — a medição virou inerte, não passou`)
      console.log(`  🔴 ${k.padEnd(8)} (não encontrado) — medição inerte`)
      continue
    }
    const igual = v === antes[k]
    console.log(`  ${igual ? '✅' : '🔴'} ${k.padEnd(8)} ${v ?? '(não encontrado)'}${igual ? '' : `  ← era ${antes[k]}`}`)
    if (!igual) problemas.push(`"${k}" mudou sozinho ao trocar de aba: ${antes[k]} → ${v}`)
  }
} finally {
  await navegador.close()
  await servidor.derrubar()
}

console.log(`\n${problemas.length ? '🔴' : '✅'} ${problemas.length ? problemas.join('\n   · ') : 'A tela afirma o mesmo antes e depois de navegar.'}`)
process.exit(problemas.length ? 1 : 0)
