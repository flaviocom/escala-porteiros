/**
 * A aba VALIDAÇÃO — agora percorre o catálogo inteiro.
 *
 * 🔴 O que ela mostrava antes: seis regras, e **nenhuma delas era espaçamento ou capacidade** — as
 * duas que a especificação do site anterior prometia conferir. Ela também procurava as pessoas por
 * nome em texto, então remover alguém da escala a deixaria inerte, sem erro visível.
 *
 * Agora ela roda `validar()` sobre o catálogo único: 12 regras duras e 5 de qualidade, cada uma com
 * a **medida** que apurou — o número aparece mesmo quando está tudo certo, porque "aprovado" sem
 * número não deixa ninguém mais informado.
 */
import React, { useMemo } from 'react'
import { AlertTriangle, CheckCircle, ShieldCheck, XCircle } from 'lucide-react'
import { clsx } from 'clsx'
import type { DadosPublicados } from '../dados/carregar'
import { validar, resumir } from '../dominio/validacao'
import type { Bloco } from '../dominio/tipos'

interface ValidationViewProps {
  dados: DadosPublicados
}

export const ValidationView: React.FC<ValidationViewProps> = ({ dados }) => {
  const porBloco = useMemo(() => {
    const ordenados = [...dados.blocos].sort((a, b) => (a.inicio < b.inicio ? -1 : 1))
    return ordenados.map((bloco, i) => {
      // A fronteira: a última escala de cada um nos blocos anteriores a este.
      const ultimaEscalaAnterior: Record<string, string> = {}
      for (const anterior of ordenados.slice(0, i)) {
        for (const t of anterior.turnos) {
          for (const id of t.pessoas) {
            if (!ultimaEscalaAnterior[id] || t.data > ultimaEscalaAnterior[id]) ultimaEscalaAnterior[id] = t.data
          }
        }
      }
      return { bloco, relatorio: validar({ bloco, pessoas: dados.pessoas, ultimaEscalaAnterior, config: dados.config }) }
    })
  }, [dados])

  return (
    <div className="space-y-6">
      {porBloco.map(({ bloco, relatorio }) => (
        <div key={bloco.id} className="bg-surface-card rounded-radius-2xl shadow-card border border-border-default overflow-hidden">
          <div className="bg-surface-subtle px-space-6 py-space-4 border-b border-border-subtle flex items-center gap-space-3">
            <div
              className={clsx(
                'p-space-2 rounded-radius-lg shadow-sm border',
                relatorio.aprovada
                  ? 'bg-status-success/10 border-status-success/20'
                  : 'bg-status-error/10 border-status-error/20',
              )}
            >
              <ShieldCheck className={clsx('h-5 w-5', relatorio.aprovada ? 'text-status-success' : 'text-status-error')} />
            </div>
            <div className="min-w-0">
              <h3 className="text-text-lg font-bold text-text-primary tracking-tight truncate">
                {periodoBR(bloco)}
              </h3>
              <p className="text-text-xs text-text-secondary font-medium">
                {resumir(relatorio)} · {relatorio.avaliadas} de {relatorio.totalNoCatalogo} regras conferidas
                {bloco.pisoAlcancado != null && ` · piso de ${bloco.pisoAlcancado} dia(s)`}
              </p>
            </div>
          </div>

          <div className="divide-y divide-border-subtle">
            {relatorio.resultados.map((r) => (
              <div key={r.id} className="p-space-4 md:p-space-6 hover:bg-surface-subtle/50 transition-colors">
                <div className="flex items-start gap-space-4">
                  <div className="mt-1 shrink-0">
                    {r.status === 'ok' && <CheckCircle className="h-5 w-5 text-status-success" />}
                    {r.status === 'falha' && <XCircle className="h-5 w-5 text-status-error" />}
                    {r.status === 'aviso' && <AlertTriangle className="h-5 w-5 text-status-warning" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <h4 className="text-text-base font-semibold text-text-primary">
                        <span className="text-text-secondary font-mono text-text-xs mr-2">{r.id}</span>
                        {r.titulo}
                      </h4>
                      <span
                        className={clsx(
                          'text-text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0',
                          r.status === 'ok'
                            ? 'bg-status-success/10 text-status-success'
                            : r.status === 'falha'
                              ? 'bg-status-error/10 text-status-error'
                              : 'bg-status-warning/10 text-status-warning',
                        )}
                      >
                        {r.status === 'ok' ? 'Aprovado' : r.status === 'falha' ? 'Falha' : 'Atenção'}
                      </span>
                    </div>

                    <p className="text-text-sm text-text-secondary mb-2">{r.medida}</p>

                    {r.violacoes.length > 0 && (
                      <div className="mt-space-3 bg-surface-page rounded-radius-md p-space-3 border border-border-subtle">
                        <ul className="list-disc list-inside space-y-1">
                          {r.violacoes.slice(0, 12).map((v, i) => (
                            <li key={i} className="text-text-xs text-text-secondary">
                              {v.mensagem}
                            </li>
                          ))}
                          {r.violacoes.length > 12 && (
                            <li className="text-text-xs text-text-secondary italic">
                              e mais {r.violacoes.length - 12}
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function periodoBR(b: Bloco): string {
  const br = (d: string) => d.split('-').reverse().join('/')
  return `${br(b.inicio)} a ${br(b.fim)}`
}
