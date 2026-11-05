# Contraste — redesign Apple

Contraste WCAG 2.1 de cada cor de texto e de interface da paleta (`src/theme/tokens.ts`) sobre os fundos em que aparece, nos dois temas. Cores translúcidas (`preenchimento`, `tintSuave`) foram compostas sobre o fundo real. Gerado por script fora do repositório; o axe-core (`docs/redesign-apple/fase-6/axe.json`) confirma 0 violações de `color-contrast` nas telas renderizáveis.

Mínimos: 4,5:1 para texto; 3:1 para componentes de interface e objetos gráficos (borda do anel de foco, botão sobre a superfície, contorno da faixa, anel de falta).

Dois desvios das cores de sistema do iOS, por acessibilidade:
- `texto2`/`texto3` do tema claro são mais escuros que `secondaryLabel`/`tertiaryLabel` (rgba(60,60,67,0.6) dá **3,44:1** sobre branco).
- O vermelho da marca tem dois tons: `tint` para texto e ícone e `tintCheio` (#CC2A1F) para fundo de botão com rótulo branco. O `systemRed` do escuro (#FF453A) com rótulo branco dá só ~3,5:1.

## Tema claro

| cor | fundo #FFFFFF | fundoAgrupado #F2F2F7 | preenchimento (sobre branco) #EEEEEF | tintSuave (sobre branco) #FBEAE9 |
|---|---|---|---|---|
| texto #000000 | 21.00 | 18.82 | 18.11 | 18.05 |
| texto2 #56565C | 7.29 | 6.53 | 6.29 | 6.26 |
| texto3 #6A6A70 | 5.37 | 4.82 | 4.63 | 4.62 |
| tint #CC2A1F | 5.36 | 4.80 | 4.62 | 4.61 |
| sucesso #177A34 | 5.43 | 4.86 | 4.68 | 4.66 |
| perigo #C4231B | 5.83 | 5.22 | 5.03 | 5.01 |
| ouro #876000 | 5.67 | 5.08 | 4.89 | 4.87 |

- sobreTint #FFFFFF sobre tintCheio #CC2A1F: **5.36**
- sobreTint sobre perigoCheio #C4231B: **5.83**
- sobreTint sobre sucessoCheio #1A7F37: **5.08**
- branco sobre ouro (medalha máxima): **5.67**
- texto2 sobre preenchimentoOpaco #E5E5EA (avatar): **5.81**
- CorFoco #CC2A1F sobre fundo (anel de foco): **5.36**
- texto3 (contorno de faixa/anel vazio) sobre superficie: **5.37**

## Tema escuro

| cor | fundo #000000 | superficie #1C1C1E | superficieElevada #2C2C2E | tintSuave (sobre superficie) #3E2523 |
|---|---|---|---|---|
| texto #FFFFFF | 21.00 | 17.01 | 13.94 | 14.06 |
| texto2 #AEAEB2 | 9.50 | 7.69 | 6.30 | 6.36 |
| texto3 #98989F | 7.33 | 5.94 | 4.86 | 4.91 |
| tint #FF5A4F | 6.83 | 5.53 | 4.53 | 4.57 |
| sucesso #30D158 | 10.39 | 8.42 | 6.89 | 6.95 |
| perigo #FF6961 | 7.45 | 6.03 | 4.94 | 4.98 |
| ouro #FFD60A | 14.88 | 12.05 | 9.87 | 9.96 |

- sobreTint #FFFFFF sobre tintCheio #CC2A1F: **5.36**
- sobreTint sobre perigoCheio #C4231B: **5.83**
- preto sobre ouro (medalha máxima): **14.88**
- texto2 sobre preenchimentoOpaco #3A3A3C (avatar): **5.13**
- CorFoco #CC2A1F sobre fundo (anel de foco): **3.92**
- tintCheio (botão) sobre superficie (UI, 3:1): **3.17**
