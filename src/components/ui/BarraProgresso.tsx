// BarraProgresso — XP até o próximo nível (RF17, Ciclo 2). Sem consumidor real ainda:
// `missoesProgresso`/pontuação seguem bloqueados em firestore.rules; componente pronto para
// quando RF16/RF17 destravarem.
import { StyleSheet, Text, View } from 'react-native';
import { Cores, Espacamento, FamiliaFonte, Raios, TamanhoFonte } from '../../theme';

interface BarraProgressoProps {
  nivel: number;
  xpAtual: number;
  xpProximoNivel: number;
}

export default function BarraProgresso({ nivel, xpAtual, xpProximoNivel }: BarraProgressoProps) {
  const progresso = xpProximoNivel > 0 ? Math.min(1, xpAtual / xpProximoNivel) : 0;

  return (
    <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: xpProximoNivel, now: xpAtual }}>
      <View style={styles.cabecalho}>
        <Text style={styles.nivel}>Nível {nivel}</Text>
        <Text style={styles.xp}>
          {xpAtual} / {xpProximoNivel} XP
        </Text>
      </View>
      <View style={styles.trilha}>
        <View style={[styles.preenchimento, { width: `${progresso * 100}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cabecalho: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Espacamento.minimo },
  nivel: { fontFamily: FamiliaFonte.placarSemiBold, fontSize: TamanhoFonte.md, color: Cores.preto },
  xp: { fontFamily: FamiliaFonte.placarRegular, fontSize: TamanhoFonte.sm, color: Cores.cinzaMedio },
  trilha: { height: 8, borderRadius: Raios.pequeno, backgroundColor: Cores.cinzaFundo, overflow: 'hidden' },
  preenchimento: { height: '100%', backgroundColor: Cores.preto, borderRadius: Raios.pequeno },
});
