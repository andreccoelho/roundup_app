// TEMPORÁRIO — ponte da direção "Noite de luta" para a nova (docs/DESIGN.md). Mantém compilando os
// arquivos ainda não migrados para useTema()/criarEstilos() durante as fases do redesign; é
// apagado na fase 6, quando nenhum arquivo importa mais estes nomes. Valores = tema escuro novo.
import { Platform, type TextStyle } from 'react-native';
import { CoresEscuro } from './tokens';

export const Cores = {
  fundo: CoresEscuro.fundo,
  superficie1: CoresEscuro.superficie,
  superficie2: CoresEscuro.superficieElevada,
  linha: CoresEscuro.separadorOpaco,
  linhaForte: '#6E6E74',
  texto: CoresEscuro.texto,
  texto2: CoresEscuro.texto2,
  texto3: CoresEscuro.texto3,
  acento: CoresEscuro.tint,
  sucesso: CoresEscuro.sucesso,
  perigo: CoresEscuro.perigo,
  ouro: CoresEscuro.ouro,
  sobreCor: CoresEscuro.sobreTint,
  overlay: CoresEscuro.overlay,
  foco: CoresEscuro.tint,
} as const;

export const TamanhoFonte = { xs: 12, sm: 14, md: 16, lg: 20, xl: 24, xxl: 32, display: 40, placar: 48, placarXL: 96 } as const;

export const RaiosLegado = { nenhum: 0, vivo: 10, pequeno: 12, pilula: 999 } as const;
export const AlturasLegado = { botaoHero: 56, abaBarra: 56 } as const;
export const DuracaoLegado = { dramatica: 500 } as const;

export const Sombras = {
  duraAcento: Platform.select<TextStyle>({ web: {} as TextStyle, default: {} }),
};

export const Geometria = { corteDiagonal: 28 } as const;
