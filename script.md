> **SUBSTITUÍDO.** Este documento não vale mais como regra. A referência de design atual é [`docs/DESIGN.md`](docs/DESIGN.md) (direção "Noite de luta"). Mantido só como histórico.

# Prompt para Claude Code — Redesign de UI do RoundUp (identidade "cara de luta")

Cole este prompt inteiro no Claude Code, rodando dentro do repositório `roundup_app`, branch `dev`.

---

## Contexto

Você vai trabalhar no RoundUp, app mobile (React Native + Expo SDK 57, TypeScript) de gamificação para academias de Boxe e Muay Thai. A base funcional já está pronta (vínculos, check-ins, XP, missões, ranking). O problema agora é puramente visual: a interface está correta mas genérica. Falta personalidade de luta.

Antes de tocar em qualquer arquivo, leia:
- `src/constants/colors.ts`
- `src/constants/typography.ts`
- `App.tsx` (carregamento de fontes)
- Todas as telas em `src/screens/`
- Todos os componentes reutilizáveis em `src/components/`

Não pule essa leitura. O redesign precisa nascer do que já existe, não substituir por um sistema novo.

## O que NÃO pode mudar

- Paleta base: preto/branco/cinza com verde e vermelho como cores funcionais (sucesso/erro, positivo/negativo). Você pode ajustar tons, adicionar variações (ex: um cinza mais quente, um verde mais saturado para "hit"), mas não introduza uma paleta nova nem cores decorativas soltas.
- Oswald continua sendo a fonte de placar, XP, sequência (streak) e classificação (ranking). Não substitua em nenhum desses contextos.
- Homebase (`assets/fonts/homebase.ttf`) é fonte de marca: lettering "RNDP" e títulos de tela. Não a use em corpo de texto, XP, placar ou ranking.
- Lógica de negócio, navegação, estado, chamadas ao Firestore: nada disso muda. É um trabalho de camada visual (estilos, componentes de apresentação, assets), não de arquitetura.
- A proibição de cards uniformes do Design Brief continua valendo — na verdade é o ponto de partida de tudo abaixo.

## O que precisa mudar: dar "cara de luta"

O app hoje parece um dashboard de produtividade. Precisa parecer o que é: uma ferramenta para quem treina luta. Direção de personalidade:

**1. Linguagem visual de combate, não de app corporativo**
- Trocar cards retangulares uniformes por formas com corte diagonal, bordas assimétricas, cantos vivos — como se fossem placas de ringue ou tags de luva.
- Usar textura sutil de lona de ringue (canvas) como fundo em telas-chave (home, perfil), sem prejudicar legibilidade.
- Divisores de seção podem imitar corda de ringue (linha dupla) em vez de linha reta simples.
- Ícones customizados com tema de luta onde fizer sentido: luva, faixa/graduação, saco de pancada, bandeira de round — substituindo ícones genéricos de biblioteca (estrela, troféu padrão) sempre que houver equivalente temático.

**2. Tipografia com impacto**
- Títulos de tela (Homebase) podem ganhar leve distorção/inclinação ou efeito de "batida" (drop shadow duro, sem blur, deslocado — estilo cartaz de luta) em telas de destaque (home, resultado de sessão, subida de faixa).
- Números de XP e placar (Oswald) ganham hierarquia mais agressiva: tamanho maior, peso mais pesado nos momentos de conquista, contraste alto.

**3. Motion e microinterações com peso**
- Ao completar um check-in ou missão: uma animação curta de "impacto" (leve shake/punch + flash de cor funcional), não um fade suave genérico.
- Subida de faixa/graduação: uma transição de tela ou selo com timing mais dramático (0.4–0.6s), sensação de conquista, não uma modal discreta.
- Barra de XP/progresso: em vez de barra lisa padrão, considerar textura de "round" (segmentada por round, se fizer sentido no contexto de missões) ou efeito de preenchimento com leve vibração ao chegar perto do próximo nível.
- Evite qualquer animação "fofa" (bounce suave, confete colorido genérico) — o tom é intenso, não infantil.

**4. Badges e progressão como identidade visual central**
- Badges de faixa (graduação) e conquistas devem parecer emblemas reais, não ícones planos — usar profundidade (leve gradiente metálico dentro da paleta preto/branco/cinza + cor funcional), silhueta de ringue já usada na logo pode reaparecer como moldura de badge.
- Ranking/leaderboard: top 3 precisa se destacar visualmente de forma óbvia (não só numeração), como um pódio ou disposição assimétrica.

**5. Consistência com a logo**
- A logo de silhueta de ringue com lettering RNDP é a referência de tom. Extraia dela: ângulos, espessura de linha, contraste puro preto/branco. Todo elemento novo deve parecer que poderia coexistir com essa logo, não competir com ela.

## Escopo técnico de execução

Trabalhe nesta ordem, tela por tela quando possível, com commits pequenos e descritivos:

1. **Fundação de estilo**: revisar `colors.ts` e `typography.ts` para acomodar as variações descritas acima (novos tokens, não substituições da paleta base). Documentar cada token novo com comentário explicando o uso pretendido.
2. **Componentes de base primeiro**: card genérico, botão primário/secundário, badge, barra de progresso, divisor. Esses componentes são reutilizados em todas as telas — acertar aqui evita retrabalho.
3. **Tela Home** (aluno): primeira tela que o usuário vê, prioridade máxima de impacto.
4. **Tela de check-in / conclusão de sessão**: momento de recompensa, prioridade alta para motion.
5. **Perfil / graduação / badges**: onde a progressão fica visível.
6. **Ranking**.
7. **Telas de gestor (Professor/Academia)**: mesma linguagem visual, mas tom levemente mais "operacional" (menos motion, mais densidade de informação) — são telas de gestão, não de engajamento do aluno.
8. **Onboarding compartilhado**: por último, já que é a tela mais nova e menos testada.

Para cada tela alterada, rode o app (Expo) e confirme visualmente antes de seguir para a próxima.

## Critérios de aceite

- Nenhuma quebra de funcionalidade existente (navegação, dados, autenticação).
- Paleta e fontes obrigatórias respeitadas em 100% das telas.
- Nenhum card uniforme sobrevive ao redesign.
- Pelo menos uma microinteração de "impacto" implementada em check-in e em subida de faixa.
- Performance: nada de libs pesadas de animação só para um efeito pontual — priorize `react-native-reanimated` (se já no projeto) ou CSS/estilo nativo antes de adicionar dependência nova. Se precisar adicionar dependência, justifique antes de instalar.

## Entrega

Ao final, gere um changelog curto (`docs/REDESIGN_LOG.md` ou append em log de desenvolvimento existente) listando:
- Tokens novos adicionados e por quê
- Componentes alterados
- Telas concluídas nesta rodada vs. pendentes
- Qualquer decisão de design que precise de validação do André antes de seguir (ex: se algo exigir ativo gráfico novo — ícone customizado, textura — sinalize em vez de gerar um placeholder genérico e seguir como se fosse final)