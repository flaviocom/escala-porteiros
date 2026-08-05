/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ⚠️ `base` NÃO é detalhe: o GitHub Pages serve este projeto sob /escala-porteiros/.
// Sem isto, todo caminho de asset funciona no localhost e quebra no ar.
export default defineConfig({
  base: '/escala-porteiros/',
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5173,
  },
  build: {
    outDir: 'docs',
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
     * (script `prebuild`), senão sobra arquivo antigo a cada build.
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
})
