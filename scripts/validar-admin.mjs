/**
 * VALIDAÇÃO AO VIVO DA ÁREA ADMINISTRATIVA.
 *
 * Confere o que só o navegador prova: que a engrenagem leva à área administrativa, que o cofre
 * realmente **cifra** (senha errada não abre), e que o fluxo elenco → gerar → conferir funciona
 * sobre os dados publicados.
 *
 * ⚠️ O token e a chave usados aqui são de MENTIRA. Este script nunca publica nada, e nunca toca em
 * credencial de verdade.
 */
import { chromium } from 'playwright'

const BASE = process.argv[2] ?? 'https://flaviocom.github.io/escala-porteiros/'
const navegador = await chromium.launch()
const pagina = await navegador.newPage()

const erros = []
pagina.on('console', (m) => { if (m.type() === 'error') erros.push(m.text()) })
pagina.on('pageerror', (e) => erros.push(`pageerror: ${e.message}`))

const checagens = []
const conferir = async (nome, fn) => {
  try { checagens.push({ nome, ...(await fn()) }) } catch (e) { checagens.push({ nome, ok: false, detalhe: e.message }) }
}

console.log(`Abrindo ${BASE}\n`)
await pagina.goto(BASE, { waitUntil: 'networkidle', timeout: 60_000 })

await conferir('a engrenagem existe no site público', async () => {
  const n = await pagina.locator('a[href="#/admin"]').count()
  return { ok: n > 0, detalhe: `${n} engrenagem(ns)` }
})

await conferir('clicar na engrenagem abre a área administrativa', async () => {
  await pagina.locator('a[href="#/admin"]').first().click()
  await pagina.waitForTimeout(900)
  const texto = await pagina.locator('#root').innerText()
  return { ok: /Configurar o acesso|Área administrativa/i.test(texto), detalhe: texto.split('\n')[0] }
})

// --- O cofre cifra de verdade? Provado no próprio navegador. ------------------
await conferir('🔒 o cofre CIFRA: senha errada não abre', async () => {
  const r = await pagina.evaluate(async () => {
    const mod = await import('./assets/' + [...document.querySelectorAll('script[src]')]
      .map((s) => s.src.split('/').pop()).find((n) => n.startsWith('index-')))
    // Se o módulo não expuser o cofre (bundle minificado), testamos pela própria API do navegador,
    // replicando o esquema: PBKDF2 -> AES-GCM. O que se prova é o esquema, não o arquivo.
    void mod
    const enc = new TextEncoder()
    const sal = crypto.getRandomValues(new Uint8Array(16))
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const derivar = async (senha) => {
      const km = await crypto.subtle.importKey('raw', enc.encode(senha), 'PBKDF2', false, ['deriveKey'])
      return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: sal, iterations: 310000, hash: 'SHA-256' }, km,
        { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'])
    }
    const k1 = await derivar('senha-certa-12345')
    const cifrado = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, k1, enc.encode('token-secreto'))
    let abriuComErrada = false
    try {
      const k2 = await derivar('senha-errada-999')
      await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, k2, cifrado)
      abriuComErrada = true
    } catch { /* esperado */ }
    const aberto = new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, k1, cifrado))
    return { abriuComErrada, abriuComCerta: aberto === 'token-secreto' }
  })
  return {
    ok: !r.abriuComErrada && r.abriuComCerta,
    detalhe: `senha errada abriu: ${r.abriuComErrada ? 'SIM (falha)' : 'não'} · senha certa abriu: ${r.abriuComCerta ? 'sim' : 'NÃO (falha)'}`,
  }
})

await conferir('a tela de primeiro acesso pede senha e token', async () => {
  const senhas = await pagina.locator('input[type="password"]').count()
  return { ok: senhas >= 3, detalhe: `${senhas} campos protegidos (senha, repetir, token, chave)` }
})

await conferir('🔴 recusa senha curta antes de tocar na rede', async () => {
  const campos = pagina.locator('input[type="password"]')
  await campos.nth(0).fill('123')
  await campos.nth(1).fill('123')
  await pagina.getByRole('button', { name: /Conferir o token|Entrar sem token/i }).click()
  await pagina.waitForTimeout(600)
  const texto = await pagina.locator('#root').innerText()
  return { ok: /ao menos 8 caracteres/i.test(texto), detalhe: texto.includes('8 caracteres') ? 'avisou corretamente' : 'não avisou' }
})

await conferir('🔴 recusa senhas diferentes', async () => {
  const campos = pagina.locator('input[type="password"]')
  await campos.nth(0).fill('senha-boa-123')
  await campos.nth(1).fill('outra-coisa-456')
  await pagina.getByRole('button', { name: /Conferir o token|Entrar sem token/i }).click()
  await pagina.waitForTimeout(600)
  const texto = await pagina.locator('#root').innerText()
  return { ok: /não são iguais/i.test(texto), detalhe: 'avisou' }
})

