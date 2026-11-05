// Ícones do RoundUp no estilo dos SF Symbols (docs/DESIGN.md): viewBox 24, traço uniforme de 1,75,
// pontas e junções arredondadas, cantos arredondados nas formas. Os ícones das abas têm versão
// preenchida (`preenchido`), usada na aba ativa, como na tab bar do iOS; os recortes da versão
// cheia são feitos com fillRule "evenodd", sem máscara, para funcionar igual no nativo e no web.
// Desenho próprio em SVG nas três plataformas (sem expo-symbols): o visual é o mesmo no iOS, no
// Android e no web. Decorativos por padrão: quem precisa de rótulo acessível coloca no elemento pai.
import type { ReactNode } from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

export interface IconeProps {
  tamanho?: number;
  cor?: string;
  espessura?: number;
  preenchido?: boolean;
}

const COR_PADRAO = '#8E8E93';
const TRACO = 1.75;

// flexShrink 0: no web um <svg> numa linha flex encolhe até sumir quando o texto ao lado não cabe
const SEM_ENCOLHER = { flexShrink: 0 };

function Base({ tamanho = 24, children }: { tamanho?: number; children: ReactNode }) {
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none" style={SEM_ENCOLHER}>
      {children}
    </Svg>
  );
}

function traco(cor: string, espessura: number) {
  return { stroke: cor, strokeWidth: espessura, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
}

// ---- Ícones de aba (contorno e preenchido) ----

// Treinar — luva de boxe
export function IconeLuva({ tamanho, cor = COR_PADRAO, espessura = TRACO, preenchido }: IconeProps) {
  if (preenchido) {
    return (
      <Base tamanho={tamanho}>
        <Path d="M11 3.5h3a5 5 0 0 1 5 5V11a4.5 4.5 0 0 1-4.5 4.5H10a4 4 0 0 1-4-4v-3a6 6 0 0 1 5-5Z" fill={cor} />
        <Path d="M3.6 10.6a2.1 2.1 0 0 1 3.4-1.7l.6.5v4.1l-1.6.4a2.4 2.4 0 0 1-2.4-3.3Z" fill={cor} />
        <Rect x="7.5" y="16.75" width="9.5" height="3.75" rx="1.4" fill={cor} />
      </Base>
    );
  }
  return (
    <Base tamanho={tamanho}>
      <Path d="M11 3.5h3a5 5 0 0 1 5 5V11a4.5 4.5 0 0 1-4.5 4.5H10a4 4 0 0 1-4-4v-3a6 6 0 0 1 5-5Z" {...traco(cor, espessura)} />
      <Path d="M6 9.4 5.4 9a1.9 1.9 0 0 0-2 3.2l2.6 1" {...traco(cor, espessura)} />
      <Rect x="7.5" y="17.25" width="9.5" height="3.25" rx="1.2" {...traco(cor, espessura)} />
    </Base>
  );
}

// Agenda — calendário
export function IconeFichaTecnica({ tamanho, cor = COR_PADRAO, espessura = TRACO, preenchido }: IconeProps) {
  if (preenchido) {
    return (
      <Base tamanho={tamanho}>
        <Path
          fillRule="evenodd"
          d="M6.5 5h11a3 3 0 0 1 3 3v9.5a3 3 0 0 1-3 3h-11a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3Zm1 7.5v2h2v-2h-2Zm4.5 0v2h2v-2h-2Zm4.5 0v2h2v-2h-2Zm-9 4v2h2v-2h-2Zm4.5 0v2h2v-2h-2Z"
          fill={cor}
        />
        <Path d="M8 3v3.5M16 3v3.5" {...traco(cor, espessura)} />
      </Base>
    );
  }
  return (
    <Base tamanho={tamanho}>
      <Rect x="3.5" y="5" width="17" height="15.5" rx="3" {...traco(cor, espessura)} />
      <Path d="M3.5 10h17M8 3v3.5M16 3v3.5" {...traco(cor, espessura)} />
      <Path d="M8 13.5h.01M12 13.5h.01M16 13.5h.01M8 17h.01M12 17h.01" {...traco(cor, espessura + 0.5)} />
    </Base>
  );
}

// Missões — bandeira
export function IconeBandeira({ tamanho, cor = COR_PADRAO, espessura = TRACO, preenchido }: IconeProps) {
  return (
    <Base tamanho={tamanho}>
      <Path
        d="M5.5 4.5h11.3c.8 0 1.3.9.8 1.6L15.3 9l2.3 2.9c.5.7 0 1.6-.8 1.6H5.5"
        {...traco(cor, espessura)}
        fill={preenchido ? cor : 'none'}
      />
      <Path d="M5.5 3.5v17" {...traco(cor, espessura)} />
    </Base>
  );
}

// Classificação — pódio de barras
export function IconeCartaoPontuacao({ tamanho, cor = COR_PADRAO, espessura = TRACO, preenchido }: IconeProps) {
  const props = preenchido ? { fill: cor } : traco(cor, espessura);
  return (
    <Base tamanho={tamanho}>
      <Rect x="9.25" y="4.5" width="5.5" height="16" rx="1.6" {...props} />
      <Rect x="3" y="10.5" width="5.5" height="10" rx="1.6" {...props} />
      <Rect x="15.5" y="13.5" width="5.5" height="7" rx="1.6" {...props} />
    </Base>
  );
}

// Perfil — pessoa
export function IconePerfil({ tamanho, cor = COR_PADRAO, espessura = TRACO, preenchido }: IconeProps) {
  const props = preenchido ? { fill: cor } : traco(cor, espessura);
  return (
    <Base tamanho={tamanho}>
      <Circle cx="12" cy="8" r="3.75" {...props} />
      <Path d="M4.75 19.6c.8-3.6 3.7-5.6 7.25-5.6s6.45 2 7.25 5.6a.8.8 0 0 1-.8 1H5.55a.8.8 0 0 1-.8-1Z" {...props} />
    </Base>
  );
}

// Hoje do gestor e notificações — sino
export function IconeSino({ tamanho, cor = COR_PADRAO, espessura = TRACO, preenchido }: IconeProps) {
  return (
    <Base tamanho={tamanho}>
      <Path
        d="M12 3.5c-3.2 0-5.5 2.5-5.5 5.8v3.3l-1.5 2.7c-.4.7.1 1.6.9 1.6h12.2c.8 0 1.3-.9.9-1.6l-1.5-2.7V9.3c0-3.3-2.3-5.8-5.5-5.8Z"
        {...traco(cor, espessura)}
        fill={preenchido ? cor : 'none'}
      />
      <Path d="M9.8 19.6a2.4 2.4 0 0 0 4.4 0" {...traco(cor, espessura)} />
    </Base>
  );
}

// Turmas — grade 2×2 (tatame visto de cima)
export function IconeTatame({ tamanho, cor = COR_PADRAO, espessura = TRACO, preenchido }: IconeProps) {
  const props = preenchido ? { fill: cor } : traco(cor, espessura);
  return (
    <Base tamanho={tamanho}>
      <Rect x="4" y="4" width="7" height="7" rx="2" {...props} />
      <Rect x="13" y="4" width="7" height="7" rx="2" {...props} />
      <Rect x="4" y="13" width="7" height="7" rx="2" {...props} />
      <Rect x="13" y="13" width="7" height="7" rx="2" {...props} />
    </Base>
  );
}

// Alunos e graduação — faixa com nó
export function IconeFaixa({ tamanho, cor = COR_PADRAO, espessura = TRACO, preenchido }: IconeProps) {
  if (preenchido) {
    return (
      <Base tamanho={tamanho}>
        <Rect x="2.5" y="8" width="6.2" height="4" rx="1.2" fill={cor} />
        <Rect x="15.3" y="8" width="6.2" height="4" rx="1.2" fill={cor} />
        <Rect x="9.6" y="6.75" width="4.8" height="6.5" rx="1.5" fill={cor} />
        <Path d="M10.6 14.5 9 20.5M13.4 14.5l1.6 6" {...traco(cor, espessura + 0.5)} />
      </Base>
    );
  }
  return (
    <Base tamanho={tamanho}>
      <Path d="M9.6 8H3.7a1.2 1.2 0 0 0-1.2 1.2v1.6A1.2 1.2 0 0 0 3.7 12h5.9M14.4 8h5.9a1.2 1.2 0 0 1 1.2 1.2v1.6a1.2 1.2 0 0 1-1.2 1.2h-5.9" {...traco(cor, espessura)} />
      <Rect x="9.6" y="6.75" width="4.8" height="6.5" rx="1.5" {...traco(cor, espessura)} />
      <Path d="M10.6 13.5 9 20.5M13.4 13.5l1.6 7" {...traco(cor, espessura)} />
    </Base>
  );
}

// ---- Ícones de conteúdo ----

export function IconeCadeado({ tamanho, cor = COR_PADRAO, espessura = TRACO }: IconeProps) {
  return (
    <Base tamanho={tamanho}>
      <Path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" {...traco(cor, espessura)} />
      <Rect x="5.5" y="10.5" width="13" height="10" rx="2.5" {...traco(cor, espessura)} />
      <Path d="M12 14.5v2" {...traco(cor, espessura)} />
    </Base>
  );
}

export function IconeCheck({ tamanho, cor = COR_PADRAO, espessura = 2.25 }: IconeProps) {
  return (
    <Base tamanho={tamanho}>
      <Path d="M5 12.8 9.6 17.2 19 6.8" {...traco(cor, espessura)} />
    </Base>
  );
}

// Check dentro de círculo — presença confirmada, missão concluída
export function IconeCheckCirculo({ tamanho, cor = COR_PADRAO, espessura = TRACO, preenchido }: IconeProps) {
  if (preenchido) {
    return (
      <Base tamanho={tamanho}>
        <Path
          fillRule="evenodd"
          d="M12 2.75a9.25 9.25 0 1 1 0 18.5 9.25 9.25 0 0 1 0-18.5Zm4.2 6.2a1 1 0 0 0-1.4-.1l-4.1 3.9-1.5-1.5a1 1 0 1 0-1.4 1.4l2.2 2.2a1 1 0 0 0 1.4 0l4.8-4.5a1 1 0 0 0 0-1.4Z"
          fill={cor}
        />
      </Base>
    );
  }
  return (
    <Base tamanho={tamanho}>
      <Circle cx="12" cy="12" r="8.75" {...traco(cor, espessura)} />
      <Path d="m8.3 12.3 2.4 2.4 5-4.8" {...traco(cor, espessura)} />
    </Base>
  );
}

// Vínculos — duas cordas (elo)
export function IconeCorda({ tamanho, cor = COR_PADRAO, espessura = TRACO }: IconeProps) {
  return (
    <Base tamanho={tamanho}>
      <Path d="M10 14a4 4 0 0 0 5.7 0l2.8-2.8a4 4 0 0 0-5.7-5.7l-.9.9" {...traco(cor, espessura)} />
      <Path d="M14 10a4 4 0 0 0-5.7 0l-2.8 2.8a4 4 0 0 0 5.7 5.7l.9-.9" {...traco(cor, espessura)} />
    </Base>
  );
}

export function IconeCirculo({ tamanho, cor = COR_PADRAO, espessura = TRACO }: IconeProps) {
  return (
    <Base tamanho={tamanho}>
      <Circle cx="12" cy="12" r="8.75" {...traco(cor, espessura)} />
    </Base>
  );
}

// Academia — poste de canto com cordas
export function IconePoste({ tamanho, cor = COR_PADRAO, espessura = TRACO }: IconeProps) {
  return (
    <Base tamanho={tamanho}>
      <Rect x="10" y="3" width="4" height="18" rx="2" {...traco(cor, espessura)} />
      <Path d="M3.5 7.5H10M14 7.5h6.5M3.5 12H10M14 12h6.5M3.5 16.5H10M14 16.5h6.5" {...traco(cor, espessura)} />
    </Base>
  );
}

export function IconeVoltar({ tamanho, cor = COR_PADRAO, espessura = 2.25 }: IconeProps) {
  return (
    <Base tamanho={tamanho}>
      <Path d="M15 4.5 7.5 12l7.5 7.5" {...traco(cor, espessura)} />
    </Base>
  );
}

export function IconeChevron({ tamanho, cor = COR_PADRAO, espessura = 2.25 }: IconeProps) {
  return (
    <Base tamanho={tamanho}>
      <Path d="m9 5 7 7-7 7" {...traco(cor, espessura)} />
    </Base>
  );
}

export function IconeFechar({ tamanho, cor = COR_PADRAO, espessura = 2 }: IconeProps) {
  return (
    <Base tamanho={tamanho}>
      <Path d="M6.5 6.5l11 11M17.5 6.5l-11 11" {...traco(cor, espessura)} />
    </Base>
  );
}

export function IconeMais({ tamanho, cor = COR_PADRAO, espessura = 2.25 }: IconeProps) {
  return (
    <Base tamanho={tamanho}>
      <Path d="M12 5v14M5 12h14" {...traco(cor, espessura)} />
    </Base>
  );
}

export function IconeOlho({ tamanho, cor = COR_PADRAO, espessura = TRACO }: IconeProps) {
  return (
    <Base tamanho={tamanho}>
      <Path d="M2.75 12C4.6 8 8 5.75 12 5.75S19.4 8 21.25 12C19.4 16 16 18.25 12 18.25S4.6 16 2.75 12Z" {...traco(cor, espessura)} />
      <Circle cx="12" cy="12" r="3" {...traco(cor, espessura)} />
    </Base>
  );
}

export function IconeOlhoFechado({ tamanho, cor = COR_PADRAO, espessura = TRACO }: IconeProps) {
  return (
    <Base tamanho={tamanho}>
      <Path d="M2.75 12C4.6 8 8 5.75 12 5.75S19.4 8 21.25 12C19.4 16 16 18.25 12 18.25S4.6 16 2.75 12Z" {...traco(cor, espessura)} />
      <Circle cx="12" cy="12" r="3" {...traco(cor, espessura)} />
      <Path d="M4.5 19.5 19.5 4.5" {...traco(cor, espessura)} />
    </Base>
  );
}

// Erro/alerta — triângulo de cantos arredondados
export function IconeAlerta({ tamanho, cor = COR_PADRAO, espessura = TRACO }: IconeProps) {
  return (
    <Base tamanho={tamanho}>
      <Path d="M10.3 4.6a2 2 0 0 1 3.4 0l7.2 12.6a2 2 0 0 1-1.7 3H4.8a2 2 0 0 1-1.7-3l7.2-12.6Z" {...traco(cor, espessura)} />
      <Path d="M12 9.5v4" {...traco(cor, espessura)} />
      <Path d="M12 16.75h.01" {...traco(cor, espessura + 0.75)} />
    </Base>
  );
}

// Janela de check-in — relógio
export function IconeRelogio({ tamanho, cor = COR_PADRAO, espessura = TRACO }: IconeProps) {
  return (
    <Base tamanho={tamanho}>
      <Circle cx="12" cy="12" r="8.75" {...traco(cor, espessura)} />
      <Path d="M12 7.5V12l3 2" {...traco(cor, espessura)} />
    </Base>
  );
}

// RF21: sequência — chama
export function IconeChama({ tamanho, cor = COR_PADRAO, espessura = TRACO, preenchido }: IconeProps) {
  return (
    <Base tamanho={tamanho}>
      <Path
        d="M12 21c-3.7 0-6.5-2.6-6.5-6.2 0-3.3 2.3-5.4 3.6-8.3.2-.5.9-.6 1.2-.1.8 1.2 1.4 1.9 2.2 2.4.3-2.2 1.3-4.1 2.8-5.6.4-.4 1.1-.2 1.2.4.4 2.5 2.5 4.6 2.5 8.4C19 17.6 16 21 12 21Z"
        {...traco(cor, espessura)}
        fill={preenchido ? cor : 'none'}
      />
    </Base>
  );
}

// RF19: medalha (fita + disco) — conquistas e 1º lugar
export function IconeCinturao({ tamanho, cor = COR_PADRAO, espessura = TRACO, preenchido }: IconeProps) {
  return (
    <Base tamanho={tamanho}>
      <Path d="M7.5 3.5h9l-2.6 5.2h-3.8L7.5 3.5Z" {...traco(cor, espessura)} fill={preenchido ? cor : 'none'} />
      <Circle cx="12" cy="15" r="5.5" {...traco(cor, espessura)} fill={preenchido ? cor : 'none'} />
    </Base>
  );
}

export function IconeSair({ tamanho, cor = COR_PADRAO, espessura = TRACO }: IconeProps) {
  return (
    <Base tamanho={tamanho}>
      <Path d="M13.5 4.5H7a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h6.5" {...traco(cor, espessura)} />
      <Path d="M10.5 12h9.5M16.5 8.5 20 12l-3.5 3.5" {...traco(cor, espessura)} />
    </Base>
  );
}
