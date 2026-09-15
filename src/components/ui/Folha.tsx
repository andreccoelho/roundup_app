// Folha (bottom sheet) — modal ancorado na base da tela, para ações contextuais curtas.
import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Cores, Espacamento, Raios } from '../../theme';

interface FolhaProps {
  visivel: boolean;
  onFechar: () => void;
  children: ReactNode;
}

export default function Folha({ visivel, onFechar, children }: FolhaProps) {
  return (
    <Modal visible={visivel} transparent animationType="slide" onRequestClose={onFechar}>
      <Pressable style={styles.fundo} onPress={onFechar} accessibilityRole="button" accessibilityLabel="Fechar" />
      <View style={styles.folha}>{children}</View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fundo: { flex: 1, backgroundColor: 'rgba(10,10,10,0.5)' },
  folha: {
    backgroundColor: Cores.branco,
    borderTopLeftRadius: Raios.grande,
    borderTopRightRadius: Raios.grande,
    padding: Espacamento.padrao,
    paddingBottom: Espacamento.grande,
  },
});
