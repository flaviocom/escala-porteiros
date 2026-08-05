import { Component, StrictMode, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { carregarDados, paraShifts, type DadosPublicados } from './dados/carregar'
import { Admin } from './admin/Admin'

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
      <button title="Recarrega a página"
        onClick={() => location.reload()}
        style={{ padding: '0.6rem 1.1rem', borderRadius: 10, border: '1px solid #cbd5e1', background: '#fff', fontWeight: 600, cursor: 'pointer' }}
      >
        Tentar de novo
      </button>
      <pre style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: '#94a3b8', whiteSpace: 'pre-wrap' }}>{msg}</pre>
    </div>,
  )
}

/**
 * 🔴 A REDE QUE NÃO EXISTIA — quinta auditoria externa, 05/08/2026.
 *
 * Este arquivo declara, em letras grandes, que *"tela branca sem explicação é o pior desfecho
 * possível"* — e o `.catch(mostrarErro)` abaixo cobre **só** a promessa de carregamento. Qualquer
 * erro lançado durante o RENDER (uma leitura de `localStorage` bloqueada por política de cookies,
 * um dado publicado com forma inesperada, um componente que estoura numa borda) derrubava a árvore
 * inteira, e o React desmonta tudo deixando a página em branco. O projeto não tinha um único
 * `ErrorBoundary`: `grep` devolvia zero.
 *
 * Ele existe para uma coisa só: transformar um estouro em texto que a pessoa entende, com o botão
 * de recarregar ao lado. Não tenta consertar nada — tentar seria adivinhar.
 *
 * ⚠️ `ErrorBoundary` PRECISA ser classe: o React não oferece equivalente em hook, e é o único lugar
 * deste projeto onde uma classe é a escolha certa em vez da preguiçosa.
 */
class Rede extends Component<{ children: ReactNode }, { erro: Error | null }> {
  state: { erro: Error | null } = { erro: null }

  static getDerivedStateFromError(erro: Error) {
    return { erro }
  }

  componentDidCatch(erro: Error) {
    // O console é onde quem administra procura. A tela fica com a mensagem em português.
    console.error('🔴 A tela estourou durante o render:', erro)
  }

  render() {
    if (!this.state.erro) return this.props.children
    return (
      <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif', maxWidth: 560, margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem' }}>
          Alguma coisa travou ao montar a tela
        </h1>
        <p style={{ color: '#475569', lineHeight: 1.6, marginBottom: '1rem' }}>
          A escala publicada não foi afetada — o problema é só na exibição, neste aparelho. Recarregue
          a página; se continuar, avise o Flavio e mostre a linha cinza abaixo.
        </p>
        <button title="Recarrega a página"
          onClick={() => location.reload()}
          style={{ padding: '0.6rem 1.1rem', borderRadius: 10, border: '1px solid #cbd5e1', background: '#fff', fontWeight: 600, cursor: 'pointer' }}
        >
          Tentar de novo
        </button>
        <pre style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: '#94a3b8', whiteSpace: 'pre-wrap' }}>
          {this.state.erro.message}
        </pre>
      </div>
    )
  }
}

/**
 * Roteamento por hash, em 6 linhas, em vez de uma biblioteca.
 *
 * São duas telas. `react-router` traria ~10 kB e uma API inteira para resolver uma decisão que cabe
 * num `if` — e o GitHub Pages não sabe reescrever URL, então rota por caminho (`/admin`) devolveria
 * 404 ao recarregar a página. O hash não tem esse problema.
 */
function ehAdmin(): boolean {
  return location.hash.replace(/^#/, '').replace(/^\//, '') === 'admin'
}

carregarDados()
  .then((dados: DadosPublicados) => {
    /*
      🔴 O TÍTULO DA ABA TAMBÉM É CONFIGURAÇÃO — achado da auditoria externa, 05/08/2026.

      O `index.html` é servido estático: não há como ele ler `config.json` no momento em que o
      navegador o carrega. Por isso o título nasce genérico lá e é corrigido AQUI, no primeiro
      instante em que a configuração existe de fato.

      Vale a pena? Vale: o título da aba é o nome que o administrador vê no atalho da tela inicial
      do celular, e é o texto que o WhatsApp mostra quando alguém compartilha o link.
    */
    document.title = `${dados.config.identidade.titulo} — ${dados.config.identidade.subtitulo}`

    const pintar = () => {
      raiz.render(
        <StrictMode>
          <Rede>
            {ehAdmin() ? <Admin dados={dados} /> : <App shifts={paraShifts(dados.turnos)} dados={dados} />}
          </Rede>
        </StrictMode>,
      )
    }
    window.addEventListener('hashchange', pintar)
    pintar()
  })
  .catch(mostrarErro)
