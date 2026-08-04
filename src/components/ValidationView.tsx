import React, { useMemo } from 'react';
import { Shift } from '../types/scheduler';
import { runValidation, ValidationResult } from '../utils/scheduler';
import { CheckCircle, XCircle, AlertTriangle, ShieldCheck } from 'lucide-react';
import { clsx } from 'clsx';

interface ValidationViewProps {
  shifts: Shift[];
}

export const ValidationView: React.FC<ValidationViewProps> = ({ shifts }) => {
  const results = useMemo(() => runValidation(shifts), [shifts]);

  const allPassed = results.every(r => r.status === 'pass');

  return (
    <div className="bg-surface-card rounded-radius-2xl shadow-card border border-border-default overflow-hidden">
      <div className="bg-surface-subtle px-space-6 py-space-4 border-b border-border-subtle flex items-center gap-space-3">
        <div className={clsx(
          "p-space-2 rounded-radius-lg shadow-sm border",
          allPassed ? "bg-status-success/10 border-status-success/20" : "bg-status-error/10 border-status-error/20"
        )}>
          <ShieldCheck className={clsx(
            "h-5 w-5",
            allPassed ? "text-status-success" : "text-status-error"
          )} />
        </div>
        <div>
          <h3 className="text-text-lg font-bold text-text-primary tracking-tight">
            Validação de Regras
          </h3>
          <p className="text-text-xs text-text-secondary font-medium">
            Verificação automática de todas as restrições
          </p>
        </div>
      </div>

      <div className="divide-y divide-border-subtle">
        {results.map((result, idx) => (
          <div key={idx} className="p-space-4 md:p-space-6 hover:bg-surface-subtle/50 transition-colors">
            <div className="flex items-start gap-space-4">
              <div className="mt-1">
                {result.status === 'pass' && <CheckCircle className="h-5 w-5 text-status-success" />}
                {result.status === 'fail' && <XCircle className="h-5 w-5 text-status-error" />}
                {result.status === 'warn' && <AlertTriangle className="h-5 w-5 text-status-warning" />}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-text-base font-semibold text-text-primary">
                    {result.rule}
                  </h4>
                  <span className={clsx(
                    "text-text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                    result.status === 'pass' ? "bg-status-success/10 text-status-success" : 
                    result.status === 'fail' ? "bg-status-error/10 text-status-error" : 
                    "bg-status-warning/10 text-status-warning"
                  )}>
                    {result.status === 'pass' ? 'Aprovado' : 'Falha'}
                  </span>
                </div>
                
                <p className="text-text-sm text-text-secondary mb-2">
                  {result.message}
                </p>

                {result.details.length > 0 && (
                  <div className="mt-space-3 bg-surface-page rounded-radius-md p-space-3 border border-border-subtle">
                    <ul className="list-disc list-inside space-y-1">
                      {result.details.map((detail, i) => (
                        <li key={i} className="text-text-xs text-text-secondary font-mono">
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
