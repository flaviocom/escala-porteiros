/**
 * AUTOTESTE DO PORTÃO GENÉRICO — ele reprova o infrator E aprova o limpo.
 *
 * 🔴 POR QUE ESTE ARQUIVO EXISTE, com prova do mesmo dia. O termo que procura "irmão" nasceu
 * INERTE: escrito por script, o `\b` do JavaScript virou um byte de backspace (0x08) dentro da
 * expressão. O portão continuou imprimindo *"termos procurados ..... 5"* e *"achados ..... 0"* — e
 * o 0 era verdade sobre uma busca que não procurava nada. Passou por verde.
 *
 * Quando o termo foi consertado, ele achou uma ocorrência real no primeiro segundo
 * (`Admin.tsx:1055`). Ou seja: entre o portão inerte e o portão vivo, a diferença era um defeito de
 * verdade — e nada além deste autoteste teria mostrado a diferença.
 *
 * A regra do método: *o portão prova as DUAS pontas*. Reprovar o infrator não basta (um portão
 * sempre-vermelho também reprova); aprovar o limpo não basta (um portão inerte também aprova).
 *
 * Uso: node scripts/autoteste-portao-generico.mjs
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
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

console.log('AUTOTESTE — portão de produto genérico\n')
let falhas = 0
for (const c of CASOS) {
  const r = medir(c.arquivos)
  const achou = r.achados.length > 0
  const ok = achou === c.esperaAchado && (achou ? r.codigo === 1 : r.codigo === 0)
  if (!ok) falhas++
  console.log(`  ${ok ? '✅' : '🔴'} ${c.nome}`)
  console.log(`       esperava ${c.esperaAchado ? 'ACHADO' : 'limpo'}; portão devolveu ${r.achados.length} achado(s), saída ${r.codigo}`)
  if (!ok && r.achados.length) console.log(`       ${r.achados.map((a) => `${a.arquivo}:${a.linha} ${a.termo}`).join(' · ')}`)
}

console.log(`\n  ${falhas ? '🔴' : '✅'} ${CASOS.length - falhas} de ${CASOS.length} casos corretos`)
if (falhas) console.log('  O portão NÃO está medindo o que diz medir.')
process.exit(falhas ? 1 : 0)
