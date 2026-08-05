# Modelo de dados

> **Cadeia:** [`AGENTS.md`](../AGENTS.md) → [`docs/RECONSTRUIR.md`](RECONSTRUIR.md) → **você está aqui**
>
> Vizinhos: [`CATALOGO_DE_REGRAS.md`](CATALOGO_DE_REGRAS.md) · [`ARQUITETURA.md`](ARQUITETURA.md) ·
> [`OPERACAO.md`](OPERACAO.md)

Este documento descreve os **três arquivos JSON** que são o sistema inteiro. Quem entender estes
três arquivos consegue reconstruir o produto — o resto é tela em cima deles.

---

## A ideia de fundo, que vale mais que os campos

O site anterior **não tinha "a escala"**. Tinha uma função que remontava tudo a cada abertura do
navegador. Por isso não havia como editar: **não havia o que editar**. Trocar uma pessoa exigia
mexer no código e publicar de novo.

Aqui a escala é **dado publicado**. Dessa única mudança saem três consequências que o produto
inteiro depende:

| Porque a escala é dado… | …dá para |
|---|---|
| existe um arquivo com o resultado | **editar** sem tocar em código |
| o arquivo tem versões no git | **voltar atrás** |
| o arquivo é lido, não recalculado | **conferir**: o que está no arquivo é o que aparece na tela |

E uma regra que atravessa tudo: **o passado não se reescreve.** Um bloco publicado pode ser
*truncado* numa data, nunca alterado no trecho que permanece. Quem já viu a escala não pode ser
desmentido.

---

## Onde os arquivos moram — e por que são DUAS pastas

```
public/dados/     ← a origem. É o que o build lê
docs/dados/       ← o que o GitHub Pages SERVE. É o que o irmão baixa
```

🔴 **Gravar em só uma é o erro que não avisa.** O site continua no ar, mostrando o dado antigo, sem
erro nenhum no console. Já aconteceu neste projeto: um script gravava só em `public/` e contava com
o build para copiar.

Tudo que escreve dado escreve **nas duas**: a publicação pela tela (`publicarDados`) e o script
(`gerar-bloco.mjs --escrever`). O auditor adversarial tem uma pergunta só para isso: *"os dois
arquivos de dados são iguais?"*

---

## 1. `pessoas.json` — quem pode ser escalado

```json
{
  "pessoas": [
    {
      "id": "williams",
      "nome": "Williams",
      "ativo": true,
      "restricoes": {
        "diasPermitidos": [0, 3],
        "tetoMensal": 3
      }
    }
  ]
}
```

| Campo | Tipo | O que é |
|---|---|---|
| `id` | texto | Identificador estável. **Nunca muda**, nem se a pessoa trocar de nome — é ele que aparece dentro dos turnos |
| `nome` | texto | O que a tela mostra |
| `ativo` | booleano | `false` = saiu da escala. **Continua no arquivo**: o passado dele está nos turnos e precisa continuar visível |
| `restricoes` | objeto | As cinco famílias abaixo. Objeto vazio = sem restrição nenhuma |

### As cinco famílias de restrição

| Campo | Exemplo | O que quer dizer |
|---|---|---|
| `diasPermitidos` | `[0, 3]` | **Só** pode domingo (0) e quarta (3). Ausente = todos os dias |
| `diasProibidos` | `[6]` | **Nunca** pode sábado. Vence `diasPermitidos` em caso de conflito |
| `turnosPermitidos` | `["NOITE"]` | Só à noite. Ausente = todos |
| `tetoMensal` | `3` | **Máximo** por mês. Nunca é meta — ver abaixo |
| `ausencias` | `[{"inicio":"2026-09-01","fim":"2026-09-15","motivo":"férias"}]` | Intervalos, **inclusivos nas duas pontas** |

🔴 **Lista ausente ≠ lista vazia.** `diasPermitidos` ausente significa *"todos os dias"*.
`diasPermitidos: []` significa *"nenhum dia"* — a pessoa não pode ser escalada nunca. São coisas
opostas, e tratá-las igual é o defeito clássico do `null` que liga um modo especial.

🔴 **`tetoMensal` é teto, nunca meta.** Ultrapassar reprova (regra D7). Ficar abaixo **não é falha** —
só vira aviso quem fica **2 ou mais** abaixo, e só em **mês inteiro** (regra Q5). O site anterior
quebrou exatamente aqui: o gerador tratava como teto e a validação cobrava como exato.

---

## 2. `blocos.json` — a escala

```json
{
  "versao": 1,
  "blocos": [
    {
      "id": "bloco-historico-2026-03",
      "inicio": "2026-03-01",
      "fim": "2026-08-05",
      "geradoEm": "2026-08-05T12:00:00-03:00",
      "origem": "importado",
      "pisoAlcancado": null,
      "elenco": ["williams", "adilson"],
      "malha": { "regras": [] },
      "turnos": [
        { "data": "2026-03-01", "tipo": "MANHA", "capacidade": 3, "pessoas": ["williams", "adilson", "marcos"] },
        { "data": "2026-08-16", "tipo": "NOITE", "capacidade": 0, "pessoas": [], "santaCeia": true }
      ]
    }
  ]
}
```

### O bloco

