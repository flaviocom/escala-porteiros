# ESTADO — escala-porteiros

> **Onde o projeto está agora.** Documento **vivo**: sobrescrito, não acumulado.
>
> **Última atualização:** 04/08/2026 · **Fuso:** America/São_Paulo
> **Cadeia:** este arquivo → [`AGENTS.md`](AGENTS.md) → [`BACKLOG.md`](BACKLOG.md)

---

## Em uma frase

O desenho da área administrativa está escrito e aguarda a aprovação do Flavio; **nenhuma linha de
código de produto foi escrita**, e o site que está no ar continua sendo o antigo.

## Onde roda

| | |
|---|---|
| Ambiente | ainda não publicado |
| Endereço planejado | `https://flaviocom.github.io/escala-porteiros/` (nome livre — conferido no GitHub em 04/08/2026, HTTP 404) |
| Repositório | **ainda não criado** |
| Repositório git local | **não existe** (medido pelo pré-voo em 04/08/2026) |
| Usuários | 16 irmãos porteiros + 1 administrador (o Flavio) |

⚠️ **O site que os irmãos usam hoje é outro projeto:** `flaviocom/escala-irmaos-2026-mar`, em
`https://flaviocom.github.io/escala-irmaos-2026-mar/`, servido por GitHub Pages em **modo branch**
(`build_type: legacy`, `source: main /`). Ele **não deve ser tocado** — decisão do Flavio.

## O que acabou de entrar

**Levantamento do projeto atual, medido e não presumido (04/08/2026).** O gerador foi extraído e
**executado**, não apenas lido. O bundle publicado foi aberto e confere com o `src/`.

O que funciona: 184 turnos, 549 vagas, **zero turnos incompletos**, distribuição de 35–36 turnos para
os 14 irmãos sem cota, e as cotas de Thiago (2/mês) e Williams (3/mês) cumpridas nos 10 meses.

Nove defeitos confirmados, dos quais três importam agora:

- **O distanciamento não é regra, é desempate.** Williams tem **7 casos de intervalo de 1 dia** e
  há **18 pares com ≤3 dias**. O caso "quarta → sábado" que o Flavio citou acontece 6 vezes.
- 🔴 **A data da Santa Ceia está errada no ar.** O código tem `07/06/2026`; a correta é
  **16/08/2026**, que é **domingo**. O site vai exibir 3 porteiros de manhã e 3 à noite num dia sem
  escala.
- **A validação não confere o que a especificação promete** — nem espaçamento, nem capacidade.

**O padrão nos defeitos: todos são silenciosos.** Nenhum quebra a tela; todos produzem uma escala
com aparência correta.

**Desenho escrito e revisado**, incorporando os padrões globais lidos integralmente em 04/08/2026.

## O que está em curso

**Aprovação do desenho pelo Flavio** — item P0.1 do [`BACKLOG.md`](BACKLOG.md).

Já decidido por ele nesta rodada: base é a escala `mar`; sem piso fixo de distanciamento; geração
por intervalo de datas com contagem zerada e passado preservado; as quatro famílias de restrição;
o motor distribui junto com o algoritmo; nome `escala-porteiros`; acesso por engrenagem discreta com
login e senha; Santa Ceia sem porteiros; **congelar de março até hoje e gerar de 05/08 em diante**.

## O que bloqueia

| O que | De quem depende |
|---|---|
| Aprovação do desenho | 👤 Flavio |
| Criar o repositório `flaviocom/escala-porteiros` | 🤖 assistente, após a aprovação |
| `GITHUB_PAT_ESCALA_PORTEIROS` | 👤 Flavio cola o valor (o assistente prepara o arquivo de um clique) |
| `ANTHROPIC_API_KEY_ESCALA` | 👤 Flavio cola o valor |

## Como retomar

1. Leia [`AGENTS.md`](AGENTS.md).
2. Leia este arquivo e o [`BACKLOG.md`](BACKLOG.md).
3. Leia o desenho em
   [`docs/superpowers/specs/2026-08-04-area-administrativa-escala-design.md`](docs/superpowers/specs/2026-08-04-area-administrativa-escala-design.md).
4. Rode o pré-voo: `node D:/Antigravity/_padroes-globais/scripts/pre-voo.mjs .`

**Você não precisa perguntar ao Flavio onde paramos.** Se este arquivo não responde isso, ele está
desatualizado — e atualizá-lo é parte de fechar qualquer passo.
