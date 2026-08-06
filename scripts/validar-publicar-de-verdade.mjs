/**
 * 📤 O BOTÃO PUBLICAR, APERTADO DE VERDADE — com a rede interceptada na borda.
 *
 * 🔴 POR QUE ESTE ARQUIVO EXISTE. Em 06/08/2026, prestes a divulgar a escala, o dono perguntou se
 * restava alguma entrelinha. Restava esta, e era a última do caminho dele:
 *
 *     **o botão Publicar nunca tinha sido apertado.**
 *
 * Todas as publicações até então — inclusive a escala no ar — saíram do terminal por `git push`. O
 * caminho do painel (token → API do GitHub → grava nas DUAS pastas) tinha 25 testes, todos com o
 * módulo de rede trocado por um dublê. **Nenhum deles apertava o botão.**
 *
 * A diferença importa: teste de módulo prova que a função monta o pedido certo *quando é chamada*.
 * Não prova que a tela chama, nem em que ordem, nem o que ela faz com a resposta, nem o que aparece
 * para quem clicou. Este projeto já registrou essa distância três vezes — a mais cara foi
 * `capacidade: 0`, que passava nas duas réguas e quebrava a tela.
 *
 * ── COMO ELE TESTA SEM TOCAR NO TOKEN DO DONO ────────────────────────────────────────────────────
 *
 * A rede é interceptada em `api.github.com` **dentro do navegador**. Roda o `fetch` de verdade, o
 * base64 de verdade, a sequência de verdade, a tela de verdade — e o único pedaço que não roda é o
 * servidor do GitHub, que é justamente o que ninguém consegue testar.
 *
 * ⚠️ O token usado é um valor **inventado**, obviamente falso, que nunca sai desta máquina. É o
 * mesmo recurso que o portão `segredos` usa para provar que morde. **O token real do dono não é
 * lido, digitado nem tocado em passo nenhum** — esse limite não tem exceção.
 *
 * O que ele prova, medindo o que chegou ao servidor falso:
 *   · o botão dispara a publicação;
 *   · chega `public/dados/blocos.json` **e** `docs/dados/blocos.json` — subir em só uma é o erro que
 *     não avisa, e é a razão de as duas pastas existirem;
 *   · o conteúdo das duas é **idêntico** e é um JSON de escala válido;
 *   · acentos sobrevivem (o base64 é de UTF-8, não de bytes soltos);
 *   · a tela diz que publicou.
 *
 * Uso: node scripts/validar-publicar-de-verdade.mjs
 */
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { subirServidor } from './lib/servidor-de-teste.mjs'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')
const PORTA = 4291

/** Valor inventado, com a forma de um token e nenhum poder. Nunca sai desta máquina. */
const TOKEN_FALSO = 'ghp_' + 'X'.repeat(36)
const SENHA_FALSA = 'senha-de-teste-nao-e-do-dono'

const checagens = []
const conferir = (nome, ok, detalhe = '') => checagens.push({ nome, ok, detalhe })

console.log('📤 O BOTÃO PUBLICAR, APERTADO DE VERDADE\n')

const servidor = await subirServidor({ raiz: RAIZ, porta: PORTA, modo: 'preview' })
let navegador
/** O que o "GitHub" recebeu. É sobre isto que as checagens falam. */
const recebido = []

