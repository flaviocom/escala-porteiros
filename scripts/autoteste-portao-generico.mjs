/**
 * AUTOTESTE DO PORTÃO GENÉRICO — ele reprova o infrator E aprova o limpo.
 *
 * 🔴 POR QUE ESTE ARQUIVO EXISTE, com prova do mesmo dia. O termo que procura "irmão" nasceu
 * INERTE: escrito por script, o `\b` do JavaScript virou um byte de backspace (0x08) dentro da
 * expressão. O portão continuou imprimindo *"termos procurados ..... 5"* e *"achados ..... 0"* — e
 * o 0 era verdade sobre uma busca que não procurava nada. Passou por verde.
 *
 * Quando o termo foi consertado, ele achou uma ocorrência real no primeiro segundo
 * (uma frase de tela em `Admin.tsx` que dizia "os irmãos já viram"). Ou seja: entre o portão inerte e o portão vivo, a diferença era um defeito de
 * verdade — e nada além deste autoteste teria mostrado a diferença.
 *
 * A regra do método: *o portão prova as DUAS pontas*. Reprovar o infrator não basta (um portão
 * sempre-vermelho também reprova); aprovar o limpo não basta (um portão inerte também aprova).
 *
 * Uso: node scripts/autoteste-portao-generico.mjs
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const AQUI = dirname(fileURLToPath(import.meta.url))
const PORTAO = join(AQUI, 'portao-generico.mjs')

/** Monta uma árvore de mentira e devolve o que o portão disse sobre ela. */
function medir(arquivos) {
  const raiz = mkdtempSync(join(tmpdir(), 'portao-generico-'))
  try {
    mkdirSync(join(raiz, 'src'), { recursive: true })
    for (const [nome, conteudo] of Object.entries(arquivos)) {
      mkdirSync(dirname(join(raiz, nome)), { recursive: true })
      writeFileSync(join(raiz, nome), conteudo, 'utf8')
    }
    try {
      const saida = execFileSync(process.execPath, [PORTAO, '--raiz', raiz, '--json'], { encoding: 'utf8' })
      return { codigo: 0, ...JSON.parse(saida) }
    } catch (e) {
      // Saída diferente de 0 é o comportamento esperado quando há achado: `execFileSync` estoura.
      return { codigo: e.status, ...JSON.parse(e.stdout) }
    }
  } finally {
    rmSync(raiz, { recursive: true, force: true })
  }
}

const LIMPO = `import { useState } from 'react'
export function Tela({ config }) {
  return <h1>{config.identidade.titulo}</h1>
}
`

