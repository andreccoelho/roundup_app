# RoundUp — Briefing de Design (para implementação direta em código)

## Como usar este documento

Os wireframes lo-fi em `docs/wireframes/` (as 17 telas do Figma) são **referência funcional apenas**: fluxo de navegação, hierarquia de informação, quais estados cada tela precisa cobrir. Eles NÃO são referência visual. Não reproduza os cards genéricos, os rótulos em CAIXA ALTA, ou o layout literal deles — a estética real vem deste briefing.

Antes de gerar qualquer tela, releia a seção "Anti-padrões a evitar". Ela existe porque a primeira tentativa (feita programaticamente no Figma) caiu em todos eles.

## Do que se trata

RoundUp é um app de gamificação para academias de Boxe e Muay Thai no Brasil. O público é aluno (adolescente a adulto) que treina luta, quer ver progresso concreto (frequência, faixa, XP, ranking da turma), e o professor/academia que gerencia turmas e valida evolução. O tom é de **ringue, não de academia genérica de crossfit ou app de produtividade**. Pense em cartaz de luta, placar de round, ficha de pesagem — não em dashboard de SaaS.

## Vocabulário visual do universo

Round, corner, luva, faixa/grau, tatame, corda do ringue, sino, ficha técnica, cartão de pontuação do juiz. Esses são os objetos que devem inspirar tratamento visual — não ícones genéricos de "fitness app" (halteres, coração, medalha dourada brilhante).

## Sistema de design (proposta — ajuste livremente)

**Cor:** base estritamente monocromática, como já definido — preto `#0A0A0A`, branco, e uma escala de cinzas. Nada de acento colorido decorativo (nem o verde/vermelho semântico deve virar "tema" — reserve cor só para status funcional: sucesso de check-in, alerta de janela fechada). A ausência de cor É a identidade — não compense com gradientes ou sombras suaves genéricas.

**Tipografia:** dois registros claramente distintos, não um Inter-para-tudo:
- Um **grotesco condensado/bold para números e headlines de placar** (XP, contagem de round, percentual de graduação) — pense em ficha de pesagem ou placar de arena: números grandes, apertados, com peso. Se Homebase (a fonte da marca) tiver um corte bold/condensado, use-o aqui; senão, é aceitável buscar uma condensada gratuita via Google Fonts (ex: Oswald, Bebas Neue) especificamente para esse papel numérico.
- Um **sans-serif neutro e legível para corpo de texto** (Homebase Regular, conforme já definido).
- Não use CAIXA ALTA como recurso de rótulo padrão — é o tique mais comum de design genérico. Se precisar de um rótulo pequeno, resolva com peso ou cor, não com maiúsculas forçadas.
- Não junte metadados com ponto médio ("Roxa · 2º Grau · 64%"). Separe visualmente por hierarquia de tamanho/peso, não por pontuação.

**Layout:** pare de repetir "card branco com borda cinza e raio 12 em tudo". Cards estruturalmente diferentes (card de faixa/graduação vs. card de missão vs. linha de ranking) devem ter tratamentos visuais diferentes — pelo menos um elemento deve quebrar a grade repetitiva (ex: o card de faixa atual pode ser full-bleed, sem padding lateral, como uma faixa de tecido; o ranking pode ser uma lista sem bordas, separada por linhas finas, como cartão de pontuação, não uma pilha de cards).

**Motivo assinatura (use com moderação, uma vez por tela no máximo):** uma referência visual à corda do ringue ou à faixa/graduação — já existe no logo (as linhas diagonais). Pode reaparecer como um detalhe estrutural (ex: barra de progresso de graduação com textura de faixa, não barra de progresso de SaaS genérica) — mas não decore todas as telas com isso, ou vira papel de parede.

## Anti-padrões a evitar (a primeira tentativa caiu em todos)

- Rótulos em CAIXA ALTA acima de conteúdo ("FAIXA ATUAL", "XP TOTAL", "RECOMPENSA DESTE TREINO")
- Metadados grudados com ponto médio ("Roxa · 2º Grau", "Missão semanal · Frequência")
- O "kit de card de SaaS": tudo em card branco arredondado, mesma borda cinza fina, mesmo raio, em qualquer hierarquia de conteúdo
- Ícones-placeholder genéricos dentro de caixa preta arredondada, repetidos sem variação
- Sombra suave cinza padrão embaixo de todo elemento "elevado"

## Telas do Ciclo 1 (ordem sugerida de implementação)

Mapeamento tela → requisito, para referência ao gerar:

1. Login + Cadastro — RF01, RF02
2. Seleção de perfil (Academia/Professor/Aluno) — RF01
3. Home do Aluno (faixa, XP, sequência, CTA de check-in, missões, ranking) — RF14
4. Check-in — precisa dos **3 estados visualmente distintos**: disponível, fora da janela de tempo (RN08), já realizado (RN02). Isso não é opcional — é regra de negócio que precisa ser legível de relance, sem o usuário ler texto.
5. Missões (lista com filtro em curso/concluídas/do professor)
6. Perfil do Aluno/Professor/Academia — RF04–RF06
7. Vínculos (solicitar/aceitar) — RF07, RF08
8. Turmas e sessões — visão do gestor — RF10, RF11, RF12
9. Histórico de check-ins — RF15

## Processo recomendado para o Claude Code

Siga o processo de duas passadas do skill de frontend-design: primeiro um plano curto (paleta com hex nomeados, papéis tipográficos, conceito de layout em prosa/ASCII, princípios) revisado contra este briefing antes de qualquer código — se alguma escolha do plano seria a mesma para qualquer app de fitness genérico, revise antes de implementar. Depois disso, implemente incrementalmente, telas âncora primeiro (Home do Aluno + Check-in), tire screenshot/preview e faça autocrítica antes de seguir para as próximas.