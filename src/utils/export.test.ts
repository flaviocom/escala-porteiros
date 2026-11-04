/**
 * Compartilhar só em aparelho de toque; no computador, baixar — 03/11/2026: no Chrome do Windows a
 * janela "Compartilhar" do sistema abria no lugar do download e ficava presa na tela.
 */
import { describe, expect, it } from 'vitest'
import { deveCompartilhar } from './export'

describe('deveCompartilhar', () => {
  it('🔴 INFRATOR: computador com mouse, mesmo com o navegador sabendo compartilhar → BAIXA', () => {
    expect(deveCompartilhar({ temShare: true, aceitaArquivos: true, toquePrincipal: false })).toBe(false)
  })
  it('✅ CONTROLE: celular (toque) que aceita os arquivos → compartilha', () => {
    expect(deveCompartilhar({ temShare: true, aceitaArquivos: true, toquePrincipal: true })).toBe(true)
  })
  it('celular que recusa os arquivos → baixa', () => {
    expect(deveCompartilhar({ temShare: true, aceitaArquivos: false, toquePrincipal: true })).toBe(false)
  })
  it('navegador sem compartilhamento → baixa', () => {
    expect(deveCompartilhar({ temShare: false, aceitaArquivos: false, toquePrincipal: true })).toBe(false)
  })
})
