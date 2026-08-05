/**
 * 🔴 O SELETOR DE MESES — o que ele existe para impedir.
 *
 * A imagem sai **uma por mês** (uma de cinco meses bateria no teto de canvas do navegador). Sem
 * escolha, clicar em "Enviar Escala p/ WhatsApp" com a escala inteira em vista disparava **dez
 * downloads de uma vez**. Ninguém queria nove daqueles arquivos.
 *
 * As duas pontas do par, e as duas precisam valer:
 *   · **vários meses em vista** → pergunta ANTES, e gera só o que foi marcado
 *   · **um mês em vista**       → não pergunta nada; o caso comum não paga o preço da escolha
 *
 * Provar só a primeira deixaria passar uma caixa que aparece sempre — que seria um estorvo novo no
 * lugar do antigo.
 *
 * Uso: node scripts/validar-seletor-de-meses.mjs
 */
import { chromium, devices } from 'playwright'
import { spawn } from 'node:child_process'

const PORTA = 4185
const servidor = spawn('npx', ['vite', 'preview', '--port', String(PORTA), '--strictPort'], {
  cwd: process.cwd(), shell: true, stdio: 'ignore',
})

const checagens = []
const conferir = (nome, ok, detalhe) => checagens.push({ nome, ok, detalhe })

