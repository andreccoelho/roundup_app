// Folha (sheet) — fluxos curtos (criar turma/sessão/missão, marcar conclusões). No iOS é o sheet
// nativo (Modal com presentationStyle "pageSheet": desliza de baixo, a tela de trás recua e dá
// para fechar arrastando). No Android e no web, o mesmo desenho montado à mão: overlay, cantos de
// 16 contínuos e alça. Barra superior no padrão do iOS: "Cancelar" à esquerda, título no centro
// e a ação de confirmar ("Salvar", "Criar") à direita quando `acao` é passada. Rolagem interna e
// KeyboardAvoidingView para o teclado não cobrir os campos.
import type { ReactNode } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { criarEstilos, Espacamento, LarguraMaxima, Raios, Tipografia, useTema } from '../../theme';
import { estiloAnelFoco, estiloSemOutline, useFocoVisivel } from '../../hooks/useFocoVisivel';
import { useMovimentoReduzido } from '../../hooks/useMovimentoReduzido';
import Texto from './Texto';

interface AcaoFolha {
  titulo: string;
  onPress: () => void;
  carregando?: boolean;
  desabilitado?: boolean;
}

interface FolhaProps {
  visivel: boolean;
  onFechar: () => void;
  titulo?: string;
  acao?: AcaoFolha;
  tituloCancelar?: string;
  children: ReactNode;
}

function BotaoBarra({ titulo, onPress, forte, desabilitado }: { titulo: string; onPress: () => void; forte?: boolean; desabilitado?: boolean }) {
  const { focado, propsFoco } = useFocoVisivel();
  const styles = useEstilos();
  return (
    <Pressable
      onPress={onPress}
      disabled={desabilitado}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={titulo}
      accessibilityState={{ disabled: Boolean(desabilitado) }}
      style={({ pressed }) => [styles.botaoBarra, pressed && styles.pressionado, desabilitado && styles.inativo, estiloSemOutline, focado && estiloAnelFoco]}
      {...propsFoco}
    >
      <Text style={[styles.textoBarra, forte && styles.textoForte]}>{titulo}</Text>
    </Pressable>
  );
}

export default function Folha({ visivel, onFechar, titulo, acao, tituloCancelar = 'Cancelar', children }: FolhaProps) {
  const insets = useSafeAreaInsets();
  const reduzido = useMovimentoReduzido();
  const { cores } = useTema();
  const styles = useEstilos();
  const nativoIOS = Platform.OS === 'ios';

  const barra = (
    <View style={styles.barra}>
      <View style={styles.ladoBarra}>
        <BotaoBarra titulo={tituloCancelar} onPress={onFechar} />
      </View>
      <View style={styles.tituloArea}>
        {titulo ? (
          <Texto variante="headline" alinhamento="center" numberOfLines={1} cabecalho>
            {titulo}
          </Texto>
        ) : null}
      </View>
      <View style={[styles.ladoBarra, styles.ladoDireito]}>
        {acao ? (
          acao.carregando ? (
            <ActivityIndicator color={cores.tint} accessibilityLabel="Carregando" />
          ) : (
            <BotaoBarra titulo={acao.titulo} onPress={acao.onPress} forte desabilitado={acao.desabilitado} />
          )
        ) : null}
      </View>
    </View>
  );

  const corpo = (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[styles.conteudo, { paddingBottom: insets.bottom + Espacamento.grande }]}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );

  if (nativoIOS) {
    return (
      <Modal visible={visivel} presentationStyle="pageSheet" animationType={reduzido ? 'none' : 'slide'} onRequestClose={onFechar}>
        <KeyboardAvoidingView style={styles.pagina} behavior="padding">
          {barra}
          {corpo}
        </KeyboardAvoidingView>
      </Modal>
    );
  }

  return (
    <Modal visible={visivel} transparent animationType={reduzido ? 'none' : 'slide'} onRequestClose={onFechar} statusBarTranslucent>
      <KeyboardAvoidingView style={styles.raiz} behavior={Platform.OS === 'android' ? 'height' : undefined}>
        <Pressable style={styles.fundo} onPress={onFechar} accessibilityRole="button" accessibilityLabel="Fechar" />
        <View style={styles.folha} accessibilityViewIsModal aria-modal role="dialog" aria-label={titulo}>
          <View style={styles.alca} aria-hidden />
          {barra}
          {corpo}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const useEstilos = criarEstilos((c) => ({
  pagina: { flex: 1, backgroundColor: c.fundoAgrupado },
  raiz: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  fundo: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: c.overlay },
  folha: {
    width: '100%',
    maxWidth: LarguraMaxima.lista,
    maxHeight: '90%',
    backgroundColor: c.fundoAgrupado,
    borderTopLeftRadius: Raios.destaque,
    borderTopRightRadius: Raios.destaque,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  alca: { alignSelf: 'center', width: 36, height: 5, borderRadius: 3, backgroundColor: c.separadorOpaco, marginTop: 6 },
  barra: { flexDirection: 'row', alignItems: 'center', minHeight: 52, paddingHorizontal: Espacamento.padrao },
  ladoBarra: { width: 96, alignItems: 'flex-start' },
  ladoDireito: { alignItems: 'flex-end' },
  tituloArea: { flex: 1 },
  botaoBarra: { minHeight: 44, justifyContent: 'center' },
  textoBarra: { ...Tipografia.body, color: c.tint },
  textoForte: { fontWeight: '600' },
  pressionado: { opacity: 0.6 },
  inativo: { opacity: 0.4 },
  conteudo: { paddingHorizontal: Espacamento.padrao, paddingTop: Espacamento.pequeno },
}));