| Campo | O que é |
|---|---|
| `id` | Identificador do bloco |
| `inicio` / `fim` | O intervalo que este bloco **governa** — não é o mesmo que o primeiro e o último turno. Um bloco de 06/08 a 31/12 pode ter o primeiro turno em 08/08, se 06 e 07 não tiverem culto |
| `geradoEm` | Quando foi montado, com fuso |
| `origem` | `importado` (veio de fora, é histórico e **congelado**) · `algoritmo` · `motor` · `manual` |
| `pisoAlcancado` | O maior distanciamento que coube. `null` para bloco importado |
| `elenco` | Quem **participa deste bloco**. Quem não está aqui não é contado nem cobrado por regra nenhuma |
| `malha` | A malha vigente **neste bloco**. Fica no bloco, não na configuração, porque ela muda com o tempo e o passado tem de continuar sendo lido pela malha da época |
| `semente` | *(opcional)* O sorteio que produziu esta versão. Guardado para a escala ser **reproduzível** |

### O turno

| Campo | O que é |
|---|---|
| `data` | `AAAA-MM-DD` |
| `tipo` | `MANHA` · `TARDE` · `NOITE` (sem acento no dado; a tela acentua) |
| `capacidade` | Quantas vagas |
| `pessoas` | Os `id`s escalados |
| `rotulo` | *(opcional)* Etiqueta na tela, ex.: `"ENSAIO"`. 🔴 Até 05/08/2026 esta linha era uma **promessa não cumprida**: o campo era gravado, viajava no `blocos.json` e era lido em **um** lugar — a aba Ajustar. O site público e a imagem do WhatsApp imprimiam `"ENSAIO"` **cravado no componente**, em todo turno de tarde. Hoje ele atravessa por `Shift.rotulo` e chega aos três |
| `santaCeia` | *(opcional)* `true` = dia marcado, **sem ninguém**, e que não consome cota |

### 🔴 Como blocos que se sobrepõem são resolvidos

Blocos **podem** se sobrepor: gerar `01/09 → 30/12` trunca o anterior em 31/08. A regra de desempate
é uma só, e vale sempre:

> **O bloco que começa depois manda no trecho compartilhado.**

E um bloco só governa o que está **dentro do próprio intervalo** — turno com data fora de
`inicio`/`fim` é ignorado. É isso que permite preservar o passado e regerar o futuro.

---

## 3. `config.json` — o que muda de cliente para cliente

```json
{
  "versao": 1,
  "capacidadePadrao": 3,
  "malhaPadrao": {
    "regras": [
      { "diaSemana": 0, "turnos": ["MANHA", "NOITE"] },
      { "diaSemana": 3, "turnos": ["NOITE"] },
      { "diaSemana": 6, "turnos": ["NOITE"] },
      { "diaSemana": 6, "turnos": ["TARDE"], "somenteOcorrencia": 1, "rotulo": "ENSAIO" }
    ]
  },
  "santaCeia": ["2026-08-16"],
  "identidade": {
    "titulo": "Escala Porteiros",
    "subtitulo": "JD. São Luiz",
    "logo": "logo.png",
    "pessoa": { "singular": "Irmão", "plural": "irmãos" }
  }
}
```

| Campo | O que é |
|---|---|
| `capacidadePadrao` | Quantas pessoas por turno. Numa portaria de prédio pode ser 1 |
| `malhaPadrao` | Que dias da semana têm turno, e quais. Ver abaixo |
| `santaCeia` | Datas em que **ninguém** é escalado. Pode estar vazio |
| `identidade` | O nome do cliente. **É o único lugar do sistema que sabe de quem é a escala** |

### A malha

Cada regra diz: *neste dia da semana existem estes turnos*.

| Campo | O que é |
|---|---|
| `diaSemana` | 0=domingo … 6=sábado |
| `turnos` | Quais turnos existem nesse dia |
| `somenteOcorrencia` | *(opcional)* `1` = só na 1ª ocorrência do mês. É como se descreve "1º sábado do mês tem ensaio" |
| `rotulo` | *(opcional)* Etiqueta, ex.: `"ENSAIO"` |
| `capacidade` | *(opcional)* Capacidade só desta regra |

### 🔴 `identidade` — o que torna o produto vendável

| Campo | Onde aparece |
|---|---|
| `titulo` | Cabeçalho do site, imagem do WhatsApp, título da aba, nome do arquivo baixado |
| `subtitulo` | Linha menor sob o título. **Pode ser vazio** de propósito |
| `logo` | Nome do arquivo em `dados/`. **Vazio = sem emblema**, e a tela se arranja |
| `pessoa.singular` / `pessoa.plural` | Como este cliente chama quem é escalado: "Irmão", "Funcionário", "Plantonista" |

Isto existe porque a regra máxima de escopo (§0 do [`AGENTS.md`](../AGENTS.md)) diz que a escala é
**genérica**. O código não sabe o nome de cliente nenhum, e `npm run generico` reprova se alguém
cravar um.

---

## 🔴 A armadilha do arquivo velho

`config.json` é lido com um padrão de reserva. **O padrão só entra quando o download FALHA** — um
arquivo que baixa bem mas veio de uma versão anterior do produto entrega `undefined` num campo que o
TypeScript jura ser `string`.

Não é hipótese: quando `identidade.pessoa` nasceu, o arquivo publicado não o tinha, e a tela teria
mostrado *"Total de turnos por undefined e mês"*.

Por isso existe `completarConfig()`, que preenche **campo a campo** o que faltar. A mescla rasa
(`{...padrao, ...lido}`) **não resolve**: ela devolve o objeto aninhado inteiro do arquivo, sem o
campo novo. Há teste que fica vermelho contra a versão rasa.

**Ao acrescentar campo novo em `config.json`, acrescente também em `completarConfig` e no teste.**

---

## Como conferir que o dado chega inteiro à tela

```bash
npm run vivo:conferir
```

Abre o site publicado num navegador de verdade e compara, dia a dia e nome a nome, com o JSON.
Hoje: **131 dias e 543 nomes, 0 divergências**.
