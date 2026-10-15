// Diálogo modal centralizado — confirmação ou alerta que exige decisão antes de continuar.
import type { ReactNode } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { Cores, Espacamento, Raios, TamanhoFonte } from '../../theme';
import Botao from './Botao';

interface DialogoProps {
  visivel: boolean;
  titulo: string;
  mensagem?: string;
  tituloConfirmar: string;
  onConfirmar: () => void;
  tituloCancelar?: string;
  onCancelar?: () => void;
  destrutivo?: boolean;
  children?: ReactNode;
}

export default function Dialogo({
  visivel,
  titulo,
  mensagem,
  tituloConfirmar,
  onConfirmar,
  tituloCancelar,
  onCancelar,
  destrutivo,
  children,
}: DialogoProps) {
  return (
    <Modal visible={visivel} transparent animationType="fade" onRequestClose={onCancelar}>
      <View style={styles.fundo}>
        <View style={styles.caixa} accessibilityViewIsModal accessibilityRole="alert">
          <Text style={styles.titulo}>{titulo}</Text>
          {mensagem ? <Text style={styles.mensagem}>{mensagem}</Text> : null}
          {children}
          <View style={styles.acoes}>
            {tituloCancelar && onCancelar ? <Botao titulo={tituloCancelar} variante="fantasma" onPress={onCancelar} /> : null}
            <Botao titulo={tituloConfirmar} variante={destrutivo ? 'destrutivo' : 'primario'} onPress={onConfirmar} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fundo: { flex: 1, backgroundColor: 'rgba(10,10,10,0.5)', alignItems: 'center', justifyContent: 'center', padding: Espacamento.grande },
  caixa: { backgroundColor: Cores.fundo, borderRadius: Raios.pequeno, padding: Espacamento.padrao, width: '100%', maxWidth: 360 },
  titulo: { fontSize: TamanhoFonte.lg, fontWeight: '700', color: Cores.texto },
  mensagem: { fontSize: TamanhoFonte.sm, color: Cores.texto2, marginTop: Espacamento.pequeno },
  acoes: { flexDirection: 'row', justifyContent: 'flex-end', gap: Espacamento.pequeno, marginTop: Espacamento.padrao },
});
