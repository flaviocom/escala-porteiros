/**
 * PROVA AO VIVO — o nome do site vem do DADO, e trocá-lo troca a tela.
 *
 * 🔴 O portão `portao-generico.mjs` prova que o nome do cliente saiu do código. Isso é METADE: um
 * código sem nome nenhum também passa nele — inclusive um que imprima "undefined" no cabeçalho.
 *
 * Aqui se prova a outra metade, num navegador de verdade: o site sobe com um `config.json`
 * INVENTADO ("Portaria Bloco A" / "Plantonista") e se confere que é ISSO que aparece. Se o dado não
 * estivesse chegando à tela, o teste veria o texto antigo — e é assim que se descobre configuração
 * morta, que foi exatamente o defeito de 05/08/2026.
 *
 * E confere o outro lado: um `config.json` SEM `identidade.pessoa` — exatamente o arquivo que estava
 * publicado antes desta correção — não pode imprimir "undefined" em lugar nenhum.
 *
 * Uso: node scripts/validar-identidade-configuravel.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { subirServidor } from './lib/servidor-de-teste.mjs'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')
const { chromium } = await import(`file:///${RAIZ.replace(/\\/g, '/')}/node_modules/playwright/index.mjs`)
const PORTA = 4181

/*
  O palco é o REPOSITÓRIO, não uma cópia.

  `vite preview` serve o build com `base: '/escala-porteiros/'`; copiar `docs/` para outra pasta
  quebraria o caminho e o teste mediria uma tela em branco. Então troca-se só o `config.json`, e o
  `finally` devolve o arquivo **byte a byte** — o original é guardado como TEXTO, não reserializado,
  porque um `JSON.stringify` de volta poderia mudar espaçamento e sujar o `git status` calado.
*/
const CONFIG = join(RAIZ, 'docs/dados/config.json')
const ORIGINAL = readFileSync(CONFIG, 'utf8')
const configReal = JSON.parse(ORIGINAL)

const CASOS = [
  {
    nome: 'cliente INVENTADO — a tela obedece ao dado',
    config: {
      ...configReal,
      identidade: { titulo: 'Portaria Bloco A', subtitulo: 'Unidade Centro', pessoa: { singular: 'Plantonista', plural: 'plantonistas' } },
    },
    esperaNaTela: ['Portaria Bloco A', 'Unidade Centro'],
    esperaNoTitulo: 'Portaria Bloco A',
    naoEsperaNaTela: ['Escala Porteiros', 'JD. SÃO LUIZ', 'undefined'],
  },
  {
    nome: '🔴 config VELHO (sem `identidade.pessoa`) não imprime "undefined"',
    config: { ...configReal, identidade: { titulo: 'Escala Porteiros', subtitulo: 'JD. São Luiz' } },
    esperaNaTela: ['Escala Porteiros'],
    esperaNoTitulo: 'Escala Porteiros',
    naoEsperaNaTela: ['undefined', 'Undefined'],
  },
  {
    nome: 'o dado de verdade continua mostrando o que os irmãos veem hoje',
    config: configReal,
    esperaNaTela: [configReal.identidade.titulo, configReal.identidade.subtitulo].filter(Boolean),
    esperaNoTitulo: configReal.identidade.titulo,
    naoEsperaNaTela: ['undefined'],
  },
]

console.log('VALIDAÇÃO AO VIVO — identidade configurável\n')
let falhas = 0
const servidor = await subirServidor({ raiz: RAIZ, porta: PORTA, modo: 'preview' })
const navegador = await chromium.launch()

try {
  for (const caso of CASOS) {
    writeFileSync(CONFIG, JSON.stringify(caso.config, null, 2) + '\n', 'utf8')

    const pagina = await navegador.newPage({ viewport: { width: 1400, height: 1000 } })
    // `?v=` no carregador já derrota o cache do navegador; a página nova garante o resto.
    await pagina.goto(servidor.url, { waitUntil: 'networkidle', timeout: 30000 })
    await pagina.waitForTimeout(600)

    /*
      🔴 COMPARAÇÃO SEM CAIXA — a primeira versão deste script deu VERMELHO em 3 de 3 e o
         defeito era dele, não do produto.

         `innerText` devolve o texto COMO RENDERIZADO, e o cabeçalho tem `uppercase` no CSS:
         a tela dizia "ESCALA PORTEIROS" e a régua procurava "Escala Porteiros". É a mesma
         classe de erro que já custou caro aqui — a régua errada acusando o produto certo — e
         a única defesa é olhar a tela de verdade antes de acreditar no vermelho.
    */
    const cru = await pagina.locator('body').innerText()
    const texto = cru.toLocaleLowerCase('pt-BR')
    const titulo = await pagina.title()
    const problemas = []

    const min = (t) => t.toLocaleLowerCase('pt-BR')
    for (const t of caso.esperaNaTela) if (!texto.includes(min(t))) problemas.push(`não achou na tela: "${t}"`)
    for (const t of caso.naoEsperaNaTela) if (texto.includes(min(t))) problemas.push(`achou o que NÃO devia: "${t}"`)
    if (!titulo.toLocaleLowerCase('pt-BR').includes(caso.esperaNoTitulo.toLocaleLowerCase('pt-BR'))) problemas.push(`título da aba é "${titulo}", esperava conter "${caso.esperaNoTitulo}"`)

    await pagina.close()
    if (problemas.length) falhas++
    console.log(`  ${problemas.length ? '🔴' : '✅'} ${caso.nome}`)
    console.log(`       título da aba: "${titulo}"`)
    for (const p of problemas) console.log(`       · ${p}`)
  }
} finally {
  writeFileSync(CONFIG, ORIGINAL, 'utf8')
  await navegador.close()
  await servidor.derrubar()
}

// 🔴 O arquivo VOLTOU? Restaurar sem conferir é a mesma fé cega que este projeto já pagou caro.
const voltou = readFileSync(CONFIG, 'utf8') === ORIGINAL
if (!voltou) {
  console.log('\n  🔴 O `docs/dados/config.json` NÃO voltou ao original — confira o `git status`.')
  falhas++
} else {
  console.log('\n  ✅ `docs/dados/config.json` restaurado byte a byte.')
}

console.log(`  ${falhas ? '🔴' : '✅'} ${CASOS.length - falhas} de ${CASOS.length} casos corretos`)
process.exit(falhas ? 1 : 0)
