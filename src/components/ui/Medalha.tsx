// Medalha — marco de conquista (RF19) como emblema redondo, no estilo dos prêmios do app Fitness:
//  - conquistada: disco cheio no tint, com aro claro e ícone + número em branco;
//  - bloqueada: disco em cinza translúcido (`preenchimento`), ícone e número em texto3 e um
//    cadeado pequeno — forma e ícone diferentes, não só cor;
//  - `maxima`: a medalha de nível máximo, a única em ouro (docs/DESIGN.md, R-03).
// Vai numa grade (o pai arruma em linhas); rótulo de até duas linhas embaixo.
import type { ComponentType } from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { criarEstilos, Espacamento, useTema } from '../../theme';
import { IconeCadeado, IconeChama, IconeFaixa, IconeLuva, type IconeProps } from '../icones';
import Texto from './Texto';

export type TipoMedalha = 'treinos' | 'sequencia' | 'graduacoes';

const ICONE: Record<TipoMedalha, ComponentType<IconeProps>> = {
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
  tamanho?: number;
  // Sem o rótulo embaixo (quando o contexto já diz o nome da medalha, como no momento de conquista)
  semRotulo?: boolean;
}

export default function Medalha({ rotulo, conquistada = true, tipo = 'treinos', numero, maxima, tamanho = 64, semRotulo }: MedalhaProps) {
  const { cores } = useTema();
  const styles = useEstilos();
  const ouro = conquistada && maxima;
  const Icone = ICONE[tipo];
  const corDisco = !conquistada ? cores.preenchimento : ouro ? cores.ouro : cores.tintCheio;
  // Sobre o ouro escuro do tema claro e o ouro claro do escuro, o conteúdo inverte
  const corConteudo = !conquistada ? cores.texto3 : ouro ? cores.fundo : cores.sobreTint;
  const r = tamanho / 2;

  return (
    <View style={[styles.container, { width: tamanho + 20 }]} accessible accessibilityRole="image" accessibilityLabel={`Medalha: ${rotulo}${conquistada ? ', conquistada' : ', ainda não conquistada'}`}>
      <View style={{ width: tamanho, height: tamanho }}>
        <Svg width={tamanho} height={tamanho} aria-hidden>
          <Circle cx={r} cy={r} r={r} fill={corDisco} />
          {conquistada ? <Circle cx={r} cy={r} r={r - 4} fill="none" stroke="#FFFFFF" strokeOpacity={0.35} strokeWidth={1.5} /> : null}
        </Svg>
        <View style={styles.centro} aria-hidden>
          <Icone tamanho={tamanho * 0.34} cor={corConteudo} preenchido={conquistada} />
          {numero !== undefined ? (
            <Texto
              variante="headline"
              style={[styles.numero, { color: corConteudo, fontSize: Math.round(tamanho * 0.26), lineHeight: Math.round(tamanho * 0.31) }]}
              maxFontSizeMultiplier={1.2}
            >
              {String(numero)}
            </Texto>
          ) : null}
        </View>
        {!conquistada ? (
          <View style={[styles.cadeado, { backgroundColor: cores.superficie }]} aria-hidden>
            <IconeCadeado tamanho={13} cor={cores.texto3} espessura={2} />
          </View>
        ) : null}
      </View>
      {semRotulo ? null : (
        <Texto variante="caption" cor={conquistada ? 'texto' : 'texto3'} alinhamento="center" style={styles.rotulo} numberOfLines={2}>
          {rotulo}
        </Texto>
      )}
    </View>
  );
}

const useEstilos = criarEstilos(() => ({
  container: { alignItems: 'center' },
  centro: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  numero: { marginTop: -1, fontVariant: ['tabular-nums'], fontWeight: '700' },
  cadeado: { position: 'absolute', right: -2, bottom: -2, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  rotulo: { marginTop: Espacamento.pequeno - 2 },
}));
