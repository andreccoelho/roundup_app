# Relatório técnico do RoundUp: estado atual

Projeto baseado no template de TCC das Engenharias do Ibmec, configurado como **Projeto aplicado (relatório técnico)** (`\relatoriotrue` no `main.tex`).

## Como compilar
- **Overleaf:** envie o .zip, use Compiler = pdfLaTeX e Main document = `main.tex`.
- **Local:** `latexmk -pdf main.tex` (precisa do pacote abntex2).

## Fontes usadas no preenchimento
- Lista de requisitos exportada do Notion (RF01–RF33, RN01–RN09, RNF01–RNF11).
- Repositório `andreccoelho/roundup_app` (branch `dev`): código, `docs/decisoes-tecnicas.md`, `docs/DECISOES_PENDENTES.md`, testes e capturas do redesign.
- Formulário com usuários reais (6 respostas, 18–19/09/2026).
- Respostas sintéticas (65, 26/10/2026), geradas por script a partir de 12 personas e enviadas a uma cópia do formulário. Metodologia em `dados/brutos/metodologia_respostas_sinteticas.xlsx`. **Não são evidência**: servem só para testar o questionário e a análise.

## O que cada capítulo tem agora
| Capítulo | Conteúdo |
|---|---|
| 1. Introdução | Três perfis (aluno, professor, academia); objetivo (d) reescrito como teste do instrumento |
| 2. Ideação e requisitos | Ideias I01–I13 ligadas aos RF reais; situação decidida só com dados reais (gestão = "Sem dados"); RN; RNF |
| 3. Modelagem | Visão geral por pacotes (TikZ), 7 diagramas de casos de uso (PlantUML, PDF vetorial), quadro UC01–UC30, descrição UC12/UC15, modelo de dados Firestore, diagrama de sequência |
| 4. Implementação | Tecnologias, arquitetura, ciclos, telas (Figura 5), situação de cada requisito, 2 trechos de código |
| 5. Testes e validação | Survey real; 5.2 teste do instrumento com respostas sintéticas; suítes de teste |
| 6. Resultados | Objetivo a objetivo, personas, limitações, trabalhos futuros |
| Resumo / Abstract | Completos |
| Apêndices | A: especificação dos 30 casos de uso e B: questionário (duas colunas, espaçamento simples); C: 12 personas sintéticas; D: protocolo das respostas sintéticas |

## Diagramas UML
- Fontes PlantUML em `figuras/uml-fonte/`; PDFs em `figuras/uc-*.pdf` (exportados em monocromático).

## Dados e scripts
- `dados/survey_anonimizado.csv`, `dados/notas_por_ideia.csv`: usuários reais (gerados por `scripts/analise_survey.py`).
- `dados/brutos/personas_ia_respostas.csv`: export bruto da cópia do formulário com as respostas sintéticas.
- `scripts/analise_personas.py` gera `dados/personas_anonimizado.csv`, `dados/notas_por_ideia_personas.csv`, `tab-personas.tex` e `tab-dispersao.tex`:

      python3 scripts/analise_personas.py dados/brutos/personas_ia_respostas.csv

## O que ainda depende de você
Nenhuma caixa "Orientação ao aluno" restante. Falta só:
1. Banca, titulação da orientadora e data em `config/dados.tex`.
2. Agradecimentos, dedicatória e epígrafe (ou comentar no `main.tex`).
3. Conferir as referências do `.bib` nas fontes originais.
4. Ficha catalográfica em `ficha/ficha-catalografica.pdf`.
5. `\mostrarorientacoesfalse` no `main.tex` e apagar `figuras/exemplo-*.png`.
6. Avisar a orientadora das mudanças de enquadramento (objetivo d, respostas sintéticas, requisitos de gestão "sem dados").
