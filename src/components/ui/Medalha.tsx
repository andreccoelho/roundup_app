// Medalha — marco conquistado (RF19) como emblema: placa de fivela de cinturão em SVG (octógono
// com as correias saindo pelos lados), ícone temático do marco e o número em Oswald.
//  - conquistada: placa em superficie2 com contorno claro;
//  - bloqueada: só o contorno, tracejado, tudo em tons apagados;
//  - `maxima`: a medalha de nível máximo — a única em ouro (docs/DESIGN.md).
import type { ComponentType } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { Cores, Espacamento, TamanhoFonte } from '../../theme';
import { IconeChama, IconeFaixa, IconeLuva } from '../icones';
import Texto from './Texto';

export type TipoMedalha = 'treinos' | 'sequencia' | 'graduacoes';

const ICONE: Record<TipoMedalha, ComponentType<{ tamanho?: number; cor?: string; espessura?: number }>> = {
  treinos: IconeLuva,
  sequencia: IconeChama,
  graduacoes: IconeFaixa,
};

interface MedalhaProps {
  rotulo: string;
  conquistada?: boolean;
  tipo?: TipoMedalha;
  numero?: number | string;
  maxima?: boolean;
}

const W = 72;
const H = 60;
// Octógono da placa (fivela) e as duas correias laterais.
const PLACA = 'M16,6 H56 L64,14 V46 L56,54 H16 L8,46 V14 Z';

export default function Medalha({ rotulo, conquistada = true, tipo = 'treinos', numero, maxima }: MedalhaProps) {
  const ouro = conquistada && maxima;
  const Icone = ICONE[tipo];
  const corTraco = !conquistada ? Cores.linhaForte : ouro ? Cores.ouro : Cores.texto2;
  const corPlaca = !conquistada ? 'none' : ouro ? Cores.ouro : Cores.superficie2;
  const corConteudo = !conquistada ? Cores.texto3 : ouro ? Cores.sobreCor : Cores.texto;

  return (
    <View
      style={styles.container}
      accessible
      accessibilityLabel={`Medalha: ${rotulo}${conquistada ? ', conquistada' : ', ainda não conquistada'}`}
    >
      <View style={styles.emblema}>
        <Svg width={W} height={H} aria-hidden>
          <Rect x={0} y={22} width={10} height={16} fill={conquistada ? Cores.superficie2 : 'none'} stroke={corTraco} strokeWidth={1.5} strokeDasharray={conquistada ? undefined : '3 3'} />
          <Rect x={62} y={22} width={10} height={16} fill={conquistada ? Cores.superficie2 : 'none'} stroke={corTraco} strokeWidth={1.5} strokeDasharray={conquistada ? undefined : '3 3'} />
          <Path d={PLACA} fill={corPlaca} stroke={corTraco} strokeWidth={2} strokeDasharray={conquistada ? undefined : '4 3'} strokeLinejoin="round" />
        </Svg>
        <View style={styles.centro} aria-hidden>
          <Icone tamanho={18} cor={corConteudo} espessura={1.8} />
          {numero !== undefined ? (
            <Texto variante="numero" style={[styles.numero, { color: corConteudo }]}>
              {String(numero)}
            </Texto>
          ) : null}
        </View>
      </View>
      <Texto variante="subheadline" cor={conquistada ? 'texto' : 'texto3'} alinhamento="center" style={styles.rotulo} numberOfLines={2}>
        {rotulo}
      </Texto>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', width: 88 },
  emblema: { width: W, height: H },
  centro: { position: 'absolute', top: 6, left: 8, right: 8, bottom: 6, alignItems: 'center', justifyContent: 'center' },
  numero: { fontSize: TamanhoFonte.md, lineHeight: 18, marginTop: 1 },
  rotulo: { marginTop: Espacamento.minimo, fontSize: TamanhoFonte.xs, lineHeight: 16 },
});
