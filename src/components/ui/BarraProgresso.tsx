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

// script.md, item 3: "textura de 'round' (segmentada por round)... em vez de barra lisa padrão".
// 10 segmentos fixos — não é uma contagem literal de rounds da luta, é só o motivo visual da
// barra virar cartão de pontuação em vez de progressbar de SaaS genérica.
const SEGMENTOS = 10;

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
        {Array.from({ length: SEGMENTOS }).map((_, i) => {
          const inicioSegmento = i / SEGMENTOS;
          const fimSegmento = (i + 1) / SEGMENTOS;
          const progressoSegmento = Math.max(0, Math.min(1, (progresso - inicioSegmento) / (fimSegmento - inicioSegmento)));
          return (
            <View key={i} style={styles.segmento}>
              <View style={[styles.segmentoPreenchimento, { width: `${progressoSegmento * 100}%` }]} />
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cabecalho: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Espacamento.minimo },
  nivel: { fontFamily: FamiliaFonte.placarSemiBold, fontSize: TamanhoFonte.md, color: Cores.texto },
  xp: { fontFamily: FamiliaFonte.placarRegular, fontSize: TamanhoFonte.sm, color: Cores.texto2 },
  trilha: { flexDirection: 'row', gap: 2, height: 8 },
  segmento: { flex: 1, borderRadius: Raios.pequeno, backgroundColor: Cores.superficie1, overflow: 'hidden' },
  segmentoPreenchimento: { height: '100%', backgroundColor: Cores.superficie2 },
});
