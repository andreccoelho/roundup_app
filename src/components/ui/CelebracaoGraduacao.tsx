// script.md, item 3: "subida de faixa/graduação: uma transição de tela ou selo com timing mais
// dramático (0.4-0.6s), sensação de conquista, não uma modal discreta." Substitui o Aviso (toast)
// simples que RegistrarGraduacaoScreen mostrava antes ao confirmar uma graduação.
import { useEffect, useRef } from 'react';
import { Animated, Modal, StyleSheet, Text, View } from 'react-native';
import { Cores, DuracaoAnimacao, Espacamento, FamiliaFonte, Raios, TamanhoFonte } from '../../theme';
import Botao from './Botao';
import Medalha from './Medalha';

interface CelebracaoGraduacaoProps {
  visivel: boolean;
  grau: string;
  modalidade: string;
  nomeAluno: string;
  onFechar: () => void;
}

export default function CelebracaoGraduacao({ visivel, grau, modalidade, nomeAluno, onFechar }: CelebracaoGraduacaoProps) {
  const escala = useRef(new Animated.Value(0.7)).current;
  const opacidade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visivel) return;
    escala.setValue(0.7);
    opacidade.setValue(0);
    Animated.parallel([
      Animated.timing(opacidade, { toValue: 1, duration: DuracaoAnimacao.dramatica, useNativeDriver: true }),
      Animated.spring(escala, { toValue: 1, friction: 5, tension: 40, useNativeDriver: true }),
    ]).start();
  }, [visivel, escala, opacidade]);

  return (
    <Modal visible={visivel} transparent animationType="fade" onRequestClose={onFechar}>
      <View style={styles.fundo}>
        <Animated.View
          style={[styles.caixa, { opacity: opacidade, transform: [{ scale: escala }] }]}
          accessibilityViewIsModal
          accessibilityRole="alert"
        >
          <Medalha rotulo={grau} />
          <Text style={styles.titulo}>Novo grau!</Text>
          <Text style={styles.detalhe}>
            {nomeAluno} — {grau}, {modalidade}
          </Text>
          <View style={styles.espaco} />
          <Botao titulo="Fechar" onPress={onFechar} />
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fundo: { flex: 1, backgroundColor: 'rgba(10,10,10,0.7)', alignItems: 'center', justifyContent: 'center', padding: Espacamento.grande },
  caixa: {
    backgroundColor: Cores.branco,
    borderRadius: Raios.medio,
    padding: Espacamento.grande,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  titulo: { fontFamily: FamiliaFonte.homebaseDisplay, fontSize: TamanhoFonte.xxl, color: Cores.preto, marginTop: Espacamento.padrao },
  detalhe: { fontSize: TamanhoFonte.md, color: Cores.cinzaMedio, marginTop: Espacamento.minimo, textAlign: 'center' },
  espaco: { height: Espacamento.grande },
});
