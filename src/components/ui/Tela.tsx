// Tela — contêiner raiz de toda tela (docs/DESIGN.md): fundo do tema (agrupado ou não), safe
// area, coluna centralizada com largura máxima em web/tablet (480 em auth/forms, 720 em listas —
// sem layout de 2 colunas), rolagem e KeyboardAvoidingView opcionais.
//
// Navegação: no iOS o cabeçalho é transparente com blur e Large Title (opcoesCasca.tsx); a rolagem
// usa contentInsetAdjustmentBehavior "automatic" para o conteúdo começar abaixo do cabeçalho e o
// título grande encolher ao rolar. Fora do iOS, nas telas raiz das abas o cabeçalho some e esta
// Tela desenha o título grande (`tituloGrande`). A tab bar é translúcida e fica por cima do
// conteúdo: o respiro inferior soma a altura dela (BottomTabBarHeightContext).
//
// `bordas`: quais insets esta tela aplica por conta própria. Telas sem header e fora das abas
// (auth) usam as duas.
import { useContext, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
import { criarEstilos, Espacamento, LarguraMaxima } from '../../theme';
import Texto from './Texto';

type Borda = 'topo' | 'base';

const IOS = Platform.OS === 'ios';

interface TelaProps {
  children: ReactNode;
  rolavel?: boolean;
  teclado?: boolean;
  largura?: 'formulario' | 'lista' | 'total';
  bordas?: Borda[];
  // Gutter lateral de 16 + respiro inferior. Desligar quando a tela começa com um bloco que vai de
  // borda a borda e aplica o gutter por seção.
  preenchimento?: boolean;
  centralizarVertical?: boolean;
  estiloConteudo?: StyleProp<ViewStyle>;
  // Elemento fixo fora da rolagem (ex.: Aviso, que precisa ficar na viewport).
  sobreposicao?: ReactNode;
  // Listas agrupadas inseridas pedem o fundo agrupado (systemGroupedBackground)
  agrupada?: boolean;
  // Título da tela raiz de uma aba (Large Title). No iOS quem desenha é o cabeçalho nativo.
  tituloGrande?: string;
}

export default function Tela({
  children,
  rolavel = true,
  teclado = false,
  largura = 'lista',
  bordas = [],
  preenchimento = true,
  centralizarVertical = false,
  estiloConteudo,
  sobreposicao,
  agrupada = false,
  tituloGrande,
}: TelaProps) {
  const insets = useSafeAreaInsets();
  const alturaTabBar = useContext(BottomTabBarHeightContext) ?? 0;
  const styles = useEstilos();
  const maxWidth = largura === 'total' ? undefined : LarguraMaxima[largura];
  const tituloNaTela = tituloGrande && !IOS;
  const topo = bordas.includes('topo') || tituloNaTela;

  const coluna: StyleProp<ViewStyle> = [
    styles.coluna,
    { maxWidth },
    preenchimento && styles.preenchimento,
    topo && { paddingTop: insets.top + (preenchimento ? Espacamento.padrao : 0) },
    bordas.includes('base') && { paddingBottom: insets.bottom + Espacamento.enorme },
    alturaTabBar > 0 && { paddingBottom: alturaTabBar + Espacamento.grande },
    centralizarVertical && styles.centralizar,
    estiloConteudo,
  ];

  const titulo = tituloNaTela ? (
    <Texto variante="largeTitle" style={[styles.tituloGrande, !preenchimento && styles.tituloSemGutter]}>
      {tituloGrande}
    </Texto>
  ) : null;

  // No iOS a rolagem existe mesmo quando a tela não rola (scrollEnabled false): é ela que aplica o
  // inset do cabeçalho transparente.
  const conteudo =
    rolavel || IOS ? (
      <ScrollView
        style={[styles.raiz, agrupada && styles.raizAgrupada]}
        contentContainerStyle={styles.rolagem}
        contentInsetAdjustmentBehavior="automatic"
        scrollEnabled={rolavel}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[coluna, !rolavel && styles.flex]}>
          {titulo}
          {children}
        </View>
      </ScrollView>
    ) : (
      <View style={[styles.raiz, agrupada && styles.raizAgrupada, styles.rolagem]}>
        <View style={[coluna, styles.flex]}>
          {titulo}
          {children}
        </View>
      </View>
    );

  return (
    <View style={[styles.raiz, agrupada && styles.raizAgrupada]}>
      {teclado ? (
        <KeyboardAvoidingView style={styles.flex} behavior={IOS ? 'padding' : undefined}>
          {conteudo}
        </KeyboardAvoidingView>
      ) : (
        conteudo
      )}
      {sobreposicao}
    </View>
  );
}

const useEstilos = criarEstilos((c) => ({
  raiz: { flex: 1, backgroundColor: c.fundo },
  raizAgrupada: { backgroundColor: c.fundoAgrupado },
  flex: { flex: 1 },
  rolagem: { flexGrow: 1, alignItems: 'center' },
  coluna: { width: '100%', flexGrow: 1 },
  preenchimento: { paddingHorizontal: Espacamento.padrao, paddingTop: Espacamento.padrao, paddingBottom: Espacamento.enorme },
  centralizar: { justifyContent: 'center' },
  tituloGrande: { marginBottom: Espacamento.padrao, marginTop: Espacamento.minimo },
  tituloSemGutter: { paddingHorizontal: Espacamento.padrao },
}));
