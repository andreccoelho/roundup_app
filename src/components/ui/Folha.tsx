// Folha (bottom sheet) — ações e formulários curtos ancorados na base. Alça, título, botão de
// fechar, rolagem interna e KeyboardAvoidingView (antes o teclado cobria os campos da "Nova
// missão"). Respeita o inset inferior e fica centralizada com maxWidth 720 no web/tablet.
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Cores, Espacamento, LarguraMaxima, Raios } from '../../theme';
import { estiloAnelFoco, estiloSemOutline, useFocoVisivel } from '../../hooks/useFocoVisivel';
import { useMovimentoReduzido } from '../../hooks/useMovimentoReduzido';
import { IconeFechar } from '../icones';
import Texto from './Texto';

interface FolhaProps {
  visivel: boolean;
  onFechar: () => void;
  titulo?: string;
  children: ReactNode;
}

export default function Folha({ visivel, onFechar, titulo, children }: FolhaProps) {
  const insets = useSafeAreaInsets();
  const fechar = useFocoVisivel();
  const reduzido = useMovimentoReduzido();

  return (
    <Modal visible={visivel} transparent animationType={reduzido ? 'none' : 'slide'} onRequestClose={onFechar} statusBarTranslucent>
      <KeyboardAvoidingView style={styles.raiz} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Pressable style={styles.fundo} onPress={onFechar} accessibilityRole="button" accessibilityLabel="Fechar" />
        <View style={[styles.folha, { paddingBottom: insets.bottom + Espacamento.padrao }]} accessibilityViewIsModal aria-modal role="dialog">
          <View style={styles.alca} aria-hidden />
          <View style={styles.cabecalho}>
            <View style={styles.tituloArea}>{titulo ? <Texto variante="title3">{titulo}</Texto> : null}</View>
            <Pressable
              onPress={onFechar}
              hitSlop={8}
              style={[styles.botaoFechar, estiloSemOutline, fechar.focado && estiloAnelFoco]}
              accessibilityRole="button"
              accessibilityLabel="Fechar"
              {...fechar.propsFoco}
            >
              <IconeFechar tamanho={22} cor={Cores.texto2} />
            </Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.conteudo} showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  fundo: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: Cores.overlay },
  folha: {
    width: '100%',
    maxWidth: LarguraMaxima.lista,
    maxHeight: '88%',
    // Fundo = fundo da tela (não superficie1): mantém válidas dentro da folha as mesmas regras
    // de contraste das telas (texto em perigo só sobre fundo, 4,5:1). A separação do conteúdo atrás
    // vem do overlay, do contorno superior e da alça.
    backgroundColor: Cores.fundo,
    borderTopLeftRadius: Raios.pequeno,
    borderTopRightRadius: Raios.pequeno,
    borderTopWidth: 1,
    borderTopColor: Cores.linhaForte,
    paddingHorizontal: Espacamento.padrao,
  },
  alca: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: Cores.linhaForte, marginTop: Espacamento.pequeno },
  cabecalho: { flexDirection: 'row', alignItems: 'center', minHeight: 48, marginTop: Espacamento.minimo },
  tituloArea: { flex: 1 },
  botaoFechar: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: -Espacamento.pequeno },
  conteudo: { paddingTop: Espacamento.pequeno },
});
