// CelebracaoGraduacao — confirmação para quem registra a graduação (RF25, RegistrarGraduacaoScreen),
// no mesmo cartão central do MomentoConquista: faixa grande, título, aluno e modalidade e "Fechar".
// Entra com mola curta e haptic de sucesso. Reduce motion: aparece direto.
import { useEffect, useRef } from 'react';
import { Animated, Modal, View } from 'react-native';
import { criarEstilos, Espacamento, Mola } from '../../theme';
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
  const styles = useEstilos();
  const entrada = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!visivel) return;
    hapticaSucesso();
    if (reduzido) {
      entrada.setValue(1);
      return;
    }
    entrada.setValue(0);
    Animated.spring(entrada, { toValue: 1, ...Mola, useNativeDriver: DRIVER_NATIVO }).start();
  }, [visivel, reduzido, entrada]);

  const escala = entrada.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] });

  return (
    <Modal visible={visivel} transparent animationType={reduzido ? 'none' : 'fade'} onRequestClose={onFechar} statusBarTranslucent>
      <View style={styles.fundo}>
        <Animated.View style={[styles.cartao, { opacity: entrada, transform: [{ scale: escala }] }]} accessibilityViewIsModal accessibilityRole="alert">
          <Texto variante="footnote" alinhamento="center">
            Graduação registrada
          </Texto>
          <View style={styles.faixa}>
            <SeloFaixa faixaOuGrau={grau} tamanho="grande" />
          </View>
          <Texto variante="title2" alinhamento="center">
            Novo grau
          </Texto>
          <Texto variante="subheadline" alinhamento="center" style={styles.detalhe}>
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

const useEstilos = criarEstilos((c, escuro) => ({
  fundo: { flex: 1, backgroundColor: c.overlay, alignItems: 'center', justifyContent: 'center', padding: Espacamento.grande },
  cartao: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: c.superficieElevada,
    borderRadius: 24,
    borderCurve: 'continuous',
    padding: Espacamento.grande,
    ...(escuro ? {} : { boxShadow: '0px 12px 40px rgba(0,0,0,0.18)' }),
  },
  faixa: { marginVertical: Espacamento.grande },
  detalhe: { marginTop: Espacamento.minimo },
  acao: { marginTop: Espacamento.grande },
}));
