// Etiqueta — o único chip do app (docs/DESIGN.md: pílula só em chips). Três usos:
//  - estática (sem onPress): rótulo informativo, ex.: modalidades na banda;
//  - seleção única (`modo="unico"`, padrão): nível da turma, turma ativa — role radio;
//  - seleção múltipla (`modo="multiplo"`): modalidades, dias da semana — role checkbox.
// Selecionada = preenchida em `texto` com rótulo `sobreCor` (17:1); sem acento, para não gastar o
// destaque da tela em filtros.
import { Pressable, StyleSheet, Text } from 'react-native';
import { Cores, Espacamento, Raios, TamanhoFonte } from '../../theme';
import { estiloAnelFoco, estiloSemOutline, useFocoVisivel } from '../../hooks/useFocoVisivel';

interface EtiquetaProps {
  texto: string;
  selecionada?: boolean;
  onPress?: () => void;
  desabilitada?: boolean;
  modo?: 'unico' | 'multiplo';
  accessibilityLabel?: string;
}

export default function Etiqueta({ texto, selecionada, onPress, desabilitada, modo = 'unico', accessibilityLabel }: EtiquetaProps) {
  const { focado, propsFoco } = useFocoVisivel();

  if (!onPress) {
    return <Text style={[styles.etiqueta, styles.estatica, styles.texto, styles.textoEstatico]}>{texto}</Text>;
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={desabilitada}
      hitSlop={{ top: 6, bottom: 6, left: 2, right: 2 }}
      accessibilityRole={modo === 'multiplo' ? 'checkbox' : 'radio'}
      accessibilityLabel={accessibilityLabel ?? texto}
      accessibilityState={{ checked: Boolean(selecionada), disabled: Boolean(desabilitada) }}
      style={({ pressed }) => [
        styles.etiqueta,
        styles.interativa,
        selecionada && styles.selecionada,
        pressed && !selecionada && styles.pressionada,
        desabilitada && styles.desabilitada,
        estiloSemOutline,
        focado && estiloAnelFoco,
      ]}
      {...propsFoco}
    >
      <Text style={[styles.texto, selecionada && styles.textoSelecionado]}>{texto}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  etiqueta: {
    borderRadius: Raios.pilula,
    paddingHorizontal: Espacamento.medio + 2,
    overflow: 'hidden',
  },
  interativa: {
    minHeight: 36,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Cores.linhaForte,
  },
  estatica: { paddingVertical: Espacamento.minimo + 1, backgroundColor: Cores.superficie2, alignSelf: 'flex-start' },
  selecionada: { backgroundColor: Cores.texto, borderColor: Cores.texto },
  pressionada: { backgroundColor: Cores.superficie2 },
  desabilitada: { opacity: 0.4 },
  texto: { fontSize: TamanhoFonte.sm, color: Cores.texto },
  textoEstatico: { color: Cores.texto2 },
  textoSelecionado: { color: Cores.sobreCor, fontWeight: '600' },
});