const CASOS = [
  // ---- A ponta que a maioria dos portões cobre: o infrator é reprovado. -------------------------
  {
    nome: 'nome do cliente no cabeçalho do site',
    arquivos: { 'src/App.tsx': `export const T = () => <h1>Escala Porteiros</h1>\n` },
    esperaAchado: true,
  },
  {
    nome: 'bairro cravado em texto de tela',
    arquivos: { 'src/App.tsx': `const s = 'JD. São Luiz - 2026'\n` },
    esperaAchado: true,
  },
  {
    nome: 'nome da instituição na imagem exportada',
    arquivos: { 'src/export/Img.tsx': `const rodape = 'Congregação Cristã no Brasil'\n` },
    esperaAchado: true,
  },
  {
    nome: 'prompt do motor cravado',
    arquivos: { 'src/admin/motor.ts': "const p = `Você está montando a escala de porteiros de uma congregação, para o mês`\n" },
    esperaAchado: true,
  },
  {
    nome: 'vocabulário de congregação num rótulo de tela',
    arquivos: { 'src/components/Tabela.tsx': `const th = <th>Irmão</th>\n` },
    esperaAchado: true,
  },
  {
    nome: 'vocabulário no plural, no rodapé da imagem',
    arquivos: { 'src/export/Img.tsx': `const r = \`\${n} irmãos por turno\`\n` },
    esperaAchado: true,
  },
  {
    nome: 'infrator no index.html (fora de src/)',
    arquivos: { 'src/App.tsx': LIMPO, 'index.html': `<title>Escala Porteiros - JD. São Luiz</title>\n` },
    esperaAchado: true,
  },

  // ---- A ponta que quase ninguém cobre: o limpo é aprovado. -------------------------------------
  {
    nome: 'código que lê a configuração passa',
    arquivos: { 'src/App.tsx': LIMPO },
    esperaAchado: false,
  },
  {
    nome: 'comentário que CITA o defeito não é achado',
    arquivos: {
      'src/App.tsx': `/* Antes dizia "Escala Porteiros" e "JD. São Luiz" cravados — ver AGENTS.md §0. */\n${LIMPO}`,
    },
    esperaAchado: false,
  },
  {
    nome: 'comentário de uma linha também não é achado',
    arquivos: { 'src/App.tsx': `// o rodapé dizia "3 irmãos por turno"\n${LIMPO}` },
    esperaAchado: false,
  },
  {
    nome: 'comentário de HTML não é achado',
    arquivos: { 'src/App.tsx': LIMPO, 'index.html': `<!-- era "Escala Porteiros" -->\n<title>Escala de plantões</title>\n` },
    esperaAchado: false,
  },
  {
    nome: '🔴 "irmandade" NÃO é achado — o \\b tem de estar vivo nas duas pontas',
    arquivos: { 'src/App.tsx': `const t = 'Fundo de irmandade e solidariedade'\n` },
    esperaAchado: false,
  },
  {
    nome: 'vocabulário genérico ("pessoas por turno") passa',
    arquivos: { 'src/export/Img.tsx': `const r = \`\${n} pessoas por turno\`\n` },
    esperaAchado: false,
  },
  {
    // 🔴 A classe que o portão não enxergava: um `import` de imagem não tem TEXTO de cliente.
    //    O emblema desta congregação viveu no cabeçalho do site inteiro sob 0 achados.
    nome: '🔴 emblema EMPACOTADO (`import … from "./assets/…"`) é achado',
    arquivos: { 'src/App.tsx': `import logo from './assets/logo-ccb-light.png'\n${LIMPO}` },
    esperaAchado: true,
  },
  {
    nome: 'emblema vindo de `dados/` (configuração) NÃO é achado',
    arquivos: { 'src/App.tsx': `const src = \`\${base}dados/\${config.identidade.logo}\`\n${LIMPO}` },
    esperaAchado: false,
  },
  {
    // 🔴 Fronteira de portão é onde o defeito se esconde: `package.json` era invisível.
    nome: '🔴 `package.json` com nome de cliente na descrição é achado',
    arquivos: { 'src/App.tsx': LIMPO, 'package.json': `{\n  "description": "Escala de porteiros CCB Jd. São Luiz"\n}\n` },
    esperaAchado: true,
  },
  {
    nome: '🔴 "sem porteiro escalado" É achado — a frase que escapou de 4 termos',
    arquivos: { 'src/admin/AbaAjustar.tsx': `const t = <span>sem porteiro escalado — não há o que ajustar</span>\n` },
    esperaAchado: true,
  },
  {
    // 🔴 O par do caso acima. O termo "porteiro" nasceu largo demais e acusou 9 linhas que eram o
    //    NOME DO REPOSITÓRIO. Identidade de infraestrutura não vai para tela nenhuma.
    nome: '🔴 `escala-porteiros` (slug do repositório) NÃO é achado',
    arquivos: {
      'src/admin/github.ts': `const REPO = 'escala-porteiros'\nconst CHAVE = 'escala-porteiros:cofre'\nconst M = 'ESCALA-PORTEIROS-COFRE-V1'\nconst u = 'https://flaviocom.github.io/escala-porteiros/'\n`,
    },
    esperaAchado: false,
  },
  {
    nome: 'fixture de teste com o nome do cliente NÃO é achado — teste não vai para o ar',
    arquivos: { 'src/dados/carregar.test.ts': `const doAr = { identidade: { titulo: 'Escala Porteiros', subtitulo: 'JD. São Luiz' } }\n` },
    esperaAchado: false,
  },
  {
    // 🔴 O par do caso acima. Sem ele, a exclusão de `.test.ts` poderia ter comido a pasta inteira
    //    (ou o diretório `src/dados/`) e o autoteste teria lido isso como acerto.
    nome: '🔴 o MESMO conteúdo num arquivo que não é teste É achado',
    arquivos: { 'src/dados/carregar.ts': `const doAr = { identidade: { titulo: 'Escala Porteiros', subtitulo: 'JD. São Luiz' } }\n` },
    esperaAchado: true,
  },
]

