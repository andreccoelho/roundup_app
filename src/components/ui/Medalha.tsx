// Medalha — marco conquistado (RF19, Ciclo 2). Sem consumidor real ainda: `graduacoes` e o
// crédito de pontos seguem bloqueados em firestore.rules/Ciclo 2-3.
//
// script.md, item 4: "emblemas reais, não ícones planos — usar profundidade (leve gradiente
// metálico dentro da paleta preto/branco/cinza)". Sem lib de gradiente instalada (e sem
// justificativa forte pra adicionar uma só por isto) — 3 círculos concêntricos de cinza
// decrescente + um "brilho" deslocado pro canto superior esquerdo fazem esse relevo com Views
// simples, mesmo truque usado em ícone de app/botão desde sempre em design de interface.
import { StyleSheet, Text, View } from 'react-native';
import { Cores, Espacamento, TamanhoFonte } from '../../theme';

interface MedalhaProps {
  rotulo: string;
  conquistada?: boolean;
}

export default function Medalha({ rotulo, conquistada = true }: MedalhaProps) {
  return (
    <View style={styles.container} accessibilityLabel={`Medalha: ${rotulo}${conquistada ? '' : ', ainda não conquistada'}`}>
      <View style={[styles.moldura, !conquistada && styles.molduraBloqueada]}>
        <View style={[styles.anel, !conquistada && styles.anelBloqueado]}>
          <View style={[styles.brilho, !conquistada && styles.brilhoBloqueado]} />
        </View>
      </View>
      <Text style={[styles.rotulo, !conquistada && styles.rotuloBloqueada]}>{rotulo}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', width: 72 },
  moldura: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: Cores.preto,
    backgroundColor: Cores.cinzaEscuro,
    alignItems: 'center',
    justifyContent: 'center',
  },
  molduraBloqueada: { borderColor: Cores.cinzaBorda, backgroundColor: Cores.cinzaFundo, opacity: 0.6 },
  anel: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Cores.cinzaMedio,
    overflow: 'hidden',
  },
  anelBloqueado: { backgroundColor: Cores.cinzaBorda },
  brilho: {
    position: 'absolute',
    top: 5,
    left: 6,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Cores.cinzaClaro,
  },
  brilhoBloqueado: { backgroundColor: Cores.cinzaFundo },
  rotulo: { fontSize: TamanhoFonte.xs, color: Cores.preto, marginTop: Espacamento.minimo, textAlign: 'center' },
  rotuloBloqueada: { color: Cores.cinzaClaro },
});
