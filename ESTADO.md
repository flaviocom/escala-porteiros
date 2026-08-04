# ESTADO — escala-porteiros

> **Onde o projeto está agora.** Documento **vivo**: sobrescrito, não acumulado.
>
> **Última atualização:** 04/08/2026 · **Fuso:** America/São_Paulo
>
> **Cadeia de navegação, nesta ordem:**
> **`ESTADO.md` (você está aqui)** → [`handoff mais recente`](docs/handoff/HANDOFF_2026-08-04.md) → [`BACKLOG.md`](BACKLOG.md)
> *onde estamos · o que aconteceu na última sessão e por quê · o que fazer a seguir*
>
> **Roteador do projeto:** [`AGENTS.md`](AGENTS.md) ·
> **Solicitações:** [`docs/solicitacoes/INDICE_DE_SOLICITACOES.md`](docs/solicitacoes/INDICE_DE_SOLICITACOES.md) ·
> **Histórico:** [`docs/historico/INDICE.md`](docs/historico/INDICE.md)

---

## Em uma frase

**O site está no ar com a área administrativa funcionando**, a escala de 05/08 a 30/12 já gerada com
o distanciamento consertado e a Santa Ceia na data certa — falta o motor de sugestão e a auditoria
adversarial.

## Onde roda

| | |
|---|---|
| Site | **https://flaviocom.github.io/escala-porteiros/** |
| Área administrativa | **https://flaviocom.github.io/escala-porteiros/#/admin** |
| Repositório | [`flaviocom/escala-porteiros`](https://github.com/flaviocom/escala-porteiros) — público |
| Publicação | GitHub Pages, modo branch, `main` + `/docs` |
| Usuários | 16 irmãos porteiros + 1 administrador |

⚠️ **O site antigo continua no ar e intocado**, como decidido: `escala-irmaos-2026-mar`.

### 🔴 A pasta local é lenta a ponto de inviabilizar o desenvolvimento

Medido em 04/08/2026, com o disco em repouso: escrever 100 arquivos pequenos leva **79.844 ms em
`D:`** contra **45 ms em `C:`** — **0,8 segundo por arquivo**, cerca de **1.775× mais lento**. Um
`npm install` (~30 mil arquivos) levaria **horas**; na cópia em `C:` levou **14 segundos**.

Não é "disco lento": é antivírus varrendo cada escrita, ou disco com defeito. **Enquanto isso não for
resolvido, o build e os testes rodam numa cópia em `C:`**, e o GitHub é a ponte:

```bash
git clone https://github.com/flaviocom/escala-porteiros.git /c/.../build-escala-porteiros
# trabalha, testa e publica de lá; a pasta em D: recebe por `git pull`
```

⚠️ Junção (`mklink /J`) **não resolve**: o npm apaga um `node_modules` que não seja diretório real
(`npm warn reify Removing non-directory`).

## O que acabou de entrar

**O núcleo, medido e testado.** 15 regras num catálogo único (10 duras + 5 de qualidade), cada uma
com teste que **reprova um infrator injetado e aprova o caso limpo** — 55 testes verdes.

**O gerador descobre o piso de distanciamento** em vez de recebê-lo cravado. Na escala real ele
relatou: *"Piso alcançado: 6 dias. Tentei 9, 8, 7 — não foi possível cobrir todos os turnos."*

**O defeito que motivou o projeto está consertado**, e a prova é numérica:

| | Site no ar hoje | Bloco novo (05/08 → 30/12) |
|---|---|---|
| Menor intervalo | **1 dia** (Williams, 7 casos) | **6 dias** |
| Pares com ≤3 dias | **18** | **0** |
| Quarta → sábado | 6 casos | **0** |
| Santa Ceia | 07/06 errada; 16/08 com 6 escalados | **16/08 correta, 0 escalados** |
| Validação | 6 regras, nenhuma de espaçamento ou capacidade | **15 de 15** |
| Equilíbrio | — | 16–17 turnos, diferença de **1** |

**A área administrativa está no ar**: elenco com X para tirar e + para acrescentar, as quatro
famílias de restrição, geração por intervalo de datas, conferência regra a regra e publicação por
commit. Publicar fica **bloqueado** enquanto a validação reprovar.

**Achado no caminho:** o `tsconfig` herdado do template vinha com **`"strict"` comentado**. Sem
`strictNullChecks` o TypeScript não estreita união discriminada — foi o que produziu 12 erros
falsos. Ligar o `strict` resolveu todos e revelou 9 trechos de código morto, removidos.

**Tudo validado ao vivo, no navegador** — não só por `curl`: a tela renderiza, os nomes aparecem, o
16/08 mostra SANTA CEIA sem ninguém, as 15 regras aparecem na aba Validação, o cofre cifra de
verdade (senha errada não abre) e um token inválido é recusado antes de ser guardado.

## O que está em curso

Nada em execução. Próximo item: o **motor** (P3.9 do backlog) — proposta, explicação, arbitragem e
auditoria, sempre atrás do portão determinístico e degradável quando faltar crédito.

## O que bloqueia

| O que | De quem depende |
|---|---|
| Publicar pela tela | 👤 Flavio cola `GITHUB_PAT_ESCALA_PORTEIROS` no primeiro acesso |
| O motor funcionar | 👤 Flavio cola `ANTHROPIC_API_KEY_ESCALA` (opcional — sem ela o algoritmo segue) |
| Desenvolver na pasta `D:` | 👤 Flavio decide se investiga o antivírus/disco |

## Como retomar

1. Leia [`AGENTS.md`](AGENTS.md).
2. Leia este arquivo e o [`BACKLOG.md`](BACKLOG.md).
3. Rode o pré-voo: `node D:/Antigravity/_padroes-globais/scripts/pre-voo.mjs .`
4. Clone numa pasta em `C:` antes de rodar `npm install` — ver o aviso acima.

**Você não precisa perguntar ao Flavio onde paramos.** Se este arquivo não responde isso, ele está
desatualizado — e atualizá-lo é parte de fechar qualquer passo.
