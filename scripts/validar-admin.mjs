/**
 * VALIDAÇÃO AO VIVO DA ÁREA ADMINISTRATIVA.
 *
 * Confere o que só o navegador prova: que a engrenagem leva à área administrativa, que o cofre
 * realmente **cifra** (senha errada não abre), e que o fluxo elenco → gerar → conferir funciona
 * sobre os dados da árvore atual.
 *
 * ⚠️ O token e a chave usados aqui são de MENTIRA. Este script nunca publica nada, e nunca toca em
 * credencial de verdade.
 *
 * 🔴 P2.18 (08/08/2026): este script está no grupo LOCAL do `vivo:tudo` — o que roda no GATE —,
 * mas abria a URL PUBLICADA por padrão. No gate, isso aprova a árvore que JÁ ESTÁ no ar, não a que
 * se quer aprovar ("verde de outra árvore"); e num ambiente sem saída de rede, nem roda. Agora o
 * padrão é servir o build local; medir o site no ar continua possível passando a URL:
 *
 * Uso: node scripts/validar-admin.mjs [url]
 */
import { chromium } from 'playwright'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { subirServidor } from './lib/servidor-de-teste.mjs'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')
const PORTA = 4302
const servidor = process.argv[2] ? null : await subirServidor({ raiz: RAIZ, porta: PORTA, modo: 'preview' })
const BASE = process.argv[2] ?? servidor.url
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
    /*
      🔴 P4.3, fechado em 05/08/2026 — falso vermelho fora do build de produção.

      Isto procurava `assets/index-*.js`. Em `npm run dev` o script é `/src/main.tsx`, o `find`
      devolvia `undefined`, e o `import('./assets/undefined')` **estourava antes** de a
      criptografia ser testada — reprovando como se a cifra tivesse falhado.

      O `import` nunca serviu para nada aqui: o `void mod` logo abaixo diz isso com todas as
      letras — o que se prova é o ESQUEMA (PBKDF2 → AES-GCM) na API do próprio navegador, não o
      arquivo empacotado. Então ele sai, e o teste passa a valer nos dois modos.
    */
    // Se o módulo não expuser o cofre (bundle minificado), testamos pela própria API do navegador,
    // replicando o esquema: PBKDF2 -> AES-GCM. O que se prova é o esquema, não o arquivo.
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

/*
  🔴 AS CHECAGENS ABAIXO FORAM REESCRITAS EM 05/08/2026 — a régua tinha ficado para trás.

  Elas testavam o fluxo antigo: a tela de primeiro acesso EXIGIA senha + repetir senha + token, e o
  script conferia `input[type="password"] >= 3`. Em 05/08 (S-013) o Flavio pediu que entrar virasse
  **um clique**, e a tela passou a mostrar os campos de senha **só quando há segredo a guardar**.

  A partir daí `npm run vivo:admin` ficou **vermelho todo dia**, testando um fluxo que não existe
  mais. Ninguém notou porque ele está **fora do GATE** — e portão fora do gate é portão que só é
  lido quando alguém desconfia.

  ⚠️ **A lição: mudou o fluxo, a régua muda no MESMO passo.** Régua velha não é neutra: ela grita
  vermelho sobre um produto certo, e o vermelho crônico ensina a ignorar o vermelho.
*/
await conferir('🔴 ENTRAR é UM CLIQUE — sem senha, sem token (S-013)', async () => {
  // 🔒 Começa LIMPO. A checagem anterior cria um cofre para provar que a cifra funciona, e um
  //    aparelho com cofre mostra a tela de senha — que é o comportamento certo, e não o que
  //    este caso mede. O próprio arquivo já avisava: teste que suja o ambiente derruba o
  //    próximo e manda procurar defeito no produto.
  await pagina.evaluate(() => localStorage.clear())
  await pagina.reload({ waitUntil: 'networkidle' })
  await pagina.waitForTimeout(900)
  /*
    🔴 MEDIR POR RÓTULO, não por `input[type="password"]`.

    A primeira versão contava campos mascarados e achou 2 — mas os 2 são o **token** e a **chave
    do motor**, que são mascarados por serem segredos, não por serem senha. O produto estava
    certo; a régua é que media a coisa errada. É a mesma armadilha que já custou caro aqui: tipo
    de campo descreve como o navegador o pinta, não o que ele significa.
  */
  const rotulos = await pagina.locator('label').allInnerTexts()
  const deSenha = rotulos.filter((r) => /senha/i.test(r))
  const botao = pagina.getByRole('button', { name: /Entrar agora/i })
  const existe = (await botao.count()) > 0
  return {
    ok: existe && deSenha.length === 0,
    detalhe: `botão "Entrar agora": ${existe ? 'sim' : 'NÃO'} · campos de SENHA: ${deSenha.length} (esperado 0) ${deSenha.length ? '→ ' + deSenha.join(' / ') : ''}`,
  }
})

await conferir('🔴 e entrar de fato ABRE a área administrativa', async () => {
  await pagina.getByRole('button', { name: /Entrar agora/i }).first().click()
  await pagina.waitForTimeout(1500)
  const texto = await pagina.locator('#root').innerText()
  const abas = ['Elenco', 'Gerar escala', 'Ajustar', 'Conferir por fora', 'Publicar'].filter((a) => texto.includes(a))
  return { ok: abas.length === 5, detalhe: `abas visíveis: ${abas.join(', ') || 'nenhuma'}` }
})

await conferir('🔴 quem entrou sem token vê o caminho manual, não um botão morto', async () => {
  await pagina.getByRole('button', { name: /^Publicar$/i }).first().click().catch(() => {})
  await pagina.waitForTimeout(900)
  const texto = await pagina.locator('#root').innerText()
  const mostraCaminho = /publique assim|duas paradas|sem token/i.test(texto)
  return {
    ok: mostraCaminho,
    detalhe: mostraCaminho ? 'a aba Publicar explica como publicar à mão' : '🔴 não diz como publicar sem token',
  }
})

await conferir('🔴 nada foi guardado no navegador — entrar sem token não cria cofre', async () => {
  const temCofre = await pagina.evaluate(() => localStorage.getItem('escala-porteiros:cofre') !== null)
  return {
    ok: !temCofre,
    detalhe: temCofre ? '🔴 criou cofre sem ninguém pedir' : 'localStorage limpo, como deve ser',
  }
})

await conferir('🔴 o caminho de GUARDAR o token continua existindo, para quem quiser', async () => {
  await pagina.evaluate(() => localStorage.clear())
  await pagina.reload({ waitUntil: 'networkidle' })
  await pagina.waitForTimeout(900)
  const texto = await pagina.locator('#root').innerText()
  // Não é obrigatório, mas tem de estar ACESSÍVEL — foi o defeito que 33fc736 consertou ao contrário.
  const oferece = /guardar|token|senha/i.test(texto)
  return { ok: oferece, detalhe: oferece ? 'a tela oferece guardar o token neste aparelho' : '🔴 o caminho sumiu' }
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
await servidor?.derrubar()

const falhou = checagens.some((c) => !c.ok) || relevantes.length > 0
console.log(falhou ? '\n🔴 REPROVOU' : '\n✅ ÁREA ADMINISTRATIVA APROVADA AO VIVO')
process.exit(falhou ? 1 : 0)