try {
  const navegador = await chromium.launch()

  /** Abre o site, aplica um filtro e devolve a página pronta. */
  async function abrir(filtro) {
    const pagina = await navegador.newPage({ viewport: { width: 1400, height: 1000 } })
    pagina.on('pageerror', (e) => conferir('erro de JavaScript', false, e.message))
    let subiu = false
    for (let i = 0; i < 40 && !subiu; i++) {
      try {
        await pagina.goto(`http://127.0.0.1:${PORTA}/`, { waitUntil: 'networkidle', timeout: 3000 })
        subiu = true
      } catch { await pagina.waitForTimeout(500) }
    }
    if (!subiu) throw new Error(`o servidor não subiu na porta ${PORTA}`)
    await pagina.waitForTimeout(1600)
    if (filtro) {
      await pagina.locator('input[type="text"]').first().fill(filtro)
      await pagina.waitForTimeout(900)
    }
    return pagina
  }

  const botaoEnviar = (pg) => pg.getByRole('button', { name: /Enviar Escala/i }).first()

  // ------------------------------------------------------------------ 1. vários meses → pergunta
  {
    const pg = await abrir(null) // tudo em vista
    const baixados = []
    pg.on('download', (d) => baixados.push(d))
    await botaoEnviar(pg).click()
    await pg.waitForTimeout(1200)

    const caixa = pg.locator('dialog[open]')
    const apareceu = await caixa.count()
    conferir('vários meses em vista → PERGUNTA antes de gerar', apareceu > 0,
      apareceu ? 'a caixa abriu' : '🔴 gerou direto — é o defeito original')
    conferir('   …e não baixou nada enquanto pergunta', baixados.length === 0,
      baixados.length ? `🔴 ${baixados.length} arquivo(s) já baixados` : 'nenhum download antes da escolha')

    if (apareceu) {
      const linhas = await caixa.locator('label').count()
      conferir('   …listando os meses com a contagem de turnos', linhas >= 5, `${linhas} mês(es) na lista`)

      // 🔴 Pelo TEXTO, não pelo nome acessível: o botão de fechar tem `title="Fechar sem gerar"`,
      // e `getByRole({ name: /Gerar/ })` casava com ele — devolvendo rótulo vazio e clique errado.
      const acao = caixa.locator('button', { hasText: /^(Gerar|Escolha um mês)/ }).last()

      // Marca um segundo mês e confere que o botão diz quantos arquivos vão sair.
      await caixa.locator('label').nth(1).click()
      await pg.waitForTimeout(200)
      const rotulo = (await acao.textContent()) ?? ''
      conferir('   …e o botão DIZ quantos arquivos vão sair', /Gerar \d+ imagens?/.test(rotulo), `"${rotulo.trim()}"`)

      await acao.click()
      let antes = -1
      while (antes !== baixados.length) { antes = baixados.length; await pg.waitForTimeout(1800) }
      conferir('   …e gera SÓ os meses marcados', baixados.length === 2,
        `${baixados.length} arquivo(s): ${baixados.map((d) => d.suggestedFilename()).join(', ')}`)
    }
    await pg.close()
  }

  // ------------------------------------------------------------------ 2. um mês → não pergunta
  {
    const pg = await abrir('novembro')
    const baixados = []
    pg.on('download', (d) => baixados.push(d))
    await botaoEnviar(pg).click()
    for (let i = 0; i < 40 && !baixados.length; i++) await pg.waitForTimeout(500)

    const caixa = await pg.locator('dialog[open]').count()
    conferir('um mês em vista → NÃO pergunta nada', caixa === 0,
      caixa === 0 ? 'gerou direto' : '🔴 a caixa apareceu à toa — estorvo novo no lugar do antigo')
    conferir('   …e gera o arquivo daquele mês', baixados.length === 1,
      baixados.length ? baixados[0].suggestedFilename() : '🔴 nenhum arquivo')
    await pg.close()
  }

  // ------------------------------------------------------------------ 3. no CELULAR
  //
  // 🔴 É o aparelho que ele usa. Medido num iPhone 13 em 04/08/2026: "Todos" e "Nenhum" saíam com
  // 36px de altura — a mesma classe do defeito já corrigido nos alternadores de senha, reintroduzida
  // em código novo. Validar só a 1400px teria deixado passar.
  {
    const ctx = await navegador.newContext({ ...devices['iPhone 13'] })
    const pg = await ctx.newPage()
    let subiu = false
    for (let i = 0; i < 40 && !subiu; i++) {
      try { await pg.goto(`http://127.0.0.1:${PORTA}/`, { waitUntil: 'networkidle', timeout: 3000 }); subiu = true }
      catch { await pg.waitForTimeout(500) }
    }
    await pg.waitForTimeout(2000)

    // No celular quem abre é o botão flutuante.
    const flutuante = pg.locator('button[title="Enviar Escala p/ WhatsApp"]')
    conferir('no celular, o botão flutuante existe', (await flutuante.count()) > 0, 'presente')
    await flutuante.first().click()
    await pg.waitForTimeout(1400)

    const caixa = pg.locator('dialog[open]')
    const abriu = await caixa.count()
    conferir('   …e abre a mesma caixa', abriu > 0, abriu ? 'abriu' : '🔴 não abriu no celular')

    if (abriu) {
      const cx = await caixa.boundingBox()
      const vp = pg.viewportSize()
      conferir('   …que cabe na tela', cx.width <= vp.width && cx.height <= vp.height,
        `${Math.round(cx.width)}x${Math.round(cx.height)} em ${vp.width}x${vp.height}`)

      const pequenos = []
      for (const alvo of await caixa.locator('button, label').all()) {
        const b = await alvo.boundingBox()
        if (b && (b.height < 44 || b.width < 44)) pequenos.push(`${Math.round(b.width)}x${Math.round(b.height)}`)
      }
      conferir('   …com todo alvo de toque em 44px ou mais', pequenos.length === 0,
        pequenos.length ? `🔴 ${pequenos.length} pequeno(s): ${pequenos.join(' ')}` : 'nenhum abaixo do piso')
      await pg.screenshot({ path: 'capturas/seletor-celular.png' })
    }
    await pg.close()
  }

  await navegador.close()
} finally {
  servidor.kill()
}

for (const c of checagens) console.log(`  ${c.ok ? '✅' : '🔴'} ${c.nome.padEnd(48)} ${c.detalhe}`)

const falhas = checagens.filter((c) => !c.ok)
console.log(`\n  ${checagens.length - falhas.length} de ${checagens.length} checagens aprovadas\n`)
if (falhas.length) {
  console.error('🔴 O seletor não faz o que promete.\n')
  process.exit(1)
}
console.log('✅ Pergunta quando há escolha, e some quando não há.\n')
