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
import React, { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle, CheckCircle, Download, Eye, EyeOff, KeyRound, Loader2, LogOut, Phone, Plus, RefreshCw,
  History, RotateCcw, ShieldCheck, Trash2, Upload, X, XCircle,
} from 'lucide-react'
import { clsx } from 'clsx'
import { abrirCofre, apagarCofre, cofreExiste, exportarCofre, gravarCofre, importarCofre, type Segredos } from './cofre'
import { baixarPacoteManual, COMO_CRIAR_O_TOKEN, conferirToken, DESTINOS, historicoPublicacoes, lerDadosNoCommit, publicarDados, reverterPara, type Publicacao } from './github'
import { completarConfig, retratoPublicado, type ConfigLida, type DadosPublicados } from '../dados/carregar'
import type { ArquivoBlocos, ArquivoPessoas, Bloco, Configuracao, Pessoa, TipoTurno, Turno } from '../dominio/tipos'
import { ROTULO_TURNO } from '../dominio/tipos'
import { idDoNome } from '../utils/nomes'
import { normalizarTelefone, formatarTelefone } from '../utils/telefone'
import { construirGrade, diaTemCulto } from '../dominio/malha'
import { gerarVariasVersoes } from '../dominio/gerador'
import { distribuir } from '../dominio/estatisticas'
import { validar, resumir } from '../dominio/validacao'
import { CATALOGO, menorIntervalo } from '../dominio/regras'
import { conferirPorFora } from '../dominio/conferencia-independente'
import { conferirBuracoNaEscala, conferirPassadoPreservado, conferirReversao, cotaMensalJaPublicada, montarBlocosParaPublicar, publicacaoImpedida, travaDeDataRetroativa } from '../dominio/blocos'
import { diaDaSemana, diferencaEmDias, ehDataValida, formatarBR, sugerirFim, hojeSaoPaulo, NOMES_DIA, NOMES_DIA_CURTO, ROTULO_MES, somarDias } from '../dominio/datas'
import { AbaAjustar } from './AbaAjustar'
import { lerRascunho, gravarRascunho, limparRascunho, type Rascunho } from './rascunho'
import { arbitrar, auditar, medir, pedirProposta, type Placar, type ProgressoMotor } from './motor'
import { Sparkles } from 'lucide-react'

type Aba = 'elenco' | 'gerar' | 'ajustar' | 'conferir' | 'publicar'

/**
 * 🔴 P4.1 — UMA GRAVAÇÃO POR VEZ, e a trava mora FORA do componente.
 *
 * Achada pela auditoria independente de 04/08/2026: `AbaPublicar` é montada por condição, então
 * **trocar de aba a desmonta** — mas a promessa que já está na rede continua correndo. Ao voltar,
 * uma instância nova nascia com `ocupado = false` e deixava clicar Publicar de novo. Medido ao vivo:
 * duas chamadas independentes à API, e a tela mostrando só o resultado da segunda.
 *
 * ⚠️ A trava é MODULAR de propósito: `useState` e `useRef` morrem com o componente, e é justamente
 * a morte do componente que abre a porta. Um módulo sobrevive à troca de aba — e à do `Admin`.
 *
 * 🔴 Em 05/08/2026 ela passou a cobrir também a REVERSÃO, que grava os mesmos dois arquivos e
 * escapava por não ser "publicação". Guarda o QUE está gravando, para a mensagem poder dizer.
 */

let gravacaoEmVoo: string | null = null

/**
 * 🔴 O MOTOR TAMBÉM TEM DE SOBREVIVER À TROCA DE ABA — quinta auditoria externa, 05/08/2026.
 *
 * `AbaGerar` guardava o progresso do motor em `useState` local. Trocar de aba apagava o indicador,
 * **a chamada continuava correndo** (não há `AbortController`), e o operador clicava de novo: duas
 * execuções do motor em paralelo, pagas. É o mesmo P4.1 que já tinha sido corrigido na publicação e
 * não tinha sido corrigido aqui.
 *
 * Guarda o PROGRESSO, e não um `boolean`, para que a aba remontada volte mostrando em que fase a
 * chamada está — em vez de nascer limpa sobre um trabalho que continua correndo.
 */
let motorEmVoo: ProgressoMotor | null = null

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
        nome="token-github"
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
        nome="chave-do-motor"
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

const Entrar: React.FC<{ aoAbrir: (s: Segredos) => void; identidade: Configuracao['identidade'] }> = ({ aoAbrir, identidade }) => {
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
    <Moldura titulo="Área administrativa" subtitulo={`${identidade.titulo} — ${identidade.subtitulo}`}>
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
        className="w-full mt-3 text-xs text-gray-600 hover:text-gray-800 underline"
      >
        Esqueci a senha — configurar de novo
      </button>
    </Moldura>
  )
}

// ===========================================================================
// ADMIN
// ===========================================================================

