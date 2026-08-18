# Tabela de conformidade — projetos-irmãos (charmway-erp × escala-porteiros)

> Registro auditável da frente **PROJETOS IRMÃOS**, escrito em 14/08/2026 pelo corretor da própria
> frente. Compara os dois projetos entre si e contra o método global
> (`D:\Antigravity\_padroes-globais\`). **Por que este arquivo existe:** o sumário original da
> entrega citava "a tabela de conformidade" como parte do que fora construído, e ela não existia
> como arquivo — confirmado por `git status --porcelain` sem nenhuma linha `??` nos dois
> repositórios e por busca textual sem ocorrência em nenhum dos dois projetos. Toda célula abaixo
> foi reconferida por este corretor (arquivo:linha ou comando ao vivo) — nenhuma foi copiada sem
> checagem própria do inventário original.

## Trio de portabilidade e roteadores

| | charmway-erp | escala-porteiros |
|---|---|---|
| `AGENTS.md` / `ESTADO.md` / `BACKLOG.md` | ✅ presentes e preenchidos — `pre-voo.mjs`, grupo ARQ, rodado 14/08/2026 | ✅ idem |
| `CLAUDE.md` próprio | ✅ existe, 16.659 bytes (`ls -la CLAUDE.md`) — roteador específico para Claude Code | ❌ não existe — só `AGENTS.md`, lido por todo assistente |
| Ordem de leitura declarada | **DUAS versões conflitantes** (repositório charmway-erp): `AGENTS.md`, linhas 7 a 8, diz AGENTS→`docs/AMBIENTE_E_ACESSOS.md`→ESTADO→BACKLOG; `CLAUDE.md`, linhas 10 a 13, diz ESTADO→Handoff→BACKLOG (nunca cita AGENTS.md) | **Uma única versão:** `AGENTS.md:9-11` diz AGENTS→ESTADO→handoff mais recente→BACKLOG |
| Seção "Mesa do dono" em `ESTADO.md` | ✅ `ESTADO.md`, linhas 8 a 16 (charmway-erp) — criada nesta frente, antes vazia de menção | ✅ `ESTADO.md:18-26` — criada nesta frente |
| Seção MÉTODO em `AGENTS.md` | ✅ já existia antes desta frente — `AGENTS.md`, linhas 57 a 59 (charmway-erp), aponta para `docs/METODO_GAUNTLET_CHARMWAY.md`, instituída 13/08/2026 | ✅ criada nesta frente — `AGENTS.md:137-141` ("3.1 MÉTODO"), aponta para `METODO_GAUNTLET_LOOP.md` (global) + `ENGINEERING_LOOP.md` |

⚠️ **A "Mesa do dono" dos dois projetos citava uma cadeia própria** (`ESTADO.md → AGENTS.md →
BACKLOG.md`) que não batia com NENHUM dos roteadores acima — achado corrigido nesta mesma passada:
o parágrafo agora aponta para "ordem de leitura completa em `AGENTS.md`" em vez de cravar uma cadeia
numerada que só valia por coincidência de nome entre os dois projetos.

## Infraestrutura (medida ao vivo, não copiada do manifesto)

| | charmway-erp | escala-porteiros |
|---|---|---|
| Remoto git | `flaviocom/charmway-erp`, branch `main` (`git remote -v`) | `flaviocom/escala-porteiros`, branch `main` (`git remote -v`) |
| CI / GitHub Actions | 3 workflows em `.github/workflows/`: `deploy-motor-redator.yml`, `deploy-motor-v8.yml`, `deploy-worker.yml` (`ls .github/workflows`) | nenhum — pasta `.github/` não existe (`test -d .github` → NAO) |
| Deploy | Vercel — `.vercel/project.json` presente (`test -f`) + `docs/pre-voo.json` do charmway-erp, linha 43 | GitHub Pages — branch `main` + `/docs` (`docs/pre-voo.json:37`) |
| Site | <https://charmway.net> — `AGENTS.md`, linha 27 (charmway-erp) | <https://flaviocom.github.io/escala-porteiros/> — `AGENTS.md:97` |
| Stack | Next.js 14 + React 18 + TypeScript | Vite 7 + React 18.3 + TypeScript 5.8 + Vitest 3 (`package.json`) |
| `node_modules` | presente — pré-voo relata 17 dependência(s) declarada(s), todas resolvem | ausente **DE PROPÓSITO** — disco `D:` mede 0,8 s/arquivo, ~1.775× mais lento que `C:`; build roda em cópia `C:` (`docs/pre-voo.json:20`) |

## `docs/pre-voo.json` — schema real, não o "v2" da tarefa original

O schema descrito na tarefa original (`projeto`/`arquivos_obrigatorios`/`saas.github_repo`/`site`/
`credenciais_exigidas`/`conectores_mcp`) **não é o que `scripts/pre-voo.mjs` (global, linhas 82 a
99) lê** — a função
`lerConfig()` só reconhece `cli`/`env`/`git`/`arquivos`/`docs`/`deps`. Os dois manifestos usam o
schema real; o conteúdo do "v2" foi preservado como bloco informativo `_metadata_projeto`.

| | charmway-erp | escala-porteiros |
|---|---|---|
| `docs/pre-voo.json` já existia antes desta frente | ✅ sim, 3 commits, o mais recente do dia anterior | ✅ sim, já correto |
| Bloco `_metadata_projeto` | acrescentado nesta frente — `docs/pre-voo.json` do charmway-erp, linhas 39 a 44 | acrescentado nesta frente — `docs/pre-voo.json:33-38` |
| Documentos acima do teto (400 linhas / 40 KB) | 🔴 **17**, com isenção declarada (`docs.bloqueia:false`, motivo no `docs/pre-voo.json` do charmway-erp, linha 27) — specs congeladas classificadas no regime errado, já rastreado no `BACKLOG.md` do projeto | ✅ **0** — 21 de 21 documentos dentro do teto |

## `pre-voo.mjs` ao vivo — rodado agora (14/08/2026), não presumido

```
node D:/Antigravity/_padroes-globais/scripts/pre-voo.mjs "<raiz-do-projeto>"
```

| Grupo | charmway-erp | escala-porteiros |
|---|---|---|
| CLI / GIT / ARQ | ✅ tudo verde | ✅ tudo verde |
| DOCS | ⚪ 17 acima do teto (isento, motivo escrito) | ✅ 21/21 OK |
| CREDENCIAIS | 🔴 1 segredo fora da central | 🔴 1 segredo fora da central |
| MÉTODO | ✅ 10/10 checagens (autotestes incluídos: `pre-voo-deps` 8/8, `pre-voo-ordem` 2/2, `pre-voo` 9/9…) | ✅ idem |
| **Resultado** | **🔴 EXIT 1** | **🔴 EXIT 1** |

**O bloqueador é o MESMO nos dois, e vem de um TERCEIRO projeto.** `checar-credenciais.mjs` varre a
árvore de `Meus-Projetos/` inteira — não recebe a raiz do projeto como argumento (`scripts/pre-voo.mjs`
global, linhas 711 a 728, chama o script sem repassar o parâmetro) — e encontra
`MERCADOPAGO_PUBLIC_KEY` (nome apenas; valor nunca lido, por regra) em
`D:/Antigravity/Meus-Projetos/ThetaLens-V3/.env.local`. Reconfirmado rodando `checar-credenciais.mjs`
direto: `1 SEGREDO(S) fora da central`, mesmo arquivo, EXIT 1.

**Nenhum dos dois projetos-irmãos chega hoje a "✅ Pronto para começar"** por causa disso — e não por
um defeito desta frente nem do projeto em si. Corrigir está fora do escopo de "projetos irmãos"
(exigiria mexer no ThetaLens-V3); a sincronização (`node <padroes>/scripts/sync-credenciais.mjs`) é
do dono da credencial.

## Conclusão

Nenhum dos dois projetos tem defeito estrutural no trio de portabilidade — os dois têm
`AGENTS.md`/`ESTADO.md`/`BACKLOG.md` preenchidos e roteador funcional. A diferença real é de
**escala de dívida documental** (17 docs acima do teto no charmway-erp, já isenta e rastreada, contra
zero no escala-porteiros) e de **infraestrutura deliberada** (CI + Vercel contra GitHub Pages sem
pipeline — decisão registrada, não lacuna). O charmway-erp também carrega um roteador **duplo e
inconsistente** (`AGENTS.md` × `CLAUDE.md`, ver tabela acima), que o escala-porteiros não tem por não
possuir `CLAUDE.md`. Nenhuma dessas diferenças bloqueia o pré-voo hoje; quem bloqueia os dois é a
credencial do ThetaLens-V3, fora do escopo desta frente.

---

**Frente:** PROJETOS IRMÃOS · **Gerado por:** o corretor, ao consertar o achado 2 da auditoria de
14/08/2026 (a tabela fora reivindicada como entregue e não existia como arquivo).
**Ligado de:** [`AGENTS.md` do escala-porteiros](../AGENTS.md) ·
[`AGENTS.md` do charmway-erp](../../charmway-erp/AGENTS.md).
