/**
 * ÁREA ADMINISTRATIVA.
 *
 * O que ela resolve, nas palavras do Flavio: *"sempre acontece de saírem pessoas da escala e
 * acrescentarem nomes. Essas pessoas têm novas restrições, e eu preciso redistribuir a escala de
 * acordo com as nossas regras."* Antes, isso exigia editar código-fonte e refazer o deploy.
 *
 * O fluxo é: **elenco → gerar → conferir → publicar**, e a publicação não tira o site do ar em
 * momento nenhum — ela grava um arquivo de dados, e o site passa a ler o arquivo novo.
 */
import React, { useMemo, useState } from 'react'
import {
  AlertTriangle, CheckCircle, Download, Eye, EyeOff, KeyRound, Loader2, LogOut, Plus, RefreshCw,
  History, RotateCcw, Save, ShieldCheck, Trash2, Upload, X, XCircle,
} from 'lucide-react'
import { clsx } from 'clsx'
import { abrirCofre, apagarCofre, cofreExiste, exportarCofre, gravarCofre, importarCofre, type Segredos } from './cofre'
import { baixarPacoteManual, COMO_CRIAR_O_TOKEN, conferirToken, DESTINOS, historicoPublicacoes, publicarDados, reverterPara, type Publicacao } from './github'
import type { DadosPublicados } from '../dados/carregar'
import type { Bloco, Configuracao, Pessoa, TipoTurno } from '../dominio/tipos'
import { ROTULO_TURNO } from '../dominio/tipos'
import { construirGrade } from '../dominio/malha'
import { gerarVariasVersoes } from '../dominio/gerador'
import { validar, resumir } from '../dominio/validacao'
import { CATALOGO, menorIntervalo } from '../dominio/regras'
import { conferirPorFora } from '../dominio/conferencia-independente'
import { diferencaEmDias, formatarBR, hojeSaoPaulo, NOMES_DIA_CURTO, somarDias } from '../dominio/datas'
import { AbaAjustar } from './AbaAjustar'
import { arbitrar, auditar, medir, pedirProposta, type Placar, type ProgressoMotor } from './motor'
import { Sparkles } from 'lucide-react'

type Aba = 'elenco' | 'gerar' | 'ajustar' | 'conferir' | 'publicar'

// ===========================================================================
// PORTA — login
// ===========================================================================

/**
 * 🔴 LEVAR O ACESSO PARA OUTRO APARELHO — sem carregar o token em texto claro.
 *
 * O cofre vive no navegador, então cada aparelho precisa do seu. O caminho ingênuo seria mandar o
 * token para si mesmo por mensagem — e aí ele fica legível num histórico de conversa, para sempre.
 *
 * O que se copia aqui é o cofre **já cifrado**. Sem a senha é ruído: pode ir por qualquer canal.
 * A senha viaja na sua cabeça, que é o único lugar que não deixa cópia.
 *
 * Depois de colar uma vez no aparelho novo, ele passa a pedir **só a senha** — para sempre.
 */
