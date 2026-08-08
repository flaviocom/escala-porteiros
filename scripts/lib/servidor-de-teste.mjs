/**
 * SERVIDOR DE TESTE — sobe o site num processo que a gente realmente controla, e derruba inteiro.
 *
 * 🔴 POR QUE ESTE ARQUIVO EXISTE — dois auditores independentes acharam o mesmo defeito, em
 * scripts diferentes, em 04/08/2026.
 *
 * O padrão anterior, repetido em três scripts, era:
 *
 *     const servidor = spawn('npx', ['vite', ...], { cwd: RAIZ, shell: true, stdio: 'ignore' })
 *     ...
 *     servidor.kill()
 *
 * No Windows, `shell: true` faz o Node criar um `cmd.exe`, e é o `cmd.exe` que cria o `node` do
 * vite. **`servidor.kill()` mata o `cmd.exe` e deixa o vite vivo**, segurando a porta. O script
 * termina anunciando sucesso e deixa um processo órfão para trás.
 *
 * O estrago não é o processo esquecido — é o que acontece na PRÓXIMA execução. Como a porta é fixa
 * e o `--strictPort` faz a instância nova morrer em silêncio, o script seguinte conversa com o
 * **órfão da execução anterior**, sem ter como perceber:
 *
 *   • Em `validar-quem-saiu.mjs`, deu 🔴 falso quatro vezes seguidas. Matando os órfãos, o MESMO
 *     código deu 5 de 5 verde. O produto nunca esteve errado.
 *   • Em `gerar-imagem-exemplo.mjs`, foi pior: o órfão servia um **bundle antigo**, e o script
 *     aprovou a imagem imprimindo um nome de arquivo (`escala-porteiros-2026-08-agosto.png`) que
 *     **não existe mais no código**. Verde em cima de um build velho.
 *
 * Verde falso num portão "ao vivo" é o pior defeito possível deste método, porque é justamente o
 * portão que existe para pegar o que a suíte não pega.
 *
 * ⚠️ A DEFESA PRINCIPAL NÃO É MATAR MELHOR — É RECUSAR-SE A COMEÇAR.
 *
 * Matar direito (abaixo, com `taskkill /T`) resolve o vazamento. Mas se um órfão sobrar por
 * qualquer outro motivo — outra sessão, outro agente, um Ctrl+C — o script novo ainda falaria com
 * ele. Por isso a porta é conferida ANTES de subir: ocupada, o script **para e diz o que fazer**.
 * Um portão que não consegue garantir contra o que mede tem de reprovar, nunca seguir no escuro.
 */
import { spawn, spawnSync } from 'node:child_process'
import { connect, createServer } from 'node:net'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

/** A porta está livre? Resolve `true` se dá para escutar nela agora. */
export function portaLivre(porta) {
  return new Promise((resolve) => {
    const s = createServer()
    s.once('error', () => resolve(false))
    s.once('listening', () => s.close(() => resolve(true)))
    s.listen(porta, '127.0.0.1')
  })
}

/** A porta está respondendo? Resolve `true` se alguém ACEITA conexão nela agora — o inverso de `portaLivre`. */
function portaRespondendo(porta) {
  return new Promise((resolve) => {
    const s = connect({ port: porta, host: '127.0.0.1' })
    s.once('connect', () => { s.destroy(); resolve(true) })
    s.once('error', () => resolve(false))
  })
}

/** Quem está segurando a porta — só para a mensagem de erro ser acionável, não decorativa. */
function quemOcupa(porta) {
  if (process.platform !== 'win32') return ''
  const r = spawnSync('netstat', ['-ano'], { encoding: 'utf8' })
  if (r.status !== 0) return ''
  const linha = (r.stdout || '')
    .split('\n')
    .find((l) => l.includes(`:${porta} `) && l.includes('LISTENING'))
  const pid = linha?.trim().split(/\s+/).pop()
  return pid ? ` O processo ${pid} está escutando nela.` : ''
}

/**
 * Sobe o site e devolve `{ url, derrubar }`.
 *
 * @param {object} op
 * @param {string} op.raiz     raiz do repositório
 * @param {number} op.porta    porta fixa (uma por script, para dois scripts não brigarem)
 * @param {'dev'|'preview'} op.modo  `dev` usa o código-fonte; `preview` serve o build de `docs/`
 */
