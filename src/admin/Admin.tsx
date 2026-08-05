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
import { baixarPacoteManual, conferirToken, DESTINOS, historicoPublicacoes, publicarDados, reverterPara, type Publicacao } from './github'
import type { DadosPublicados } from '../dados/carregar'
import type { Bloco, Pessoa, TipoTurno } from '../dominio/tipos'
import { ROTULO_TURNO } from '../dominio/tipos'
import { construirGrade } from '../dominio/malha'
import { gerar } from '../dominio/gerador'
import { validar, resumir } from '../dominio/validacao'
import { menorIntervalo } from '../dominio/regras'
import { diferencaEmDias, formatarBR, hojeSaoPaulo, NOMES_DIA_CURTO, somarDias } from '../dominio/datas'
import { AbaAjustar } from './AbaAjustar'
import { arbitrar, auditar, medir, pedirProposta, type Placar, type ProgressoMotor } from './motor'
import { Sparkles } from 'lucide-react'

type Aba = 'elenco' | 'gerar' | 'ajustar' | 'publicar'

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

/** O outro lado: colar o código trazido de um aparelho já configurado. */
function ColarCofre() {
  const [aberto, setAberto] = useState(false)
  const [codigo, setCodigo] = useState('')
  const [erro, setErro] = useState('')

  if (!aberto) {
    return (
      <button title="Se você já configurou noutro aparelho, traga o cofre de lá em vez de cadastrar tudo de novo"
        onClick={() => setAberto(true)}
        className="mb-4 text-xs font-bold text-indigo-600 hover:underline"
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

  const criar = async () => {
    setErro('')
    if (senha.length < 8) return setErro('A senha precisa ter ao menos 8 caracteres.')
    if (senha !== repetir) return setErro('As duas senhas não são iguais.')
    if (!token.trim()) return setErro('Cole o token do GitHub — é ele que permite publicar.')
    setOcupado(true)
    const teste = await conferirToken(token.trim())
    if (!teste.ok) {
      setOcupado(false)
      return setErro(teste.detalhe)
    }
    const segredos: Segredos = { tokenGitHub: token.trim(), ...(chaveMotor.trim() ? { chaveMotor: chaveMotor.trim() } : {}) }
    await gravarCofre(senha, segredos)
    setOcupado(false)
    aoAbrir(segredos)
  }

  return (
    <Moldura titulo="Configurar o acesso" subtitulo="Só desta vez, neste aparelho">
      <p className="text-sm text-gray-600 mb-5 leading-relaxed">
        A sua senha não fica guardada em lugar nenhum — ela é a <strong>chave que decifra</strong> o
        token. Sem ela, o que ficar neste navegador é ruído, mesmo para quem estiver com o aparelho
        na mão. Se você esquecê-la, é só configurar de novo com um token novo.
      </p>
      <ColarCofre />
      <Campo rotulo="Senha (mínimo 8 caracteres)" tipo="senha" valor={senha} aoMudar={setSenha} />
      <Campo rotulo="Repita a senha" tipo="senha" valor={repetir} aoMudar={setRepetir} />
      <Campo
        rotulo="Token do GitHub"
        tipo="senha"
        valor={token}
        aoMudar={setToken}
        dica="Fine-grained · Only select repositories → escala-porteiros · Repository permissions → Contents: Read and write"
      />
      <Campo
        rotulo="Chave do motor (opcional)"
        tipo="senha"
        valor={chaveMotor}
        aoMudar={setChaveMotor}
        dica="Sem ela, o algoritmo continua gerando e validando — só não há proposta nem explicação do motor."
      />
      {erro && <Aviso tom="erro">{erro}</Aviso>}
      <Botao aoClicar={criar} ocupado={ocupado} icone={KeyRound}>
        Conferir o token e guardar
      </Botao>
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
      <Campo rotulo="Senha" tipo="senha" valor={senha} aoMudar={setSenha} aoEnter={entrar} />
      {erro && <Aviso tom="erro">{erro}</Aviso>}
      <Botao aoClicar={entrar} ocupado={ocupado} icone={KeyRound}>Entrar</Botao>
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
  const [blocoNovo, setBlocoNovo] = useState<Bloco | null>(null)
  /** O bloco como o gerador o entregou — a referência para o "desfazer tudo" do ajuste manual. */
  const [blocoOriginal, setBlocoOriginal] = useState<Bloco | null>(null)
  const [relatoGeracao, setRelatoGeracao] = useState<string>('')

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
          />
        )}
        {aba === 'publicar' && (
          <AbaPublicar dados={dados} pessoas={pessoas} blocoNovo={blocoNovo} segredos={segredos} />
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
  aoGerar: (b: Bloco | null, relato: string) => void
}> = ({ dados, pessoas, blocoNovo, relato, segredos, aoGerar }) => {
  const proximoDia = useMemo(() => somarDias(hojeSaoPaulo(), 1), [])
  const [de, setDe] = useState(proximoDia)
  const [ate, setAte] = useState(`${new Date().getFullYear()}-12-31`)
  const [ocupado, setOcupado] = useState(false)
  const [falha, setFalha] = useState<string>('')
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
        malha: dados.config.malhaPadrao,
        capacidadePadrao: dados.config.capacidadePadrao,
        santaCeia: dados.config.santaCeia,
      })
      const elenco = pessoas.filter((p) => p.ativo).map((p) => p.id)
      const r = gerar({ inicio: de, fim: ate, grade, pessoas, elenco, malha: dados.config.malhaPadrao, ultimaEscalaAnterior: fronteira })
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
    () => (blocoNovo ? validar({ bloco: blocoNovo, pessoas, ultimaEscalaAnterior: fronteira }) : null),
    [blocoNovo, pessoas, fronteira],
  )

  return (
    <>
      <Cartao titulo="Gerar" subtitulo="Escolha o intervalo. Antes dele, nada é tocado — o que já foi divulgado continua valendo.">
        <div className="flex flex-wrap gap-4 items-end">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            De
            <input type="date" value={de} onChange={(e) => setDe(e.target.value)} className="block mt-1 px-3 py-2 border border-gray-300 rounded-xl text-sm" />
          </label>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Até
            <input type="date" value={ate} onChange={(e) => setAte(e.target.value)} className="block mt-1 px-3 py-2 border border-gray-300 rounded-xl text-sm" />
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
        <p className="text-xs text-gray-500 mt-3">
          {pessoas.filter((p) => p.ativo).length} pessoas no elenco ·{' '}
          {Object.keys(fronteira).length} com escala anterior a considerar na fronteira
        </p>
      </Cartao>

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

          <Cartao titulo="Proposta do motor" subtitulo="O algoritmo já entregou uma escala válida. O motor propõe a dele, e o portão julga as duas.">
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
                      const r = await pedirProposta(segredos.chaveMotor!, blocoNovo, pessoas, fronteira, setMotorOcupado)
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
                        medir('Algoritmo', blocoNovo, pessoas, fronteira),
                        medir('Motor', propostaMotor.bloco, pessoas, fronteira),
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

          <Cartao titulo="Conferência regra a regra">
            <div className="divide-y divide-gray-100 -my-2">
              {relatorio.resultados.map((r) => (
                <div key={r.id} className="py-3 flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">
                    {r.status === 'ok' && <CheckCircle className="w-5 h-5 text-green-600" />}
                    {r.status === 'falha' && <XCircle className="w-5 h-5 text-red-600" />}
                    {r.status === 'aviso' && <AlertTriangle className="w-5 h-5 text-amber-500" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">
                      <span className="font-mono text-xs text-gray-400 mr-2">{r.id}</span>
                      {r.titulo}
                    </p>
                    <p className="text-xs text-gray-500">{r.medida}</p>
                    {r.violacoes.slice(0, 5).map((v, i) => (
                      <p key={i} className="text-xs text-gray-600 mt-1">· {v.mensagem}</p>
                    ))}
                    {r.violacoes.length > 5 && <p className="text-xs text-gray-400 mt-1">e mais {r.violacoes.length - 5}</p>}
                  </div>
                </div>
              ))}
            </div>
          </Cartao>

          <Cartao titulo="Distanciamento por pessoa" subtitulo="Quantos dias, no mínimo, cada um ficou entre duas escalas">
            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1">
              {pessoas.filter((p) => p.ativo).map((p) => {
                const min = menorIntervalo({ bloco: blocoNovo, pessoas, ultimaEscalaAnterior: fronteira }, p.id)
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
  blocoNovo: Bloco | null
  segredos: Segredos
}> = ({ dados, pessoas, blocoNovo, segredos }) => {
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
    return validar({ bloco: blocoNovo, pessoas, ultimaEscalaAnterior: f })
  }, [blocoNovo, dados.blocos, pessoas])

  const publicar = async () => {
    if (relatorio && !relatorio.aprovada) return
    setOcupado(true)
    setResultado(null)
    const passos: string[] = []
    let tudoOk = true

    const rp = await publicarDados(segredos.tokenGitHub, 'pessoas.json', { versao: 1, pessoas }, 'atualiza o elenco e as restrições')
    passos.push(rp.ok ? '✅ elenco publicado' : `🔴 elenco: ${rp.erro}`)
    tudoOk = tudoOk && rp.ok

    if (blocoNovo && tudoOk) {
      const rb = await publicarDados(
        segredos.tokenGitHub,
        'blocos.json',
        { versao: 1, blocos: blocosParaPublicar },
        `escala de ${formatarBR(blocoNovo.inicio)} a ${formatarBR(blocoNovo.fim)}`,
      )
      passos.push(rb.ok ? '✅ escala publicada' : `🔴 escala: ${rb.erro}`)
      tudoOk = tudoOk && rb.ok
    }

    setOcupado(false)
    setResultado({
      ok: tudoOk,
      texto: tudoOk
        ? passos.join('\n') + '\n\nO site mostra a escala nova em cerca de um minuto. Ele não saiu do ar em momento nenhum.'
        : passos.join('\n') + '\n\nNada foi publicado pela metade: se o elenco falhou, a escala nem foi tentada.',
    })
  }

  const impedido = relatorio ? !relatorio.aprovada : false

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
          <button title="Grava a escala no repositório. O site atualiza em cerca de um minuto, sem sair do ar"
            onClick={publicar}
            disabled={ocupado || impedido}
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
        <details className="mt-4 rounded-xl border border-gray-200 bg-gray-50">
          <summary className="cursor-pointer px-4 py-3 text-sm font-bold text-gray-700 select-none">
            Publicar sem token — as duas paradas
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

  return (
    <Cartao titulo="Histórico de publicações" subtitulo="Cada publicação é um commit. Dá para ver o que mudou e voltar atrás.">
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
}> = ({ rotulo, tipo = 'texto', valor, aoMudar, dica, aoEnter }) => {
  const [visivel, setVisivel] = useState(false)
  return (
    <label className="block mb-4">
      <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">{rotulo}</span>
      <div className="relative mt-1.5">
        <input
          type={tipo === 'senha' && !visivel ? 'password' : 'text'}
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
