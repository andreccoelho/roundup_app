// MomentoConquista — a celebração do lado do aluno (UX-16/R18) como cartão central contido, no
// padrão dos prêmios do app Fitness: emblema grande (nível, faixa ou medalha), título, uma linha de
// explicação e "Continuar". Para subida de nível, nova faixa e nova medalha.
//
// Entrada: o cartão sobe de 92% para 100% com mola curta, e o fundo escurece em fade. Haptic de
// sucesso. Reduce motion: aparece direto, haptic mantido (não é movimento visual).
import { useEffect, useRef } from 'react';
import { Animated, Modal, View } from 'react-native';
import { criarEstilos, Espacamento, Mola, useTema } from '../../theme';
import { DRIVER_NATIVO } from '../../utils/animacao';
import { hapticaSucesso } from '../../utils/haptica';
import { useMovimentoReduzido } from '../../hooks/useMovimentoReduzido';
import Botao from './Botao';
import Medalha, { type TipoMedalha } from './Medalha';
import SeloFaixa from './SeloFaixa';
import Texto from './Texto';

export type TipoConquista = 'nivel' | 'faixa' | 'medalha';

export interface Conquista {
  tipo: TipoConquista;
  // nível: o número; faixa: o texto da faixa; medalha: a quantidade do marco.
  valor: string | number;
  rotulo: string;
  icone?: TipoMedalha;
}

interface MomentoConquistaProps {
  conquista: Conquista | null;
  onFechar: () => void;
  // "1 de 3" quando há várias conquistas na fila.
  posicaoFila?: string;
}

const TITULO: Record<TipoConquista, string> = {
  nivel: 'Subiu de nível',
  faixa: 'Nova faixa',
  medalha: 'Nova medalha',
};

export default function MomentoConquista({ conquista, onFechar, posicaoFila }: MomentoConquistaProps) {
  const reduzido = useMovimentoReduzido();
  const { cores } = useTema();
  const styles = useEstilos();
  const entrada = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!conquista) return;
    hapticaSucesso();
    if (reduzido) {
      entrada.setValue(1);
      return;
    }
    entrada.setValue(0);
    Animated.spring(entrada, { toValue: 1, ...Mola, useNativeDriver: DRIVER_NATIVO }).start();
  }, [conquista, reduzido, entrada]);

  if (!conquista) return null;

  const escala = entrada.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] });

  return (
    <Modal visible transparent animationType={reduzido ? 'none' : 'fade'} onRequestClose={onFechar} statusBarTranslucent>
      <View style={styles.fundo}>
        <Animated.View
          style={[styles.cartao, { opacity: entrada, transform: [{ scale: escala }] }]}
          accessibilityViewIsModal
          accessibilityRole="alert"
          accessibilityLiveRegion="assertive"
          aria-modal
        >
          {posicaoFila ? (
            <Texto variante="caption" alinhamento="center">
              {posicaoFila}
            </Texto>
          ) : null}
          <View style={styles.emblema}>
            {conquista.tipo === 'nivel' ? (
              <View style={[styles.discoNivel, { backgroundColor: cores.tintCheio }]} accessible accessibilityLabel={`Nível ${conquista.valor}`}>
                <Texto variante="caption" style={styles.textoDisco}>
                  Nível
                </Texto>
                <Texto variante="numeroXL" style={[styles.textoDisco, styles.numeroDisco]}>
                  {String(conquista.valor)}
                </Texto>
              </View>
            ) : conquista.tipo === 'faixa' ? (
              <SeloFaixa faixaOuGrau={String(conquista.valor)} tamanho="grande" />
            ) : (
              <Medalha rotulo={conquista.rotulo} semRotulo tipo={conquista.icone ?? 'treinos'} numero={conquista.valor} tamanho={112} />
            )}
          </View>
          <Texto variante="title2" alinhamento="center">
            {TITULO[conquista.tipo]}
          </Texto>
          <Texto variante="subheadline" alinhamento="center" style={styles.rotulo}>
            {conquista.rotulo}
          </Texto>
          <View style={styles.acao}>
            <Botao titulo="Continuar" onPress={onFechar} />
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
  emblema: { alignItems: 'center', marginTop: Espacamento.pequeno, marginBottom: Espacamento.padrao + 4 },
  discoNivel: { width: 132, height: 132, borderRadius: 66, alignItems: 'center', justifyContent: 'center' },
  textoDisco: { color: '#FFFFFF' },
  numeroDisco: { marginTop: -6 },
  rotulo: { marginTop: Espacamento.minimo },
  acao: { marginTop: Espacamento.grande },
}));
