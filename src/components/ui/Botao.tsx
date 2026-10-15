// Botao — docs/DESIGN.md. Variantes cheias com canto vivo (raio 2), rótulo Oswald em caixa alta;
// `primario` é o CTA da tela (acento, texto #0B0B0C) e aparece no máximo uma vez por tela.
// Pressionado = escala 0.97 (desligada com reduce motion). Foco de teclado = anel em acento.
import { useRef, type ComponentType } from 'react';
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text, View, type TextStyle, type ViewStyle } from 'react-native';
import { Alturas, Cores, DuracaoAnimacao, Espacamento, FamiliaFonte, Raios, TamanhoFonte } from '../../theme';
import { useFocoVisivel, estiloAnelFoco, estiloSemOutline } from '../../hooks/useFocoVisivel';
import { useMovimentoReduzido } from '../../hooks/useMovimentoReduzido';
import { IconeVoltar } from '../icones';

type VarianteCheia = 'primario' | 'secundario' | 'fantasma' | 'destrutivo';
export type VarianteBotao = VarianteCheia | 'texto' | 'voltar';

interface IconeProps {
  tamanho?: number;
  cor?: string;
}

interface BotaoProps {
  titulo?: string;
  onPress: () => void;
  carregando?: boolean;
  desabilitado?: boolean;
  variante?: VarianteBotao;
  // Menos altura, para ações secundárias lado a lado — alvo de toque de 44 continua garantido.
  compacto?: boolean;
  // 56px de altura: CTA de hero (check-in, conquista).
  grande?: boolean;
  icone?: ComponentType<IconeProps>;
  accessibilityLabel?: string;
}

const ESTILOS: Record<VarianteCheia, { container: ViewStyle; cor: string }> = {
  primario: { container: { backgroundColor: Cores.acento }, cor: Cores.sobreCor },
  secundario: { container: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: Cores.linhaForte }, cor: Cores.texto },
  fantasma: { container: { backgroundColor: 'transparent' }, cor: Cores.texto },
  destrutivo: { container: { backgroundColor: Cores.perigo }, cor: Cores.sobreCor },
};

export default function Botao({
  titulo,
  onPress,
  carregando,
  desabilitado,
  variante = 'primario',
  compacto,
  grande,
  icone: Icone,
  accessibilityLabel,
}: BotaoProps) {
  const inativo = Boolean(carregando || desabilitado);
  const { focado, propsFoco } = useFocoVisivel();
  const reduzido = useMovimentoReduzido();
  const escala = useRef(new Animated.Value(1)).current;

  function animar(para: number) {
    if (reduzido) return;
    Animated.timing(escala, { toValue: para, duration: DuracaoAnimacao.rapida / 2, useNativeDriver: true }).start();
  }

  if (variante === 'texto' || variante === 'voltar') {
    const rotulo = titulo ?? 'Voltar';
    return (
      <Pressable
        onPress={onPress}
        disabled={inativo}
        hitSlop={12}
        accessibilityRole={variante === 'voltar' ? 'button' : 'link'}
        accessibilityLabel={accessibilityLabel ?? rotulo}
        accessibilityState={{ disabled: inativo }}
        style={[variante === 'voltar' ? styles.voltar : styles.link, estiloSemOutline, focado && estiloAnelFoco]}
        {...propsFoco}
      >
        {({ pressed }) => (
          <>
            {variante === 'voltar' ? <IconeVoltar tamanho={22} cor={Cores.texto} /> : null}
            <Text style={[variante === 'voltar' ? styles.textoVoltar : styles.textoLink, pressed && styles.textoPressionado]}>
              {rotulo}
            </Text>
          </>
        )}
      </Pressable>
    );
  }

  const estilo = ESTILOS[variante];
  const corTexto = inativo && !carregando ? Cores.texto3 : estilo.cor;

  return (
    <Animated.View style={{ transform: [{ scale: escala }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={() => animar(0.97)}
        onPressOut={() => animar(1)}
        disabled={inativo}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? titulo}
        accessibilityState={{ disabled: inativo, busy: Boolean(carregando) }}
        style={({ pressed }) => [
          styles.botao,
          estilo.container,
          compacto && styles.compacto,
          grande && styles.grande,
          pressed && styles.pressionado,
          inativo && !carregando && (variante === 'secundario' || variante === 'fantasma' ? styles.inativoContorno : styles.inativoCheio),
          estiloSemOutline,
          focado && estiloAnelFoco,
        ]}
        {...propsFoco}
      >
        {carregando ? (
          <ActivityIndicator color={estilo.cor} />
        ) : (
          <View style={styles.conteudo}>
            {Icone ? <Icone tamanho={grande ? 22 : 18} cor={corTexto} /> : null}
            {titulo ? (
              <Text style={[styles.texto, compacto && styles.textoCompacto, grande && styles.textoGrande, { color: corTexto }]}>
                {titulo}
              </Text>
            ) : null}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const texto: TextStyle = {
  fontFamily: FamiliaFonte.placarSemiBold,
  fontSize: TamanhoFonte.md,
  letterSpacing: 1,
  textTransform: 'uppercase',
};

const styles = StyleSheet.create({
  botao: {
    minHeight: Alturas.botao,
    minWidth: Alturas.alvoMinimo,
    paddingHorizontal: Espacamento.padrao,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Raios.vivo,
  },
  compacto: { minHeight: Alturas.alvoMinimo, paddingHorizontal: Espacamento.medio },
  grande: { minHeight: Alturas.botaoHero },
  pressionado: { opacity: 0.85 },
  inativoCheio: { backgroundColor: Cores.superficie2 },
  inativoContorno: { borderColor: Cores.linha },
  conteudo: { flexDirection: 'row', alignItems: 'center', gap: Espacamento.pequeno },
  texto,
  textoCompacto: { fontSize: TamanhoFonte.sm },
  textoGrande: { fontSize: TamanhoFonte.lg, letterSpacing: 1.5 },

  link: { alignSelf: 'center', minHeight: Alturas.alvoMinimo, justifyContent: 'center' },
  textoLink: { color: Cores.texto2, fontSize: TamanhoFonte.sm, textDecorationLine: 'underline' },
  voltar: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacamento.minimo,
    minHeight: Alturas.alvoMinimo,
    paddingRight: Espacamento.pequeno,
    marginLeft: -Espacamento.minimo,
  },
  textoVoltar: { color: Cores.texto, fontSize: TamanhoFonte.md },
  textoPressionado: { opacity: 0.6 },
});