export async function subirServidor({ raiz, porta, modo = 'dev' }) {
  if (!(await portaLivre(porta))) {
    throw new Error(
      `a porta ${porta} JÁ ESTÁ OCUPADA.${quemOcupa(porta)}\n` +
        `   Este script se recusa a continuar: falar com um servidor que não foi ele que subiu\n` +
        `   produz verde (ou vermelho) sobre um código que pode não ser o atual — já aconteceu.\n` +
        `   No Windows: taskkill /F /PID <pid>   ·   ou feche a janela que deixou o vite rodando.`,
    )
  }

  // Sem `shell: true`: chamamos o vite pelo Node diretamente, então o PID que recebemos é o do
  // processo de verdade — não o de um `cmd.exe` intermediário que morre sozinho e não leva ninguém.
  const viteBin = join(raiz, 'node_modules', 'vite', 'bin', 'vite.js')
  if (!existsSync(viteBin)) throw new Error(`vite não encontrado em ${viteBin} — rode \`npm ci\``)

  const args = [viteBin, ...(modo === 'preview' ? ['preview'] : []), '--port', String(porta), '--strictPort']
  const servidor = spawn(process.execPath, args, { cwd: raiz, stdio: 'ignore' })

  let derrubado = false
  const derrubar = async () => {
    if (derrubado) return
    derrubado = true
    if (process.platform === 'win32' && servidor.pid) {
      // `/T` leva a árvore inteira. Sem ele, um filho do vite sobreviveria segurando a porta —
      // que é exatamente o defeito que este arquivo existe para não repetir.
      spawnSync('taskkill', ['/F', '/T', '/PID', String(servidor.pid)], { stdio: 'ignore' })
    } else {
      servidor.kill('SIGTERM')
    }
    // Confirma que a porta voltou: derrubar sem conferir é a mesma fé cega de antes.
    for (let i = 0; i < 20; i++) {
      if (await portaLivre(porta)) return
      await new Promise((r) => setTimeout(r, 150))
    }
    console.warn(`⚠️ a porta ${porta} continuou ocupada após derrubar o servidor — confira processos órfãos.`)
  }

  // Rede de segurança: se o script estourar sem passar pelo `finally`, ainda assim não deixamos lixo.
  // 🔴 Medido em 08/08/2026, num contêiner Linux: ela só existia para Windows — um script que
  // estourava antes do `finally` deixava o vite ÓRFÃO segurando a porta, exatamente a classe de
  // defeito que o cabeçalho deste arquivo conta. Agora vale nas duas famílias de sistema.
  process.once('exit', () => {
    if (derrubado || !servidor.pid) return
    if (process.platform === 'win32') {
      spawnSync('taskkill', ['/F', '/T', '/PID', String(servidor.pid)], { stdio: 'ignore' })
    } else {
      try { servidor.kill('SIGKILL') } catch { /* já morreu — era o que se queria */ }
    }
  })

  // 🔴 Devolver antes de a porta ABRIR era corrida de largada (P2.16, 08/08/2026): na máquina de
  // origem o vite ganhava sempre; num contêiner mais lento, o primeiro `goto` do consumidor levava
  // `ERR_CONNECTION_REFUSED` e o script acusava um produto certo. A espera morava COPIADA em parte
  // dos consumidores — agora mora aqui, na fonte única, ao lado da recusa de porta ocupada.
  const PRAZO_MS = 30_000
  const inicio = Date.now()
  while (!(await portaRespondendo(porta))) {
    if (servidor.exitCode !== null) {
      throw new Error(`o servidor morreu antes de abrir a porta ${porta} (código ${servidor.exitCode}).`)
    }
    if (Date.now() - inicio > PRAZO_MS) {
      await derrubar()
      throw new Error(`o servidor não abriu a porta ${porta} em ${PRAZO_MS / 1000} s.`)
    }
    await new Promise((r) => setTimeout(r, 150))
  }

  return { url: `http://127.0.0.1:${porta}/`, derrubar, pid: servidor.pid }
}
