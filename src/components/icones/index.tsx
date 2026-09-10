// Ícones do universo de luta (line-art), em vez de ícones-placeholder genéricos.
// Ver DESIGN_BRIEF.md — vocabulário visual: luva, sino, corda, cadeado (janela fechada).
import Svg, { Path, Circle, Line } from 'react-native-svg';

interface IconeProps {
  tamanho?: number;
  cor?: string;
  espessura?: number;
}

export function IconeLuva({ tamanho = 24, cor = '#0A0A0A', espessura = 1.6 }: IconeProps) {
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7 11V6.5a2.5 2.5 0 0 1 5 0V10M12 10V5.5a2.5 2.5 0 0 1 5 0V12"
        stroke={cor}
        strokeWidth={espessura}
        strokeLinecap="round"
      />
      <Path
        d="M7 11c-1.5 0-2.5 1.2-2.5 2.8v2.4C4.5 19 6.6 21 9.6 21h1.8c3 0 5.1-2.3 5.1-5.1v-3.4c0-1.2-.9-2.1-2-2.1"
        stroke={cor}
        strokeWidth={espessura}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function IconeSino({ tamanho = 24, cor = '#0A0A0A', espessura = 1.6 }: IconeProps) {
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 16c0-1 .5-1.6.5-4.2C6.5 8.6 8.8 6 12 6s5.5 2.6 5.5 5.8c0 2.6.5 3.2.5 4.2H6Z"
        stroke={cor}
        strokeWidth={espessura}
        strokeLinejoin="round"
      />
      <Path d="M10 18.5a2 2 0 0 0 4 0" stroke={cor} strokeWidth={espessura} strokeLinecap="round" />
      <Line x1="12" y1="3.5" x2="12" y2="6" stroke={cor} strokeWidth={espessura} strokeLinecap="round" />
    </Svg>
  );
}

export function IconeCadeado({ tamanho = 24, cor = '#0A0A0A', espessura = 1.6 }: IconeProps) {
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7.5 10.5V8a4.5 4.5 0 0 1 9 0v2.5"
        stroke={cor}
        strokeWidth={espessura}
        strokeLinecap="round"
      />
      <Path
        d="M6 10.5h12v8a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 18.5v-8Z"
        stroke={cor}
        strokeWidth={espessura}
        strokeLinejoin="round"
      />
      <Line x1="12" y1="14" x2="12" y2="16.5" stroke={cor} strokeWidth={espessura} strokeLinecap="round" />
    </Svg>
  );
}

export function IconeCheck({ tamanho = 24, cor = '#0A0A0A', espessura = 2 }: IconeProps) {
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 12.5 9.5 17 19 6.5"
        stroke={cor}
        strokeWidth={espessura}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function IconeCorda({ tamanho = 24, cor = '#0A0A0A', espessura = 1.4 }: IconeProps) {
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 8c3 3 3-3 6 0s3-3 6 0 3-3 6 0"
        stroke={cor}
        strokeWidth={espessura}
        strokeLinecap="round"
      />
      <Path
        d="M3 15c3 3 3-3 6 0s3-3 6 0 3-3 6 0"
        stroke={cor}
        strokeWidth={espessura}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function IconeCirculo({ tamanho = 24, cor = '#0A0A0A', espessura = 1.6 }: IconeProps) {
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="8" stroke={cor} strokeWidth={espessura} />
    </Svg>
  );
}

// RF06: faixa/grau — usado na seleção de perfil Aluno, em vez de ícone genérico de "estudante"
export function IconeFaixa({ tamanho = 24, cor = '#0A0A0A', espessura = 1.6 }: IconeProps) {
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 8c0 3 2 3 2 6s-2 3-2 6M21 8c0 3-2 3-2 6s2 3 2 6"
        stroke={cor}
        strokeWidth={espessura}
        strokeLinecap="round"
      />
      <Path d="M3 8h18" stroke={cor} strokeWidth={espessura} strokeLinecap="round" />
      <Path
        d="M9 8v6a3 3 0 0 0 3 3 3 3 0 0 0 3-3V8"
        stroke={cor}
        strokeWidth={espessura}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// RF04: poste de canto + cordas — usado na seleção de perfil Academia, em vez de prédio genérico
export function IconePoste({ tamanho = 24, cor = '#0A0A0A', espessura = 1.6 }: IconeProps) {
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none">
      <Line x1="12" y1="4" x2="12" y2="21" stroke={cor} strokeWidth={espessura} strokeLinecap="round" />
      <Circle cx="12" cy="3.2" r="1.2" stroke={cor} strokeWidth={espessura} />
      <Path d="M5 8h14M4 13h16M5 18h14" stroke={cor} strokeWidth={espessura} strokeLinecap="round" />
    </Svg>
  );
}