/**
 * 🔒 A AUTODEFESA MORDE?
 *
 * O portão confere as próprias expressões antes de medir. Aqui isso é PROVADO: uma cópia dele
 * recebe um byte de backspace (0x08) dentro de uma regex — a corrupção exata que aconteceu três
 * vezes em 05/08/2026 — e tem de morrer com saída 2 em vez de imprimir "0 achados".
 *
 * Sem este caso, a autodefesa seria mais uma peça que ninguém sabe se funciona.
 */
function autodefesaMorde() {
  const raiz = mkdtempSync(join(tmpdir(), 'portao-doente-'))
  try {
    const fonte = readFileSync(PORTAO, 'utf8')
    // Troca a borda `\b` de um termo pelo caractere de controle que o script mal-escrito produz.
    const doente = fonte.replace(String.raw`\birm[ãa]os?\b`, `${String.fromCharCode(8)}irm[ãa]os?${String.fromCharCode(8)}`)
    if (doente === fonte) return { ok: false, motivo: 'não consegui injetar a corrupção — o termo mudou de forma' }

    const copia = join(raiz, 'portao.mjs')
    writeFileSync(copia, doente, 'utf8')
    mkdirSync(join(raiz, 'src'), { recursive: true })
    writeFileSync(join(raiz, 'src', 'App.tsx'), LIMPO, 'utf8')

    try {
      // stdio silencioso: este caso INJETA a corrupção de propósito, e o grito da autodefesa vazava
      // para o log do GATE — assustando quem lê, como se o portão de verdade estivesse quebrado.
      // O veredito continua sendo lido de `e.status` e `e.stderr`, logo abaixo.
      execFileSync(process.execPath, [copia, '--raiz', raiz], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
      return { ok: false, motivo: 'o portão doente rodou e deu VERDE — a autodefesa não morde' }
    } catch (e) {
      if (e.status !== 2) return { ok: false, motivo: `esperava saída 2 (portão quebrado), veio ${e.status}` }
      if (!String(e.stderr).includes('O PORTÃO ESTÁ QUEBRADO')) return { ok: false, motivo: 'saiu 2, mas sem dizer o motivo' }
      return { ok: true }
    }
  } finally {
    rmSync(raiz, { recursive: true, force: true })
  }
}

console.log('AUTOTESTE — portão de produto genérico\n')
let falhas = 0

const defesa = autodefesaMorde()
if (!defesa.ok) falhas++
console.log(`  ${defesa.ok ? '✅' : '🔴'} 🔒 a AUTODEFESA morde: portão com regex corrompida morre em vez de dar verde`)
if (!defesa.ok) console.log(`       ${defesa.motivo}`)

for (const c of CASOS) {
  const r = medir(c.arquivos)
  const achou = r.achados.length > 0
  const ok = achou === c.esperaAchado && (achou ? r.codigo === 1 : r.codigo === 0)
  if (!ok) falhas++
  console.log(`  ${ok ? '✅' : '🔴'} ${c.nome}`)
  console.log(`       esperava ${c.esperaAchado ? 'ACHADO' : 'limpo'}; portão devolveu ${r.achados.length} achado(s), saída ${r.codigo}`)
  if (!ok && r.achados.length) console.log(`       ${r.achados.map((a) => `${a.arquivo}:${a.linha} ${a.termo}`).join(' · ')}`)
}

// O `+ 1` é o caso da autodefesa, que roda fora da lista. Contar só `CASOS.length` faria o próprio
// autoteste medir menos do que diz — que é o defeito que ele existe para pegar.
const total = CASOS.length + 1
console.log(`\n  ${falhas ? '🔴' : '✅'} ${total - falhas} de ${total} casos corretos (${CASOS.length} de varredura + 1 de autodefesa)`)
if (falhas) console.log('  O portão NÃO está medindo o que diz medir.')
process.exit(falhas ? 1 : 0)
