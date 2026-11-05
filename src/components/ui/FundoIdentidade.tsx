// FundoIdentidade — o fundo da antiga BandaIdentidade (lona de ringue + marca d'água do logo)
// dentro de um cartão de destaque do redesign Apple: canto contínuo de 16, superfície do tema e a
// sombra sutil do claro, em vez da banda full-bleed com borda inferior. Fica atrás do topo dos
// perfis (CabecalhoPerfil) e da saudação de Home, Hoje e do painel da academia.
//
// - `aluno`: lona + marca d'água — telas de engajamento.
// - `gestor`: só marca d'água — tom operacional (professor e academia).
import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { criarEstilos, Espacamento, Raios, useTema } from '../../theme';
import Logo from '../Logo';
import TexturaLona from './TexturaLona';

interface FundoIdentidadeProps {
  variante?: 'aluno' | 'gestor';
  // Saudação em linha (marca d'água menor) × topo de perfil centralizado
  compacto?: boolean;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}

export default function FundoIdentidade({ variante = 'aluno', compacto, style, children }: FundoIdentidadeProps) {
  const styles = useEstilos();
  const { escuro } = useTema();
  const tamanhoMarca = compacto ? 160 : 200;
  return (
    <View style={[styles.fundo, compacto ? styles.compacto : styles.centro, style]}>
      {variante === 'aluno' ? <TexturaLona /> : null}
      <View
        style={[styles.marca, compacto ? styles.marcaCompacta : styles.marcaCentro, { opacity: escuro ? 0.06 : 0.04 }]}
        aria-hidden
        importantForAccessibility="no-hide-descendants"
        pointerEvents="none"
      >
        <Logo tamanho={tamanhoMarca} />
      </View>
      {children}
    </View>
  );
}

const useEstilos = criarEstilos((c, escuro) => ({
  fundo: {
    backgroundColor: c.superficie,
    borderRadius: Raios.destaque,
    borderCurve: 'continuous',
    overflow: 'hidden',
    ...(escuro ? {} : { boxShadow: '0px 1px 3px rgba(0,0,0,0.06), 0px 6px 16px rgba(0,0,0,0.05)' }),
  },
  compacto: { padding: Espacamento.padrao },
  centro: { paddingHorizontal: Espacamento.padrao, paddingVertical: Espacamento.grande },
  marca: { position: 'absolute' },
  marcaCompacta: { top: -30, right: -60 },
  marcaCentro: { top: -36, right: -96 },
}));
