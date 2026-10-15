// Diálogo modal centralizado — confirmação que exige decisão. Caixa em superficie2 com canto
// vivo e filete superior (perigo quando destrutivo), sobre overlay.
import type { ReactNode } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { Cores, Espacamento, Raios } from '../../theme';
import { useMovimentoReduzido } from '../../hooks/useMovimentoReduzido';
import Botao from './Botao';
import Texto from './Texto';

interface DialogoProps {
  visivel: boolean;
  titulo: string;
  mensagem?: string;
  tituloConfirmar: string;
  onConfirmar: () => void;
  tituloCancelar?: string;
  onCancelar?: () => void;
  destrutivo?: boolean;
  carregando?: boolean;
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
  carregando,
  children,
}: DialogoProps) {
  const reduzido = useMovimentoReduzido();
  return (
    <Modal visible={visivel} transparent animationType={reduzido ? 'none' : 'fade'} onRequestClose={onCancelar} statusBarTranslucent>
      <View style={styles.fundo}>
        <View style={[styles.caixa, destrutivo && styles.caixaDestrutiva]} accessibilityViewIsModal aria-modal role="dialog">
          <Texto variante="titulo">{titulo}</Texto>
          {mensagem ? (
            <Texto variante="corpo" cor="texto2" style={styles.mensagem}>
              {mensagem}
            </Texto>
          ) : null}
          {children}
          <View style={styles.acoes}>
            {tituloCancelar && onCancelar ? <Botao titulo={tituloCancelar} variante="fantasma" compacto onPress={onCancelar} /> : null}
            <Botao
              titulo={tituloConfirmar}
              variante={destrutivo ? 'destrutivo' : 'primario'}
              compacto
              carregando={carregando}
              onPress={onConfirmar}
            />
          </View>
        </View>
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
    borderTopColor: Cores.linhaForte,
    padding: Espacamento.grande,
    width: '100%',
    maxWidth: 400,
  },
  caixaDestrutiva: { borderTopColor: Cores.perigo },
  mensagem: { marginTop: Espacamento.pequeno },
  acoes: { flexDirection: 'row', justifyContent: 'flex-end', gap: Espacamento.pequeno, marginTop: Espacamento.grande },
});
