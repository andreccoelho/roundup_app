// CelebracaoGraduacao — confirmação com peso para quem registra a graduação (RF25,
// RegistrarGraduacaoScreen). Faixa em tamanho grande, título display com sombra dura em acento
// (permitida só em hero/conquista), entrada "dramática" e haptic. Reduce motion: aparece direto.
import { useEffect, useRef } from 'react';
import { Animated, Modal, StyleSheet, View } from 'react-native';
import { Cores, DuracaoAnimacao, Espacamento, Raios, Sombras } from '../../theme';
import { DRIVER_NATIVO } from '../../utils/animacao';
import { useMovimentoReduzido } from '../../hooks/useMovimentoReduzido';
import { hapticaSucesso } from '../../utils/haptica';
import Botao from './Botao';
import SeloFaixa from './SeloFaixa';
import Texto from './Texto';

interface CelebracaoGraduacaoProps {
  visivel: boolean;
  grau: string;
  modalidade: string;
  nomeAluno: string;
  onFechar: () => void;
}

export default function CelebracaoGraduacao({ visivel, grau, modalidade, nomeAluno, onFechar }: CelebracaoGraduacaoProps) {
  const reduzido = useMovimentoReduzido();
  const escala = useRef(new Animated.Value(1)).current;
  const opacidade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!visivel) return;
    hapticaSucesso();
    if (reduzido) {
      escala.setValue(1);
      opacidade.setValue(1);
      return;
    }
    escala.setValue(0.8);
    opacidade.setValue(0);
    Animated.parallel([
      Animated.timing(opacidade, { toValue: 1, duration: DuracaoAnimacao.dramatica, useNativeDriver: DRIVER_NATIVO }),
      Animated.spring(escala, { toValue: 1, friction: 5, tension: 50, useNativeDriver: DRIVER_NATIVO }),
    ]).start();
  }, [visivel, reduzido, escala, opacidade]);

  return (
    <Modal visible={visivel} transparent animationType={reduzido ? 'none' : 'fade'} onRequestClose={onFechar} statusBarTranslucent>
      <View style={styles.fundo}>
        <Animated.View
          style={[styles.caixa, { opacity: opacidade, transform: [{ scale: escala }] }]}
          accessibilityViewIsModal
          accessibilityRole="alert"
        >
          <Texto variante="caption" alinhamento="center">
            Graduação registrada
          </Texto>
          <Texto variante="largeTitle" alinhamento="center" style={[styles.titulo, Sombras.duraAcento]}>
            Novo grau
          </Texto>
          <View style={styles.faixa}>
            <SeloFaixa faixaOuGrau={grau} tamanho="grande" />
          </View>
          <Texto variante="body" cor="texto2" alinhamento="center">
            {`${nomeAluno}, ${modalidade}`}
          </Texto>
          <View style={styles.acao}>
            <Botao titulo="Fechar" onPress={onFechar} />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fundo: { flex: 1, backgroundColor: Cores.overlay, alignItems: 'center', justifyContent: 'center', padding: Espacamento.grande },
  caixa: {
    backgroundColor: Cores.superficie2,
    borderRadius: Raios.pequeno,
    borderTopWidth: 2,
    borderTopColor: Cores.acento,
    padding: Espacamento.grande,
    width: '100%',
    maxWidth: 400,
  },
  titulo: { marginTop: Espacamento.pequeno },
  faixa: { marginVertical: Espacamento.grande },
  acao: { marginTop: Espacamento.grande },
});
