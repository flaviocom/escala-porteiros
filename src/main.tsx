import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { carregarDados, paraShifts, type DadosPublicados } from './dados/carregar'

/**
 * Os dados são carregados ANTES de montar a tela.
 *
 * Não é preciosismo: `BROTHERS` (a lista de pessoas que as telas herdadas consultam) é preenchida
 * durante o carregamento. Montar antes deixaria a primeira renderização com nomes vazios — e um
 * defeito que só aparece na primeira abertura é o mais difícil de reproduzir depois.
 *
 * Em troca, o erro de carregamento tem de ser **visível e em português**. Tela branca sem
 * explicação é o pior desfecho possível para quem só quer saber se está escalado no domingo.
 */
const raiz = createRoot(document.getElementById('root')!)

function mostrarErro(erro: unknown) {
  const msg = erro instanceof Error ? erro.message : String(erro)
  raiz.render(
    <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif', maxWidth: 560, margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem' }}>
        Não foi possível carregar a escala
      </h1>
      <p style={{ color: '#475569', lineHeight: 1.6, marginBottom: '1rem' }}>
        Verifique sua conexão e tente de novo. Se o problema continuar, avise o Flavio — a escala
        pode estar em publicação neste momento.
      </p>
      <button
        onClick={() => location.reload()}
        style={{ padding: '0.6rem 1.1rem', borderRadius: 10, border: '1px solid #cbd5e1', background: '#fff', fontWeight: 600, cursor: 'pointer' }}
      >
        Tentar de novo
      </button>
      <pre style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: '#94a3b8', whiteSpace: 'pre-wrap' }}>{msg}</pre>
    </div>,
  )
}

carregarDados()
  .then((dados: DadosPublicados) => {
    raiz.render(
      <StrictMode>
        <App shifts={paraShifts(dados.turnos)} dados={dados} />
      </StrictMode>,
    )
  })
  .catch(mostrarErro)
