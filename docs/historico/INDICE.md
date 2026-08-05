# Índice do histórico — escala-porteiros

> **O mapa das fatias arquivadas.** Fatia sem entrada aqui é conteúdo perdido: existe no disco e não
> existe para quem procura.
>
> **Cadeia de navegação:** [`ESTADO.md`](../../ESTADO.md) → [`handoff mais recente`](../handoff/INDICE.md) → [`BACKLOG.md`](../../BACKLOG.md)
> **Roteador do projeto:** [`AGENTS.md`](../../AGENTS.md) · **Índice de solicitações:** [`../solicitacoes/INDICE_DE_SOLICITACOES.md`](../solicitacoes/INDICE_DE_SOLICITACOES.md)

---

## Como funciona

Dois documentos deste projeto são **append-only** e crescem por natureza — declarados em
[`../regimes-documentos.json`](../regimes-documentos.json):

| Documento | Papel |
|---|---|
| [`../../AI_MASTER_LOG.md`](../../AI_MASTER_LOG.md) | **o que** foi feito, passo a passo |
| [`../../DIARIO_DE_BORDO.md`](../../DIARIO_DE_BORDO.md) | **por que** cada decisão foi tomada, e como revertê-la |

Ao estourar o teto (2.000 linhas **ou** virada de mês), eles são **fatiados por período** para
`historico/<DOCUMENTO>/AAAA-MM.md`. O arquivo da raiz passa a conter **duas coisas e só elas**: o
índice das fatias e a fatia corrente.

**Nada é excluído, nunca.**

## Imutabilidade

**Fatia fechada não se edita.** Se um registro antigo estava errado ou mudou, escreve-se um registro
**novo** na fatia corrente que **supersede** o antigo, com link nos dois sentidos. Apagar o erro
apaga a informação mais valiosa que existe: por que se acreditou nele.

⚠️ **Efeito colateral conhecido da rotação:** mover um arquivo para `docs/historico/X/` **quebra os
links relativos dele** — `../BACKLOG.md` vira `docs/historico/BACKLOG.md`, que não existe. Como fatia
fechada é imutável, esses links **não são reescritos**: ficam como registro do que o documento
apontava na época, e a isenção do histórico é regra do método (o portão de órfãos vive no pré-voo, não neste repositório). Este aviso existe para que o
próximo leitor não confunda com defeito.

## Fatias arquivadas

| Período | Documento | Fatia | Resumo |
|---|---|---|---|
| — | — | — | *Nenhuma ainda. Os dois documentos vivem na raiz, dentro do teto.* |

---

**Estado dos tetos** — conferido por `checar-tamanho-docs.mjs`, que vive em
`_padroes-globais/scripts/` e roda no **pré-voo**.

> ⚠️ **Correção de 05/08/2026** (auditoria externa de documentação): esta linha dizia *"no pré-voo
> **e no GATE**"*, e o GATE deste projeto **não tem** passo de tamanho de documento. O mesmo vale
> para o "portão de órfãos" citado acima: ele não existe em `scripts/`. Duas regras afirmadas com
> portão inexistente — exatamente o padrão de falha que o método nomeia (*"regra sem portão é
> disciplina, e disciplina falha"*). Fica **declarado** em vez de escondido: quem quiser a garantia
> tem de rodar o pré-voo, porque `npm run gate` não a dá.
