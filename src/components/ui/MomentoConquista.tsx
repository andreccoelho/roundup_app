// MomentoConquista — a celebração do lado do aluno (RELATORIO_UI_UX.md, UX-16/R18): tela cheia,
// fundo preto, flash de acento, número em placarXL, título display com sombra dura em acento e
// haptic. Para subida de nível, nova faixa e nova medalha.
//
// Reduce motion: sem flash e sem entrada animada — aparece direto, haptic mantido (não é
// movimento visual).
import { useEffect, useRef, type ComponentType } from 'react';
import { Animated, Easing, Modal, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Cores, DuracaoAnimacao, Espacamento, LarguraMaxima, Sombras } from '../../theme';
import { DRIVER_NATIVO } from '../../utils/animacao';
import { hapticaImpacto, hapticaSucesso } from '../../utils/haptica';
import { useMovimentoReduzido } from '../../hooks/useMovimentoReduzido';
import { IconeChama, IconeCinturao, IconeFaixa, IconeLuva } from '../icones';
import Botao from './Botao';
import SeloFaixa from './SeloFaixa';
import TexturaLona from './TexturaLona';
import Texto from './Texto';

export type TipoConquista = 'nivel' | 'faixa' | 'medalha';

export interface Conquista {
  tipo: TipoConquista;
  // nível: o número; faixa: o texto da faixa; medalha: a quantidade do marco.
  valor: string | number;
  rotulo: string;
  icone?: 'treinos' | 'sequencia' | 'graduacoes';
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

const ICONE_MEDALHA: Record<string, ComponentType<{ tamanho?: number; cor?: string; espessura?: number }>> = {
  treinos: IconeLuva,
  sequencia: IconeChama,
  graduacoes: IconeFaixa,
};

export default function MomentoConquista({ conquista, onFechar, posicaoFila }: MomentoConquistaProps) {
  const insets = useSafeAreaInsets();
  const reduzido = useMovimentoReduzido();
  const flash = useRef(new Animated.Value(0)).current;
  const entrada = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!conquista) return;
    hapticaImpacto();
    const t = setTimeout(hapticaSucesso, DuracaoAnimacao.lenta);
    if (reduzido) {
      flash.setValue(0);
      entrada.setValue(1);
      return () => clearTimeout(t);
    }
    flash.setValue(0);
    entrada.setValue(0);
    Animated.parallel([
      Animated.sequence([
        Animated.timing(flash, { toValue: 0.9, duration: 90, useNativeDriver: DRIVER_NATIVO }),
        Animated.timing(flash, { toValue: 0, duration: DuracaoAnimacao.dramatica, useNativeDriver: DRIVER_NATIVO }),
      ]),
      Animated.timing(entrada, {
        toValue: 1,
        duration: DuracaoAnimacao.dramatica,
        easing: Easing.out(Easing.back(1.6)),
        useNativeDriver: DRIVER_NATIVO,
      }),
    ]).start();
    return () => clearTimeout(t);
  }, [conquista, reduzido, flash, entrada]);

  if (!conquista) return null;

  const IconeMedalha = ICONE_MEDALHA[conquista.icone ?? 'treinos'] ?? IconeLuva;
  const escala = entrada.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });

  return (
    <Modal visible transparent={false} animationType={reduzido ? 'none' : 'fade'} onRequestClose={onFechar} statusBarTranslucent>
      <View style={[styles.fundo, { paddingTop: insets.top + Espacamento.grande, paddingBottom: insets.bottom + Espacamento.grande }]}>
        <TexturaLona opacidade={0.06} />
        <Animated.View style={[styles.flash, { opacity: flash }]} aria-hidden />

        <View style={styles.coluna} accessibilityViewIsModal accessibilityRole="alert" accessibilityLiveRegion="assertive">
          {posicaoFila ? (
            <Texto variante="caption" cor="texto3" alinhamento="center">
              {posicaoFila}
            </Texto>
          ) : null}
          <Texto variante="caption" alinhamento="center" style={styles.sobretitulo}>
            Conquista
          </Texto>
          <Texto variante="largeTitle" alinhamento="center" style={[styles.titulo, Sombras.duraAcento]}>
            {TITULO[conquista.tipo]}
          </Texto>

          <Animated.View style={[styles.centro, { opacity: entrada, transform: [{ scale: escala }] }]}>
            {conquista.tipo === 'nivel' ? (
              <>
                <IconeCinturao tamanho={48} cor={Cores.acento} />
                <Texto variante="numeroXL" alinhamento="center" accessibilityLabel={`Nível ${conquista.valor}`}>
                  {String(conquista.valor)}
                </Texto>
              </>
            ) : conquista.tipo === 'faixa' ? (
              <View style={styles.faixa}>
                <SeloFaixa faixaOuGrau={String(conquista.valor)} tamanho="grande" />
              </View>
            ) : (
              <>
                <IconeMedalha tamanho={56} cor={Cores.acento} espessura={1.4} />
                <Texto variante="numeroXL" alinhamento="center">
                  {String(conquista.valor)}
                </Texto>
              </>
            )}
          </Animated.View>

          <Texto variante="title3" alinhamento="center" cabecalho={false}>
            {conquista.rotulo}
          </Texto>
        </View>

        <View style={styles.acao}>
          <Botao titulo="Continuar" grande onPress={onFechar} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fundo: { flex: 1, backgroundColor: Cores.fundo, paddingHorizontal: Espacamento.grande, justifyContent: 'space-between', alignItems: 'center' },
  flash: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: Cores.acento },
  coluna: { flex: 1, width: '100%', maxWidth: LarguraMaxima.formulario, justifyContent: 'center' },
  sobretitulo: { marginTop: Espacamento.pequeno },
  titulo: { marginTop: Espacamento.pequeno },
  centro: { alignItems: 'center', marginVertical: Espacamento.extraGrande },
  faixa: { paddingVertical: Espacamento.grande },
  acao: { width: '100%', maxWidth: LarguraMaxima.formulario },
});
