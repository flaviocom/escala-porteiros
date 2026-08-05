/**
 * 🔴 O QUE O IRMÃO VÊ QUANDO O CARREGAMENTO FALHA?
 *
 * Este site baixa a escala como JSON e desenha no navegador. Se o arquivo não vier, o HTML continua
 * respondendo 200 e a tela fica **branca** — o pior desfecho possível para quem abriu o link só para
 * saber se está escalado no domingo. Sem mensagem, a pessoa conclui que "o site quebrou" e liga para
 * o Flavio.
 *
 * O tratamento existe em `main.tsx` desde o começo. **Nunca tinha sido exercitado.** Caminho de erro
 * escrito e não testado é a mesma coisa que caminho de erro ausente: ninguém sabe se o `catch`
 * alcança, se a mensagem aparece, se o botão funciona.
 *
 * As quatro maneiras realistas de falhar, todas testadas contra o site DE VERDADE:
 *   1. a rede cai no meio (o caso do celular na igreja)
 *   2. o servidor devolve erro (publicação em andamento, arquivo removido)
 *   3. o arquivo chega corrompido (JSON que não parseia)
 *   4. o arquivo chega válido mas VAZIO (o mais traiçoeiro: parseia e não tem escala)
 *
 * Uso: node scripts/validar-caminho-de-erro.mjs
 */
import { chromium } from 'playwright'
import { subirServidor } from './lib/servidor-de-teste.mjs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')
const PORTA = 5198
const ALVO = /dados\/blocos\.json/

console.log('O QUE O IRMÃO VÊ QUANDO O CARREGAMENTO FALHA?\n')

// Recusa-se a subir se a porta estiver ocupada — ver `lib/servidor-de-teste.mjs`.
const servidor = await subirServidor({ raiz: RAIZ, porta: PORTA, modo: 'dev' })

const checagens = []
const conferir = (nome, ok, detalhe) => checagens.push({ nome, ok, detalhe })

/** A tela de erro precisa ser reconhecível por QUEM LÊ, não por classe de CSS. */
const TITULO = 'Não foi possível carregar a escala'

