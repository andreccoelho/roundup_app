// MomentoConquista — a celebração do lado do aluno (UX-16/R18) como cartão central contido, no
// padrão dos prêmios do app Fitness: emblema grande (nível, faixa ou medalha), título, uma linha de
// explicação e "Continuar". Para subida de nível, nova faixa e nova medalha.
//
// Efeitos herdados da direção anterior, no traço novo: flash de tint na tela inteira ao abrir, o
// emblema "estoura" com overshoot (de 60% a 100%), dois halos de tint se expandem atrás dele e o
// haptic é duplo (impacto ao abrir, sucesso quando o emblema assenta). O cartão sobe de 92% para
// 100% com a mola curta. Reduce motion: sem flash, halo nem entrada — aparece direto, haptic
// mantido (não é movimento visual).
import { useEffect, useRef } from 'react';
import { Animated, Easing, Modal, View } from 'react-native';
import { criarEstilos, DuracaoAnimacao, Espacamento, Mola, useTema } from '../../theme';
import { DRIVER_NATIVO } from '../../utils/animacao';
import { hapticaImpacto, hapticaSucesso } from '../../utils/haptica';
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

const TAMANHO_HALO = 132;

export default function MomentoConquista({ conquista, onFechar, posicaoFila }: MomentoConquistaProps) {
  const reduzido = useMovimentoReduzido();
  const { cores } = useTema();
  const styles = useEstilos();
  const entrada = useRef(new Animated.Value(1)).current;
  const emblema = useRef(new Animated.Value(1)).current;
  const flash = useRef(new Animated.Value(0)).current;
  const halo1 = useRef(new Animated.Value(1)).current;
  const halo2 = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!conquista) return;
    hapticaImpacto();
    const t = setTimeout(hapticaSucesso, DuracaoAnimacao.lenta);
    if (reduzido) {
      [entrada, emblema, halo1, halo2].forEach((v) => v.setValue(1));
      flash.setValue(0);
      return () => clearTimeout(t);
    }
    [entrada, emblema, halo1, halo2].forEach((v) => v.setValue(0));
    flash.setValue(0);
    const expandirHalo = (v: Animated.Value) =>
      Animated.timing(v, { toValue: 1, duration: DuracaoAnimacao.celebracao + 250, easing: Easing.out(Easing.cubic), useNativeDriver: DRIVER_NATIVO });
    const animacao = Animated.parallel([
      Animated.sequence([
        Animated.timing(flash, { toValue: 0.85, duration: 90, useNativeDriver: DRIVER_NATIVO }),
        Animated.timing(flash, { toValue: 0, duration: DuracaoAnimacao.celebracao, useNativeDriver: DRIVER_NATIVO }),
      ]),
      Animated.spring(entrada, { toValue: 1, ...Mola, useNativeDriver: DRIVER_NATIVO }),
      Animated.sequence([
        Animated.delay(80),
        Animated.timing(emblema, {
          toValue: 1,
          duration: DuracaoAnimacao.celebracao,
          easing: Easing.out(Easing.back(1.6)),
          useNativeDriver: DRIVER_NATIVO,
        }),
      ]),
      Animated.sequence([Animated.delay(200), expandirHalo(halo1)]),
      Animated.sequence([Animated.delay(380), expandirHalo(halo2)]),
    ]);
    animacao.start();
    return () => {
      clearTimeout(t);
      animacao.stop();
    };
  }, [conquista, reduzido, entrada, emblema, flash, halo1, halo2]);

  if (!conquista) return null;

  const escala = entrada.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] });
  const escalaEmblema = emblema.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });
  // Halo: anel de tint que cresce além do emblema e some; em repouso (e com reduce motion) é invisível
  const estiloHalo = (v: Animated.Value) => ({
    opacity: v.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.5, 0] }),
    transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.7] }) }],
  });

  return (
    <Modal visible transparent animationType={reduzido ? 'none' : 'fade'} onRequestClose={onFechar} statusBarTranslucent>
      <View style={styles.fundo}>
        <Animated.View style={[styles.flash, { backgroundColor: cores.tintCheio, opacity: flash }]} aria-hidden pointerEvents="none" />
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
            <View style={styles.halos} aria-hidden pointerEvents="none">
              <Animated.View style={[styles.halo, { borderColor: cores.tint }, estiloHalo(halo1)]} />
              <Animated.View style={[styles.halo, { borderColor: cores.tint }, estiloHalo(halo2)]} />
            </View>
            <Animated.View style={{ opacity: emblema, transform: [{ scale: escalaEmblema }] }}>
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
            </Animated.View>
          </View>
          <Texto variante="footnote" cor="tint" alinhamento="center" style={styles.sobretitulo}>
            Conquista
          </Texto>
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
  flash: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  cartao: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: c.superficieElevada,
    borderRadius: 24,
    borderCurve: 'continuous',
    padding: Espacamento.grande,
    ...(escuro ? {} : { boxShadow: '0px 12px 40px rgba(0,0,0,0.18)' }),
  },
  emblema: { alignItems: 'center', justifyContent: 'center', minHeight: TAMANHO_HALO, marginTop: Espacamento.pequeno, marginBottom: Espacamento.padrao + 4 },
  halos: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  halo: { position: 'absolute', width: TAMANHO_HALO, height: TAMANHO_HALO, borderRadius: TAMANHO_HALO / 2, borderWidth: 3 },
  discoNivel: { width: 132, height: 132, borderRadius: 66, alignItems: 'center', justifyContent: 'center' },
  textoDisco: { color: '#FFFFFF' },
  numeroDisco: { marginTop: -6 },
  sobretitulo: { marginBottom: Espacamento.minimo },
  rotulo: { marginTop: Espacamento.minimo },
  acao: { marginTop: Espacamento.grande },
}));