function LevarParaOutroAparelho() {
  const [codigo, setCodigo] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)

  return (
    <div className="mt-6 rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
      <h4 className="text-sm font-bold text-indigo-900">Usar no celular ou em outro navegador</h4>
      <p className="text-xs text-indigo-800 mt-1 leading-relaxed">
        Copie o código abaixo e mande para você mesmo — por mensagem, e-mail, o que preferir. Ele é o
        cofre <strong>cifrado</strong>: sem a sua senha, não serve para nada. No outro aparelho, cole na
        tela de acesso e digite a mesma senha. Depois disso, lá também é <strong>só a senha</strong>.
      </p>
      {!codigo ? (
        <button title="Mostra o cofre cifrado deste navegador, pronto para copiar"
          onClick={() => setCodigo(exportarCofre() ?? 'não há cofre neste navegador')}
          className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700"
        >
          Mostrar o código
        </button>
      ) : (
        <div className="mt-3">
          <textarea
            readOnly
            value={codigo}
            onFocus={(e) => e.currentTarget.select()}
            title="Selecione tudo e copie"
            className="w-full h-24 p-3 text-[11px] font-mono border border-indigo-200 rounded-lg bg-white text-gray-700 resize-none"
          />
          <div className="flex items-center gap-2 mt-2">
            <button title="Copia o código para a área de transferência"
              onClick={() => {
                navigator.clipboard?.writeText(codigo)
                setCopiado(true)
                setTimeout(() => setCopiado(false), 2000)
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700"
            >
              {copiado ? 'Copiado!' : 'Copiar código'}
            </button>
            <button title="Esconde o código de novo"
              onClick={() => setCodigo(null)}
              className="px-3 py-2 text-xs font-semibold text-indigo-700 hover:underline"
            >
              Esconder
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * 🔴 O PASSO A PASSO DO TOKEN, NA TELA ONDE A PESSOA ESTÁ TRAVADA.
 *
 * Ele existia num `.cmd` na Área de Trabalho — longe do lugar onde a pergunta aparece, e num
 * arquivo que **nunca foi testado**. Guia que mora noutro lugar é guia que não se lê: quem chega
 * aqui sem token precisa da instrução aqui, com os valores exatos e um botão que abre a página.
 *
 * Os valores vêm de `COMO_CRIAR_O_TOKEN`, no mesmo arquivo que confere o token — para o que a tela
 * MANDA marcar e o que o código EXIGE nunca divergirem.
 */
function ComoCriarOToken() {
  const [aberto, setAberto] = useState(false)

  return (
    <div className="mb-5 rounded-xl border border-gray-200 bg-gray-50">
      <button title="Passo a passo para criar o token, com os valores exatos"
        onClick={() => setAberto((v) => !v)}
        className="flex min-h-[2.75rem] w-full items-center justify-between px-4 text-sm font-bold text-gray-700"
      >
        <span>Não tenho token — como criar (3 minutos)</span>
        <span className="text-gray-400">{aberto ? '−' : '+'}</span>
      </button>

      {aberto && (
        <div className="px-4 pb-4 text-sm text-gray-600">
          <a
            href={COMO_CRIAR_O_TOKEN.url}
            target="_blank"
            rel="noreferrer"
            title="Abre a página do GitHub onde o token é criado"
            className="mb-3 flex min-h-[2.75rem] items-center justify-center rounded-xl bg-gray-900 px-4 text-sm font-bold text-white hover:bg-black"
          >
            Abrir a página do GitHub →
          </a>

          <p className="mb-2 text-xs">Lá, preencha exatamente assim:</p>
          <dl className="mb-3 overflow-hidden rounded-lg border border-gray-200 bg-white">
            {COMO_CRIAR_O_TOKEN.passos.map((p, i) => (
              <div key={p.campo} className={clsx('flex flex-col gap-0.5 px-3 py-2', i > 0 && 'border-t border-gray-100')}>
                <dt className="text-[11px] font-bold uppercase tracking-wide text-gray-500">{p.campo}</dt>
                <dd className="text-sm font-semibold text-gray-900">{p.valor}</dd>
              </div>
            ))}
          </dl>

          <p className="text-xs leading-relaxed text-gray-500">
            Não marque mais nada. Um token que só escreve arquivo <strong>neste</strong> repositório não
            alcança nenhum outro. Clique em <strong>Generate token</strong>, copie o valor — ele aparece
            <strong> uma única vez</strong> — e cole aqui no campo abaixo.
          </p>
        </div>
      )}
    </div>
  )
}

/** O outro lado: colar o código trazido de um aparelho já configurado. */
function ColarCofre() {
  const [aberto, setAberto] = useState(false)
  const [codigo, setCodigo] = useState('')
  const [erro, setErro] = useState('')

  if (!aberto) {
    return (
      // 🔴 Alvo de toque, DE NOVO. Botão em forma de link nasce com a altura do texto — 16px aqui —
      // e é a terceira vez nesta sessão que a mesma classe aparece em código novo. O piso de 44px
      // não pode viver na minha cabeça; vive no portão `vivo:celular`, que foi quem pegou este.
      <button title="Se você já configurou noutro aparelho, traga o cofre de lá em vez de cadastrar tudo de novo"
        onClick={() => setAberto(true)}
        className="mb-4 -ml-2 flex min-h-[2.75rem] items-center px-2 text-xs font-bold text-indigo-600 hover:underline"
      >
        Já configurei noutro aparelho — colar o código de lá
      </button>
    )
  }

  return (
    <div className="mb-5 rounded-xl border border-indigo-200 bg-indigo-50 p-3">
      <p className="text-xs text-indigo-800 mb-2 leading-relaxed">
        Cole o código copiado do outro aparelho. Ele é cifrado — a senha continua sendo pedida depois.
      </p>
      <textarea
        value={codigo}
        onChange={(e) => setCodigo(e.target.value)}
        placeholder="ESCALA-PORTEIROS-COFRE-V1...."
        className="w-full h-20 p-2 text-[11px] font-mono border border-indigo-200 rounded-lg bg-white resize-none"
      />
      {erro && <p className="text-xs text-red-600 mt-1 font-semibold">{erro}</p>}
      <button title="Instala o cofre neste navegador — a senha é pedida em seguida"
        onClick={() => {
          const r = importarCofre(codigo)
          if (r.ok) location.reload()
          else setErro(r.motivo)
        }}
        className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700"
      >
        Usar este cofre
      </button>
    </div>
  )
}

const PrimeiroAcesso: React.FC<{ aoAbrir: (s: Segredos) => void }> = ({ aoAbrir }) => {
  const [senha, setSenha] = useState('')
  const [repetir, setRepetir] = useState('')
  const [token, setToken] = useState('')
  const [chaveMotor, setChaveMotor] = useState('')
  const [erro, setErro] = useState('')
  const [ocupado, setOcupado] = useState(false)

  /**
   * 🔴 SEM SEGREDO, SEM SENHA — corrigido em 05/08/2026, a pedido do Flavio.
   *
   * A senha existe por UM motivo: cifrar o token no `localStorage`. Quando não há token nem chave do
   * motor, o cofre é um objeto vazio — e a tela estava exigindo oito caracteres para proteger nada.
   *
   * Quem só quer ENTRAR e olhar a escala pagava um pedágio inventado, com dois campos de senha e um
   * campo de token que ele não tem. Pior: os dados são públicos (o repositório é público), então a
   * senha não guardava sequer sigilo — guardava apenas o token, que ali não existia.
   *
   * Agora há dois caminhos, e o de cima não pede nada.
   */
  const entrarSemGuardarNada = () => aoAbrir({ tokenGitHub: '' })

  /** Só há o que proteger se houver um segredo para guardar. */
  const temSegredo = Boolean(token.trim() || chaveMotor.trim())

  const criar = async () => {
    setErro('')
    if (!temSegredo) return entrarSemGuardarNada()
    if (senha.length < 8) return setErro('A senha precisa ter ao menos 8 caracteres.')
    if (senha !== repetir) return setErro('As duas senhas não são iguais.')
    /**
     * 🔴 O TOKEN É OPCIONAL — e antes não era, o que tornava INALCANÇÁVEL o caminho de publicar
     * à mão que existe logo ali dentro. Quem não quisesse cadastrar token não passava desta tela,
     * então a alternativa construída para essa pessoa nunca chegava a ela. Código inerte com cara
     * de recurso.
     *
     * Sem token: gera, valida, ajusta e baixa. Só o botão Publicar fica de fora — e a tela diz
     * isso com todas as letras, em vez de deixar o botão morto sem explicação.
     */
    setOcupado(true)
    if (token.trim()) {
      const teste = await conferirToken(token.trim())
      if (!teste.ok) {
        setOcupado(false)
        return setErro(teste.detalhe)
      }
    }
    const segredos: Segredos = { tokenGitHub: token.trim(), ...(chaveMotor.trim() ? { chaveMotor: chaveMotor.trim() } : {}) }
    await gravarCofre(senha, segredos)
    setOcupado(false)
    aoAbrir(segredos)
  }

  return (
    <Moldura titulo="Configurar o acesso" subtitulo="Só desta vez, neste aparelho">
      <p className="text-sm text-gray-600 mb-4 leading-relaxed">
        Você não precisa de token nem de senha para <strong>entrar e trabalhar</strong>. Elas só
        entram em cena se você quiser que este aparelho <strong>guarde</strong> o token — e aí a
        senha é a chave que o decifra.
      </p>

      {/* O caminho de cima não pede nada, porque não guarda nada. */}
      <div className="mb-5 rounded-xl border-2 border-indigo-200 bg-indigo-50/60 p-4">
        <button
          onClick={entrarSemGuardarNada}
          title="Entra agora, sem senha e sem guardar nada neste navegador"
          className="flex min-h-[2.75rem] w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white hover:bg-indigo-700"
        >
          <KeyRound className="h-4 w-4" />
          Entrar agora — sem senha, sem token
        </button>
        <p className="mt-2.5 text-xs leading-relaxed text-gray-600">
          Você gera a escala, confere regra a regra, ajusta turno a turno e baixa os arquivos.
          <strong> Nada é guardado neste navegador</strong> — por isso não há o que proteger com
          senha. Só o botão <em>Publicar</em> fica de fora, e a tela ensina a subir o arquivo pelo
          GitHub com o seu login normal, sem token nenhum.
        </p>
      </div>

      <details className="mb-5">
        <summary className="cursor-pointer text-sm font-bold text-gray-700">
          Prefiro guardar o token neste aparelho (aí sim tem senha)
        </summary>
        <p className="mt-2 text-xs leading-relaxed text-gray-500">
          Vale a pena quando você publica com frequência: o botão <em>Publicar</em> passa a
          funcionar e você não repete o processo. O token fica cifrado aqui, e a senha é a única
          coisa que o abre.
        </p>
      </details>

      <ColarCofre />
      <ComoCriarOToken />
      <Campo
        rotulo="Token do GitHub (opcional)"
        tipo="senha"
        valor={token}
        aoMudar={setToken}
        dica="Fine-grained · Only select repositories → escala-porteiros · Repository permissions → Contents: Read and write"
      />
      <p className="-mt-2 mb-4 text-xs leading-relaxed text-gray-500">
        <strong>Sem token também funciona:</strong> você gera, valida, ajusta e baixa os arquivos —
        só o botão <em>Publicar</em> fica de fora, e a tela mostra como subir à mão em duas paradas.
        Dá para cadastrar o token depois, sem refazer nada.
      </p>
      <Campo
        rotulo="Chave do motor (opcional)"
        tipo="senha"
        valor={chaveMotor}
        aoMudar={setChaveMotor}
        dica="Sem ela, o algoritmo continua gerando e validando — só não há proposta nem explicação do motor."
      />
      {/*
        🔴 OS CAMPOS DE SENHA NASCEM ABAIXO DO TOKEN — e a ordem não é estética.

        Eles ficavam ACIMA. Medido num iPhone 13 em 05/08/2026: ao digitar o token, o campo em que a
        pessoa estava digitando **saltava 184 px para cima**, porque dois campos nasciam em cima dele
        e empurravam tudo. O texto e o foco sobreviviam — mas com o teclado aberto o campo foge de
        debaixo do dedo, e quem digita um token de 90 caracteres perde a linha.

        Abaixo, nada do que já estava na tela se move.
      */}
      {temSegredo && (
        <>
          <Campo rotulo="Senha (mínimo 8 caracteres)" tipo="senha" valor={senha} aoMudar={setSenha}
            nome="senha-do-cofre" autoCompletar="new-password" />
          <Campo rotulo="Repita a senha" tipo="senha" valor={repetir} aoMudar={setRepetir}
            nome="senha-do-cofre-repetida" autoCompletar="new-password" />
        </>
      )}
      {erro && <Aviso tom="erro">{erro}</Aviso>}
      {/*
        O botão de baixo só existe quando há segredo a guardar. Sem isso, ele ficava idêntico ao de
        cima, dois botões iguais na mesma tela — e botão repetido faz a pessoa procurar a diferença
        que não existe.
      */}
      {temSegredo && (
        <Botao aoClicar={criar} ocupado={ocupado} icone={KeyRound}>
          Conferir e guardar com senha
        </Botao>
      )}
    </Moldura>
  )
}

const Entrar: React.FC<{ aoAbrir: (s: Segredos) => void }> = ({ aoAbrir }) => {
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [ocupado, setOcupado] = useState(false)

  const entrar = async () => {
    setOcupado(true)
    setErro('')
    const s = await abrirCofre(senha)
    setOcupado(false)
    if (!s) return setErro('Senha incorreta.')
    aoAbrir(s)
  }

  return (
    <Moldura titulo="Área administrativa" subtitulo="Escala de porteiros — JD. São Luiz">
      <p className="mb-4 text-sm leading-relaxed text-gray-600">
        O token já está guardado neste aparelho, cifrado. Ele <strong>não é pedido de novo</strong> —
        só esta senha, que é a chave que o abre.
      </p>
      <Campo rotulo="Senha" tipo="senha" valor={senha} aoMudar={setSenha} aoEnter={entrar}
        nome="senha-do-cofre" autoCompletar="current-password" />
      {erro && <Aviso tom="erro">{erro}</Aviso>}
      <Botao aoClicar={entrar} ocupado={ocupado} icone={KeyRound}>Entrar</Botao>
      <p className="mt-3 text-xs leading-relaxed text-gray-500">
        Para não digitar nem isto: quando o navegador perguntar <strong>“salvar senha?”</strong>,
        aceite. Da próxima vez ele preenche sozinho e você só clica em <em>Entrar</em>. Guardar a
        senha no navegador é mais seguro do que este site guardá-la — o token continua cifrado.
      </p>
      <button title="Apaga o token deste navegador para configurar de novo. Não revoga o token no GitHub"
        onClick={() => { if (confirm('Isto apaga o token guardado neste navegador. Continuar?')) { apagarCofre(); location.reload() } }}
        className="w-full mt-3 text-xs text-gray-400 hover:text-gray-600 underline"
      >
        Esqueci a senha — configurar de novo
      </button>
    </Moldura>
  )
}

// ===========================================================================
// ADMIN
// ===========================================================================

export const Admin: React.FC<{ dados: DadosPublicados }> = ({ dados }) => {
  const [segredos, setSegredos] = useState<Segredos | null>(null)
  const [aba, setAba] = useState<Aba>('elenco')
  const [pessoas, setPessoas] = useState<Pessoa[]>(() => dados.pessoas.map((p) => ({ ...p, restricoes: { ...p.restricoes } })))
  /**
   * 🔴 A CONFIGURAÇÃO VIROU EDITÁVEL em 05/08/2026, e a razão é de escopo, não de conforto.
   *
   * O Flavio: *"não achei nenhuma configuração de quantas pessoas por turno. É uma escala
   * GENÉRICA agora, com intenção de comercialização. Posso querer dois, ou apenas um."*
   *
   * `capacidadePadrao` sempre existiu no dado — mas só dava para mudá-lo editando `config.json` à
   * mão, no repositório. Para uma congregação com um administrador técnico ao lado, passava; para
   * um produto vendido, é um recurso que não existe.
   */
  const [config, setConfig] = useState<Configuracao>(() => ({ ...dados.config }))
  const [blocoNovo, setBlocoNovo] = useState<Bloco | null>(null)
  /** O bloco como o gerador o entregou — a referência para o "desfazer tudo" do ajuste manual. */
  const [blocoOriginal, setBlocoOriginal] = useState<Bloco | null>(null)
  const [relatoGeracao, setRelatoGeracao] = useState<string>('')

  /**
   * 🔴 O INTERVALO MORA AQUI, e não dentro da aba — corrigido em 05/08/2026 a pedido do Flavio.
   *
   * *"Mesmo após gerada uma escala do dia 12/08 até 31/12, ela volta para 06/08."*
   *
   * A causa: a aba Gerar é montada por condição (`aba === 'gerar' && …`), então **trocar de aba a
   * desmonta** e o React descarta o que estava digitado. Quem gerava, ia conferir em Ajustar e
   * voltava, encontrava as datas de fábrica — e podia gerar outro período sem perceber.
   *
   * O padrão também estava errado: era *amanhã*. O certo é **o dia seguinte ao último turno já
   * publicado**, que é onde a escala nova precisa começar para não deixar buraco nem sobrepor o que
   * os irmãos já viram.
   */
  const inicioSugerido = useMemo(() => {
    const ultimo = dados.blocos.flatMap((b) => b.turnos).map((t) => t.data).sort().at(-1)
    const amanha = somarDias(hojeSaoPaulo(), 1)
    // Se o publicado já acabou no passado, começar amanhã: continuar de trás seria criar escala velha.
    return ultimo && diferencaEmDias(ultimo, amanha) < 0 ? somarDias(ultimo, 1) : amanha
  }, [dados.blocos])
  const [de, setDe] = useState(inicioSugerido)
  const [ate, setAte] = useState(`${Number(inicioSugerido.slice(0, 4))}-12-31`)

  if (!segredos) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        {cofreExiste() ? <Entrar aoAbrir={setSegredos} /> : <PrimeiroAcesso aoAbrir={setSegredos} />}
      </div>
    )
  }

  const abas: { id: Aba; texto: string; travada?: boolean }[] = [
    { id: 'elenco', texto: 'Elenco' },
    { id: 'gerar', texto: 'Gerar escala' },
    { id: 'ajustar', texto: 'Ajustar', travada: !blocoNovo },
    { id: 'conferir', texto: 'Conferir por fora', travada: !blocoNovo },
    { id: 'publicar', texto: 'Publicar' },
  ]

  // A fronteira com os blocos anteriores — quem trabalhou na véspera não pode entrar no dia 1.
  const fronteira: Record<string, string> = {}
  if (blocoNovo) {
    for (const b of dados.blocos) {
      for (const t of b.turnos) {
        if (diferencaEmDias(t.data, blocoNovo.inicio) <= 0) continue
        for (const id of t.pessoas) if (!fronteira[id] || t.data > fronteira[id]) fronteira[id] = t.data
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-base font-bold text-gray-900 truncate">Área administrativa</h1>
            <p className="text-xs text-gray-500">Escala de porteiros · JD. São Luiz</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a href="#/" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 px-3 py-2">
              Ver o site
            </a>
            <button
              onClick={() => setSegredos(null)}
              title="Sair e trancar o cofre"
              className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
        <nav className="max-w-5xl mx-auto px-4 flex gap-1 border-t border-gray-100">
          {abas.map((a) => (
            <button
              key={a.id}
              onClick={() => !a.travada && setAba(a.id)}
              disabled={a.travada}
              title={a.travada ? 'Gere uma escala primeiro' : undefined}
              className={clsx(
                'px-4 py-3 text-sm font-semibold border-b-2 -mb-px transition-colors',
                a.travada
                  ? 'border-transparent text-gray-300 cursor-not-allowed'
                  : aba === a.id
                    ? 'border-indigo-600 text-indigo-700'
                    : 'border-transparent text-gray-500 hover:text-gray-800',
              )}
            >
              {a.texto}
            </button>
          ))}
        </nav>
      </header>

      <main className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        {aba === 'elenco' && <AbaElenco pessoas={pessoas} aoMudar={setPessoas} />}
        {aba === 'gerar' && (
          <AbaGerar
            dados={dados}
            pessoas={pessoas}
            blocoNovo={blocoNovo}
            relato={relatoGeracao}
            segredos={segredos}
            fronteira={fronteira}
            de={de}
            ate={ate}
            aoMudarDe={setDe}
            aoMudarAte={setAte}
            aoMudarPessoas={setPessoas}
            config={config}
            aoMudarConfig={setConfig}
            aoGerar={(b, r) => { setBlocoNovo(b); setBlocoOriginal(b); setRelatoGeracao(r) }}
          />
        )}
        {aba === 'ajustar' && blocoNovo && blocoOriginal && (
          <AbaAjustar
            bloco={blocoNovo}
            blocoOriginal={blocoOriginal}
            pessoas={pessoas}
            fronteira={fronteira}
            aoAlterar={setBlocoNovo}
            config={config}
          />
        )}
        {aba === 'conferir' && blocoNovo && (
          <AbaConferirPorFora bloco={blocoNovo} pessoas={pessoas} config={config} fronteira={fronteira} />
        )}
        {aba === 'publicar' && (
          <AbaPublicar dados={dados} pessoas={pessoas} config={config} blocoNovo={blocoNovo} segredos={segredos} />
        )}
      </main>
    </div>
  )
}

// ===========================================================================
// ELENCO
// ===========================================================================

const AbaElenco: React.FC<{ pessoas: Pessoa[]; aoMudar: (p: Pessoa[]) => void }> = ({ pessoas, aoMudar }) => {
  const [novoNome, setNovoNome] = useState('')

  const alterar = (id: string, muda: (p: Pessoa) => Pessoa) =>
    aoMudar(pessoas.map((p) => (p.id === id ? muda(p) : p)))

  const acrescentar = () => {
    const nome = novoNome.trim()
    if (!nome) return
    const id = nome.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '_')
    if (pessoas.some((p) => p.id === id)) return alert(`Já existe alguém com o identificador "${id}".`)
    aoMudar([...pessoas, { id, nome, ativo: true, restricoes: {} }])
    setNovoNome('')
  }

  return (
    <>
      <Cartao
        titulo="Elenco"
        subtitulo="O X tira a pessoa da escala. Ela não é apagada — os blocos já publicados continuam mostrando o nome dela."
      >
        <div className="flex gap-2 mb-5">
          <input
            value={novoNome}
            onChange={(e) => setNovoNome(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && acrescentar()}
            placeholder="Nome de quem está entrando"
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
          <button title="Acrescenta ao elenco. Só entra na escala quando você gerar de novo"
            onClick={acrescentar}
            className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Acrescentar
          </button>
        </div>

        <div className="space-y-3">
          {pessoas.map((p) => (
            <CartaoPessoa key={p.id} pessoa={p} aoAlterar={(m) => alterar(p.id, m)} />
          ))}
        </div>
      </Cartao>
      <p className="text-xs text-gray-500 px-1">
        {pessoas.filter((p) => p.ativo).length} na escala · {pessoas.filter((p) => !p.ativo).length} fora
      </p>
    </>
  )
}

const CartaoPessoa: React.FC<{ pessoa: Pessoa; aoAlterar: (m: (p: Pessoa) => Pessoa) => void }> = ({ pessoa, aoAlterar }) => {
  const [aberto, setAberto] = useState(false)
  const r = pessoa.restricoes

  const alternarDia = (campo: 'diasPermitidos' | 'diasProibidos', dia: number) =>
    aoAlterar((p) => {
      const atual = p.restricoes[campo] ?? []
      const novo = atual.includes(dia) ? atual.filter((d) => d !== dia) : [...atual, dia].sort()
      const rest = { ...p.restricoes }
      if (novo.length) rest[campo] = novo
      else delete rest[campo]
      return { ...p, restricoes: rest }
    })

  const alternarTurno = (t: TipoTurno) =>
    aoAlterar((p) => {
      const atual = p.restricoes.turnosPermitidos ?? []
      const novo = atual.includes(t) ? atual.filter((x) => x !== t) : [...atual, t]
      const rest = { ...p.restricoes }
      if (novo.length) rest.turnosPermitidos = novo
      else delete rest.turnosPermitidos
      return { ...p, restricoes: rest }
    })

  const etiquetas: string[] = []
  if (r.diasPermitidos?.length) etiquetas.push(`só ${r.diasPermitidos.map((d) => NOMES_DIA_CURTO[d]).join('/')}`)
  if (r.diasProibidos?.length) etiquetas.push(`nunca ${r.diasProibidos.map((d) => NOMES_DIA_CURTO[d]).join('/')}`)
  if (r.turnosPermitidos?.length) etiquetas.push(`só ${r.turnosPermitidos.map((t) => ROTULO_TURNO[t].toLowerCase()).join('/')}`)
  if (r.tetoMensal != null) etiquetas.push(`máx. ${r.tetoMensal}/mês`)
  if (r.ausencias?.length) etiquetas.push(`${r.ausencias.length} ausência(s)`)

  return (
    <div className={clsx('border rounded-2xl overflow-hidden', pessoa.ativo ? 'border-gray-200 bg-white' : 'border-gray-200 bg-gray-50 opacity-60')}>
      <div className="flex items-center gap-3 p-4">
        <button title="Clique para ver quem pode substituir esta pessoa neste turno" onClick={() => setAberto(!aberto)} className="flex-1 text-left min-w-0">
          <div className="font-semibold text-gray-900 flex items-center gap-2">
            {pessoa.nome}
            {!pessoa.ativo && <span className="text-[10px] uppercase tracking-wider bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">fora</span>}
          </div>
          <div className="text-xs text-gray-500 mt-0.5 truncate">
            {etiquetas.length ? etiquetas.join(' · ') : 'sem restrição'}
          </div>
        </button>
        <button
          onClick={() => aoAlterar((p) => ({ ...p, ativo: !p.ativo }))}
          title={pessoa.ativo ? 'Tirar da escala' : 'Trazer de volta'}
          className={clsx('p-2 rounded-lg', pessoa.ativo ? 'text-red-500 hover:bg-red-50' : 'text-green-600 hover:bg-green-50')}
        >
          {pessoa.ativo ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
        </button>
      </div>

      {aberto && (
        <div className="px-4 pb-4 pt-1 border-t border-gray-100 space-y-4">
          <LinhaDias titulo="Só pode nestes dias" selecionados={r.diasPermitidos ?? []} aoAlternar={(d) => alternarDia('diasPermitidos', d)} />
          <LinhaDias titulo="Nunca pode nestes dias" selecionados={r.diasProibidos ?? []} aoAlternar={(d) => alternarDia('diasProibidos', d)} tom="vermelho" />
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Só pode nestes turnos</p>
            <div className="flex gap-2">
              {(['MANHA', 'TARDE', 'NOITE'] as TipoTurno[]).map((t) => (
                <button title="Clique para ver quem pode substituir esta pessoa neste turno"
                  key={t}
                  onClick={() => alternarTurno(t)}
                  className={clsx(
                    'px-3 py-1.5 rounded-lg text-xs font-semibold border',
                    r.turnosPermitidos?.includes(t) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-300',
                  )}
                >
                  {ROTULO_TURNO[t]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Máximo por mês</p>
            <input
              type="number"
              min={1}
              value={r.tetoMensal ?? ''}
              placeholder="sem limite"
              onChange={(e) => {
                const v = e.target.value === '' ? undefined : Math.max(1, Number(e.target.value))
                aoAlterar((p) => {
                  const rest = { ...p.restricoes }
                  if (v == null) delete rest.tetoMensal
                  else rest.tetoMensal = v
                  return { ...p, restricoes: rest }
                })
              }}
              className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <Ausencias pessoa={pessoa} aoAlterar={aoAlterar} />
        </div>
      )}
    </div>
  )
}

const LinhaDias: React.FC<{ titulo: string; selecionados: number[]; aoAlternar: (d: number) => void; tom?: 'vermelho' }> = ({ titulo, selecionados, aoAlternar, tom }) => (
  <div>
    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{titulo}</p>
    <div className="flex gap-1.5 flex-wrap">
      {NOMES_DIA_CURTO.map((n, d) => (
        <button title="Clique para ver quem pode substituir esta pessoa neste turno"
          key={d}
          onClick={() => aoAlternar(d)}
          className={clsx(
            'w-11 py-1.5 rounded-lg text-xs font-semibold border capitalize',
            selecionados.includes(d)
              ? tom === 'vermelho' ? 'bg-red-500 text-white border-red-500' : 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white text-gray-600 border-gray-300',
          )}
        >
          {n}
        </button>
      ))}
    </div>
  </div>
)

const Ausencias: React.FC<{ pessoa: Pessoa; aoAlterar: (m: (p: Pessoa) => Pessoa) => void }> = ({ pessoa, aoAlterar }) => {
  const [de, setDe] = useState('')
  const [ate, setAte] = useState('')
  const [motivo, setMotivo] = useState('')
  const lista = pessoa.restricoes.ausencias ?? []

  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Ausências (férias, viagem)</p>
      {lista.map((a, i) => (
        <div key={i} className="flex items-center gap-2 mb-1.5 text-sm bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <span className="flex-1">
            {formatarBR(a.inicio)} a {formatarBR(a.fim)}
            {a.motivo && <span className="text-gray-500"> · {a.motivo}</span>}
          </span>
          <button title="Remover esta ausência"
            onClick={() => aoAlterar((p) => ({ ...p, restricoes: { ...p.restricoes, ausencias: (p.restricoes.ausencias ?? []).filter((_, j) => j !== i) } }))}
            className="text-red-500 hover:bg-red-100 p-1 rounded"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
      <div className="flex flex-wrap gap-2 items-end mt-2">
        <label className="text-xs text-gray-500">
          de
          <input type="date" value={de} onChange={(e) => setDe(e.target.value)} className="block px-2 py-1.5 border border-gray-300 rounded-lg text-sm" />
        </label>
        <label className="text-xs text-gray-500">
          até
          <input type="date" value={ate} onChange={(e) => setAte(e.target.value)} className="block px-2 py-1.5 border border-gray-300 rounded-lg text-sm" />
        </label>
        <input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="motivo (opcional)" className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm flex-1 min-w-[8rem]" />
        <button title="Acrescenta ao elenco. Só entra na escala quando você gerar de novo"
          onClick={() => {
            if (!de || !ate) return alert('Informe as duas datas.')
            if (diferencaEmDias(de, ate) < 0) return alert('A data final é anterior à inicial.')
            aoAlterar((p) => ({
              ...p,
              restricoes: { ...p.restricoes, ausencias: [...(p.restricoes.ausencias ?? []), { inicio: de, fim: ate, ...(motivo ? { motivo } : {}) }] },
            }))
            setDe(''); setAte(''); setMotivo('')
          }}
          className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-semibold hover:bg-amber-600"
        >
          Acrescentar
        </button>
      </div>
    </div>
  )
}

/**
 * AUSÊNCIAS ANTES DE GERAR — a segunda porta para o mesmo dado.
 *
 * 🔴 Pedido do Flavio em 05/08/2026: *"não consigo colocar aqui um dia de férias combinado. Deveria
 * ser no gerar escala. Pessoa, data inicial e data final, ANTES de gerar, porque a escala deverá
 * considerar esta ausência."*
 *
 * O dado sempre existiu (`restricoes.ausencias`) e a regra D6 sempre o respeitou — mas o único lugar
 * de cadastrá-lo era a aba Elenco, pessoa por pessoa. Na hora de gerar, que é quando alguém lembra
 * das férias que o irmão avisou, era preciso sair, achar a pessoa, voltar.
 *
 * ⚠️ NÃO é uma cópia do dado: escreve na MESMA lista que o Elenco lê e que o gerador consulta. Duas
 * cópias de uma regra é onde as duas divergem em silêncio — este projeto já pagou por isso.
 */
const AusenciasAntesDeGerar: React.FC<{
  pessoas: Pessoa[]
  de: string
  ate: string
  aoMudarPessoas: (p: Pessoa[]) => void
}> = ({ pessoas, de, ate, aoMudarPessoas }) => {
  const [quem, setQuem] = useState('')
  const [inicio, setInicio] = useState('')
  const [fim, setFim] = useState('')
  const [motivo, setMotivo] = useState('')
  const [erro, setErro] = useState('')

  const ativos = pessoas.filter((p) => p.ativo)

  /** Só as ausências que TOCAM o período — as de outro ano não informam nada aqui. */
  const noPeriodo = pessoas.flatMap((p) =>
    (p.restricoes.ausencias ?? [])
      .map((a, i) => ({ pessoa: p, ausencia: a, indice: i }))
      .filter(({ ausencia }) => !(diferencaEmDias(ausencia.fim, de) > 0 || diferencaEmDias(ate, ausencia.inicio) > 0)),
  )

  const remover = (pessoaId: string, indice: number) =>
    aoMudarPessoas(pessoas.map((p) => p.id !== pessoaId ? p : {
      ...p,
      restricoes: { ...p.restricoes, ausencias: (p.restricoes.ausencias ?? []).filter((_, j) => j !== indice) },
    }))

  const acrescentar = () => {
    setErro('')
    if (!quem) return setErro('Escolha de quem é a ausência.')
    if (!inicio || !fim) return setErro('Informe o primeiro e o último dia da ausência.')
    if (diferencaEmDias(inicio, fim) < 0) return setErro('O último dia é anterior ao primeiro.')
    aoMudarPessoas(pessoas.map((p) => p.id !== quem ? p : {
      ...p,
      restricoes: { ...p.restricoes, ausencias: [...(p.restricoes.ausencias ?? []), { inicio, fim, ...(motivo.trim() ? { motivo: motivo.trim() } : {}) }] },
    }))
    setQuem(''); setInicio(''); setFim(''); setMotivo('')
  }

  return (
    <Cartao
      titulo="Quem estará ausente no período"
      subtitulo="Férias, viagem, compromisso. Cadastre ANTES de gerar — quem está ausente não é escalado naqueles dias."
    >
      {noPeriodo.length === 0 ? (
        <p className="text-sm text-gray-500">Ninguém com ausência marcada dentro deste período.</p>
      ) : (
        <div className="mb-4 space-y-1.5">
          {noPeriodo.map(({ pessoa, ausencia, indice }) => (
            <div key={`${pessoa.id}-${indice}`} className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm">
              <span className="flex-1">
                <strong>{pessoa.nome}</strong> — de {formatarBR(ausencia.inicio)} a {formatarBR(ausencia.fim)}
                {ausencia.motivo && <span className="text-gray-500"> · {ausencia.motivo}</span>}
              </span>
              <button title={`Tirar a ausência de ${pessoa.nome}`}
                onClick={() => remover(pessoa.id, indice)}
                className="rounded p-1 text-red-500 hover:bg-red-100"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-end gap-2">
        <label className="text-xs text-gray-500">
          quem
          <select value={quem} onChange={(e) => setQuem(e.target.value)}
            title="A pessoa que estará ausente"
            className="mt-1 block min-w-[10rem] rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
          >
            <option value="">escolha…</option>
            {ativos.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
        </label>
        <label className="text-xs text-gray-500">
          primeiro dia
          <input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} title="Primeiro dia da ausência"
            className="mt-1 block rounded-lg border border-gray-300 px-2 py-1.5 text-sm" />
        </label>
        <label className="text-xs text-gray-500">
          último dia
          <input type="date" value={fim} onChange={(e) => setFim(e.target.value)} title="Último dia da ausência (inclusive)"
            className="mt-1 block rounded-lg border border-gray-300 px-2 py-1.5 text-sm" />
        </label>
        <input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="motivo (opcional)"
          title="Aparece só aqui, para você lembrar depois"
          className="min-w-[8rem] flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-sm" />
        <button onClick={acrescentar} title="Marca a ausência. Ela vale na próxima vez que você gerar"
          className="min-h-[2.75rem] rounded-lg bg-amber-500 px-4 text-sm font-semibold text-white hover:bg-amber-600"
        >
          Marcar ausência
        </button>
      </div>
      {erro && <Aviso tom="erro">{erro}</Aviso>}
      <p className="mt-3 text-xs leading-relaxed text-gray-500">
        A ausência entra na escala <strong>quando você gerar</strong>. Se já havia uma escala gerada
        nesta sessão, gere de novo para que ela passe a valer.
      </p>
    </Cartao>
  )
}

/**
 * CONFERIR POR FORA — a segunda régua na tela.
 *
 * 🔴 A dor do Flavio, 05/08/2026: *"quero uma outra forma de conferência, que mostre por auditoria
 * — de outro agente, que não foi o mesmo que criou — que ele valide as regras e veja se não houve
 * furo."* É o maker–checker do método dele aplicado ao produto.
 *
 * O que esta aba mostra que a conferência normal não mostra: o **cruzamento**. Duas implementações
 * independentes chegam a um veredito cada uma, e o que importa é se elas CONCORDAM. Concordar é o
 * esperado e prova pouco; **divergir é ouro**, porque significa que uma das duas está errada.
 */
const AbaConferirPorFora: React.FC<{
  bloco: Bloco
  pessoas: Pessoa[]
  config: Configuracao
  fronteira: Record<string, string>
}> = ({ bloco, pessoas, config, fronteira }) => {
  const porFora = useMemo(
    () => conferirPorFora(bloco, pessoas, config, fronteira),
    [bloco, pessoas, config, fronteira],
  )
  const oficial = useMemo(
    () => validar({ bloco, pessoas, ultimaEscalaAnterior: fronteira, config }),
    [bloco, pessoas, fronteira, config],
  )

  const foraAcusa = porFora.comFuro.length > 0
  const oficialAcusa = oficial.falhasDuras.length > 0
  const concordam = foraAcusa === oficialAcusa

  return (
    <>
      <Cartao
        titulo="Conferência independente"
        subtitulo="Uma segunda régua, escrita do zero, confere a mesma escala por outro caminho."
        tom={concordam ? undefined : 'erro'}
      >
        <div
          className={clsx(
            'rounded-xl border p-4',
            !concordam ? 'border-red-300 bg-red-50' : foraAcusa ? 'border-amber-300 bg-amber-50' : 'border-green-300 bg-green-50',
          )}
        >
          <p className="text-sm font-bold text-gray-900">
            {!concordam
              ? '🔴 AS DUAS CONFERÊNCIAS DISCORDAM — não publique até entender por quê'
              : foraAcusa
                ? '⚠️ As duas encontraram problema — e concordam no veredito'
                : '✅ As duas conferências concordam: nenhum furo nesta escala'}
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-gray-600">
            Conferência normal: <strong>{oficialAcusa ? `${oficial.falhasDuras.length} regra(s) violada(s)` : 'sem violação'}</strong>
            {' · '}Conferência independente: <strong>{foraAcusa ? `${porFora.comFuro.length} promessa(s) com furo` : 'sem furo'}</strong>
          </p>
          {!concordam && (
            <p className="mt-2 text-xs leading-relaxed text-red-800">
              Uma das duas está errada. Divergência entre réguas independentes é o sinal mais forte
              de defeito que este sistema consegue produzir — mais forte que qualquer uma delas
              sozinha dizendo que está tudo bem.
            </p>
          )}
        </div>

        <div className="mt-4 divide-y divide-gray-100">
          {porFora.achados.map((a) => (
            <div key={a.promessa} className="flex items-start gap-3 py-3">
              <div className="mt-0.5 shrink-0">
                {a.furos.length === 0
                  ? <CheckCircle className="h-5 w-5 text-green-600" />
                  : <XCircle className="h-5 w-5 text-red-600" />}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900">{a.promessa}</p>
                <p className="mt-0.5 text-xs text-gray-500">{a.veredito}</p>
                {a.furos.slice(0, 5).map((f, i) => (
                  <p key={i} className="mt-1 text-xs text-red-700">· {f}</p>
                ))}
                {a.furos.length > 5 && <p className="mt-1 text-xs text-gray-400">e mais {a.furos.length - 5}</p>}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs leading-relaxed text-gray-600">
          <strong>Números apurados por fora</strong>, sem consultar a outra conferência:{' '}
          {porFora.numeros.turnos} turno(s) · {porFora.numeros.preenchidas} de {porFora.numeros.vagas} vagas
          preenchidas · {porFora.numeros.pessoasEscaladas} pessoa(s) · {porFora.numeros.dias} dia(s).
        </div>
      </Cartao>

      <Cartao titulo="Até onde esta conferência prova — e onde ela para">
        <div className="space-y-2 text-sm leading-relaxed text-gray-600">
          <p>
            <strong>O que ela garante:</strong> não compartilha <em>uma linha</em> de código com a
            conferência normal. Ela não usa o catálogo de regras; monta a <strong>linha do tempo de
            cada pessoa</strong> e confere por aí. Um erro de laço, de fronteira de data, ou uma
            regra que percorre a lista errada não se repete igual em duas implementações escritas por
            ângulos opostos — foi um defeito exatamente desse tipo que a auditoria de 04/08 encontrou.
          </p>
          <p className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <strong>⚠️ O que ela NÃO garante:</strong> as duas réguas foram escritas pelo mesmo autor.
            Ponto cego comum é possível, e prometer o contrário seria vender confiança que não existe.
            Independência de verdade vem de auditor externo — e é por isso que ela continua no
            backlog do projeto, mesmo com esta tela pronta.
          </p>
        </div>
      </Cartao>
    </>
  )
}

// ===========================================================================
// GERAR
// ===========================================================================

const AbaGerar: React.FC<{
  dados: DadosPublicados
  pessoas: Pessoa[]
  blocoNovo: Bloco | null
  relato: string
  segredos: Segredos
  fronteira: Record<string, string>
  /** O intervalo vive no Admin: trocar de aba desmontava esta e apagava o que estava digitado. */
  de: string
  ate: string
  aoMudarDe: (v: string) => void
  aoMudarAte: (v: string) => void
  aoMudarPessoas: (p: Pessoa[]) => void
  config: Configuracao
  aoMudarConfig: (c: Configuracao) => void
  aoGerar: (b: Bloco | null, relato: string) => void
}> = ({ dados, pessoas, blocoNovo, relato, segredos, de, ate, aoMudarDe, aoMudarAte, aoMudarPessoas, config, aoMudarConfig, aoGerar }) => {
  const [ocupado, setOcupado] = useState(false)
  const [falha, setFalha] = useState<string>('')
  /** Muda a cada "gerar outra combinação" — é o que faz a próxima rodada explorar outro caminho. */
  const [sementeBase, setSementeBase] = useState(1)
  const [comparadas, setComparadas] = useState(0)
  const [motorOcupado, setMotorOcupado] = useState<ProgressoMotor | null>(null)
  const [motorErro, setMotorErro] = useState<string>('')
  const [propostaMotor, setPropostaMotor] = useState<{ bloco: Bloco; explicacao: string } | null>(null)
  const [auditoria, setAuditoria] = useState<string>('')
  const [arbitragem, setArbitragem] = useState<string>('')

  const fronteira = useMemo(() => {
    const f: Record<string, string> = {}
    for (const b of dados.blocos) {
      for (const t of b.turnos) {
        if (diferencaEmDias(t.data, de) <= 0) continue
        for (const id of t.pessoas) if (!f[id] || t.data > f[id]) f[id] = t.data
      }
    }
    return f
  }, [dados, de])

  const executar = () => {
    setOcupado(true)
    setFalha('')
    aoGerar(null, '')
    // Um respiro para o navegador pintar o estado "gerando" antes do trabalho pesado.
    setTimeout(() => {
      const grade = construirGrade({
        inicio: de, fim: ate,
        malha: config.malhaPadrao,
        capacidadePadrao: config.capacidadePadrao,
        santaCeia: config.santaCeia,
      })
      const elenco = pessoas.filter((p) => p.ativo).map((p) => p.id)
      /**
       * 🔴 OITO VERSÕES, e a melhor vai para a tela — decisão de 05/08/2026, registrada em
       * `docs/superpowers/specs/PESQUISA_2026-08-05-gerar-n-versoes.md`.
       *
       * Medido antes de escolher: uma escala custa ~6 ms; oito custam ~48 ms. Abaixo dos 100 ms
       * em que Nielsen diz que nem indicador de carregando é necessário — por isso o Web Worker
       * que a pesquisa recomendou foi RECUSADO: seria complexidade comprada sem dor.
       *
       * A semente muda a cada clique em "gerar outra combinação", e fica gravada no bloco.
       */
      const escolha = gerarVariasVersoes(
        { inicio: de, fim: ate, grade, pessoas, elenco, malha: config.malhaPadrao, ultimaEscalaAnterior: fronteira },
        8, 3, sementeBase,
      )
      const r = escolha.melhor
      setComparadas(escolha.versoes.filter((v) => v.resultado.ok).length)
      setOcupado(false)
      if (!r.ok) {
        setFalha(
          `${r.motivo}\n\n` +
            (r.turnoQueTravou ? `Travou em ${formatarBR(r.turnoQueTravou.data)}, turno da ${r.turnoQueTravou.tipo}: faltaram ${r.turnoQueTravou.faltaram} pessoa(s).\n` : '') +
            `Pisos de distanciamento tentados: ${r.pisosTentados.join(', ')}.`,
        )
        return
      }
      aoGerar(r.bloco, r.relato)
    }, 50)
  }

  const relatorio = useMemo(
    () => (blocoNovo ? validar({ bloco: blocoNovo, pessoas, ultimaEscalaAnterior: fronteira, config }) : null),
    [blocoNovo, pessoas, fronteira, config],
  )

  return (
    <>
      <Cartao titulo="Gerar" subtitulo="Escolha o intervalo. Antes dele, nada é tocado — o que já foi divulgado continua valendo.">
        <div className="flex flex-wrap gap-4 items-end">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            De
            <input type="date" value={de} onChange={(e) => aoMudarDe(e.target.value)} className="block mt-1 px-3 py-2 border border-gray-300 rounded-xl text-sm" />
          </label>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Até
            <input type="date" value={ate} onChange={(e) => aoMudarAte(e.target.value)} className="block mt-1 px-3 py-2 border border-gray-300 rounded-xl text-sm" />
          </label>
          <button title="Monta a escala buscando o maior espaçamento possível entre as escalas de cada um"
            onClick={executar}
            disabled={ocupado}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 disabled:bg-gray-400 flex items-center gap-2"
          >
            {ocupado ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {ocupado ? 'Gerando…' : 'Gerar escala'}
          </button>
        </div>
        {/*
          🔴 QUANTAS PESSOAS POR TURNO — pedido do Flavio em 05/08/2026, e é regra de ESCOPO:
          *"é uma escala genérica, configurável, mas genérica, com intenção de comercialização"*.
          O número sempre existiu no dado; faltava a porta. Numa portaria de prédio pode ser 1.
        */}
        <label className="mt-4 flex flex-wrap items-center gap-2 text-sm text-gray-700">
          <span className="font-semibold">Pessoas por turno:</span>
          <input
            type="number"
            min={1}
            max={20}
            value={config.capacidadePadrao}
            title="Quantas pessoas cada turno precisa. Vale para a próxima geração"
            onChange={(e) => {
              const n = Number(e.target.value)
              if (Number.isInteger(n) && n >= 1 && n <= 20) aoMudarConfig({ ...config, capacidadePadrao: n })
            }}
            className="w-20 rounded-xl border border-gray-300 px-3 py-2 text-sm"
          />
          <span className="text-xs text-gray-500">
            vale na próxima geração · hoje a escala no ar usa {dados.config.capacidadePadrao}
          </span>
        </label>
        {/*
          🔴 "GERAR OUTRA COMBINAÇÃO" — o pedido do Flavio de poder recusar e pedir outra.
          Só aparece depois que existe escala: antes dela o botão não teria o que substituir.
          Ele muda a SEMENTE, e é isso que faz a próxima rodada explorar caminhos diferentes —
          sem semente nova, oito versões seriam oito cópias.
        */}
        {blocoNovo && !ocupado && (
          <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3">
            <button
              onClick={() => { setSementeBase((n) => n + 100); setTimeout(executar, 30) }}
              title="Descarta esta escala e monta outra, explorando combinações diferentes"
              className="flex min-h-[2.75rem] items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 hover:bg-gray-100"
            >
              <RefreshCw className="h-4 w-4" /> Não gostei — gerar outra combinação
            </button>
            <p className="mt-2 text-xs leading-relaxed text-gray-600">
              Esta escala é a melhor de <strong>{comparadas} versões</strong> que o sistema montou e
              comparou internamente — primeiro pelo espaçamento entre as escalas de cada um, e
              depois pelo equilíbrio de carga. Pedir outra explora combinações diferentes; a
              anterior não volta sozinha.
            </p>
          </div>
        )}
        <p className="text-xs text-gray-500 mt-3">
          {pessoas.filter((p) => p.ativo).length} pessoas no elenco ·{' '}
          {Object.keys(fronteira).length} com escala anterior a considerar na fronteira
        </p>
      </Cartao>

      {/* Antes de gerar, e não depois: é aqui que alguém lembra das férias que o irmão avisou. */}
      <AusenciasAntesDeGerar pessoas={pessoas} de={de} ate={ate} aoMudarPessoas={aoMudarPessoas} />

      {falha && (
        <Cartao titulo="Não foi possível gerar" tom="erro">
          <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{falha}</pre>
          {segredos.chaveMotor && !arbitragem && (
            <button title="Sugere o que afrouxar, em que ordem, e o que cada caminho custa"
              onClick={async () => {
                setMotorOcupado({ fase: 'Arbitragem', detalhe: 'pensando em como destravar…' })
                try {
                  setArbitragem(await arbitrar(segredos.chaveMotor!, falha, pessoas))
                } catch (e) {
                  setMotorErro(e instanceof Error ? e.message : String(e))
                } finally {
                  setMotorOcupado(null)
                }
              }}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" /> Perguntar ao motor como destravar
            </button>
          )}
          {arbitragem && (
            <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
              <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-2">Caminhos possíveis</p>
              <p className="text-sm text-indigo-950 whitespace-pre-wrap leading-relaxed">{arbitragem}</p>
            </div>
          )}
        </Cartao>
      )}

      {blocoNovo && relatorio && (
        <>
          <Cartao titulo="Resultado" tom={relatorio.aprovada ? 'ok' : 'erro'}>
            <p className="text-sm font-semibold text-gray-900 mb-1">{relato}</p>
            <p className="text-sm text-gray-600">{resumir(relatorio)}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              <Numero rotulo="turnos" valor={blocoNovo.turnos.filter((t) => !t.santaCeia).length} />
              <Numero rotulo="vagas" valor={blocoNovo.turnos.reduce((s, t) => s + t.pessoas.length, 0)} />
              <Numero rotulo="piso (dias)" valor={blocoNovo.pisoAlcancado ?? '-'} />
              <Numero rotulo="regras conferidas" valor={`${relatorio.avaliadas}/${relatorio.totalNoCatalogo}`} />
            </div>
          </Cartao>

          {/*
            🔴 *"Eu não entendi o que é a proposta do motor"* — Flavio, 05/08/2026.

            E o subtítulo antigo pressupunha o vocabulário da casa: "o portão julga as duas" só
            significa alguma coisa para quem já sabe o que é o portão. Recurso que ninguém entende é
            recurso que ninguém usa — e, num produto para vender, é recurso que ninguém paga.
          */}
          <Cartao titulo="Segunda opinião do motor" subtitulo="Opcional. A escala que você já tem continua válida.">
            <details className="mb-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <summary className="cursor-pointer text-sm font-bold text-gray-700">O que é isto, exatamente?</summary>
              <div className="mt-2 space-y-2 text-sm leading-relaxed text-gray-600">
                <p>
                  A escala que está na tela foi montada pelo <strong>algoritmo</strong>: ele percorre
                  os turnos em ordem e escolhe sempre quem está há mais tempo sem servir. É rápido,
                  é sempre igual para a mesma entrada, e o resultado você já viu conferido acima.
                </p>
                <p>
                  O <strong>motor</strong> monta uma <strong>segunda versão</strong> da mesma escala,
                  olhando o período inteiro de uma vez em vez de turno a turno — e por isso às vezes
                  acha um arranjo que distribui melhor. Ele tenta, mede o resultado contra as mesmas{' '}
                  {CATALOGO.length} regras, e <strong>refaz até 3 vezes</strong> quando a própria
                  proposta é reprovada.
                </p>
                <p className="rounded-lg border border-indigo-100 bg-indigo-50 p-3">
                  🔒 <strong>Ele nunca decide sozinho.</strong> A proposta dele passa exatamente pelas
                  mesmas regras que a do algoritmo. Se reprovar, não chega até você. Se passar, você
                  vê <strong>as duas lado a lado</strong>, com os números de cada uma, e escolhe. Nada
                  substitui a sua escala sem o seu clique.
                </p>
                <p className="text-xs text-gray-500">
                  Não é obrigatório: sem ele, a escala do algoritmo publica normalmente.
                </p>
              </div>
            </details>
            {!segredos.chaveMotor ? (
              <Aviso tom="atencao">
                Não há chave do motor guardada neste navegador. A escala do algoritmo continua válida
                e publicável — o que falta é só a proposta alternativa e os textos de explicação.
              </Aviso>
            ) : motorOcupado ? (
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <strong>{motorOcupado.fase}</strong> — {motorOcupado.detalhe}
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                <button title="O motor monta a própria versão. Ela só chega ao placar se passar nas mesmas regras"
                  onClick={async () => {
                    setMotorErro('')
                    setPropostaMotor(null)
                    try {
                      const r = await pedirProposta(segredos.chaveMotor!, blocoNovo, pessoas, fronteira, config, setMotorOcupado)
                      if (r.ok) setPropostaMotor({ bloco: r.proposta.bloco, explicacao: r.proposta.explicacao })
                      else setMotorErro(r.motivo)
                    } catch (e) {
                      setMotorErro(e instanceof Error ? e.message : String(e))
                    } finally {
                      setMotorOcupado(null)
                    }
                  }}
                  className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" /> Pedir proposta ao motor
                </button>
                <button title="Segunda opinião sobre o que a regra não pega: mesmo grupo repetido, alguém sempre no mesmo dia"
                  onClick={async () => {
                    setMotorOcupado({ fase: 'Auditoria', detalhe: 'procurando o que a regra não pega…' })
                    setMotorErro('')
                    try {
                      setAuditoria(await auditar(segredos.chaveMotor!, blocoNovo, pessoas))
                    } catch (e) {
                      setMotorErro(e instanceof Error ? e.message : String(e))
                    } finally {
                      setMotorOcupado(null)
                    }
                  }}
                  className="px-4 py-2.5 border border-indigo-300 text-indigo-700 rounded-xl text-sm font-semibold hover:bg-indigo-50 flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" /> Auditar esta escala
                </button>
              </div>
            )}

            {motorErro && <div className="mt-4"><Aviso tom="erro">{motorErro}</Aviso></div>}

            {auditoria && (
              <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Segunda opinião</p>
                <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{auditoria}</p>
              </div>
            )}

            {propostaMotor && (
              <>
                <div className="mt-5 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wider text-gray-500 border-b border-gray-200">
                        <th className="py-2 pr-3 font-semibold">Comparação</th>
                        <th className="py-2 px-3 font-semibold">Algoritmo</th>
                        <th className="py-2 px-3 font-semibold">Motor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {linhasDoPlacar(
                        medir('Algoritmo', blocoNovo, pessoas, fronteira, config),
                        medir('Motor', propostaMotor.bloco, pessoas, fronteira, config),
                      ).map((l) => (
                        <tr key={l.rotulo}>
                          <td className="py-2 pr-3 text-gray-600">{l.rotulo}</td>
                          <td className={clsx('py-2 px-3 font-semibold', l.melhor === 'a' && 'text-green-700')}>{l.a}</td>
                          <td className={clsx('py-2 px-3 font-semibold', l.melhor === 'b' && 'text-green-700')}>{l.b}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {propostaMotor.explicacao && (
                  <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-xl max-h-56 overflow-y-auto">
                    <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-2">O que o motor considerou</p>
                    <p className="text-sm text-indigo-950 whitespace-pre-wrap leading-relaxed">{propostaMotor.explicacao}</p>
                  </div>
                )}
                <button title="Substitui a escala do algoritmo pela do motor"
                  onClick={() => { aoGerar(propostaMotor.bloco, 'Escala do motor, aprovada no portão determinístico.'); setPropostaMotor(null) }}
                  className="mt-4 px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700"
                >
                  Usar a proposta do motor
                </button>
                <p className="text-xs text-gray-400 mt-2">
                  A escala do motor só chegou até aqui porque passou nas mesmas regras obrigatórias da
                  do algoritmo. Escolher é seu.
                </p>
              </>
            )}
          </Cartao>

          {/*
            🔴 A CONFERÊNCIA PRECISA SER LIDA POR QUEM NÃO CONSTRUIU O SISTEMA — pedido do Flavio em
            05/08/2026, porque o produto vai ser vendido: *"precisa estar amigável até para quem vai
            gerar uma escala de dois turnos para a portaria de um prédio"*.

            O que faltava não era o número: era o SENTIDO. "60 dia(s) conferido(s)" não diz o que foi
            conferido nem por que importa. Cada regra passou a trazer a explicação em linguagem comum
            (`explicacao`, no catálogo), e o cabeçalho separa o que REPROVA do que só AVISA — antes
            um ⚠️ e um 🔴 tinham o mesmo peso visual e ninguém sabia qual travava a publicação.
          */}
          <Cartao
            titulo="Conferência regra a regra"
            subtitulo={
              `${relatorio.falhasDuras.length === 0 ? 'Nenhuma regra obrigatória violada' : `${relatorio.falhasDuras.length} regra(s) obrigatória(s) violada(s)`}` +
              ` · ${relatorio.avisos.length} ponto(s) de atenção · ${relatorio.avaliadas} regras conferidas`
            }
          >
            <div className="mb-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-500">
              <span className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-green-600" /> está certo</span>
              <span className="flex items-center gap-1.5"><XCircle className="h-3.5 w-3.5 text-red-600" /> <strong>impede publicar</strong> até ser resolvido</span>
              <span className="flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> só um aviso — <strong>não</strong> impede publicar</span>
            </div>
            <div className="divide-y divide-gray-100 -my-2">
              {relatorio.resultados.map((r) => {
                const explicacao = CATALOGO.find((c) => c.id === r.id)?.explicacao
                return (
                  <div key={r.id} className="py-3.5 flex items-start gap-3">
                    <div className="mt-0.5 shrink-0" title={r.familia === 'DURA' ? 'Regra obrigatória: violou, não publica' : 'Ponto de atenção: não impede publicar'}>
                      {r.status === 'ok' && <CheckCircle className="w-5 h-5 text-green-600" />}
                      {r.status === 'falha' && <XCircle className="w-5 h-5 text-red-600" />}
                      {r.status === 'aviso' && <AlertTriangle className="w-5 h-5 text-amber-500" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900">
                        {/*
                          Tira o prefixo técnico ("Capacidade — ") e devolve a maiúscula: sem isto
                          o título vira "cada turno com o número certo…", em minúscula, e um título
                          em minúscula parece frase quebrada, não cabeçalho. Achado na verificação
                          visual de 05/08/2026 — o DOM estava certo e o olho não.
                        */}
                        {(() => { const t = r.titulo.replace(/^[^—]+—\s*/, ''); return t.charAt(0).toUpperCase() + t.slice(1) })()}
                        {r.familia === 'QUALIDADE' && (
                          <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-500">
                            não impede publicar
                          </span>
                        )}
                      </p>
                      {explicacao && <p className="mt-0.5 text-xs leading-relaxed text-gray-600">{explicacao}</p>}
                      <p className="mt-1 text-xs font-medium text-gray-500">{r.medida}</p>
                      {r.violacoes.slice(0, 5).map((v, i) => (
                        <p key={i} className="text-xs text-gray-600 mt-1">· {v.mensagem}</p>
                      ))}
                      {r.violacoes.length > 5 && <p className="text-xs text-gray-400 mt-1">e mais {r.violacoes.length - 5}</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          </Cartao>

          <Cartao titulo="Distanciamento por pessoa" subtitulo="Quantos dias, no mínimo, cada um ficou entre duas escalas">
            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1">
              {pessoas.filter((p) => p.ativo).map((p) => {
                const min = menorIntervalo({ bloco: blocoNovo, pessoas, ultimaEscalaAnterior: fronteira, config }, p.id)
                const total = blocoNovo.turnos.filter((t) => t.pessoas.includes(p.id)).length
                return (
                  <div key={p.id} className="flex items-baseline justify-between text-sm py-1 border-b border-gray-50">
                    <span className="text-gray-800">{p.nome}</span>
                    <span className="text-gray-500 text-xs">
                      {total} turnos · mín. <strong className={clsx(min != null && min <= 3 && 'text-red-600')}>{min ?? '-'}</strong> dias
                    </span>
                  </div>
                )
              })}
            </div>
          </Cartao>
        </>
      )}
    </>
  )
}

// ===========================================================================
// PUBLICAR
// ===========================================================================

const AbaPublicar: React.FC<{
  dados: DadosPublicados
  pessoas: Pessoa[]
  /** A configuração EDITADA nesta sessão — publicada junto quando mudou. */
  config: Configuracao
  blocoNovo: Bloco | null
  segredos: Segredos
}> = ({ dados, pessoas, config, blocoNovo, segredos }) => {
  const [ocupado, setOcupado] = useState(false)
  const [resultado, setResultado] = useState<{ ok: boolean; texto: string } | null>(null)

  const blocosParaPublicar = useMemo(() => {
    if (!blocoNovo) return dados.blocos
    const vespera = somarDias(blocoNovo.inicio, -1)
    const anteriores = dados.blocos
      .filter((b) => b.inicio < blocoNovo.inicio)
      .map((b) => ({
        ...b,
        fim: b.fim > vespera ? vespera : b.fim,
        turnos: b.turnos.filter((t) => diferencaEmDias(t.data, blocoNovo.inicio) > 0),
      }))
    return [...anteriores, blocoNovo]
  }, [dados.blocos, blocoNovo])

  const relatorio = useMemo(() => {
    if (!blocoNovo) return null
    const f: Record<string, string> = {}
    for (const b of dados.blocos) for (const t of b.turnos) {
      if (diferencaEmDias(t.data, blocoNovo.inicio) <= 0) continue
      for (const id of t.pessoas) if (!f[id] || t.data > f[id]) f[id] = t.data
    }
    return validar({ bloco: blocoNovo, pessoas, ultimaEscalaAnterior: f, config })
  }, [blocoNovo, dados.blocos, pessoas, config])

  const publicar = async () => {
    if (relatorio && !relatorio.aprovada) return
    setOcupado(true)
    setResultado(null)
    const passos: string[] = []
    let tudoOk = true
    // 🔴 O QUE REALMENTE FOI GRAVADO — corrigido em 04/08/2026 por auditoria independente.
    //
    // Cada arquivo vai para DUAS pastas (`public/dados` e `docs/dados`), em dois commits. Se o
    // primeiro é aceito e o segundo falha (409 por edição concorrente, queda de rede, limite de
    // requisições), `publicarDados` devolve `ok: false` — mas o primeiro **já foi gravado**.
    //
    // A tela dizia, nesse caso, *"Nada foi publicado pela metade"*. Era verdade sobre uma coisa
    // (se o elenco falha, a escala nem é tentada) e MENTIRA sobre outra: uma das duas cópias tinha
    // ido. O operador ficava sem saber que o site estava com metade dos dados novos.
    //
    // Não se tenta desfazer: desfazer é outro commit, que também pode falhar, e bloco publicado não
    // se reescreve por conta própria. O que se faz é **contar o que aconteceu** — republicar é
    // idempotente e regrava as duas pastas.
    const gravados: string[] = []

    const rp = await publicarDados(segredos.tokenGitHub, 'pessoas.json', { versao: 1, pessoas }, 'atualiza o elenco e as restrições')
    passos.push(rp.ok ? '✅ elenco publicado' : `🔴 elenco: ${rp.erro}`)
    gravados.push(...rp.commits.map((c) => c.caminho))
    tudoOk = tudoOk && rp.ok

    // 🔴 A CONFIGURAÇÃO TAMBÉM PUBLICA — desde 05/08/2026, quando ela virou editável na tela.
    //
    // Sem isto, mudar "pessoas por turno" valeria só na geração desta sessão: o site continuaria
    // servindo o número antigo, e a próxima pessoa a abrir a tela veria o valor velho de volta.
    // Recurso que só funciona até recarregar é pior que recurso ausente.
    //
    // Só publica se MUDOU: commit sem mudança polui o histórico que o Flavio usa para reverter.
    const configMudou = JSON.stringify(config) !== JSON.stringify(dados.config)
    if (configMudou && tudoOk) {
      const rc = await publicarDados(segredos.tokenGitHub, 'config.json', config, 'atualiza a configuração da escala')
      passos.push(rc.ok ? '✅ configuração publicada' : `🔴 configuração: ${rc.erro}`)
      gravados.push(...rc.commits.map((c) => c.caminho))
      tudoOk = tudoOk && rc.ok
    }

    if (blocoNovo && tudoOk) {
      const rb = await publicarDados(
        segredos.tokenGitHub,
        'blocos.json',
        { versao: 1, blocos: blocosParaPublicar },
        `escala de ${formatarBR(blocoNovo.inicio)} a ${formatarBR(blocoNovo.fim)}`,
      )
      passos.push(rb.ok ? '✅ escala publicada' : `🔴 escala: ${rb.erro}`)
      gravados.push(...rb.commits.map((c) => c.caminho))
      tudoOk = tudoOk && rb.ok
    }

    setOcupado(false)
    setResultado({
      ok: tudoOk,
      texto: tudoOk
        ? passos.join('\n') + '\n\nO site mostra a escala nova em cerca de um minuto. Ele não saiu do ar em momento nenhum.'
        : passos.join('\n') +
          '\n\n' +
          (gravados.length === 0
            ? 'Nada chegou a ser gravado — o site continua exatamente como estava.'
            : `⚠️ ATENÇÃO: ${gravados.length} arquivo(s) JÁ foram gravados antes da falha:\n` +
              gravados.map((c) => `   · ${c}`).join('\n') +
              '\n\nO site pode estar com parte dos dados novos e parte dos antigos. ' +
              'Clique em Publicar de novo: a publicação regrava tudo e resolve. ' +
              'Se falhar outra vez, confira os commits no repositório antes de mexer em qualquer coisa.') +
          '\n\nA escala só é tentada depois que o elenco é publicado — se o elenco falhou, a escala nem começou.',
    })
  }

  const impedido = relatorio ? !relatorio.aprovada : false
  /** Sem token, publicar pela tela não existe — e o motivo aparece, em vez de um botão morto. */
  const semToken = !segredos.tokenGitHub

  return (
    <>
      <Cartao titulo="Publicar" subtitulo="Cada publicação vira um commit — dá para ver o que mudou e desfazer.">
        {!blocoNovo && (
          <Aviso tom="atencao">
            Nenhuma escala nova foi gerada nesta sessão. Publicar agora atualiza <strong>só o elenco e
            as restrições</strong>, sem mexer na escala que está no ar.
          </Aviso>
        )}
        {impedido && (
          <Aviso tom="erro">
            A escala gerada <strong>não passou na validação</strong>. Publicar está bloqueado — volte
            em "Gerar escala" e veja quais regras foram violadas.
          </Aviso>
        )}
        {blocoNovo && !impedido && (
          <div className="text-sm text-gray-700 space-y-1 mb-4">
            <p>Vai ao ar a escala de <strong>{formatarBR(blocoNovo.inicio)}</strong> a <strong>{formatarBR(blocoNovo.fim)}</strong>.</p>
            <p className="text-gray-500 text-xs">
              {blocosParaPublicar.length} bloco(s) no total · o anterior é cortado em{' '}
              {formatarBR(somarDias(blocoNovo.inicio, -1))} e o que está antes disso não é tocado.
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button title={semToken
            ? 'Você entrou sem token — publique pelo botão ao lado, em duas paradas'
            : 'Grava a escala no repositório. O site atualiza em cerca de um minuto, sem sair do ar'}
            onClick={publicar}
            disabled={ocupado || impedido || semToken}
            className="px-5 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 disabled:bg-gray-300 flex items-center gap-2"
          >
            {ocupado ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {ocupado ? 'Publicando…' : 'Publicar'}
          </button>
          <button title="Baixa os arquivos e o guia com os dois endereços — dá para publicar sem token nenhum"
            onClick={() =>
              baixarPacoteManual([
                { nome: 'pessoas.json', dados: { versao: 1, pessoas } },
                ...(blocoNovo ? [{ nome: 'blocos.json', dados: { versao: 1, blocos: blocosParaPublicar } }] : []),
              ])
            }
            className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Baixar para publicar à mão
          </button>
        </div>

        {/*
          🔴 O CAMINHO SEM TOKEN, ESCANCARADO NA TELA — não escondido num arquivo baixado.
          Quem chega aqui sem token precisa saber, ANTES de clicar, que existe saída e que ela tem
          duas paradas. Subir em só uma das pastas é o erro que não avisa: ou o site não muda, ou
          muda e a próxima montagem desfaz.
        */}
        {/*
          Aberto por padrão para quem entrou SEM token: para essa pessoa, isto não é um detalhe
          escondido — é o único caminho de publicação que ela tem. Quem tem token acha o bloco
          recolhido, onde ele não estorva.
        */}
        <details open={semToken} className={clsx('mt-4 rounded-xl border', semToken ? 'border-amber-300 bg-amber-50' : 'border-gray-200 bg-gray-50')}>
          <summary className="cursor-pointer px-4 py-3 text-sm font-bold text-gray-700 select-none">
            {semToken ? 'Você entrou sem token — publique assim, em duas paradas' : 'Publicar sem token — as duas paradas'}
          </summary>
          <div className="px-4 pb-4 text-sm text-gray-600 space-y-3">
            <p>
              O botão <strong>Publicar</strong> usa o token porque o site é estático: não há servidor, e
              escrever no repositório pelo navegador só é possível pela API do GitHub. Sem token, o
              mesmo se faz à mão — e o arquivo precisa ir para <strong>as duas</strong> pastas abaixo.
            </p>
            {DESTINOS.map((d, i) => (
              <div key={d.pasta} className="rounded-lg border border-gray-200 bg-white p-3">
                <div className="font-mono text-xs font-bold text-gray-800">{i + 1}. {d.pasta}</div>
                <p className="text-xs text-gray-500 mt-1">{d.porque}</p>
                <a
                  href={d.url}
                  target="_blank"
                  rel="noreferrer"
                  title="Abre a página do GitHub já apontada para esta pasta"
                  className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-indigo-600 hover:underline"
                >
                  Abrir esta pasta no GitHub →
                </a>
              </div>
            ))}
            <p className="text-xs text-gray-500">
              Subir em só uma delas é o erro que não avisa: <strong>só {DESTINOS[1].pasta}</strong> muda o
              site agora e a próxima montagem desfaz; <strong>só {DESTINOS[0].pasta}</strong> não muda nada.
              O guia baixado repete isso, para quando você estiver no computador sem esta tela aberta.
            </p>
          </div>
        </details>

        <LevarParaOutroAparelho />

        {resultado && (
          <div className={clsx('mt-4 p-4 rounded-xl border text-sm whitespace-pre-wrap', resultado.ok ? 'bg-green-50 border-green-200 text-green-900' : 'bg-red-50 border-red-200 text-red-900')}>
            {resultado.texto}
          </div>
        )}
      </Cartao>

      <Historico segredos={segredos} />
    </>
  )
}

// ===========================================================================
// HISTÓRICO E REVERSÃO
// ===========================================================================

/**
 * Toda publicação é um commit — e é por isso que este painel existe sem ter dado trabalho.
 *
 * 🔴 Reverter aqui NÃO apaga nada. Ele lê o arquivo como estava naquele dia e o publica de novo,
 * como uma publicação nova. O erro continua registrado no histórico — e saber que ele existiu é o
 * que impede repeti-lo. Um "desfazer" que apaga o rastro rouba justamente a informação mais útil.
 */
const Historico: React.FC<{ segredos: Segredos }> = ({ segredos }) => {
  const [lista, setLista] = useState<Publicacao[] | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [revertendo, setRevertendo] = useState<string>('')
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null)

  const carregar = async () => {
    setCarregando(true)
    setErro('')
    try {
      setLista(await historicoPublicacoes(segredos.tokenGitHub))
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e))
    } finally {
      setCarregando(false)
    }
  }

  const voltar = async (p: Publicacao, arquivo: string) => {
    const quando = formatarQuando(p.quando)
    if (!confirm(
      `Voltar "${arquivo}" para como estava em ${quando}?\n\n` +
      'Isto não apaga nada: entra como uma publicação nova, e o histórico continua inteiro.\n' +
      'O site mostra a versão restaurada em cerca de um minuto.'
    )) return

    setRevertendo(`${p.sha}|${arquivo}`)
    setAviso(null)
    const r = await reverterPara(segredos.tokenGitHub, arquivo, p.sha, quando)
    setRevertendo('')
    setAviso(
      r.ok
        ? { ok: true, texto: `"${arquivo}" voltou para a versão de ${quando}. O site atualiza em cerca de um minuto.` }
        : { ok: false, texto: r.erro ?? 'Não foi possível reverter.' },
    )
    if (r.ok) carregar()
  }

  /*
   * *"Ao publicar, ele mantém o histórico e a versão está sendo usada. Isso é muito importante.
   * Com descrição amigável ao usuário"* — Flavio, 05/08/2026.
   *
   * O histórico já existia e a etiqueta "no ar" já marcava a versão vigente. O que faltava era
   * dizer, em português, O QUE ISSO SIGNIFICA: que nada é apagado, que voltar atrás não destrói a
   * versão atual, e que a de cima é exatamente a que os irmãos estão vendo agora.
   */
  return (
    <Cartao
      titulo="Histórico de publicações"
      subtitulo="Toda publicação fica guardada. A de cima é a que está no ar agora."
    >
      <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs leading-relaxed text-gray-600">
        Cada vez que você publica, a versão anterior <strong>não é apagada</strong> — ela fica aqui,
        com data e o que mudou. Se algo sair errado, <strong>Voltar a esta versão</strong> republica a
        escala como ela estava naquele dia; isso também vira uma publicação nova, então nada se perde
        e dá para desfazer o desfazer.
      </div>
      {!lista && !carregando && (
        <button title="Lista as publicações anteriores, com data e o que mudou"
          onClick={carregar}
          className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2"
        >
          <History className="w-4 h-4" /> Ver o histórico
        </button>
      )}

      {carregando && (
        <p className="text-sm text-gray-600 flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Lendo o histórico…
        </p>
      )}

      {erro && <Aviso tom="erro">{erro}</Aviso>}

      {aviso && (
        <div className={clsx('mb-4 p-3 rounded-xl border text-sm', aviso.ok ? 'bg-green-50 border-green-200 text-green-900' : 'bg-red-50 border-red-200 text-red-900')}>
          {aviso.texto}
        </div>
      )}

      {lista && lista.length === 0 && (
        <p className="text-sm text-gray-500">Nenhuma publicação ainda — a primeira será a sua.</p>
      )}

      {lista && lista.length > 0 && (
        <div className="space-y-2">
          {lista.map((p, i) => (
            <div key={p.sha} className={clsx('rounded-xl border p-3', i === 0 ? 'border-green-300 bg-green-50/50' : 'border-gray-200')}>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">
                    {p.mensagem}
                    {i === 0 && (
                      <span className="ml-2 text-[10px] uppercase tracking-wider bg-green-600 text-white px-1.5 py-0.5 rounded">
                        no ar
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatarQuando(p.quando)} · <span className="font-mono">{p.shaCurto}</span>
                    {p.arquivos.length > 0 && ` · ${p.arquivos.join(', ')}`}
                  </p>
                </div>
                {i > 0 && p.arquivos.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 shrink-0">
                    {p.arquivos.map((a) => (
                      <button title="Restaura este arquivo como estava nesta data. Não apaga nada: entra como publicação nova"
                        key={a}
                        onClick={() => voltar(p, a)}
                        disabled={revertendo !== ''}
                        className="px-2.5 py-1.5 text-xs font-semibold border border-amber-300 text-amber-800 bg-amber-50 rounded-lg hover:bg-amber-100 disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {revertendo === `${p.sha}|${a}` ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <RotateCcw className="w-3.5 h-3.5" />
                        )}
                        voltar {a.replace('.json', '')}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          <button title="Busca as publicações mais recentes" onClick={carregar} className="text-xs text-gray-500 hover:text-gray-800 underline mt-2">
            Atualizar a lista
          </button>
        </div>
      )}
    </Cartao>
  )
}

/** `2026-08-04T22:31:00Z` → `04/08/2026 às 19:31`, no fuso de São Paulo. */
function formatarQuando(iso: string): string {
  const d = new Date(iso)
  const data = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric',
  }).format(d)
  const hora = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit',
  }).format(d)
  return `${data} às ${hora}`
}

// ===========================================================================
// Peças de tela
// ===========================================================================

const Moldura: React.FC<{ titulo: string; subtitulo: string; children: React.ReactNode }> = ({ titulo, subtitulo, children }) => (
  <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-7 w-full max-w-md">
    <div className="flex items-center gap-3 mb-5">
      <div className="p-2.5 bg-indigo-50 rounded-2xl">
        <ShieldCheck className="w-6 h-6 text-indigo-600" />
      </div>
      <div>
        <h1 className="text-lg font-bold text-gray-900 leading-tight">{titulo}</h1>
        <p className="text-xs text-gray-500">{subtitulo}</p>
      </div>
    </div>
    {children}
  </div>
)

const Campo: React.FC<{
  rotulo: string; tipo?: 'texto' | 'senha'; valor: string
  aoMudar: (v: string) => void; dica?: string; aoEnter?: () => void
  /**
   * 🔴 `name` + `autocomplete` — acrescentados em 05/08/2026, e não são detalhe de formulário.
   *
   * Sem eles o Chrome NUNCA oferece "salvar senha", e o Flavio tinha de digitar a senha do cofre a
   * cada visita. O pedido dele era "entrou uma vez, fica liberado".
   *
   * A saída certa é o gerenciador de senhas do navegador — não guardar o token em claro. O token
   * continua cifrado; quem passa a lembrar a senha é o Chrome, que existe para isso e a guarda
   * melhor do que qualquer coisa que este site pudesse inventar.
   *
   * ⚠️ Nos campos de TOKEN e CHAVE DO MOTOR o valor é `off`: eles não são a senha da pessoa, e
   * oferecer para salvá-los junto faria o navegador propor a senha errada no retorno.
   */
  nome?: string
  autoCompletar?: string
}> = ({ rotulo, tipo = 'texto', valor, aoMudar, dica, aoEnter, nome, autoCompletar }) => {
  const [visivel, setVisivel] = useState(false)
  return (
    <label className="block mb-4">
      <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">{rotulo}</span>
      <div className="relative mt-1.5">
        <input
          type={tipo === 'senha' && !visivel ? 'password' : 'text'}
          name={nome}
          autoComplete={autoCompletar ?? (tipo === 'senha' ? 'off' : undefined)}
          value={valor}
          onChange={(e) => aoMudar(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && aoEnter?.()}
          className="w-full px-4 py-2.5 pr-11 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
        {/*
          🔴 O tamanho do botão aqui não é estética — é alcance de dedo.

          A primeira versão era só o ícone de 16px, sem área em volta, e a validação em celular
          mediu exatamente isso: alvo de toque de 16px. A recomendação da Apple é 44px e a do
          Material, 48. E o campo em questão é o do TOKEN — errar o toque e digitar por cima do que
          já está lá é caro.

          `w-11 h-11` dá 44px de alvo com o mesmo ícone de 16px no meio.
        */}
        {tipo === 'senha' && (
          <button
            title="Mostrar ou esconder o que você digitou"
            type="button"
            onClick={() => setVisivel(!visivel)}
            className="absolute right-1 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            {visivel ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {dica && <span className="block text-[11px] text-gray-400 mt-1 leading-snug">{dica}</span>}
    </label>
  )
}

const Botao: React.FC<{ aoClicar: () => void; ocupado?: boolean; icone: React.ComponentType<{ className?: string }>; children: React.ReactNode }> = ({ aoClicar, ocupado, icone: Icone, children }) => (
  <button title="Confirmar"
    onClick={aoClicar}
    disabled={ocupado}
    className="w-full mt-2 px-4 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
  >
    {ocupado ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icone className="w-4 h-4" />}
    {children}
  </button>
)

const Aviso: React.FC<{ tom: 'erro' | 'atencao'; children: React.ReactNode }> = ({ tom, children }) => (
  <div className={clsx('mb-4 p-3 rounded-xl text-sm border', tom === 'erro' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-amber-50 border-amber-200 text-amber-900')}>
    {children}
  </div>
)

const Cartao: React.FC<{ titulo: string; subtitulo?: string; tom?: 'ok' | 'erro'; children: React.ReactNode }> = ({ titulo, subtitulo, tom, children }) => (
  <section className={clsx('bg-white rounded-2xl border shadow-sm overflow-hidden', tom === 'erro' ? 'border-red-200' : tom === 'ok' ? 'border-green-200' : 'border-gray-200')}>
    <div className={clsx('px-5 py-4 border-b', tom === 'erro' ? 'bg-red-50 border-red-100' : tom === 'ok' ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100')}>
      <h2 className="font-bold text-gray-900">{titulo}</h2>
      {subtitulo && <p className="text-xs text-gray-500 mt-0.5">{subtitulo}</p>}
    </div>
    <div className="p-5">{children}</div>
  </section>
)

const Numero: React.FC<{ rotulo: string; valor: React.ReactNode }> = ({ rotulo, valor }) => (
  <div className="bg-gray-50 rounded-xl p-3 text-center">
    <div className="text-xl font-bold text-gray-900">{valor}</div>
    <div className="text-[11px] text-gray-500 uppercase tracking-wider">{rotulo}</div>
  </div>
)

/** Traduz dois placares em linhas comparáveis, marcando qual lado está melhor. */
function linhasDoPlacar(a: Placar, b: Placar) {
  const maiorMelhor = (x: number | null, y: number | null): 'a' | 'b' | undefined =>
    x == null || y == null ? undefined : x > y ? 'a' : y > x ? 'b' : undefined
  const menorMelhor = (x: number, y: number): 'a' | 'b' | undefined =>
    x < y ? 'a' : y < x ? 'b' : undefined

  return [
    { rotulo: 'Menor intervalo (dias) — maior é melhor', a: a.menorIntervalo ?? '-', b: b.menorIntervalo ?? '-', melhor: maiorMelhor(a.menorIntervalo, b.menorIntervalo) },
    { rotulo: 'Intervalo médio (dias) — maior é melhor', a: a.intervaloMedio, b: b.intervaloMedio, melhor: maiorMelhor(a.intervaloMedio, b.intervaloMedio) },
    { rotulo: 'Diferença de carga — menor é melhor', a: a.amplitudeCarga, b: b.amplitudeCarga, melhor: menorMelhor(a.amplitudeCarga, b.amplitudeCarga) },
    { rotulo: 'Grupos repetidos 3+ vezes — menor é melhor', a: a.gruposRepetidos, b: b.gruposRepetidos, melhor: menorMelhor(a.gruposRepetidos, b.gruposRepetidos) },
    { rotulo: 'Turnos completos', a: a.turnosCompletos, b: b.turnosCompletos, melhor: undefined },
  ] as { rotulo: string; a: React.ReactNode; b: React.ReactNode; melhor?: 'a' | 'b' }[]
}

export { Save }