try {
  const navegador = await chromium.launch()

  /** Abre o site com uma falha injetada na requisição da escala, e devolve o que a tela mostra. */
  async function comFalha(rotular, aplicar) {
    const pagina = await navegador.newPage({ viewport: { width: 900, height: 900 } })
    const erros = []
    pagina.on('pageerror', (e) => erros.push(e.message))
    await pagina.route(ALVO, aplicar)
    try {
      await pagina.goto(servidor.url, { waitUntil: 'networkidle', timeout: 20_000 })
    } catch { /* networkidle pode não chegar quando a requisição é abortada — seguimos e lemos a tela */ }
    await pagina.waitForTimeout(1800)
    const texto = (await pagina.locator('#root').innerText()).trim()
    const temBotao = await pagina.getByRole('button', { name: /tentar de novo/i }).count()
    await pagina.close()
    return { rotular, texto, temBotao, erros }
  }

  // Espera o servidor. Sem `sleep` cego: tenta até responder.
  {
    const p = await navegador.newPage()
    let subiu = false
    for (let i = 0; i < 40 && !subiu; i++) {
      try {
        await p.goto(servidor.url, { waitUntil: 'domcontentloaded', timeout: 3000 })
        subiu = true
      } catch { await p.waitForTimeout(500) }
    }
    await p.close()
    if (!subiu) throw new Error(`o servidor não subiu na porta ${PORTA}`)
  }

  // ---------------------------------------------------------------- 1. rede cai
  {
    const r = await comFalha('rede cai', (rota) => rota.abort('connectionfailed'))
    conferir(
      '1. rede cai — a tela explica, em português',
      r.texto.includes(TITULO),
      r.texto.includes(TITULO) ? 'mensagem visível' : `🔴 a tela mostra: "${r.texto.slice(0, 70) || '(VAZIA)'}"`,
    )
    conferir('   …e oferece tentar de novo', r.temBotao > 0, r.temBotao ? 'botão presente' : '🔴 sem saída para o usuário')
  }

  // ---------------------------------------------------------------- 2. servidor com erro
  {
    const r = await comFalha('500', (rota) => rota.fulfill({ status: 500, body: 'erro' }))
    conferir(
      '2. servidor devolve erro — a tela explica',
      r.texto.includes(TITULO),
      r.texto.includes(TITULO) ? 'mensagem visível' : `🔴 "${r.texto.slice(0, 70) || '(VAZIA)'}"`,
    )
  }

  // ---------------------------------------------------------------- 3. arquivo corrompido
  {
    const r = await comFalha('corrompido', (rota) =>
      rota.fulfill({ status: 200, contentType: 'application/json', body: '{ isto não é json' }))
    conferir(
      '3. arquivo corrompido — a tela explica',
      r.texto.includes(TITULO),
      r.texto.includes(TITULO) ? 'mensagem visível' : `🔴 "${r.texto.slice(0, 70) || '(VAZIA)'}"`,
    )
  }

  // ---------------------------------------------------------------- 4. válido, porém vazio
  //
  // O mais traiçoeiro dos quatro: passa no `resp.ok`, passa no `JSON.parse`, e só quebra — ou pior,
  // NÃO quebra e mostra uma escala vazia sem dizer nada — lá adiante, ao desenhar.
  {
    const r = await comFalha('vazio', (rota) =>
      rota.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ versao: 1, blocos: [] }) }))
    const explicou = r.texto.includes(TITULO)
    const telaBranca = r.texto.length < 40
    conferir(
      '4. arquivo válido mas SEM escala — não fica em branco',
      !telaBranca,
      telaBranca ? '🔴 TELA BRANCA — a pessoa não sabe o que houve' : explicou ? 'mostra a mensagem de erro' : `mostra a interface: "${r.texto.slice(0, 60).replace(/\n/g, ' · ')}"`,
    )
    conferir(
      '   …e não estoura erro de JavaScript',
      r.erros.length === 0,
      r.erros.length === 0 ? 'sem exceção' : `🔴 ${r.erros[0].slice(0, 80)}`,
    )
    // A mensagem tem de acusar a CAUSA certa. "Tente ajustar os filtros" quando não há filtro
    // nenhum manda a pessoa caçar o que ela não fez — e some com a informação verdadeira.
    conferir(
      '   …e diz a causa CERTA (não manda ajustar filtro inexistente)',
      /ainda não há escala publicada/i.test(r.texto) && !/ajustar os filtros/i.test(r.texto),
      /ainda não há escala publicada/i.test(r.texto)
        ? 'explica que não há escala publicada'
        : '🔴 manda ajustar filtros que a pessoa nem aplicou',
    )
  }

  // ---------------------------------------------------------------- 5. o caso limpo
  //
  // Sem esta checagem, um "sempre mostra erro" passaria como sucesso nas quatro acima.
  {
    const pagina = await navegador.newPage({ viewport: { width: 900, height: 900 } })
    await pagina.goto(servidor.url, { waitUntil: 'networkidle', timeout: 20_000 })
    await pagina.waitForTimeout(1500)
    const texto = await pagina.locator('#root').innerText()
    await pagina.close()
    conferir(
      '5. sem falha nenhuma — a escala aparece (a outra ponta)',
      !texto.includes(TITULO) && texto.length > 200,
      !texto.includes(TITULO) ? `${texto.length} caracteres de escala` : '🔴 mostra erro mesmo sem falha — portão sempre-vermelho',
    )
  }

  await navegador.close()
} finally {
  await servidor.derrubar()
}

for (const c of checagens) console.log(`  ${c.ok ? '✅' : '🔴'} ${c.nome.padEnd(50)} ${c.detalhe}`)

const falhas = checagens.filter((c) => !c.ok)
console.log(`\n  ${checagens.length - falhas.length} de ${checagens.length} checagens aprovadas\n`)
if (falhas.length) {
  console.error('🔴 Há caminho de falha que deixa o irmão sem explicação.\n')
  process.exit(1)
}
console.log('✅ Toda falha de carregamento vira mensagem em português, com saída — nunca tela branca.\n')
