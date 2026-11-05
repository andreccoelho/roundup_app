// Tela — contêiner raiz de toda tela (docs/DESIGN.md): fundo do tema, safe area, coluna
// centralizada com largura máxima em web/tablet (480 em auth/forms, 720 em listas — sem layout de
// 2 colunas), rolagem e KeyboardAvoidingView opcionais.
//
// `bordas`: quais insets esta tela aplica por conta própria. Telas dentro de um stack com header
// não precisam de 'topo' (o header já cobre); telas dentro das abas não precisam de 'base' (a tab
// bar já soma insets.bottom). Telas sem header e fora das abas (auth) usam as duas.
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { criarEstilos, Espacamento, LarguraMaxima } from '../../theme';

type Borda = 'topo' | 'base';

interface TelaProps {
  children: ReactNode;
  rolavel?: boolean;
  teclado?: boolean;
  largura?: 'formulario' | 'lista' | 'total';
  bordas?: Borda[];
  // Gutter lateral de 16 + respiro inferior. Desligar quando a tela começa com um bloco
  // full-bleed (BandaIdentidade) e aplica o gutter por seção.
  preenchimento?: boolean;
  centralizarVertical?: boolean;
  estiloConteudo?: StyleProp<ViewStyle>;
  // Elemento fixo fora da rolagem (ex.: Aviso, que precisa ficar na viewport).
  sobreposicao?: ReactNode;
  // Listas agrupadas inseridas pedem o fundo agrupado (systemGroupedBackground)
  agrupada?: boolean;
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
}: TelaProps) {
  const insets = useSafeAreaInsets();
  const styles = useEstilos();
  const maxWidth = largura === 'total' ? undefined : LarguraMaxima[largura];

  const coluna: StyleProp<ViewStyle> = [
    styles.coluna,
    { maxWidth },
    preenchimento && styles.preenchimento,
    bordas.includes('topo') && { paddingTop: insets.top + (preenchimento ? Espacamento.padrao : 0) },
    bordas.includes('base') && { paddingBottom: insets.bottom + Espacamento.enorme },
    centralizarVertical && styles.centralizar,
    estiloConteudo,
  ];

  const conteudo = rolavel ? (
    <ScrollView
      style={[styles.raiz, agrupada && styles.raizAgrupada]}
      contentContainerStyle={styles.rolagem}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={coluna}>{children}</View>
    </ScrollView>
  ) : (
    <View style={[styles.raiz, agrupada && styles.raizAgrupada, styles.rolagem]}>
      <View style={[coluna, styles.flex]}>{children}</View>
    </View>
  );

  return (
    <View style={[styles.raiz, agrupada && styles.raizAgrupada]}>
      {teclado ? (
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
}));