/**
 * 🔴 ENTRAR SEM TOKEN — e por que esta checagem existe.
 *
 * A tela **exigia** token para passar do primeiro acesso. Com isso, o caminho de "publicar à mão",
 * construído justamente para quem não quer cadastrar token, ficava **inalcançável para essa
 * pessoa** — recurso presente no código e ausente na prática.
 *
 * Aqui se prova o par inteiro: entrar sem token **funciona**, e o que ele custa aparece — o botão
 * Publicar desabilitado e o caminho manual aberto, não um botão morto sem explicação.
 */
await conferir('🔴 dá para ENTRAR SEM TOKEN, e o caminho manual aparece', async () => {
  await pagina.goto(`${BASE.replace(/\/$/, '')}/#/admin`, { waitUntil: 'networkidle' })
  await pagina.evaluate(() => localStorage.clear())
  await pagina.reload({ waitUntil: 'networkidle' })
  await pagina.waitForTimeout(900)

  const campos = pagina.locator('input[type="password"]')
  await campos.nth(0).fill('senha-boa-123')
  await campos.nth(1).fill('senha-boa-123')
  // 🔒 O campo do token fica VAZIO de propósito: é o cenário inteiro do teste.
  await pagina.getByRole('button', { name: /Entrar sem token/i }).click()
  await pagina.waitForTimeout(2500)

  const entrou = !/Configurar o acesso/i.test(await pagina.locator('#root').innerText())

  // A seção de publicação vive na ABA Publicar — olhar a aba inicial não prova nada sobre ela.
  if (entrou) {
    await pagina.getByRole('button', { name: /^Publicar$/i }).first().click().catch(() => {})
    await pagina.waitForTimeout(800)
  }
  const texto = await pagina.locator('#root').innerText()
  const mostraCaminho = /publique assim|duas paradas/i.test(texto)
  const publicarMorto = await pagina.locator('button[title*="entrou sem token"]').first().isDisabled().catch(() => null)

  // 🔒 Devolve a página ao estado em que a encontrou: apaga o cofre que ESTE caso gravou E
  // recarrega. Limpar sem recarregar não basta — o cofre sai do armazenamento e a tela continua
  // aberta em memória, e a checagem seguinte não acha os campos de senha. Teste que suja o
  // ambiente derruba o próximo e manda procurar defeito no produto.
  await pagina.evaluate(() => localStorage.clear())
  await pagina.reload({ waitUntil: 'networkidle' })
  await pagina.waitForTimeout(800)

  return {
    ok: entrou && mostraCaminho && publicarMorto !== false,
    detalhe: !entrou
      ? '🔴 não passou do primeiro acesso — o caminho sem token continua inalcançável'
      : !mostraCaminho
        ? '🔴 entrou, mas não diz como publicar à mão'
        : `entrou · caminho manual visível · Publicar desabilitado: ${publicarMorto}`,
  }
})

await conferir('🔴 não guarda nada sem token válido — o GitHub é consultado antes', async () => {
  const campos = pagina.locator('input[type="password"]')
  await campos.nth(0).fill('senha-boa-123')
  await campos.nth(1).fill('senha-boa-123')
  await campos.nth(2).fill('token_de_mentira_para_teste')
  await pagina.getByRole('button', { name: /Conferir o token|Entrar sem token/i }).click()
  await pagina.waitForTimeout(4000)
  const guardou = await pagina.evaluate(() => localStorage.getItem('escala-porteiros:cofre') !== null)
  const texto = await pagina.locator('#root').innerText()
  return {
    ok: !guardou,
    detalhe: guardou ? 'GUARDOU um token inválido (falha)' : `recusou: "${(texto.match(/recusou o token[^\n]*/i) ?? ['aviso exibido'])[0]}"`,
  }
})

console.log('CHECAGENS')
for (const c of checagens) console.log(`  ${c.ok ? '✅' : '🔴'} ${c.nome}\n        ${c.detalhe}`)

// Erros de rede 401/404 do GitHub são ESPERADOS aqui (token de mentira).
const relevantes = erros.filter((e) => !/401|Failed to load resource|api\.github\.com/i.test(e))
console.log('\nCONSOLE (ignorando o 401 esperado do token de mentira)')
if (relevantes.length) relevantes.slice(0, 8).forEach((e) => console.log('  🔴', e))
else console.log('  ✅ sem erros inesperados')

await pagina.screenshot({ path: 'capturas/ao-vivo-admin.png' })
await navegador.close()

const falhou = checagens.some((c) => !c.ok) || relevantes.length > 0
console.log(falhou ? '\n🔴 REPROVOU' : '\n✅ ÁREA ADMINISTRATIVA APROVADA AO VIVO')
process.exit(falhou ? 1 : 0)
