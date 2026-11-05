// Diálogo de confirmação no padrão do sistema. No iOS e no Android, sem conteúdo extra, é o alerta
// nativo (Alert.alert, com o botão destrutivo em vermelho). No web — onde Alert não existe — e
// quando há `children`, é o mesmo desenho montado à mão: caixa de 270pt com raio 14, título em
// Headline, mensagem em Footnote e botões em tint separados por linhas finas.
import { useEffect, useRef, type ReactNode } from 'react';
import { ActivityIndicator, Alert, Modal, Platform, Pressable, Text, View } from 'react-native';
import { criarEstilos, Espacamento, Tipografia, useTema } from '../../theme';
import { useMovimentoReduzido } from '../../hooks/useMovimentoReduzido';
import { estiloAnelFoco, estiloSemOutline, useFocoVisivel } from '../../hooks/useFocoVisivel';
import LinhaFina from '../LinhaFina';
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

function BotaoAlerta({ titulo, onPress, forte, destrutivo }: { titulo: string; onPress: () => void; forte?: boolean; destrutivo?: boolean }) {
  const { focado, propsFoco } = useFocoVisivel();
  const styles = useEstilos();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={titulo}
      style={({ pressed }) => [styles.botao, pressed && styles.pressionado, estiloSemOutline, focado && estiloAnelFoco]}
      {...propsFoco}
    >
      <Text style={[styles.textoBotao, forte && styles.textoForte, destrutivo && styles.textoDestrutivo]}>{titulo}</Text>
    </Pressable>
  );
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
  const { cores } = useTema();
  const styles = useEstilos();
  const alertaNativo = Platform.OS !== 'web' && !children;
  const aberto = useRef(false);

  // Alerta nativo: abre uma vez por `visivel` (re-renders com `carregando` não reabrem)
  useEffect(() => {
    if (!alertaNativo) return;
    if (!visivel) {
      aberto.current = false;
      return;
    }
    if (aberto.current) return;
    aberto.current = true;
    Alert.alert(
      titulo,
      mensagem,
      [
        ...(tituloCancelar && onCancelar ? [{ text: tituloCancelar, style: 'cancel' as const, onPress: onCancelar }] : []),
        { text: tituloConfirmar, style: destrutivo ? ('destructive' as const) : ('default' as const), onPress: onConfirmar },
      ],
      { cancelable: Boolean(onCancelar), onDismiss: onCancelar },
    );
  }, [alertaNativo, visivel, titulo, mensagem, tituloCancelar, onCancelar, tituloConfirmar, destrutivo, onConfirmar]);

  if (alertaNativo) return null;

  return (
    <Modal visible={visivel} transparent animationType={reduzido ? 'none' : 'fade'} onRequestClose={onCancelar} statusBarTranslucent>
      <View style={styles.fundo}>
        <View style={styles.caixa} accessibilityViewIsModal aria-modal role="alertdialog" aria-label={titulo}>
          <View style={styles.textos}>
            <Texto variante="headline" alinhamento="center" cabecalho>
              {titulo}
            </Texto>
            {mensagem ? (
              <Texto variante="footnote" cor="texto" alinhamento="center" style={styles.mensagem}>
                {mensagem}
              </Texto>
            ) : null}
            {children}
          </View>
          <LinhaFina />
          <View style={styles.acoes}>
            {tituloCancelar && onCancelar ? (
              <>
                <BotaoAlerta titulo={tituloCancelar} onPress={onCancelar} forte />
                <View style={styles.divisor} />
              </>
            ) : null}
            {carregando ? (
              <View style={styles.botao}>
                <ActivityIndicator color={destrutivo ? cores.perigo : cores.tint} accessibilityLabel="Carregando" />
              </View>
            ) : (
              <BotaoAlerta titulo={tituloConfirmar} onPress={onConfirmar} destrutivo={destrutivo} forte={!tituloCancelar} />
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const useEstilos = criarEstilos((c) => ({
  fundo: { flex: 1, backgroundColor: c.overlay, alignItems: 'center', justifyContent: 'center', padding: Espacamento.grande },
  caixa: { backgroundColor: c.superficieElevada, borderRadius: 14, borderCurve: 'continuous', width: 270, overflow: 'hidden' },
  textos: { paddingHorizontal: Espacamento.padrao, paddingTop: Espacamento.padrao + 3, paddingBottom: Espacamento.padrao },
  mensagem: { marginTop: 2 },
  acoes: { flexDirection: 'row' },
  divisor: { width: 0.5, backgroundColor: c.separador },
  botao: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  pressionado: { backgroundColor: c.preenchimento },
  textoBotao: { ...Tipografia.body, color: c.tint },
  textoForte: { fontWeight: '600' },
  textoDestrutivo: { color: c.perigo },
}));
