# Finalidade e fases — para quem este produto é, e quando

> **Cadeia:** [`AGENTS.md`](../AGENTS.md) → [`docs/RECONSTRUIR.md`](RECONSTRUIR.md) → **você está aqui**
>
> Vizinhos: [`INSTALAR.md`](INSTALAR.md) (publicar para outro cliente) · [`OPERACAO.md`](OPERACAO.md)
>
> **Decidido pelo Flavio em 05/08/2026** (S-029). Este documento existe porque a §0 do `AGENTS.md`
> diz *"com intenção de comercialização"*, e alguém que lesse só aquilo concluiria que o produto já
> está sendo vendido. **Não está.** Hoje ele atende uma congregação, e só ela.

---

## As palavras dele

> *"O que acontece hoje: eu pretendo somente disponibilizar para minha comum congregação esta
> escala, somente para os meus irmãos e somente para os porteiros da minha igreja. Outras igrejas,
> comercialização é um plano futuro. Somente quem vai acessar são os meus irmãos da minha comum
> congregação por enquanto.*
>
> *Num plano futuro, eu posso até tentar comercializar, que essa é a finalidade. Comercializar é
> para isso que nós preparamos a base. Neste momento, é para isso, mas depois eu posso expandir para
> outras comuns congregações, outras casas de oração, e até fazer uma venda, por exemplo, para uma
> central da congregação."*

---

## As três fases

| | Fase | Quem usa | Situação |
|---|---|---|---|
| **1** | **Uso próprio** | os porteiros da comum congregação do Jd. São Luiz | 🟢 **É AQUI QUE ESTAMOS** — no ar e em uso |
| **2** | **Outras congregações e casas de oração** | outras comuns, mesmo modelo de culto | ⚪ possível, não iniciado |
| **3** | **Venda** | uma central da congregação, ou clientes fora dela | ⚪ possível, não iniciado |

**Nada da fase 2 ou 3 está sendo construído agora.** O que existe é a **base preparada para elas** —
e a diferença entre "preparado" e "sendo feito" importa para quem chega no projeto e precisa saber o
que é escopo de hoje.

---

## 🔴 Por que o produto já é genérico se ainda não é vendido

Esta é a pergunta que alguém vai fazer olhando o `npm run generico` reprovar um nome de cliente num
projeto que tem **um** cliente.

**Porque a alternativa não tem volta.** Cravar "Escala Porteiros" e "JD. São Luiz" no código é barato
hoje e caríssimo depois: no dia em que a segunda congregação pedir, o trabalho não é configurar — é
**reescrever o produto**, achando cada lugar onde o nome vazou. E ele vaza em lugares que ninguém
procura: no `alt` de uma imagem, na descrição do `package.json`, no nome do arquivo baixado, dentro
do texto que o motor recebe.

Já aconteceu aqui: em 05/08/2026 havia **nove** lugares com o nome cravado, e o campo de configuração
para isso **existia desde o começo, sem nunca ser lido**. Custou meia hora consertar porque o produto
era pequeno. Daqui a um ano custaria uma semana.

> **O portão genérico não serve à fase 1. Ele serve a manter as fases 2 e 3 possíveis.**

O mesmo vale para o vocabulário configurável, para a malha como dado e para o `identidade.logo`:
nenhum deles ajuda a congregação de hoje. Todos evitam que a porta feche.

---

## O que já está pronto para a fase 2

Instalar para outra comum é seguir o [`INSTALAR.md`](INSTALAR.md) — **trocar dado, nunca código**:

| Já resolvido | Como |
|---|---|
| Nome, subtítulo, emblema | `config.identidade`, com tela na aba Gerar |
| Como chamar quem é escalado | `identidade.pessoa` — "Irmão", "Funcionário", "Plantonista" |
| Dias e turnos de culto | `config.malhaPadrao` |
| Quantas pessoas por turno | `config.capacidadePadrao`, com tela |
| Datas sem escala | `config.santaCeia` — outra comum tem outra data |
| Não deixar nome de cliente voltar | `npm run generico` + autoteste, dentro do GATE |

**O que falta para a fase 2, e está declarado no [`BACKLOG.md`](../BACKLOG.md):**

- a **malha ainda não tem tela** — muda-se editando `config.json` (dívida §0 declarada);
- a **publicação real pela tela nunca foi exercitada** com token de verdade;
- cada comum precisa do **próprio repositório** e do próprio administrador com token.

---

## O que a fase 3 reabre — e não antes

Estes assuntos **não são problema hoje**, e a decisão do Flavio foi explícita: *"essa não é
preocupação agora"*. Ficam registrados para não serem redescobertos do zero quando a hora chegar.

| Assunto | Por que muda na fase 3 |
|---|---|
| **Dados pessoais em repositório público** (P5.1) | Hoje são 16 irmãos conhecidos, num arranjo entre eles, num site que eles mesmos pediram. Num cliente pagante, são **funcionários** que não escolheram, e a responsabilidade pelo dado passa a ser de uma empresa |
| **Repositório privado** | Vira requisito de instalação, não opção. GitHub Pages com repositório privado exige plano pago |
| **Licença** (P5.6) | Repositório público sem `LICENSE` não é vendável nem defensável |
| **Publicação por duas pessoas** (P5.2) | Uma central com várias comuns tem mais de um administrador |
| **Idioma** (P5.5) | Só importa se sair do Brasil |
| **Suporte e atualização** | Quem instala hoje é o próprio autor. Cliente pagante espera outra coisa |

> ⚠️ **A fronteira está escrita para ser respeitada nos dois sentidos.** Ninguém deve gastar tempo
> nestes itens agora — e ninguém deve vender sem revisitá-los.

---

## O que isso significa para quem trabalha no projeto hoje

1. **A §0 continua valendo integralmente.** Nada de nome de cliente no código, e o portão reprova.
2. **Mas o escopo de trabalho é a fase 1.** Recurso que só a fase 2 ou 3 usaria não entra agora —
   entra no `BACKLOG.md` com a fase marcada.
3. **"Genérico" não quer dizer "para todo mundo agora".** Quer dizer que o específico vive em
   `dados/`, e nunca em `src/`.
