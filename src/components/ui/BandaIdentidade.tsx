// BandaIdentidade — bloco full-bleed de identidade no topo de dashboards e perfis. Substitui as 6
// cópias que existiam (3 dashboards + 3 perfis), cada uma com valores ligeiramente diferentes de
// marca d'água, textura e sombra (RELATORIO_UI_UX.md, UI-06).
//
// - `aluno`: textura de lona + marca d'água — tela de engajamento.
// - `gestor`: só marca d'água — tom operacional, mesmo visual escuro.
// - `compacta`: avatar e nome em linha (Home/Hoje); sem ela, coluna centralizada (Perfil).
// - `sobHeader`: a tela tem header nativo, então a banda não soma o inset superior.
import type { ReactNode } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Cores, Espacamento } from '../../theme';
import Avatar from './Avatar';
import TexturaLona from './TexturaLona';
import Texto from './Texto';

interface BandaIdentidadeProps {
  variante?: 'aluno' | 'gestor';
  compacta?: boolean;
  sobHeader?: boolean;
  nome: string;
  fotoUrl?: string;
  // Linha acima do nome, em rótulo de placar (ex.: "TREINAR", "HOJE").
  sobretitulo?: string;
  selo?: ReactNode;
  detalhes?: string[];
  children?: ReactNode;
}

export default function BandaIdentidade({
  variante = 'aluno',
  compacta,
  sobHeader,
  nome,
  fotoUrl,
  sobretitulo,
  selo,
  detalhes = [],
  children,
}: BandaIdentidadeProps) {
  const insets = useSafeAreaInsets();
  const topo = (sobHeader ? 0 : insets.top) + (compacta ? Espacamento.padrao : Espacamento.grande);

  return (
    <View style={[styles.banda, { paddingTop: topo }, compacta ? styles.bandaCompacta : styles.bandaCentro]}>
      {variante === 'aluno' ? <TexturaLona opacidade={0.07} /> : null}
      <Image
        source={require('../../../assets/roundup_logo_invertida.png')}
        style={[styles.marca, compacta ? styles.marcaCompacta : styles.marcaCentro]}
        resizeMode="contain"
        accessible={false}
        aria-hidden
      />
      <View style={compacta ? styles.linha : styles.coluna}>
        <Avatar nome={nome} fotoUrl={fotoUrl} tamanho={compacta ? 52 : 80} />
        <View style={compacta ? styles.textosLinha : styles.textosColuna}>
          {sobretitulo ? <Texto variante="caption">{sobretitulo}</Texto> : null}
          <Texto
            variante="largeTitle"
            numberOfLines={compacta ? 1 : 2}
            adjustsFontSizeToFit={compacta}
            minimumFontScale={0.7}
            alinhamento={compacta ? 'left' : 'center'}
          >
            {nome}
          </Texto>
        </View>
      </View>
      {selo ? <View style={[styles.selo, !compacta && styles.seloCentro]}>{selo}</View> : null}
      {detalhes.map((detalhe) => (
        <Texto key={detalhe} variante="subheadline" alinhamento={compacta ? 'left' : 'center'} style={styles.detalhe}>
          {detalhe}
        </Texto>
      ))}
      {children ? <View style={styles.extra}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banda: {
    backgroundColor: Cores.superficie1,
    borderBottomWidth: 1,
    borderBottomColor: Cores.linha,
    paddingHorizontal: Espacamento.padrao,
    paddingBottom: Espacamento.grande,
    overflow: 'hidden',
  },
  bandaCompacta: {},
  bandaCentro: { alignItems: 'center' },
  marca: { position: 'absolute', opacity: 0.07 },
  marcaCompacta: { top: -30, right: -70, width: 220, height: 220 },
  marcaCentro: { top: -40, right: -80, width: 240, height: 240 },
  linha: { flexDirection: 'row', alignItems: 'center', gap: Espacamento.medio },
  coluna: { alignItems: 'center', gap: Espacamento.medio },
  textosLinha: { flex: 1 },
  textosColuna: { alignItems: 'center', maxWidth: '100%' },
  selo: { marginTop: Espacamento.padrao },
  seloCentro: { alignItems: 'center' },
  detalhe: { marginTop: Espacamento.minimo },
  extra: { marginTop: Espacamento.padrao },
});