export const Admin: React.FC<{ dados: DadosPublicados }> = ({ dados: dadosIniciais }) => {
  /**
   * 🔴 O RETRATO DO PUBLICADO É ESTADO, NÃO PROP — quinta auditoria externa, 05/08/2026.
   *
   * `carregarDados()` roda uma vez, no `main.tsx`. Enquanto este objeto era uma prop congelada,
   * **publicar duas vezes na mesma sessão apagava a primeira publicação** — a segunda montava os
   * blocos contra o retrato de antes da primeira. Medido: out→dez sumia inteiro (55 turnos), e o
   * guarda do passado aprovava com `perdidos: 0`, porque recebia o mesmo retrato envelhecido.
   *
   * A `fronteira` saía do mesmo lugar: para gerar janeiro, a última escala de alguém era lida como
   * 27/09 em vez de 27/12 — e o gerador o escalava em 01/01, um dia depois de servir em 31/12.
   *
   * Agora, quem grava atualiza o retrato com o que gravou (`retratoPublicado`). Ver ali por que
   * reler da rede seria pior.
   */
  /*
    🔴 O RASCUNHO — 06/08/2026, pedido do dono: *"você altera e elas voltam (…) quando eu salvar,
    tem que ficar fixo. Inclusive as datas."*

    Medido antes de escrever: mudar De, Até, pessoas por turno e acrescentar uma Santa Ceia, e
    recarregar — **voltava tudo ao padrão**. Nada desta área sobrevivia a um F5, só o que fosse
    PUBLICADO. E publicar é um gesto grande demais para guardar um ajuste em andamento.

    Lido UMA vez, aqui, antes de qualquer estado — ler dentro de vários inicializadores daria
    leituras diferentes se alguém gravasse no meio.
  */
  const rascunhoInicial = useMemo(() => lerRascunho(), [])

  const [dados, setDados] = useState<DadosPublicados>(dadosIniciais)
  const [segredos, setSegredos] = useState<Segredos | null>(null)
  const [aba, setAba] = useState<Aba>('elenco')
  const [pessoas, setPessoas] = useState<Pessoa[]>(
    () => (rascunhoInicial?.pessoas ?? dados.pessoas).map((p) => ({ ...p, restricoes: { ...p.restricoes } })),
  )
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
  const [config, setConfig] = useState<Configuracao>(() => ({ ...(rascunhoInicial?.config ?? dados.config) }))
  const [blocoNovo, setBlocoNovo] = useState<Bloco | null>(null)
  /** O bloco como o gerador o entregou — a referência para o "desfazer tudo" do ajuste manual. */
  const [blocoOriginal, setBlocoOriginal] = useState<Bloco | null>(null)
  const [relatoGeracao, setRelatoGeracao] = useState<string>('')
  /**
   * 🔴 QUANTAS VERSÕES FORAM COMPARADAS — e por que este número mora AQUI, e não na aba.
   *
   * Ele vivia dentro de `AbaGerar`. A aba é montada por condição, então **trocar de aba a
   * desmonta** — e ao voltar, uma instância nova nascia com `0`, enquanto a escala (que mora aqui)
   * sobrevivia. A tela passava a dizer *"esta escala é a melhor de 0 versões"* sobre uma escala que
   * existia e tinha sido escolhida entre oito.
   *
   * Achado pela verificação visual de 05/08/2026 — nenhum teste pegava, porque o defeito só existe
   * depois de **navegar**. É a mesma classe do P4.1: estado que descreve o bloco tem de viver onde
   * o bloco vive.
   */
  const [versoesComparadas, setVersoesComparadas] = useState(0)
  /**
   * Se a escala na tela saiu de um "Não gostei" — muda o que a frase abaixo do botão pode prometer.
   *
   * Mora aqui, junto do bloco e de `versoesComparadas`, pelo mesmo motivo que aquele subiu da aba:
   * trocar de aba desmonta `AbaGerar`, e um estado que descreve o bloco tem de viver onde o bloco
   * vive — senão a frase volta a zero enquanto a escala continua lá.
   *
   * É DERIVADO de `executar` ter recebido uma escala recusada, não de um clique. Gerar do zero passa
   * sem `recusada` e o desliga sozinho; não há um segundo lugar para esquecer de atualizar.
   */
  const [jaRecusouAlguma, setJaRecusouAlguma] = useState(false)

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
  const [de, setDe] = useState(() => rascunhoInicial?.de || inicioSugerido)
  /*
    🔴 O FIM SUGERIDO NÃO PODE NASCER CURTO DEMAIS — achado da verificação visual de 05/08/2026.

    Era sempre 31/12 do ano do INÍCIO. Depois de publicar até 30/12, o início sugerido virou 31/12,
    o fim virou 31/12, e a aba abria com uma janela de UM dia numa quinta-feira — que a malha não
    tem. Quem clicasse em Gerar recebia "a escala ficou inválida".

    Menos de 30 dias de janela quase nunca é o que a pessoa quer, e no fim do ano é sempre errado.
    Aí o fim salta para 31/12 do ano SEGUINTE.
  */
  const [ate, setAte] = useState(() => rascunhoInicial?.ate || sugerirFim(inicioSugerido))

  /*
    🔴 GUARDA A CADA MUDANÇA, e não num botão "salvar".

    Botão de salvar cria a pergunta *"eu salvei?"* — e a resposta errada custa o trabalho todo. O
    dono descreveu justamente o sintoma disso: *"você altera e elas voltam"*. Guardar sozinho tira a
    pergunta da frente dele.

    ⚠️ Isto **não publica nada**. Vive no navegador deste aparelho até ele apertar Publicar — e é
    por isso que pode guardar qualquer coisa sem risco para quem lê a escala.
  */
  useEffect(() => {
    gravarRascunho({ de, ate, config, pessoas })
  }, [de, ate, config, pessoas])

  /**
   * 🔴 UMA GRAVAÇÃO POR VEZ — e ela cobre PUBLICAR **e** REVERTER, desde 05/08/2026.
   *
   * A trava de P4.1 olhava só o botão Publicar. `Voltar a esta versão`, logo abaixo na mesma tela,
   * grava **os mesmos arquivos** e não a consultava. Como são arquivos diferentes, não há colisão de
   * `sha` no GitHub e o 409 não salva: o desfecho é elenco antigo com escala nova, e o sintoma que
   * chega ao irmão é o **id cru no lugar do nome**.
   *
   * `gravacaoEmVoo` (módulo) é a AUTORIDADE: ela sobrevive à desmontagem da aba e até à do `Admin`
   * inteiro, que é a porta por onde a trava anterior escapava. O estado ao lado existe só para o
   * botão poder ficar cinza — os dois são escritos sempre juntos, pelas duas funções abaixo.
   */
  /**
   * 🔴 REVERTER E PUBLICAR EM SEGUIDA DESFAZIA A REVERSÃO — sexta auditoria externa, 05/08/2026.
   *
   * A correção da manhã fez o **retrato** (`dados`) acompanhar quem grava. Mas `publicar()` não sobe
   * `dados.pessoas`: sobe o estado `pessoas`, que nasce de um inicializador preguiçoso e **nunca mais
   * é reescrito**. Ou seja, a correção mexeu na variável errada — `dados` alimenta a montagem dos
   * blocos e a fronteira, não o que vai para o arquivo.
   *
   * Medido ao vivo, com a API mocada: reverter o elenco, ver a mensagem verde, clicar Publicar —
   * e o nome que a reversão tinha trocado **volta**. O administrador acredita que reverteu; o site
   * serve o elenco que ele quis descartar.
   *
   * `config` é pior ainda: `configMudou` compara `config` (velho) com `dados.config` (revertido),
   * então a publicação seguinte passa a **decidir ativamente** republicar a configuração antiga —
   * título, vocabulário, capacidade padrão, malha e Santa Ceia.
   *
   * ⚠️ POR QUE ISTO É SEPARADO DE `aoGravar`, e não um sincronismo em toda gravação: numa publicação
   * com falha parcial, `dados.config` fica sendo o ANTIGO de propósito (não foi gravado) — e copiá-lo
   * de volta para o estado apagaria a edição que a pessoa acabou de fazer e ainda quer publicar.
   * Reverter é o único caso em que o arquivo lido do passado **é** a intenção declarada.
   */
  const aoReverter = (d: DadosPublicados, arquivo: string) => {
    setDados(d)
    if (arquivo === 'pessoas.json') setPessoas(d.pessoas.map((p) => ({ ...p, restricoes: { ...p.restricoes } })))
    if (arquivo === 'config.json') setConfig({ ...d.config })
  }

  /**
   * 🔴 E OS CAMPOS DE PERÍODO TAMBÉM NÃO ACOMPANHAVAM — mesma auditoria (F7).
   *
   * `inicioSugerido` é `useMemo` sobre `dados.blocos` e recalcula; mas `useState(inicioSugerido)`
   * ignora o valor novo, por definição do React. Depois da primeira publicação da sessão, os campos
   * continuavam **no período que acabou de ir ao ar** — com cara de certo.
   *
   * Medido: publicar jan→mar/2027 e voltar à aba deixava `De = 01/01/2027`. Mudar só o "Até" e gerar
   * reescreveria, com outra semente, a escala que os irmãos já receberam. `conferirPassadoPreservado`
   * não pega — regerar o MESMO período não perde turno nenhum, só troca as pessoas — e `min` só
   * protege o passado do calendário, não o já publicado.
   */
  const aoGravar = (d: DadosPublicados) => {
    setDados(d)
    /*
      🔴 PUBLICOU: O RASCUNHO CUMPRIU O PAPEL E SAI DE CENA.

      Ele existe para segurar trabalho em andamento. Depois de publicar, o que está no ar É a
      verdade — manter o rascunho aqui faria a tela abrir mostrando um "em andamento" que já virou
      publicado, e a pessoa nunca saberia qual dos dois está vendo.

      Os campos abaixo são repostos na sequência, e o efeito de gravação guarda os novos valores.
    */
    limparRascunho()
    const ultimo = d.blocos.flatMap((b) => b.turnos).map((t) => t.data).sort().at(-1)
    if (!ultimo) return
    const seguinte = somarDias(ultimo, 1)
    const amanha = somarDias(hojeSaoPaulo(), 1)
    const novoDe = diferencaEmDias(ultimo, amanha) < 0 ? seguinte : amanha
    setDe(novoDe)
    // A mesma regra do domínio, num lugar só: duas cópias divergem em silêncio (já divergiram).
    setAte(sugerirFim(novoDe))
  }

  const [gravando, setGravando] = useState<string | null>(gravacaoEmVoo)
  const tomarGravacao = (oQue: string): boolean => {
    if (gravacaoEmVoo) return false
    gravacaoEmVoo = oQue
    setGravando(oQue)
    return true
  }
  const soltarGravacao = () => {
    gravacaoEmVoo = null
    setGravando(null)
  }

  /**
   * A fronteira com os blocos anteriores — quem trabalhou na véspera não pode entrar no dia 1.
   *
   * 🔴 ESTA CORREÇÃO ESTAVA MARCADA COMO FECHADA E NUNCA TINHA SIDO FEITA — sétima auditoria externa
   * (regressão), 05/08/2026. O `BACKLOG.md` afirmava *"P7.7 · ✅ FECHADO 05/08 — dentro de
   * `useMemo`"*, e `git blame` mostrava as nove linhas intactas desde 04/08. O que foi memoizado
   * naquele dia foi um `fronteira` **homônimo e diferente**, dentro de `AbaGerar`.
   *
   * ⚠️ E havia uma razão estrutural para o engano: o cálculo vivia **depois** do `return` condicional
   * do login, onde um hook é ilegal — a correção prometida era impossível ali sem mover o código. Por
   * isso ele subiu para cá, antes do `if (!segredos)`.
   *
   * O custo do defeito: objeto novo a cada render, passado como prop para `AbaAjustar` e
   * `AbaConferirPorFora`, cujos `useMemo` dependem dele. Identidade nova zera os memos, e `validar()`
   * (17 regras) e `conferirPorFora()` (a segunda régua) recalculavam **a cada clique**.
   *
   * É a mesma classe do P4.5 — *"item marcado FECHADO com o defeito intacto"* — que este projeto já
   * registrou uma vez. O `BACKLOG.md` promete: **item que sai sem prova volta.**
   */
  const fronteira = useMemo(() => {
    const f: Record<string, string> = {}
    if (!blocoNovo) return f
    for (const b of dados.blocos) {
      for (const t of b.turnos) {
        if (diferencaEmDias(t.data, blocoNovo.inicio) <= 0) continue
        for (const id of t.pessoas) if (!f[id] || t.data > f[id]) f[id] = t.data
      }
    }
    return f
  }, [dados.blocos, blocoNovo])

  if (!segredos) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        {cofreExiste() ? <Entrar aoAbrir={setSegredos} identidade={config.identidade} /> : <PrimeiroAcesso aoAbrir={setSegredos} />}
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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-base font-bold text-gray-900 truncate">Área administrativa</h1>
            <p className="text-xs text-gray-500">{config.identidade.titulo} · {config.identidade.subtitulo}</p>
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
            versoesComparadas={versoesComparadas}
            segredos={segredos}
            de={de}
            ate={ate}
            rascunhoInicial={rascunhoInicial}
            aoMudarDe={setDe}
            aoMudarAte={setAte}
            aoMudarPessoas={setPessoas}
            config={config}
            aoMudarConfig={setConfig}
            jaRecusouAlguma={jaRecusouAlguma}
            aoGerar={(b, r, versoes, veioDeRecusa) => { setBlocoNovo(b); setBlocoOriginal(b); setRelatoGeracao(r); setVersoesComparadas(versoes ?? 0); setJaRecusouAlguma(veioDeRecusa === true) }}
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
          <AbaConferirPorFora
            bloco={blocoNovo}
            pessoas={pessoas}
            config={config}
            fronteira={fronteira}
            cotaAnterior={cotaMensalJaPublicada(dados.blocos, blocoNovo.inicio)}
          />
        )}
        {aba === 'publicar' && (
          <AbaPublicar
            dados={dados}
            pessoas={pessoas}
            config={config}
            blocoNovo={blocoNovo}
            segredos={segredos}
            aoGravar={aoGravar}
            aoReverter={aoReverter}
            gravando={gravando}
            tomarGravacao={tomarGravacao}
            soltarGravacao={soltarGravacao}
          />
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
    // 🔴 Era `replace(/[^a-z0-9]+/g, '_')` cru aqui. Um nome escrito inteiro fora do alfabeto latino
    // — 李明, Дмитрий — virava `_`, e o SEGUNDO irmão nessa situação colidia com o primeiro. O
    // produto é vendido como genérico; a congregação que escreve em outro alfabeto não pode depender
    // de sorte. Ver `src/utils/nomes.ts`.
    const id = idDoNome(nome)
    if (!id) return alert('Esse nome não tem nenhuma letra ou número. Escreva o nome da pessoa.')
    // E o aviso fala do NOME, que foi o que a pessoa digitou — "identificador" é palavra nossa.
    if (pessoas.some((p) => p.id === id)) {
      const jaTem = pessoas.find((p) => p.id === id)!
      return alert(`Já existe alguém cadastrado como "${jaTem.nome}". Se forem duas pessoas diferentes, acrescente o sobrenome.`)
    }
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
            id="novo-nome"
            name="novo-nome"
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
        <button title="Abre e fecha as restrições desta pessoa" onClick={() => setAberto(!aberto)} className="flex-1 text-left min-w-0">
          <div className="font-semibold text-gray-900 flex items-center gap-2">
            {pessoa.nome}
            {!pessoa.ativo && <span className="text-[10px] uppercase tracking-wider bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">fora</span>}
            {pessoa.telefone && (
              <span title="Recebe lembrete individual no WhatsApp" className="text-green-600">
                <Phone className="w-3.5 h-3.5" />
              </span>
            )}
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
          <ContatoWhatsApp pessoa={pessoa} aoAlterar={aoAlterar} />
          <LinhaDias titulo="Só pode nestes dias" selecionados={r.diasPermitidos ?? []} aoAlternar={(d) => alternarDia('diasPermitidos', d)} />
          <LinhaDias titulo="Nunca pode nestes dias" selecionados={r.diasProibidos ?? []} aoAlternar={(d) => alternarDia('diasProibidos', d)} tom="vermelho" />
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Só pode nestes turnos</p>
            <div className="flex gap-2">
              {(['MANHA', 'TARDE', 'NOITE'] as TipoTurno[]).map((t) => (
                <button title="Liga e desliga este turno para a pessoa"
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
              id={`teto-mensal-${pessoa.id}`}
              name={`teto-mensal-${pessoa.id}`}
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

/**
 * NOME COMPLETO + TELEFONE — o lembrete individual do WhatsApp (S-064, 19/08/2026).
 *
 * "Essa lista tem que ficar aberta, não é para apagar" (palavras do Flavio): não existe botão de
 * remover aqui — o mesmo X que tira a pessoa da escala (`ativo: false`) também para de mandar
 * mensagem para ela, sem precisar de um segundo controle.
 *
 * O telefone digitado (parênteses, traço, +55, o que for) só vira o formato que a Evolution API
 * exige (dígitos com DDI 55) quando o campo perde o foco — normalizar a cada tecla faria o cursor
 * pular durante a digitação. Ver `src/utils/telefone.ts`.
 */
const ContatoWhatsApp: React.FC<{ pessoa: Pessoa; aoAlterar: (m: (p: Pessoa) => Pessoa) => void }> = ({ pessoa, aoAlterar }) => {
  const [telefoneDigitado, setTelefoneDigitado] = useState(pessoa.telefone ? formatarTelefone(pessoa.telefone) : '')

  useEffect(() => {
    setTelefoneDigitado(pessoa.telefone ? formatarTelefone(pessoa.telefone) : '')
  }, [pessoa.telefone])

  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
        Lembrete individual no WhatsApp
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <input
          id={`nome-completo-${pessoa.id}`}
          name={`nome-completo-${pessoa.id}`}
          title="Como chamar esta pessoa na mensagem — ex.: “Carlos Henrique”. Vazio usa o nome de sempre"
          value={pessoa.nomeCompleto ?? ''}
          onChange={(e) => aoAlterar((p) => ({ ...p, nomeCompleto: e.target.value || undefined }))}
          placeholder={`Nome completo (ex.: "${pessoa.nome}")`}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
        <input
          id={`telefone-contato-${pessoa.id}`}
          name={`telefone-contato-${pessoa.id}`}
          title="Telefone do WhatsApp desta pessoa — sem ele, ela não recebe lembrete individual"
          type="tel"
          value={telefoneDigitado}
          onChange={(e) => setTelefoneDigitado(e.target.value)}
          onBlur={() => {
            const normalizado = normalizarTelefone(telefoneDigitado)
            /*
              🔴 Sem esta guarda, um telefone digitado errado (ex.: "123") era SILENCIOSAMENTE
              apagado ao sair do campo — a pessoa não via aviso nenhum, só sumia o que tinha
              digitado. Só reformata/grava quando dá para normalizar; se não der, o texto cru fica
              no campo e o aviso vermelho (abaixo) continua visível até a pessoa corrigir ou apagar.
            */
            if (!telefoneDigitado.trim()) {
              aoAlterar((p) => ({ ...p, telefone: undefined }))
              return
            }
            if (!normalizado) return
            aoAlterar((p) => ({ ...p, telefone: normalizado }))
            setTelefoneDigitado(formatarTelefone(normalizado))
          }}
          placeholder="(11) 99999-9999"
          className={clsx(
            'px-3 py-2 border rounded-lg text-sm',
            telefoneDigitado && !normalizarTelefone(telefoneDigitado) ? 'border-red-300 bg-red-50' : 'border-gray-300',
          )}
        />
      </div>
      {telefoneDigitado && !normalizarTelefone(telefoneDigitado) && (
        <p className="text-xs text-red-600 mt-1">Esse telefone não ficou com DDD + número reconhecível — confira.</p>
      )}
    </div>
  )
}

const LinhaDias: React.FC<{ titulo: string; selecionados: number[]; aoAlternar: (d: number) => void; tom?: 'vermelho' }> = ({ titulo, selecionados, aoAlternar, tom }) => (
  <div>
    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{titulo}</p>
    <div className="flex gap-1.5 flex-wrap">
      {NOMES_DIA_CURTO.map((n, d) => (
        <button title="Liga e desliga este dia da semana para a pessoa"
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
          <input id={`ausencia-de-${pessoa.id}`} name={`ausencia-de-${pessoa.id}`} type="date" value={de} onChange={(e) => setDe(e.target.value)} className="block px-2 py-1.5 border border-gray-300 rounded-lg text-sm" />
        </label>
        <label className="text-xs text-gray-500">
          até
          <input id={`ausencia-ate-${pessoa.id}`} name={`ausencia-ate-${pessoa.id}`} type="date" value={ate} onChange={(e) => setAte(e.target.value)} className="block px-2 py-1.5 border border-gray-300 rounded-lg text-sm" />
        </label>
        <input id={`ausencia-motivo-${pessoa.id}`} name={`ausencia-motivo-${pessoa.id}`} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="motivo (opcional)" className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm flex-1 min-w-[8rem]" />
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

  /**
   * Só as ausências que TOCAM o período — as de outro ano não informam nada aqui.
   *
   * 🔴 E só de quem está ATIVO — quinta auditoria externa, 05/08/2026. Ela percorria `pessoas` cru,
   * então listava a ausência de gente que já saiu da escala. É a mesma reclamação do Flavio que
   * originou `pessoasDoBloco` em `regras.ts`: *"eu deixei o Thiago de fora; você, ainda assim,
   * contou ele. Quem está fora da escala não deve ser contado para nada."* A porta era outra, e o
   * conserto de lá não tinha chegado até aqui.
   */
  const noPeriodo = ativos.flatMap((p) =>
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
          <select id="ausencia-antes-quem" name="ausencia-antes-quem" value={quem} onChange={(e) => setQuem(e.target.value)}
            title="A pessoa que estará ausente"
            className="mt-1 block min-w-[10rem] rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
          >
            <option value="">escolha…</option>
            {ativos.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
        </label>
        <label className="text-xs text-gray-500">
          primeiro dia
          <input id="ausencia-antes-inicio" name="ausencia-antes-inicio" type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} title="Primeiro dia da ausência"
            className="mt-1 block rounded-lg border border-gray-300 px-2 py-1.5 text-sm" />
        </label>
        <label className="text-xs text-gray-500">
          último dia
          <input id="ausencia-antes-fim" name="ausencia-antes-fim" type="date" value={fim} onChange={(e) => setFim(e.target.value)} title="Último dia da ausência (inclusive)"
            className="mt-1 block rounded-lg border border-gray-300 px-2 py-1.5 text-sm" />
        </label>
        <input id="ausencia-antes-motivo" name="ausencia-antes-motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="motivo (opcional)"
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
  /** A cota mensal já publicada — as DUAS réguas precisam dela, ou as duas erram junto. */
  cotaAnterior: Record<string, Record<string, number>>
}> = ({ bloco, pessoas, config, fronteira, cotaAnterior }) => {
  const porFora = useMemo(
    () => conferirPorFora(bloco, pessoas, config, fronteira, cotaAnterior),
    [bloco, pessoas, config, fronteira, cotaAnterior],
  )
  const oficial = useMemo(
    () => validar({ bloco, pessoas, ultimaEscalaAnterior: fronteira, config, escalasPorMesAnterior: cotaAnterior }),
    [bloco, pessoas, fronteira, config, cotaAnterior],
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
                {a.furos.length > 5 && <p className="mt-1 text-xs text-gray-600">e mais {a.furos.length - 5}</p>}
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
  /*
    🔴 A PROP `fronteira` FOI REMOVIDA — achado da auditoria externa de 05/08/2026.

    Ela era declarada aqui e passada pelo `Admin`, mas **nunca aparecia na desestruturação** — um
    `useMemo` local, logo abaixo, a sombreava. Quem lesse o `Admin` concluiria que a geração usa a
    fronteira de lá; não usa.

    E as duas divergiam: a do `Admin` é chaveada por `blocoNovo.inicio` e fica `{}` enquanto não há
    bloco; a local é chaveada por `de`. Mudar "De" depois de gerar recalculava só a local, e o
    relatório desta aba podia divergir do das abas Conferir e Publicar — duas noções da mesma coisa,
    que é a fonte dupla que este projeto inteiro existe para evitar.

    A local fica, porque é a certa para esta aba: ela precisa da fronteira do período que está sendo
    DIGITADO, não do que já foi gerado.
  */
  /** O intervalo vive no Admin: trocar de aba desmontava esta e apagava o que estava digitado. */
  de: string
  ate: string
  /*
    🔴 VEM POR PROP, e não de uma segunda leitura aqui dentro. A primeira versão relia o
    `localStorage` dentro desta aba — e aí enxergava o rascunho que o próprio efeito de gravação
    tinha acabado de criar, na montagem. Resultado medido: o aviso *"você deixou em andamento"*
    aparecia numa tela limpa, e continuava aparecendo logo após DESCARTAR.

    Quem lê o rascunho é o `Admin`, uma vez, ANTES de qualquer gravação. Duas leituras da mesma
    coisa em momentos diferentes são duas verdades.
  */
  rascunhoInicial: Rascunho | null
  aoMudarDe: (v: string) => void
  aoMudarAte: (v: string) => void
  aoMudarPessoas: (p: Pessoa[]) => void
  config: Configuracao
  aoMudarConfig: (c: Configuracao) => void
  aoGerar: (b: Bloco | null, relato: string, versoesComparadas?: number, veioDeRecusa?: boolean) => void
  versoesComparadas: number
  jaRecusouAlguma: boolean
}> = ({ dados, pessoas, blocoNovo, relato, segredos, de, ate, rascunhoInicial, aoMudarDe, aoMudarAte, aoMudarPessoas, config, aoMudarConfig, aoGerar, versoesComparadas, jaRecusouAlguma }) => {
  const [ocupado, setOcupado] = useState(false)
  const [falha, setFalha] = useState<string>('')
  /** Muda a cada "gerar outra combinação" — é o que faz a próxima rodada explorar outro caminho. */
  const [sementeBase, setSementeBase] = useState(1)
  /** A última rodada devolveu a MESMA escala? Acontece, e a tela tem de dizer em vez de fingir. */
  const [repetiu, setRepetiu] = useState(false)
  /** Nasce do que está em voo: a aba remontada volta mostrando a fase, não uma tela limpa. */
  const [motorOcupado, setMotorOcupadoLocal] = useState<ProgressoMotor | null>(motorEmVoo)
  /** Os dois são escritos SEMPRE juntos — o módulo é a autoridade, o estado só pinta. */
  const setMotorOcupado = (p: ProgressoMotor | null) => {
    motorEmVoo = p
    setMotorOcupadoLocal(p)
  }
  const [motorErro, setMotorErro] = useState<string>('')
  const [propostaMotor, setPropostaMotor] = useState<{ bloco: Bloco; explicacao: string } | null>(null)
  const [auditoria, setAuditoria] = useState<string>('')
  const [arbitragem, setArbitragem] = useState<string>('')

  /*
    🔴 A FRONTEIRA É FUNÇÃO DA DATA, e por isso virou função de verdade.

    Ela era um `useMemo` sobre o `de` do ESTADO. Quando o botão "Corrigir a data" muda `de` e gera na
    mesma ação, o `useMemo` ainda tem o valor velho — e a fronteira sairia excluindo os turnos entre a
    data velha e a nova. Ou seja: quem serviu em 16/12 a 30/12 entraria como "sem escala anterior", e
    o gerador poderia escalá-lo no dia seguinte.

    Mesma raiz da semente e do `de`: valor que a tela acabou de mudar não está no closure.
  */
  const fronteiraEm = (data: string) => {
    const f: Record<string, string> = {}
    for (const b of dados.blocos) {
      for (const t of b.turnos) {
        if (diferencaEmDias(t.data, data) <= 0) continue
        for (const id of t.pessoas) if (!f[id] || t.data > f[id]) f[id] = t.data
      }
    }
    return f
  }
  /** A fronteira do que está DIGITADO — é o que a tela mostra e o que a validação usa. */
  const fronteira = useMemo(() => fronteiraEm(de), [dados, de])

  /**
   * 🔴 A SEMENTE VEM POR ARGUMENTO — quinta auditoria externa, 05/08/2026.
   *
   * "Não gostei — gerar outra combinação" fazia `setSementeBase(n => n + 100)` e, na linha seguinte,
   * `setTimeout(executar, 30)`. O `setTimeout` guarda o **objeto função deste render**, e o render
   * novo cria outro `executar`: o agendado continuava sendo o velho, com a semente velha. Medido ao
   * vivo, o botão ficava permanentemente **um clique atrasado** — o primeiro clique devolvia a
   * escala idêntica (7036 caracteres, byte a byte), e só do segundo em diante mudava.
   *
   * Passar a semente como argumento tira o valor do closure e acaba com a classe inteira.
   */
  /*
    🔴 O `de` TAMBÉM VAI POR ARGUMENTO — e a razão é a mesma da semente, medida duas vezes no mesmo dia.

    Em 05/08/2026 o botão "gerar outra combinação" ficava um clique atrasado porque `setTimeout`
    guardava a função do render anterior. Horas depois, ao acrescentar o botão "Corrigir a data e
    gerar de novo", eu **repeti o defeito**: `aoMudarDe(novaData)` seguido de `executar()` gerava com
    a data VELHA, e o aviso não sumia. Medido ao vivo: o campo mostrava 31/12/2026 e a escala saía de
    15/12.

    Valor que a tela acabou de mudar não está no closure desta função. Passa por argumento, sempre.
  */
  /*
    🔴 E A ESCALA RECUSADA VAI PELO MESMO CAMINHO — 06/08/2026, e desta vez o defeito era mais fundo
    que o closure.

    Palavras dele: *"distanciamento por pessoa, mesmo clicando várias vezes não muda nada, o 'Não
    gostei — gerar outra combinação' é uma farsa."* Medido: a semente estava certa e as oito versões
    saíam **distintas** — mas a cascata escolhe sempre a versão GULOSA, que não usa semente nenhuma.
    O botão montava oito alternativas e descartava todas em favor da mesma de sempre.

    Semente nova sem exclusão da recusada não é oferta de alternativa: é sorteio cujo resultado já
    está decidido. Por isso o clique manda junto a escala que ele está vendo.
  */
  const executar = (semente: number = sementeBase, deAgora: string = de, recusada?: Turno[]) => {
    /*
      🔴 A PROPOSTA VELHA MORRE AQUI, ANTES DE QUALQUER RECUSA — sétima auditoria, medido ao vivo.

      Isto estava lá embaixo, depois dos quatro `return` de recusa. Quem clicava em "Gerar" com um
      período sem dia de culto (ou com data para trás) recebia a mensagem vermelha e **continuava
      vendo a escala anterior** — na tela, na aba `Ajustar` e no `Publicar`, que seguia habilitado.

      O estrago não é visual: os campos "De" e "Até" já mostram o período NOVO, e a proposta na tela
      é do período VELHO. Publicar dali põe no ar uma escala que a tela não está descrevendo.

      Uma proposta só é verdadeira enquanto os campos que a geraram continuam valendo. Recusou,
      apaga — mesmo quando a recusa é só um aviso de "espere o motor terminar", porque nesse caso o
      motor em voo vai reescrever o resultado de qualquer jeito.
    */
    aoGerar(null, '')

    if (motorEmVoo) {
      setFalha(
        `O motor está trabalhando (${motorEmVoo.fase}). Espere ele terminar antes de gerar outra escala — ` +
          'senão o placar compararia a escala nova com uma proposta feita para a anterior.',
      )
      return
    }
    /**
     * 🔴 A TRAVA DE VERDADE — o `min` do campo de data é DICA, não garantia.
     *
     * Ele some com um toque no inspetor, e some sozinho em navegador que não o implemente. Gerar
     * com data retroativa REESCREVE turno já divulgado, que é a primeira regra inviolável deste
     * projeto. Uma trava que só existe no atributo é uma trava que não existe.
     */
    // A regra vive no domínio, onde há teste: desligá-la aqui passava nos 20 passos do gate.
    if (travaDeDataRetroativa(deAgora, hojeSaoPaulo())) {
      setFalha(
        `A data inicial (${formatarBR(deAgora)}) é anterior a hoje (${formatarBR(hojeSaoPaulo())}).` +
          String.fromCharCode(10, 10) +
          `Gerar para trás reescreveria turnos que ${config.identidade.pessoa.plural} já viram — e o passado ` +
          'divulgado não se reescreve. Escolha hoje ou uma data à frente.'
      )
      return
    }

    /*
      🔴 A ORDEM DOS CAMPOS, E O FORMATO — sétima auditoria, reproduzido ao vivo.

      Com "De" em 31/12/2026 e "Até" em 01/01/2026, a tela respondia: *"não há nenhum dia de culto.
      A escala tem turno em: domingo, quarta, sábado. Escolha um período mais longo."*

      Cada palavra verdadeira, e o **diagnóstico inteiro falso**: não falta dia de culto, faltam os
      campos na ordem certa. Quem seguisse o conselho — alargar o período — só se afastaria da
      solução. **Mensagem que descreve o sintoma de outro problema é pior que mensagem nenhuma:**
      manda a pessoa para o lado errado com a autoridade de quem sabe.

      Estas duas guardas vêm ANTES de montar a grade porque é a grade vazia que produzia o engano.
    */
    for (const [rotulo, valor] of [['inicial', deAgora], ['final', ate]] as const) {
      if (!ehDataValida(valor)) {
        setFalha(
          `A data ${rotulo} ("${valor}") não é uma data válida.` +
            String.fromCharCode(10, 10) +
            'O ano tem quatro dígitos e o dia precisa existir no calendário — 31 de fevereiro, por ' +
            'exemplo, não existe. Escolha a data pelo calendário do campo.',
        )
        return
      }
    }
    if (diferencaEmDias(ate, deAgora) > 0) {
      setFalha(
        `A data final (${formatarBR(ate)}) é anterior à inicial (${formatarBR(deAgora)}).` +
          String.fromCharCode(10, 10) +
          'Troque as duas, ou escolha um "Até" depois do "De".',
      )
      return
    }

    /*
      🔴 PERÍODO SEM NENHUM DIA DE CULTO — achado da verificação visual de 05/08/2026.

      Depois de publicar até 30/12, o início sugerido virou 31/12 e o fim sugerido era 31/12 do
      MESMO ano: uma janela de um dia, numa quinta-feira, que a malha não tem. O usuário abria a
      aba, clicava em Gerar e recebia *"A escala ficou inválida — o bloco está VAZIO"*.

      A regra D11 estava certa: bloco vazio É inválido, e ela existe justamente para isso. Errado
      era deixar a pessoa chegar até lá para descobrir. **Conferir antes custa uma linha; descobrir
      depois custa a confiança de quem achou que tinha quebrado alguma coisa.**
    */
    // `construirGrade` recusa data que não existe no calendário (ver `malha.ts`). A tela usa
    // `<input type="date">`, que já barra 31/02 — mas o valor também chega de estado e de URL.
    let grade
    try {
      grade = construirGrade({
        inicio: deAgora, fim: ate,
        malha: config.malhaPadrao,
        capacidadePadrao: config.capacidadePadrao,
        santaCeia: config.santaCeia,
      })
    } catch (e) {
      setFalha(e instanceof Error ? e.message : String(e))
      return
    }
    if (grade.length === 0) {
      const dias = [...new Set(config.malhaPadrao.regras.map((r) => NOMES_DIA[r.diaSemana]))].join(', ')
      setFalha(
        `De ${formatarBR(deAgora)} a ${formatarBR(ate)} não há nenhum dia de culto.\n\n` +
          `A escala tem turno em: ${dias || '(nenhum dia configurado)'}. ` +
          'Escolha um período mais longo, ou que inclua um desses dias.'
      )
      return
    }

    setOcupado(true)
    setFalha('')
    // (a proposta anterior já foi apagada no topo de `executar`, antes das recusas)
    /*
      🔴 SEM `try/catch`, UM ESTOURO AQUI DEIXA A TELA EM "Gerando…" PARA SEMPRE — sexta auditoria
      externa, 05/08/2026. Este corpo roda num `setTimeout`: o `ErrorBoundary` não o alcança (ele só
      pega estouro de render), `setOcupado(false)` nunca roda, e o botão fica travado sem uma linha de
      explicação. Mesma classe da trava presa em `publicar()`, e os três caminhos do motor já tinham
      `try/finally` — só este não tinha.
    */
    // Um respiro para o navegador pintar o estado "gerando" antes do trabalho pesado.
    setTimeout(() => {
      try {
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
        {
          inicio: deAgora, fim: ate, grade, pessoas, elenco, malha: config.malhaPadrao,
          ultimaEscalaAnterior: fronteiraEm(deAgora),
          // A cota do mês também atravessa a fronteira — ver `cotaMensalJaPublicada`.
          escalasPorMesAnterior: cotaMensalJaPublicada(dados.blocos, deAgora),
        },
        8, 3, semente, recusada,
      )
      const r = escolha.melhor
      const validas = escolha.versoes.filter((v) => v.resultado.ok).length
      setOcupado(false)
      if (!r.ok) {
        /*
          🔴 QUEM FOI BARRADO, E POR QUÊ — sétima auditoria.

          O gerador já calculava `candidatosBarrados` e **ninguém lia**. A mensagem mandava
          *"afrouxar alguma restrição"* sem dizer qual, nem para quem — o conselho certo com a
          informação que o resolve escondida dentro do objeto de retorno.

          A regra da casa é clara: dado que existe aparece **mastigado, onde a pessoa já está**.
          Aqui ele vira as linhas que transformam um beco sem saída numa lista do que mexer.

          Agrupado por pessoa porque o mesmo nome barra pelo mesmo motivo em vários turnos, e vinte
          linhas repetidas escondem as três que interessam.
        */
        const nomeDe = (id: string) => pessoas.find((q) => q.id === id)?.nome ?? id
        const porPessoa = new Map<string, Set<string>>()
        for (const c of r.candidatosBarrados) {
          const chave = nomeDe(c.pessoa)
          if (!porPessoa.has(chave)) porPessoa.set(chave, new Set())
          porPessoa.get(chave)!.add(c.motivo)
        }
        const barrados = [...porPessoa.entries()]
          .map(([nome, motivos]) => `   · ${nome} — ${[...motivos].join('; ')}`)
          .join(String.fromCharCode(10))
        setFalha(
          `${r.motivo}\n\n` +
            (r.turnoQueTravou ? `Travou em ${formatarBR(r.turnoQueTravou.data)}, turno da ${r.turnoQueTravou.tipo}: faltaram ${r.turnoQueTravou.faltaram} pessoa(s).\n` : '') +
            (barrados ? `${String.fromCharCode(10)}Quem estava disponível nesse dia e não pôde entrar:${String.fromCharCode(10)}${barrados}${String.fromCharCode(10)}` : '') +
            `Pisos de distanciamento tentados: ${r.pisosTentados.join(', ')}.`,
        )
        return
      }
      /*
        🔴 ÀS VEZES NÃO EXISTE OUTRA COMBINAÇÃO, E ISSO PRECISA SER DITO.

        Medido pela quinta auditoria externa: numa varredura de 8 períodos × 4 capacidades × 3
        sementes, a versão gulosa (a que não usa semente) venceu a cascata **67 de 96 vezes** — e a
        gulosa é a mesma sempre. Foi daí que nasceu este aviso.

        ⚠️ **Em 06/08/2026 ficou claro que o aviso era o remédio errado.** Ele descrevia com
        honestidade um comportamento que não devia existir: o dono pedia outra escala, recebia a
        mesma, e a tela explicava por quê. Explicar bem uma recusa não é o mesmo que atender ao
        pedido. Agora a escala recusada sai da disputa (`recusada`, em `gerarVariasVersoes`), e este
        aviso passou a valer só para o caso limite de verdade — quando **nenhuma** das oito ficou
        diferente da que ele recusou. Nos dados reais de hoje, ele não aparece mais.
      */
      setRepetiu(blocoNovo != null && JSON.stringify(r.bloco.turnos) === JSON.stringify(blocoNovo.turnos))
      aoGerar(r.bloco, r.relato, validas, recusada != null)
      } catch (e) {
        setOcupado(false)
        setFalha(
          `A geração parou com um erro inesperado:${String.fromCharCode(10, 10)}` +
            `${e instanceof Error ? e.message : String(e)}${String.fromCharCode(10, 10)}` +
            'Nada foi publicado. Confira as datas e o elenco, e tente de novo.',
        )
      }
    }, 50)
  }

  const relatorio = useMemo(
    () =>
      blocoNovo
        ? validar({
            bloco: blocoNovo, pessoas, ultimaEscalaAnterior: fronteira, config,
            escalasPorMesAnterior: cotaMensalJaPublicada(dados.blocos, blocoNovo.inicio),
          })
        : null,
    [blocoNovo, pessoas, fronteira, config, dados.blocos],
  )

  /*
    Aqui viviam `jaDivulgadaNaGeracao` e `proximoInicioLivre`, que alimentavam o aviso removido.
    Saíram junto: cálculo sem consumidor é código inerte, e o TypeScript, com `strict`, avisa.
  */

  /**
   * 🔴 A SANTA CEIA NÃO TINHA PORTA — achado em 05/08/2026, respondendo uma pergunta do Flavio sobre
   * quem define o fim do período.
   *
   * As datas viviam **só** no `config.json`, editáveis à mão no repositório. E este projeto nasceu
   * exatamente disso: o site antigo trazia a Ceia em **07/06** porque a data estava cravada no
   * código, quando a correta era 16/08. Trocamos o código pelo dado e deixamos o dado sem tela — o
   * mesmo defeito, um passo adiante.
   *
   * Hoje há **uma** data cadastrada, 16/08/2026, e ela já passou. Gerar 2027 inteiro produziria um
   * ano **sem nenhuma Santa Ceia**: cada uma delas entraria como culto normal, com três pessoas
   * escaladas num dia em que vêm irmãos de outra congregação. Ninguém no sistema saberia.
   */
  const [novaCeia, setNovaCeia] = useState('')
  const ceiasNoPeriodo = (config.santaCeia ?? []).filter(
    (d) => diferencaEmDias(de, d) >= 0 && diferencaEmDias(d, ate) >= 0,
  )

  return (
    <>
      <Cartao titulo="Gerar" subtitulo="Escolha o intervalo. Antes dele, nada é tocado — o que já foi divulgado continua valendo.">
        {/*
          🔴 RASCUNHO INVISÍVEL É PIOR QUE NENHUM.

          A tela passa a lembrar o que ele digitou — datas, pessoas por turno, Santas Ceias, elenco.
          Se ela lembrasse **calada**, ele veria números que não estão no ar achando que estão, e a
          diferença só apareceria no dia em que alguém reclamasse da escala.

          Então o rascunho se declara, com a hora, e com a saída ao lado. Guardar sem avisar seria
          trocar um problema (perder trabalho) por outro pior (confiar no que não foi publicado).
        */}
        {rascunhoInicial && (
          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50/70 px-3 py-2 text-xs text-indigo-900">
            <span>
              Esta tela está mostrando <strong>o que você deixou em andamento</strong>, guardado neste
              aparelho em <strong>{formatarQuando(rascunhoInicial.em)}</strong>. Nada disto está no ar até você publicar.
            </span>
            <button
              title="Descarta o que está em andamento e volta aos valores que estão publicados"
              onClick={() => { limparRascunho(); location.reload() }}
              className="ml-auto rounded-lg border border-indigo-300 bg-white px-2.5 py-1 font-semibold text-indigo-800 hover:bg-indigo-100"
            >
              Descartar e usar o publicado
            </button>
          </div>
        )}
        <div className="flex flex-wrap gap-4 items-end">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            De
            {/*
            🔴 `min={hojeSaoPaulo()}` — pedido do Flavio em 05/08/2026, e é trava de dado, não de
            conforto: *"deixe esmaecido, não habilitável, períodos anteriores; somente a partir de
            hoje em diante. Temos que preservar o histórico."*
            
            Gerar com data retroativa REESCREVE turno que já foi divulgado — e a primeira regra
            inviolável deste projeto é que o passado não se reescreve, porque isso faz o site
            desmentir o que os irmãos já viram. O navegador agora nem deixa escolher.
          */}
          <input id="gerar-de" name="gerar-de" type="date" min={hojeSaoPaulo()} value={de} onChange={(e) => aoMudarDe(e.target.value)} className="block mt-1 px-3 py-2 border border-gray-300 rounded-xl text-sm" />
          </label>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Até
            <input id="gerar-ate" name="gerar-ate" type="date" min={de || hojeSaoPaulo()} value={ate} onChange={(e) => aoMudarAte(e.target.value)} className="block mt-1 px-3 py-2 border border-gray-300 rounded-xl text-sm" />
          </label>
          {/*
            🔴 O TAMANHO DA JANELA, ANTES DE GERAR — 06/08/2026.

            O dono publicou **doze meses de escala sem perceber**: o campo "Até" saltava sozinho para
            31/12 do ano seguinte, e nada na tela dizia que aquilo era um ano. Ele só descobriu depois,
            no histórico, quando a escala publicada não aparecia no período que ele esperava.

            A sugestão foi limitada a seis meses, mas isso sozinho não basta: o campo é dele e ele pode
            digitar o que quiser. **O que impede a surpresa é o número estar à vista** — e ele fica
            ⚠️ E ela é NEUTRA, de propósito. Cheguei a pôr um alerta âmbar acima de seis meses, e estava
            errado duas vezes: o sistema sugeria um ano e em seguida reclamava do próprio palpite; e a
            regra do dono é explícita — *"os dias futuros podem ser alterados livremente, por 1, 2
            anos… ilimitado. Não tem mínimo nem máximo."*

            **O número fica; o julgamento sai.** Informar é trabalho da tela; decidir é dele.
          */}
          {(() => {
            const dias = de && ate && ehDataValida(de) && ehDataValida(ate) ? diferencaEmDias(de, ate) + 1 : 0
            if (dias <= 0) return null
            const meses = dias / 30.4
            return (
              <span
                title="Quanto tempo a escala vai cobrir"
                className="self-end mb-2 rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600"
              >
                {dias} dia(s) · {meses < 1 ? 'menos de 1 mês' : `~${Math.round(meses)} ${Math.round(meses) === 1 ? 'mês' : 'meses'}`}
              </span>
            )
          })()}
          <button title="Monta a escala buscando o maior espaçamento possível entre as escalas de cada um"
            /* `onClick={executar}` passaria o MouseEvent como semente — o TypeScript pegou. */
            onClick={() => executar()}
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
            id="capacidade-padrao"
            name="capacidade-padrao"
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
          🔴 A PORTA DA SANTA CEIA — 05/08/2026. Ver o comentário de `novaCeia`, acima, para o porquê:
          a data vivia só no `config.json`, e este projeto nasceu de uma Ceia com a data errada.

          Fica AQUI, colada ao período, porque é aqui que ela importa: o dia de Ceia não recebe
          ninguém, e cadastrá-la depois de gerar não muda a escala que já saiu.
        */}
        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3">
          <p className="text-sm font-semibold text-gray-700">Dias de Santa Ceia</p>
          <p className="mt-1 text-xs leading-relaxed text-gray-600">
            Nesses dias <strong>ninguém é escalado</strong> — vêm {config.identidade.pessoa.plural} de
            outra congregação. Cadastre <strong>antes</strong> de gerar: depois, só gerando de novo.
          </p>

          {ceiasNoPeriodo.length === 0 && (
            <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
              ⚠️ <strong>Nenhuma Santa Ceia cadastrada entre {formatarBR(de)} e {formatarBR(ate)}.</strong>{' '}
              Se houver alguma nesse período e ela não estiver aqui, o dia entra como culto comum e o
              sistema escala três pessoas nele.
            </div>
          )}

          {(config.santaCeia ?? []).length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {[...(config.santaCeia ?? [])].sort().map((d) => {
                const passou = diferencaEmDias(d, hojeSaoPaulo()) > 0
                /*
                  🔴 CEIA EM DIA SEM CULTO É PROVAVELMENTE UM ENGANO — pedido do dono, 07/08/2026.

                  Medido antes: uma Ceia cadastrada numa quinta-feira era silenciosamente inerte —
                  coerente com "feriado em dia sem expediente", MAS um erro de digitação (queria o
                  domingo 18, digitou quinta 15) deixava o domingo real desprotegido, sem nenhum
                  sinal. Palavra dele: *"Aviso, não trava"* — a data fica, o aviso aparece. O rótulo
                  âmbar diz o dia da semana para o engano se denunciar sozinho.
                */
                const semCulto = !diaTemCulto(d, config.malhaPadrao)
                return (
                  <span
                    key={d}
                    title={
                      semCulto
                        ? 'Esta data não tem culto na malha — a Ceia aqui não muda nada. Confira se não é engano de digitação.'
                        : passou ? 'Já passou — fica registrada, e o histórico não se reescreve' : 'Cadastrada'
                    }
                    className={clsx(
                      'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold',
                      semCulto ? 'border-amber-300 bg-amber-50 text-amber-900'
                        : passou ? 'border-gray-200 bg-white text-gray-400' : 'border-red-200 bg-red-50 text-red-800',
                    )}
                  >
                    {formatarBR(d)}
                    {semCulto && <em className="font-normal">⚠️ {NOMES_DIA[diaDaSemana(d)]} — sem culto na malha</em>}
                    {!semCulto && passou && <em className="font-normal">(passou)</em>}
                    <button
                      title="Tira esta data da lista"
                      onClick={() => aoMudarConfig({ ...config, santaCeia: (config.santaCeia ?? []).filter((x) => x !== d) })}
                      className="ml-0.5 text-current opacity-50 hover:opacity-100"
                    >
                      ✕
                    </button>
                  </span>
                )
              })}
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-end gap-2">
            {/*
              🔴 Este campo nasceu SEM rótulo (05/08/2026) — só com `title`, que o leitor de tela lê
              tarde e que nenhum localizador por rótulo alcança. Quem pagou não foi só quem usa
              leitor de tela: o validador de "Gerar" procurava os campos de data POR POSIÇÃO, este
              entrou no meio, e a data da ausência foi digitada aqui dentro. A ausência era recusada
              — corretamente — e o teste acusava a tela errada.

              A lição vale para todo campo novo: **campo sem rótulo é campo invisível** — para quem
              não enxerga e para quem mede.
            */}
            <label className="text-xs text-gray-500">
              data da Santa Ceia
              <input
                id="nova-santa-ceia"
                name="nova-santa-ceia"
                type="date"
                value={novaCeia}
                title="A data de uma Santa Ceia"
                onChange={(e) => setNovaCeia(e.target.value)}
                className="mt-1 block rounded-xl border border-gray-300 px-3 py-2 text-sm"
              />
            </label>
            <button
              title="Acrescenta a data. Vale na próxima geração"
              onClick={() => {
                if (!novaCeia || (config.santaCeia ?? []).includes(novaCeia)) return
                aoMudarConfig({ ...config, santaCeia: [...(config.santaCeia ?? []), novaCeia].sort() })
                setNovaCeia('')
              }}
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Acrescentar Santa Ceia
            </button>
            <span className="text-xs text-gray-500">
              vale na próxima geração · vai para o ar quando você publicar
            </span>
          </div>
        </div>

        {/*
          🔴 O NOME E O VOCABULÁRIO DA ESCALA — 05/08/2026, mesmo motivo que a linha acima.

          `config.identidade` existia desde o começo no tipo, no dado e no padrão de carregamento —
          e não era lido em lugar nenhum. Cabeçalho do site, cabeçalho daqui, imagem do WhatsApp,
          nome do arquivo baixado, título da aba e os prompts do motor traziam "Escala Porteiros",
          "JD. São Luiz" e "Irmão" cravados no código. Configuração morta é pior que configuração
          ausente: ela parece que resolve.

          O vocabulário está aqui e não numa aba separada porque é decisão de quem MONTA a escala, e
          é o mesmo lugar onde ele já decide quantas pessoas por turno.
        */}
        <details className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3">
          <summary className="cursor-pointer text-sm font-semibold text-gray-700">
            Nome da escala e como chamar quem é escalado
          </summary>
          <p className="mt-2 text-xs leading-relaxed text-gray-600">
            Sai no cabeçalho do site, na imagem que vai para o WhatsApp, no nome do arquivo baixado e
            no título da aba do navegador. Vale depois de <strong>publicar</strong>.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Título
              <input
                id="identidade-titulo"
                name="identidade-titulo"
                value={config.identidade.titulo}
                title="O nome que aparece grande no cabeçalho — ex.: Escala de Recepção"
                onChange={(e) => aoMudarConfig({ ...config, identidade: { ...config.identidade, titulo: e.target.value } })}
                className="mt-1 block w-full rounded-xl border border-gray-300 px-3 py-2 text-sm font-normal normal-case tracking-normal text-gray-900"
              />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Subtítulo
              <input
                id="identidade-subtitulo"
                name="identidade-subtitulo"
                value={config.identidade.subtitulo}
                title="A linha menor embaixo do título — ex.: Unidade Centro. Pode ficar vazia"
                onChange={(e) => aoMudarConfig({ ...config, identidade: { ...config.identidade, subtitulo: e.target.value } })}
                className="mt-1 block w-full rounded-xl border border-gray-300 px-3 py-2 text-sm font-normal normal-case tracking-normal text-gray-900"
              />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Como chamar (singular)
              <input
                id="identidade-pessoa-singular"
                name="identidade-pessoa-singular"
                value={config.identidade.pessoa.singular}
                title="Ex.: Funcionário, Plantonista, Voluntário. Aparece no filtro e no cabeçalho da tabela"
                onChange={(e) => aoMudarConfig({ ...config, identidade: { ...config.identidade, pessoa: { ...config.identidade.pessoa, singular: e.target.value } } })}
                className="mt-1 block w-full rounded-xl border border-gray-300 px-3 py-2 text-sm font-normal normal-case tracking-normal text-gray-900"
              />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Como chamar (plural)
              <input
                id="identidade-pessoa-plural"
                name="identidade-pessoa-plural"
                value={config.identidade.pessoa.plural}
                title="Ex.: funcionários, plantonistas. Aparece no rodapé da imagem: “3 ___ por turno”"
                onChange={(e) => aoMudarConfig({ ...config, identidade: { ...config.identidade, pessoa: { ...config.identidade.pessoa, plural: e.target.value } } })}
                className="mt-1 block w-full rounded-xl border border-gray-300 px-3 py-2 text-sm font-normal normal-case tracking-normal text-gray-900"
              />
            </label>
          </div>
        </details>
        {/*
          🔴 "GERAR OUTRA COMBINAÇÃO" — o pedido do Flavio de poder recusar e pedir outra.
          Só aparece depois que existe escala: antes dela o botão não teria o que substituir.
          Ele muda a SEMENTE — e manda junto a escala recusada, para que ela saia da disputa. A
          semente sozinha não bastava: as oito versões saíam distintas e a cascata escolhia sempre a
          gulosa, que semente nenhuma alcança. Ver o comentário de `executar`.
        */}
        {blocoNovo && !ocupado && (
          <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3">
            <button
              onClick={() => {
                // A semente vai por ARGUMENTO: ler `sementeBase` aqui traria o valor do render velho.
                const nova = sementeBase + 100
                setSementeBase(nova)
                // A escala recusada é a que ele está vendo — vai junto para sair da disputa.
                executar(nova, de, blocoNovo?.turnos)
              }}
              title="Descarta esta escala e monta outra, explorando combinações diferentes"
              className="flex min-h-[2.75rem] items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 hover:bg-gray-100"
            >
              <RefreshCw className="h-4 w-4" /> Não gostei — gerar outra combinação
            </button>
            {repetiu && (
              <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
                <strong>Saiu a mesma escala.</strong> As oito combinações novas foram montadas e
                nenhuma delas ficou diferente desta — com este período e este elenco, o sistema não
                encontra outra escala válida. Para obter uma realmente diferente, mude alguma coisa da
                entrada: o período, quem está ativo, as restrições ou as pessoas por turno.
              </p>
            )}
            {/*
              🔴 A FRASE SÓ VALE PARA A ESCALA DO ALGORITMO — achado da auditoria externa, 05/08/2026.

              Aceitar a proposta do motor chama `aoGerar` com dois argumentos, então
              `versoesComparadas` voltava a 0 e a tela dizia "a melhor de **0** versões" — o defeito
              que o estado tinha acabado de subir para o `Admin` para corrigir, voltando por outra
              porta. E mesmo com o número certo a frase seria FALSA aqui: a escala do motor não foi
              escolhida entre N versões, foi proposta por ele e aprovada no portão.

              Por isso a condição não é "tem número", é **de onde a escala veio**.
            */}
            {/*
              🔴 E A FRASE MUDA DEPOIS DE UMA RECUSA — 06/08/2026, na captura do site já publicado.

              "A melhor de 8 versões" é verdade na primeira geração. **Depois de "Não gostei" deixa
              de ser**: a escolha passa a ser feita entre as que DIFEREM da recusada, e a melhor de
              todas pode ter ficado de fora — foi ele quem a recusou.

              Manter a frase antiga ali seria repor, em texto, exatamente o defeito que a correção
              deste dia tirou do botão: um rótulo que descreve algo que já não é o que acontece.
            */}
            {blocoNovo.origem === 'algoritmo' && versoesComparadas > 0 ? (
              <p className="mt-2 text-xs leading-relaxed text-gray-600">
                {jaRecusouAlguma ? (
                  <>
                    Esta é a melhor entre as <strong>{versoesComparadas} versões</strong> que ficaram
                    <strong> diferentes da que você recusou</strong> — comparadas primeiro pelo
                    espaçamento entre as escalas de cada um, e depois pelo equilíbrio de carga. Pode
                    haver uma combinação melhor entre as recusadas; pedir outra continua explorando.
                  </>
                ) : (
                  <>
                    Esta escala é a melhor de <strong>{versoesComparadas} versões</strong> que o sistema montou e
                    comparou internamente — primeiro pelo espaçamento entre as escalas de cada um, e
                    depois pelo equilíbrio de carga. Pedir outra explora combinações diferentes; a
                    anterior não volta sozinha.
                  </>
                )}
              </p>
            ) : blocoNovo.origem === 'manual' ? (
              /*
                🔴 AJUSTE À MÃO NÃO VEIO DO MOTOR — sétima auditoria.

                Este ramo não existia. Quem arrastasse um nome na aba `Ajustar` continuava lendo
                *"esta escala veio do motor e passou no portão determinístico"* — frase que deixa de
                ser verdade no instante do arrasto, e que é exatamente a frase em que alguém se apoia
                para publicar sem reler.

                O que continua verdadeiro, e por isso está escrito: as 17 regras **são** conferidas de
                novo a cada alteração (a conferência acima recalcula em `useMemo` sobre o bloco). O
                que deixou de ser verdade é a autoria.
              */
              <p className="mt-2 text-xs leading-relaxed text-gray-600">
                Esta escala foi <strong>ajustada à mão</strong> depois de gerada. As 17 regras foram
                conferidas de novo sobre o resultado do ajuste — é a conferência acima. Pedir outra
                descarta os ajustes e monta uma escala nova pelo algoritmo.
              </p>
            ) : (
              <p className="mt-2 text-xs leading-relaxed text-gray-600">
                Esta escala veio <strong>do motor</strong> e passou no portão determinístico — as 17 regras
                foram conferidas do mesmo jeito. Pedir outra monta uma escala pelo algoritmo, comparando
                várias versões internamente.
              </p>
            )}
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
                if (motorEmVoo) return
                setMotorOcupado({ fase: 'Arbitragem', detalhe: 'pensando em como destravar…' })
                try {
                  setArbitragem(await arbitrar(segredos.chaveMotor!, falha, pessoas, undefined, config))
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

      {/*
        🔴 AQUI FICAVA "Atenção — esta escala mexe em dias que já estão no ar". REMOVIDO em
        06/08/2026, a pedido do dono, e a frase dele é a regra:

            *"jamais solicitei isso! A regra fixa é que não altere as posições dos dias PASSADOS,
             os dias futuros podem ser alterados livremente, por 1, 2 anos… ilimitado."*

        O aviso só conseguia falar de dias FUTUROS — gerar para trás já é impossível, o campo tem
        `min={hoje}` e a trava de data retroativa vive no domínio, com teste. Ou seja: ele existia
        para reclamar exatamente do que o dono faz de propósito toda vez que muda o elenco.

        ⚠️ E ele causava um dano concreto, não só ruído. A lista "antes → depois" mostrava
        *"08/08 Noite: Isac, **Eduardo**, Leandro → Isac, Leandro, Elson"*. O dono leu o Eduardo do
        lado ESQUERDO — a escala velha — e concluiu que quem ele tinha tirado do elenco **voltava**
        sozinho. Não voltava: está do lado esquerdo justamente por ter saído. O aviso inventou um
        defeito que não existia e me fez caçar fantasma.

        O que PROTEGE o passado continua de pé, e é outro mecanismo: `travaDeDataRetroativa`.
      */}

      {blocoNovo && relatorio && (
        <>
          <Cartao titulo="Resultado" tom={relatorio.aprovada ? 'ok' : 'erro'}>
            <p className="text-sm font-semibold text-gray-900 mb-1">{relato}</p>
            <p className="text-sm text-gray-600">{resumir(relatorio)}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              <Numero rotulo="turnos" valor={blocoNovo.turnos.filter((t) => !t.santaCeia).length} />
              <Numero rotulo="vagas" valor={blocoNovo.turnos.reduce((s, t) => s + t.pessoas.length, 0)} />
              {/*
                🔴 AQUI JÁ ESTEVE `piso 5 (entregue: 6)` — e o ramo era INERTE.

                A sétima auditoria apontou que o piso declarado pode ser menor que o entregue, e eu
                medi: com `gerar` cru e semente fixa, acontece (1 em 20). Escrevi o ramo. Só depois
                varri o caminho que **a tela** usa — `gerarVariasVersoes`, a cascata — em 36 combinações
                de período e semente-base: **zero divergências**. A cascata escolhe pelo maior piso, e
                por isso não sobra folga entre o exigido e o entregue.

                O ramo nunca renderizaria. Código inerte não é segurança extra: é uma promessa que
                ninguém pode ver falhar. A medição virou checagem no portão `refazer`, sobre o bloco
                PUBLICADO — onde, se a igualdade quebrar um dia, alguém é avisado.
              */}
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
                    if (motorEmVoo) return
                    setMotorErro('')
                    setPropostaMotor(null)
                    setMotorOcupado({ fase: 'Proposta', detalhe: 'preparando o pedido…' })
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
                    if (motorEmVoo) return
                    setMotorOcupado({ fase: 'Auditoria', detalhe: 'procurando o que a regra não pega…' })
                    setMotorErro('')
                    try {
                      setAuditoria(await auditar(segredos.chaveMotor!, blocoNovo, pessoas, config))
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

            {/*
              🔴 A PROPOSTA É DE UM PERÍODO — quinta auditoria externa, 05/08/2026.

              O motor preserva `inicio`/`fim` do bloco que recebeu. Gerar outro período com a
              proposta na tela fazia o placar comparar a escala nova com uma proposta construída
              sobre a ANTIGA — e "Usar a proposta do motor" trocava a escala por uma de outro
              período, sem que nada perguntasse nada. O bloco carrega as próprias datas: basta
              conferi-las, sem estado novo para manter em dia.
            */}
            {propostaMotor && propostaMotor.bloco.inicio === blocoNovo.inicio && propostaMotor.bloco.fim === blocoNovo.fim && (
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
                <p className="text-xs text-gray-600 mt-2">
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
                      {r.violacoes.length > 5 && <p className="text-xs text-gray-600 mt-1">e mais {r.violacoes.length - 5}</p>}
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

          <TabelaDeDistribuicao bloco={blocoNovo} pessoas={pessoas} vocabulario={config.identidade.pessoa} />
        </>
      )}
    </>
  )
}

/**
 * A DISTRIBUIÇÃO DO QUE ACABOU DE SER GERADO — pedido do dono em 06/08/2026:
 *
 *   > *"na escala na área do administrador, abaixo de distanciamento por pessoa, coloque uma
 *   >  estatística tipo essa ou melhor. Somente das datas no intervalo de datas selecionado em
 *   >  De–Até."*
 *
 * Ele mandou a tabela da tela pública como referência. **O intervalo é o do bloco**, e não há filtro
 * a aplicar: o bloco É o De–Até que ele acabou de gerar. Mesmo assim o período fica escrito no
 * cabeçalho, derivado dos turnos — pela mesma razão que a tela pública passou a escrever o dela, em
 * 06/08: uma tabela que não diz o que está contando é lida como se contasse tudo.
 *
 * ── O QUE ESTA TABELA TEM A MAIS QUE A PÚBLICA, e por quê ────────────────────────────────────────
 *
 * **As colunas por TIPO de turno.** A grade por mês esconde uma injustiça real: nesta malha o
 * domingo de manhã e o ENSAIO (uma tarde de sábado por mês) são vagas escassas e de peso diferente
 * da noite de quarta. Dois irmãos com 36 turnos cada podem ter carga bem diferente se um pegou todas
 * as manhãs e o outro nenhuma — e o total, sozinho, jura que estão iguais.
 *
 * **A linha de equilíbrio** (menor · maior · diferença), que responde de relance a pergunta que a
 * tabela inteira existe para responder. Só sobre quem está ativo: quem saiu costuma ter parado no
 * meio do período, e entraria como um desequilíbrio que não existe.
 *
 * A contagem NÃO mora aqui — mora em `src/dominio/estatisticas.ts`, e a tela pública consome a mesma.
 * Duas contagens da mesma coisa divergem num caso de borda e ninguém percebe.
 */
const TabelaDeDistribuicao: React.FC<{
  bloco: Bloco
  pessoas: Pessoa[]
  vocabulario: { singular: string; plural: string }
}> = ({ bloco, pessoas, vocabulario }) => {
  const d = useMemo(() => distribuir(bloco.turnos, pessoas), [bloco, pessoas])
  const periodo = `${formatarBR(bloco.inicio)} a ${formatarBR(bloco.fim)}`
  const diferenca = d.menor != null && d.maior != null ? d.maior - d.menor : null

  if (d.linhas.length === 0) return null

  return (
    <Cartao
      titulo="Distribuição de turnos"
      subtitulo={`Por ${vocabulario.singular.toLowerCase()}, mês e tipo de turno · ${periodo} — só o que você acabou de gerar`}
    >
      {diferenca != null && (
        <p className="mb-3 text-sm text-gray-700">
          Quem pegou menos ficou com <strong>{d.menor}</strong>; quem pegou mais, <strong>{d.maior}</strong>.{' '}
          {/*
            O juízo é da TELA, não do domínio: "2 de diferença está bom" depende de quantos meses o
            período tem, e quem decide isso é quem olha. A cor só sublinha o número que já está lá.
          */}
          <span className={clsx('font-semibold', diferenca <= 2 ? 'text-green-700' : 'text-amber-700')}>
            Diferença de {diferenca} turno{diferenca === 1 ? '' : 's'}.
          </span>
        </p>
      )}
      {/*
        Quem foi tirado da comparação aparece por NOME, com o motivo e o número — regra que o dono
        deu para a conferência independente e que vale igual aqui: contar quantos não basta, é
        preciso dizer QUEM. Sem esta linha, o "menor" de cima esconderia gente.
      */}
      {d.comTeto.length > 0 && (
        <p className="mb-3 text-xs leading-relaxed text-gray-600">
          Fora da conta acima, porque {d.comTeto.length === 1 ? 'tem teto próprio' : 'têm teto próprio'}:{' '}
          {d.comTeto.map((c, i) => (
            <React.Fragment key={c.nome}>
              {i > 0 && ', '}
              <strong>{c.nome}</strong> (máx. {c.tetoMensal}/mês — ficou com {c.total})
            </React.Fragment>
          ))}
          . Menos turnos aqui é a restrição funcionando, não desequilíbrio.
        </p>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
              <th scope="col" className="py-2 pr-4 text-left font-semibold">{vocabulario.singular}</th>
              <th scope="col" className="px-2 py-2 text-center font-semibold text-indigo-700">Total</th>
              {d.tipos.map((t) => (
                <th key={t} scope="col" className="px-2 py-2 text-center font-semibold">{ROTULO_TURNO[t]}</th>
              ))}
              {d.meses.map((m) => (
                <th key={m} scope="col" className="px-2 py-2 text-center font-semibold">
                  {/*
                    Rótulo do mês montado da própria string `AAAA-MM`. Passar por `new Date` traria
                    de volta o defeito do dia 1º em fuso negativo — e aqui nem faria falta: o mês já
                    está escrito na chave.
                  */}
                  {ROTULO_MES[Number(m.slice(5, 7)) - 1]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {d.linhas.map((l, i) => (
              <tr key={l.id} className={clsx('border-b border-gray-50', i % 2 === 1 && 'bg-gray-50/60')}>
                <td className="py-2 pr-4 font-medium text-gray-800">
                  {l.nome}
                  {!l.ativo && (
                    <span
                      title="Saiu do elenco. Os turnos dele continuam contando — nada foi apagado."
                      className="ml-2 rounded-full bg-gray-100 px-1.5 py-0.5 align-middle text-[10px] font-semibold text-gray-500"
                    >
                      saiu
                    </span>
                  )}
                </td>
                <td className="px-2 py-2 text-center font-bold text-indigo-700">{l.total}</td>
                {d.tipos.map((t) => (
                  <td key={t} className="px-2 py-2 text-center text-gray-600">{l.porTipo[t] || '-'}</td>
                ))}
                {d.meses.map((m) => (
                  <td key={m} className="px-2 py-2 text-center text-gray-600">{l.porMes[m] || '-'}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Cartao>
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
  /** Atualiza o retrato do publicado com o que ACABOU de ser gravado. Ver `retratoPublicado`. */
  aoGravar: (d: DadosPublicados) => void
  /** Repassado ao Histórico: reverter sincroniza também o estado editável. Ver `aoReverter`. */
  aoReverter: (d: DadosPublicados, arquivo: string) => void
  gravando: string | null
  tomarGravacao: (oQue: string) => boolean
  soltarGravacao: () => void
}> = ({ dados, pessoas, config, blocoNovo, segredos, aoGravar, aoReverter, gravando, tomarGravacao, soltarGravacao }) => {
  const [ocupado, setOcupado] = useState(false)
  const [resultado, setResultado] = useState<{ ok: boolean; texto: string } | null>(null)

  /*
    🔴 A MONTAGEM VIVE NO DOMÍNIO — unificada em 05/08/2026, por auditoria externa.

    Esta lógica estava escrita duas vezes à mão: aqui e no `gerar-bloco.mjs`. E as duas divergiam —
    o script pegava `blocos[0]` e montava `[truncado, novo]`, o que apagaria o bloco do meio no dia
    em que houvesse três. Esta tela fazia certo; o script, não.

    Fonte dupla é onde as duas versões divergem em silêncio, e a que erra é sempre a que ninguém
    está olhando. Agora as duas chamam a mesma função, e ela tem teste.
  */
  const blocosParaPublicar = useMemo(
    () => montarBlocosParaPublicar(dados.blocos, blocoNovo),
    [dados.blocos, blocoNovo],
  )

  const relatorio = useMemo(() => {
    if (!blocoNovo) return null
    const f: Record<string, string> = {}
    for (const b of dados.blocos) for (const t of b.turnos) {
      if (diferencaEmDias(t.data, blocoNovo.inicio) <= 0) continue
      for (const id of t.pessoas) if (!f[id] || t.data > f[id]) f[id] = t.data
    }
    return validar({
      bloco: blocoNovo, pessoas, ultimaEscalaAnterior: f, config,
      escalasPorMesAnterior: cotaMensalJaPublicada(dados.blocos, blocoNovo.inicio),
    })
  }, [blocoNovo, dados.blocos, pessoas, config])

  const publicar = async () => {
    if (relatorio && !relatorio.aprovada) return
    if (!tomarGravacao('publicação')) {
      setResultado({ ok: false, texto: `Já há ${gravacaoEmVoo} em andamento. Espere ela terminar — gravar duas vezes ao mesmo tempo pode deixar o site com metade dos dados de cada uma.` })
      return
    }
    setOcupado(true)
    setResultado(null)
    /*
      🔴 SEM `finally`, UM ESTOURO DEIXAVA A TRAVA PRESA — sexta auditoria externa, 05/08/2026.

      `soltarGravacao()` era a ÚLTIMA linha do caminho feliz. Bastava um `throw` no meio para a trava
      de módulo ficar presa — e ela é de módulo justamente para sobreviver à desmontagem, o que aqui
      vira contra: sobrevive à troca de aba, à saída para o site e a um novo login. Medido ao vivo: o
      botão Publicar fica **cinza para o resto da sessão**, sem uma linha de explicação, e só um F5
      resolve.

      E como estas funções são `async`, o erro vira *unhandled rejection*: o `ErrorBoundary` não vê
      (ele só pega estouro de render) e a tela não muda nada.
    */
    try {
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
    let gravouConfig = false
    let gravouBlocos = false

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
      gravouConfig = rc.ok
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
      gravouBlocos = rb.ok
    }

    /*
      🔴 O RETRATO EM MEMÓRIA ENVELHECIA — quinta auditoria externa, 05/08/2026.

      Sem isto, a segunda publicação da sessão montava os blocos contra o retrato de ANTES da
      primeira, e apagava o que a primeira acabara de pôr no ar. Ver o comentário do `useState` de
      `dados`, no `Admin`, para a medição.

      Campo a campo, e só o que foi **de fato gravado**: numa falha parcial, dizer que a escala nova
      está no ar quando o commit dela não passou seria trocar um retrato velho por um retrato falso —
      e o falso é pior, porque o guarda do passado passaria a comparar com algo que não existe.
    */
    if (rp.ok || gravouConfig || gravouBlocos) {
      aoGravar(retratoPublicado(
        rp.ok ? pessoas : dados.pessoas,
        gravouBlocos ? blocosParaPublicar : dados.blocos,
        gravouConfig ? config : dados.config,
      ))
    }

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
    } catch (e) {
      // O erro precisa VIRAR TEXTO na tela: promessa rejeitada em silêncio é o pior desfecho.
      setResultado({
        ok: false,
        texto:
          `A publicação parou com um erro inesperado:\n\n${e instanceof Error ? e.message : String(e)}\n\n` +
          'Confira os commits no repositório antes de tentar de novo.',
      })
    } finally {
      soltarGravacao()
      setOcupado(false)
    }
  }

  /*
    🔴 O GUARDA DO PASSADO, NA TELA — achado da auditoria externa de 05/08/2026.

    `conferirPassadoPreservado` existia e estava ligado **só no `gerar-bloco.mjs`**, cujo próprio
    cabeçalho diz *"não é ferramenta de produção"*. O botão que o Flavio clica publicava **sem
    guarda nenhum**.

    E o que ele guarda não é hipótese: gerar um período MENOR que o publicado apagava a cauda.
    Medido no dado real — gerar `01/09 → 31/10` sobre um bloco que ia até 31/12 sumia com **73
    turnos** de novembro e dezembro, em silêncio, e o site passava a não ter escala nesses meses.

    Agora a publicação trava, e a mensagem diz **quais datas** sumiriam.
  */
  const perda = useMemo(
    () => (blocoNovo ? conferirPassadoPreservado(dados.blocos, blocosParaPublicar, blocoNovo) : null),
    [dados.blocos, blocosParaPublicar, blocoNovo],
  )

  // Uma resposta só, vinda do domínio — recompor o julgamento aqui foi o que deixou o guarda
  // do passado ser desligado sem o gate piscar.
  /*
    Aqui viviam `jaDivulgada` e `proximoInicioLivrePublicar`, que alimentavam o aviso removido em
    06/08/2026. Saíram junto — cálculo sem consumidor é código inerte, e `strict` avisa.
  */

  /*
    🔴 O BURACO — sétima auditoria externa, 05/08/2026. Ver `conferirBuracoNaEscala` para a medição:
    gerar um período, não publicar, e gerar o seguinte deixava **93 dias sem escala** no ar, com o
    Publicar habilitado e nenhuma palavra. `conferirPassadoPreservado` mede desaparecimento; esta é
    outra pergunta — *o que vai ao ar cobre todos os dias de culto?*

    IMPEDE, não avisa: um dia de culto sem ninguém na porta não é uma escolha que alguém faça de
    propósito, e o irmão que abre o site vê "Nenhum turno encontrado" achando que errou o filtro.
  */
  const buraco = useMemo(
    () => conferirBuracoNaEscala(blocosParaPublicar, diaTemCulto),
    [blocosParaPublicar],
  )

  const impedido = publicacaoImpedida(relatorio, perda) || !buraco.ok
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
        {relatorio && !relatorio.aprovada && (
          <Aviso tom="erro">
            A escala gerada <strong>não passou na validação</strong>. Publicar está bloqueado — volte
            em "Gerar escala" e veja quais regras foram violadas.
          </Aviso>
        )}
        {perda && !perda.ok && (
          <Aviso tom="erro">
            <strong>Publicar apagaria escala que já está no ar.</strong> O período gerado
            ({formatarBR(blocoNovo!.inicio)} a {formatarBR(blocoNovo!.fim)}) é mais curto que o
            publicado, e {perda.antes - perda.depois} turno(s) de {perda.perdidos.length} dia(s)
            ficariam sem ninguém — a partir de <strong>{formatarBR(perda.perdidos[0])}</strong>.
            <br /><br />
            Gere de novo com o campo <strong>Até</strong> cobrindo pelo menos o que já foi publicado,
            ou aceite conscientemente que aqueles dias saiam do ar.
          </Aviso>
        )}
        {!buraco.ok && (
          <Aviso tom="erro">
            <strong>Publicar deixaria {buraco.dias.length} dia(s) de culto SEM NINGUÉM.</strong> O maior
            vão seria de <strong>{buraco.maiorVao} dias</strong> seguidos, a partir de{' '}
            <strong>{formatarBR(buraco.dias[0])}</strong>.
            <br /><br />
            Quem abrir o site nesse período vê <em>"Nenhum turno encontrado"</em> e acha que errou o
            filtro.
            <br /><br />
            Costuma acontecer quando se gera um período, <strong>não se publica</strong>, e se gera o
            seguinte: o primeiro é descartado sem aviso. Gere de novo cobrindo o vão — a partir de{' '}
            <strong>{formatarBR(buraco.dias[0])}</strong> — e publique.
          </Aviso>
        )}
        {/*
          🔴 AQUI FICAVA o mesmo aviso da aba Gerar — "esta escala muda N turnos que JÁ ESTÃO NO
          AR". REMOVIDO em 06/08/2026 pelo mesmo motivo, e com a mesma regra do dono: **só o passado
          é intocável; o futuro se altera livremente, sem mínimo nem máximo.**

          Tirar de um lugar só não resolveria: ele aparecia nas DUAS telas, e a de Publicar era a
          última coisa lida antes do botão.
        */}
        {blocoNovo && !impedido && (
          <div className="text-sm text-gray-700 space-y-1 mb-4">
            <p>Vai ao ar a escala de <strong>{formatarBR(blocoNovo.inicio)}</strong> a <strong>{formatarBR(blocoNovo.fim)}</strong>.</p>
            <p className="text-gray-500 text-xs">
              {blocosParaPublicar.length} bloco(s) no total · o anterior é cortado em{' '}
              {formatarBR(somarDias(blocoNovo.inicio, -1))}, e o que está fora deste período —
              antes <em>ou depois</em> — não é tocado.
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button title={semToken
            ? 'Você entrou sem token — publique pelo botão ao lado, em duas paradas'
            : 'Grava a escala no repositório. O site atualiza em cerca de um minuto, sem sair do ar'}
            onClick={publicar}
            /* `gravando` cobre a REVERSÃO, que grava os mesmos arquivos logo abaixo nesta tela. */
            disabled={ocupado || impedido || semToken || gravando !== null}
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

      <Historico
        segredos={segredos}
        dados={dados}
        aoReverter={aoReverter}
        tomarGravacao={tomarGravacao}
        soltarGravacao={soltarGravacao}
      />
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
const Historico: React.FC<{
  segredos: Segredos
  dados: DadosPublicados
  /** Reverter é o único caso em que o arquivo lido do passado É a intenção — ver `aoReverter`. */
  aoReverter: (d: DadosPublicados, arquivo: string) => void
  tomarGravacao: (oQue: string) => boolean
  soltarGravacao: () => void
}> = ({ segredos, dados, aoReverter, tomarGravacao, soltarGravacao }) => {
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

    /*
      🔴 A REVERSÃO GRAVA OS MESMOS ARQUIVOS QUE O PUBLICAR — quinta auditoria externa, 05/08/2026.

      Ela não consultava a trava por não se chamar "publicação". Como o GitHub só devolve 409 quando
      o MESMO arquivo colide, os dois caminhos rodando juntos não dão erro nenhum: o desfecho é
      elenco antigo com escala nova, e o sintoma que chega ao irmão é o id cru no lugar do nome.
    */
    if (!tomarGravacao('reversão')) {
      setAviso({ ok: false, texto: 'Já há uma gravação em andamento. Espere ela terminar — as duas escrevem nos mesmos arquivos.' })
      return
    }

    setRevertendo(`${p.sha}|${arquivo}`)
    setAviso(null)
    // Mesma razão de `publicar()`: sem `finally`, um estouro prende a trava e mata o botão
    // Publicar para o resto da sessão, cinza e mudo. Ver o comentário longo lá.
    try {

    /*
      🔴 REVERTER PASSAVA POR CIMA DE TODOS OS GUARDAS — sexta auditoria externa, 05/08/2026.

      O botão Publicar ganhou guarda de manhã. Este, na mesma tela, gravava direto: sem `validar`,
      sem `conferirPorFora`, sem `conferirPassadoPreservado`, sem `conferirEsquema` — só um
      `confirm()` de texto, e a mensagem de sucesso saía verde.

      E é o caminho de UM CLIQUE, porque cada publicação é um commit por arquivo: o histórico só
      oferece "voltar pessoas" OU "voltar blocos", um de cada vez. Medido sobre commits que a tela
      oferece hoje: voltar só o elenco deixaria **120 de 543 nomes saindo como id cru em 70 dias**;
      voltar só a escala trocaria **70 turnos, um deles no passado já divulgado**.

      Então lê-se ANTES de gravar, e julga-se o efeito. Passado reescrito **impede**; futuro alterado
      **avisa com o número**, porque desfazer escala futura é exatamente para o que reverter existe.
    */
    let conteudoPrevio: unknown
    try {
      conteudoPrevio = await lerDadosNoCommit(segredos.tokenGitHub, arquivo, p.sha)
    } catch (e) {
      setAviso({ ok: false, texto: e instanceof Error ? e.message : String(e) })
      return
    }

    const efeito = conferirReversao(arquivo, conteudoPrevio, dados, hojeSaoPaulo())
    if (!efeito.ok) {
      setAviso({
        ok: false,
        texto:
          `Não dá para voltar "${arquivo}" para ${quando} — nada foi gravado.\n\n` +
          efeito.avisos.map((a) => `🔴 ${a}`).join('\n'),
      })
      return
    }
    if (efeito.futuroAlterado && !confirm(
      `Confirma?\n\n${efeito.avisos.join('\n\n')}\n\nO passado divulgado NÃO seria tocado — isso já foi conferido.`
    )) {
      return
    }

    const r = await reverterPara(segredos.tokenGitHub, arquivo, p.sha, quando)

    /*
      🔴 E O RETRATO EM MEMÓRIA TEM DE ACOMPANHAR.

      Sem isto, reverter o elenco e publicar em seguida republicava o elenco velho por cima da
      reversão — desfazendo, em silêncio, o que a pessoa acabou de fazer. `reverterPara` já lê o
      conteúdo para poder gravá-lo; só faltava devolvê-lo.
    */
    if (r.ok && r.conteudo) {
      if (arquivo === 'pessoas.json') {
        const lido = (r.conteudo as ArquivoPessoas)?.pessoas
        if (Array.isArray(lido)) aoReverter(retratoPublicado(lido, dados.blocos, dados.config), arquivo)
      } else if (arquivo === 'blocos.json') {
        const lido = (r.conteudo as ArquivoBlocos)?.blocos
        if (Array.isArray(lido)) aoReverter(retratoPublicado(dados.pessoas, lido, dados.config), arquivo)
      } else if (arquivo === 'config.json') {
        aoReverter(retratoPublicado(dados.pessoas, dados.blocos, completarConfig(r.conteudo as ConfigLida)), arquivo)
      }
    }

    setAviso(
      r.ok
        ? { ok: true, texto: `"${arquivo}" voltou para a versão de ${quando}. O site atualiza em cerca de um minuto.` }
        : { ok: false, texto: r.erro ?? 'Não foi possível reverter.' },
    )
    if (r.ok) carregar()
    } catch (e) {
      setAviso({
        ok: false,
        texto:
          `A reversão parou com um erro inesperado:

${e instanceof Error ? e.message : String(e)}

` +
          'Nada garante o que foi gravado — confira os commits no repositório antes de tentar de novo.',
      })
    } finally {
      soltarGravacao()
      setRevertendo('')
    }
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
        {/*
          🔴 SEM TOKEN, ESTE PARÁGRAFO PROMETIA UM BOTÃO QUE NÃO EXISTE — 05/08/2026.

          Ler o histórico de um repositório público não precisa de credencial nenhuma (foi por isso
          que o cabeçalho `Bearer ` vazio saiu daqui: credencial vazia dá 401, credencial nenhuma dá
          200). **Reverter, sim** — é uma escrita. Quem entra sem token vê a lista inteira, os
          botões não aparecem, e antes nada dizia por quê. Deixar a pessoa procurar um botão que o
          texto prometeu é o mesmo defeito de sempre, só que pequeno.
        */}
        {!segredos.tokenGitHub && (
          <p className="mt-2 border-t border-gray-200 pt-2">
            <strong>Você entrou sem token</strong>, então esta lista é só de leitura — o histórico de
            um repositório público qualquer um lê. Voltar a uma versão é uma <em>escrita</em>, e
            precisa do token; sem ele, o caminho é o mesmo do Publicar à mão, ali em cima.
          </p>
        )}
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
                {/* Sem token, reverter falharia na API — o botão não aparece, e o texto acima diz por quê. */}
                {i > 0 && p.arquivos.length > 0 && segredos.tokenGitHub && (
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
          id={nome}
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
      {dica && <span className="block text-[11px] text-gray-600 mt-1 leading-snug">{dica}</span>}
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

/*
  🔴 O CARTÃO SE CHAMA PELO PRÓPRIO TÍTULO — `aria-labelledby`, 06/08/2026.

  Sem isto, um `<section>` é uma caixa anônima: leitor de tela anuncia "região", sem dizer qual, e
  quem MEDE não tem por onde pegar. Escrevi o portão do botão "Não gostei" localizando o cartão por
  texto solto e ele agarrou só o cabeçalho — 83 caracteres que não mudam nunca. O portão nasceu
  vermelho com a correção certa no lugar, e por um triz eu não fui atrás do defeito errado.

  É a mesma lição dos campos sem rótulo, agora em bloco: **nome alcançável serve a quem não enxerga
  e a quem mede — são o mesmo mecanismo.**
*/
const Cartao: React.FC<{ titulo: string; subtitulo?: string; tom?: 'ok' | 'erro'; children: React.ReactNode }> = ({ titulo, subtitulo, tom, children }) => {
  const idDoTitulo = React.useId()
  return (
  <section aria-labelledby={idDoTitulo} className={clsx('bg-white rounded-2xl border shadow-sm overflow-hidden', tom === 'erro' ? 'border-red-200' : tom === 'ok' ? 'border-green-200' : 'border-gray-200')}>
    <div className={clsx('px-5 py-4 border-b', tom === 'erro' ? 'bg-red-50 border-red-100' : tom === 'ok' ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100')}>
      <h2 id={idDoTitulo} className="font-bold text-gray-900">{titulo}</h2>
      {subtitulo && <p className="text-xs text-gray-500 mt-0.5">{subtitulo}</p>}
    </div>
    <div className="p-5">{children}</div>
  </section>
  )
}

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

