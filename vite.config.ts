/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * 🔵 SEGUNDA TRILHA — build GENÉRICO, mesma fonte, mesmo repositório (S-059/S-060, 18/08/2026).
 *
 * `vite build --mode generico` produz um segundo site, em `docs/generico/`, publicado pelo MESMO
 * `publicar.yml` (ele já sobe a árvore inteira de `docs/`) — sem repositório novo, sem workflow
 * novo. A prova de que isto é seguro já existia antes de este modo nascer: `npm run generico`
 * garante que `src/` não tem texto de cliente cravado, então o MESMO bundle já era genérico por
 * dentro — o que faltava era um segundo conjunto de dados (`public-generico/`) e um segundo
 * caminho base para o `fetch` de `src/dados/carregar.ts` encontrá-lo.
 *
 * Ver `docs/ARQUITETURA.md` § "A segunda trilha" e `docs/FASE2.md` §P4.w2.
 */

// ⚠️ `base` NÃO é detalhe: o GitHub Pages serve este projeto sob /escala-porteiros/ (ou
// /escala-porteiros/generico/ na trilha genérica). Sem isto, todo caminho de asset funciona no
// localhost e quebra no ar.
export default defineConfig(({ mode }) => {
  const GENERICO = mode === 'generico'
  return {
  base: GENERICO ? '/escala-porteiros/generico/' : '/escala-porteiros/',
  publicDir: GENERICO ? 'public-generico' : 'public',
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5173,
  },
  build: {
    outDir: GENERICO ? 'docs/generico' : 'docs',
    /**
     * 🔴 `emptyOutDir: false` NÃO é preferência — é a correção de um defeito real.
     *
     * O GitHub Pages, em modo branch, só aceita servir de `/` ou de `/docs`. E `docs/` também é onde
     * o método guarda `pre-voo.json`, `regimes-documentos.json`, o handoff, o índice de solicitações
     * e o índice do histórico — caminhos que os portões do método têm CRAVADOS no código.
     *
     * Com a limpeza automática ligada (o padrão do Vite), o primeiro build **apagou os cinco
     * documentos** e a remoção entrou num commit sem ninguém notar: o site continuou funcionando, e
     * a cadeia documental inteira deixou de existir. Quem pegou foi o portão de órfãos, três passos
     * depois, com 19 links quebrados.
     *
     * Aqui o build convive com a documentação. Em troca, `assets/` é limpo à mão antes de gerar
     * (scripts `prebuild`/`build:generico`), senão sobra arquivo antigo a cada build. A trilha
     * genérica usa a mesma proteção pelo mesmo motivo: `docs/generico/` também é servido por baixo
     * de `docs/`.
     */
    emptyOutDir: false,
    sourcemap: false,
  },
  test: {
    environment: 'node',
    /*
      🔴 `.test.tsx` ERA IGNORADO EM SILÊNCIO — sexta auditoria externa, 05/08/2026.

      O padrão cobria só a extensão `.test.ts`, e `.tsx` não casa. Hoje não há nenhum, então nada estava sendo
      pulado — mas os dois achados mais graves daquela auditoria são justamente o que um teste de
      componente pegaria, e **o primeiro teste de componente deste projeto seria naturalmente um
      `.tsx`**. Ele nasceria inerte, verde e mudo.

      Medido: o MESMO conteúdo com `expect(1).toBe(2)` sai `EXIT=0` como `.test.tsx` e `EXIT=1` como
      `.test.ts`. Um teste que não roda é pior que teste ausente — ele conta como cobertura.
    */
    include: ['src/**/*.test.{ts,tsx}'],
  },
  }
})