try {
  navegador = await chromium.launch()
  const pagina = await navegador.newPage({ viewport: { width: 1400, height: 1200 } })
  const errosDeConsole = []
  pagina.on('pageerror', (e) => errosDeConsole.push(e.message))

  // ── O GITHUB FALSO, na borda da rede ───────────────────────────────────────────────────────────
  await pagina.route('**://api.github.com/**', async (rota) => {
    const req = rota.request()
    const url = req.url()
    const metodo = req.method()

    // `conferirToken` pergunta pelo repositório.
    if (/\/repos\/[^/]+\/[^/]+$/.test(url) && metodo === 'GET') {
      return rota.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ permissions: { push: true } }) })
    }
    // Histórico de publicações.
    if (url.includes('/commits')) {
      return rota.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    }
    // Ler o arquivo antes de gravar — devolve um `sha` para o PUT ser substituição.
    if (url.includes('/contents/') && metodo === 'GET') {
      return rota.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ sha: 'sha-de-mentira', content: '' }) })
    }
    // A GRAVAÇÃO. É o que este validador existe para ver.
    if (url.includes('/contents/') && metodo === 'PUT') {
      const corpo = JSON.parse(req.postData() ?? '{}')
      recebido.push({
        caminho: decodeURIComponent(url.split('/contents/')[1].split('?')[0]),
        mensagem: corpo.message,
        conteudo: Buffer.from(corpo.content ?? '', 'base64').toString('utf8'),
      })
      return rota.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ content: { sha: 'sha-novo' }, commit: { sha: 'commit-novo' } }) })
    }
    return rota.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
  })

  let subiu = false
  for (let i = 0; i < 40 && !subiu; i++) {
    try { await pagina.goto(servidor.url + '#/admin', { waitUntil: 'networkidle', timeout: 3000 }); subiu = true }
    catch { await pagina.waitForTimeout(500) }
  }
  if (!subiu) throw new Error('o servidor não subiu')
  await pagina.waitForTimeout(1200)

  // ── Cofre com o token inventado ──────────────────────────────────────────────────
  //
  // Por RÓTULO, nunca por posição — a lição de 06/08/2026, quando um campo novo entrou no meio de
  // uma tela e o teste passou a preencher o campo errado sem avisar.
  await pagina.getByLabel(/Token do GitHub/i).fill(TOKEN_FALSO)
  await pagina.getByLabel(/^Senha/i).fill(SENHA_FALSA)
  await pagina.getByLabel(/Repita a senha/i).fill(SENHA_FALSA)
  await pagina.waitForTimeout(300)
  const botaoGuardar = pagina.getByRole('button', { name: /Conferir e guardar com senha/i }).first()
  const entrouComToken = (await botaoGuardar.count()) > 0
  if (entrouComToken) { await botaoGuardar.click(); await pagina.waitForTimeout(3000) }
  const noPainel = (await pagina.getByRole('button', { name: /^Gerar escala/i }).count()) > 0
  conferir('o cofre aceitou o token e abriu o painel', entrouComToken && noPainel,
    noPainel ? 'entrou com token guardado' : 'não chegou ao painel — o cofre recusou')

  // ── Gerar uma escala, que é o que se publica ───────────────────────────────────────────────────
  await pagina.getByRole('button', { name: /^Gerar escala/i }).first().click()
  await pagina.waitForTimeout(900)
  // ⚠️ UM MÊS, não dois. Este passo entrou no gate gerando 01/01 → 28/02 e virou o mais lento de
  // todos — o gate deixou de caber numa espera razoável, e gate que ninguém consegue rodar é gate
  // desligado. Um mês exercita exatamente as mesmas peças: o botão, o `fetch`, o base64, a ordem das
  // duas pastas. O que se prova aqui é o CAMINHO, não o tamanho da escala.
  await pagina.locator('input[type="date"]').first().fill('2027-01-01')
  await pagina.locator('input[type="date"]').nth(1).fill('2027-01-31')
  await pagina.waitForTimeout(300)
  await pagina.getByRole('button', { name: /^Gerar escala$/ }).last().click()
  await pagina.getByText(/Piso alcançado|não foi possível cobrir/i).first().waitFor({ timeout: 90_000 }).catch(() => {})
  const gerou = /Piso alcançado|não foi possível cobrir/i.test(await pagina.locator('body').innerText())
  conferir('há escala gerada para publicar (sem isto o resto é vácuo)', gerou, gerou ? 'proposta na tela' : 'NADA foi gerado')

  // ── O BOTÃO ───────────────────────────────────────────────────────────────────────────────────
  await pagina.getByRole('button', { name: /^Publicar/i }).first().click()
  await pagina.waitForTimeout(900)
  const botaoPublicar = pagina.getByRole('button', { name: /^Publicar$|Publicando/ }).last()
  const habilitado = (await botaoPublicar.count()) > 0 && (await botaoPublicar.isEnabled())
  conferir('🔴 o botão Publicar está HABILITADO com token no cofre', habilitado,
    habilitado ? 'clicável' : 'desabilitado — o caminho com token não abriu')
  if (habilitado) {
    await botaoPublicar.click()
    await pagina.waitForTimeout(6000)
  }

  // ── O QUE CHEGOU DO OUTRO LADO ────────────────────────────────────────────────────────────────
  const caminhos = recebido.map((r) => r.caminho)
  const blocos = recebido.filter((r) => r.caminho.endsWith('dados/blocos.json'))
  conferir('🔴 chegou nas DUAS pastas (subir em só uma é o erro que não avisa)',
    caminhos.some((c) => c.startsWith('public/')) && caminhos.some((c) => c.startsWith('docs/')),
    caminhos.join(' · ') || 'NADA chegou ao servidor')

  const iguais = blocos.length === 2 && blocos[0].conteudo === blocos[1].conteudo
  conferir('🔴 o conteúdo das duas pastas é IDÊNTICO', iguais,
    blocos.length === 2 ? (iguais ? `${blocos[0].conteudo.length} caracteres, iguais` : 'DIFERENTES') : `${blocos.length} arquivo(s) de blocos`)

  let turnos = 0
  let jsonOk = false
  if (blocos.length) {
    try {
      const j = JSON.parse(blocos[0].conteudo)
      turnos = (j.blocos ?? []).flatMap((b) => b.turnos ?? []).length
      jsonOk = turnos > 0
    } catch { jsonOk = false }
  }
  conferir('🔴 o que foi gravado é uma escala válida, com turnos', jsonOk, `${turnos} turnos no arquivo`)

  const comAcento = recebido.some((r) => /[áàâãéêíóôõúç]/i.test(r.conteudo))
  conferir('acentos sobreviveram à viagem (base64 de UTF-8, não de bytes soltos)', comAcento,
    comAcento ? 'acentos íntegros' : 'nenhum acento encontrado — suspeito')

  const corpo = await pagina.locator('body').innerText()
  conferir('🔴 a tela AVISA que publicou', /publicad|no ar|sucesso/i.test(corpo),
    (corpo.split('\n').find((l) => /publicad|no ar|sucesso/i.test(l)) ?? '').trim().slice(0, 70) || 'nenhum aviso')

  conferir('nenhum erro no console', errosDeConsole.length === 0, errosDeConsole.slice(0, 2).join(' · ') || 'limpo')
} finally {
  await navegador?.close()
  // 🔴 `derrubar`, NÃO `parar`. Escrevi `servidor.parar?.()` em três scripts hoje: o método não
  // existe, o `?.` engoliu em silêncio, e cada execução deixou um servidor vivo. Foi a raiz dos
  // conflitos de porta que atrapalharam a sessão inteira — e, no `vivo:publicar`, do processo que
  // terminava o trabalho com 9 de 9 e **nunca encerrava**, porque o servidor segurava o laço.
  // Encadeamento opcional em cima de nome errado transforma defeito em silêncio.
  await servidor.derrubar()
}

console.log('')
for (const c of checagens) console.log(`  ${c.ok ? '✅' : '🔴'} ${c.nome.padEnd(58)} ${c.detalhe}`)
const falhas = checagens.filter((c) => !c.ok)
console.log(`\n  ${checagens.length - falhas.length} de ${checagens.length} · ${recebido.length} gravação(ões) chegaram ao servidor`)
if (falhas.length) {
  console.log('\n🔴 O caminho que o dono aperta NÃO está provado.')
  process.exit(1)
}
console.log('\n✅ O botão Publicar foi apertado, e as duas pastas receberam a mesma escala.')

// Sem isto o processo fica vivo depois de imprimir o resultado — já aconteceu.
process.exit(0)
