// Botao — estilos de botão do iOS (docs/DESIGN.md), em cápsula com canto contínuo:
//   primario   = cheio no tint (tintCheio, rótulo branco) — a ação principal da tela
//   secundario = cinza (preenchimento, rótulo no tint)
//   fantasma   = simples (só o rótulo no tint)
//   destrutivo = cheio em perigoCheio (rótulo branco)
//   texto      = link em tint, sem fundo
//   voltar     = chevron + "Voltar" em tint, alinhado à esquerda
// Pressionado = opacidade 0,7 (sem escala). Desabilitado = opacidade 0,4, como no iOS. Foco de
// teclado (web) = anel em CorFoco.
import type { ComponentType } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Alturas, criarEstilos, Espacamento, Raios, Tipografia, useTema } from '../../theme';
import { useFocoVisivel, estiloAnelFoco, estiloSemOutline } from '../../hooks/useFocoVisivel';
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
  // 34pt de altura (alvo de toque de 44 garantido por hitSlop): ações em linha, cabeçalhos
  compacto?: boolean;
  // Mantido por compatibilidade: o botão padrão já tem 50pt, a altura de CTA do iOS
  grande?: boolean;
  icone?: ComponentType<IconeProps>;
  accessibilityLabel?: string;
  // Só para a variante "texto": alinhamento do link na linha (padrão: centro).
  alinhar?: 'inicio' | 'centro' | 'fim';
}

const ALINHAR = { inicio: 'flex-start', centro: 'center', fim: 'flex-end' } as const;

export default function Botao({
  titulo,
  onPress,
  carregando,
  desabilitado,
  variante = 'primario',
  compacto,
  icone: Icone,
  accessibilityLabel,
  alinhar = 'centro',
}: BotaoProps) {
  const inativo = Boolean(carregando || desabilitado);
  const { focado, propsFoco } = useFocoVisivel();
  const { cores } = useTema();
  const styles = useEstilos();

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
        style={({ pressed }) => [
          variante === 'voltar' ? styles.voltar : [styles.link, { alignSelf: ALINHAR[alinhar] }],
          pressed && styles.pressionado,
          inativo && styles.inativo,
          estiloSemOutline,
          focado && estiloAnelFoco,
        ]}
        {...propsFoco}
      >
        {variante === 'voltar' ? <IconeVoltar tamanho={22} cor={cores.tint} /> : null}
        <Text style={variante === 'voltar' ? styles.textoVoltar : styles.textoLink}>{rotulo}</Text>
      </Pressable>
    );
  }

  const fundo = {
    primario: cores.tintCheio,
    secundario: cores.preenchimento,
    fantasma: 'transparent',
    destrutivo: cores.perigoCheio,
  }[variante];
  const corTexto = variante === 'primario' || variante === 'destrutivo' ? cores.sobreTint : cores.tint;

  return (
    <Pressable
      onPress={onPress}
      disabled={inativo}
      hitSlop={compacto ? { top: 5, bottom: 5 } : undefined}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? titulo}
      accessibilityState={{ disabled: inativo, busy: Boolean(carregando) }}
      style={({ pressed }) => [
        styles.botao,
        { backgroundColor: fundo },
        compacto && styles.compacto,
        pressed && styles.pressionado,
        desabilitado && !carregando && styles.inativo,
        estiloSemOutline,
        focado && estiloAnelFoco,
      ]}
      {...propsFoco}
    >
      {carregando ? (
        <ActivityIndicator color={corTexto} />
      ) : (
        <View style={styles.conteudo}>
          {Icone ? <Icone tamanho={compacto ? 16 : 20} cor={corTexto} /> : null}
          {titulo ? (
            <Text style={[compacto ? styles.textoCompacto : styles.texto, { color: corTexto }]} numberOfLines={1}>
              {titulo}
            </Text>
          ) : null}
        </View>
      )}
    </Pressable>
  );
}

const useEstilos = criarEstilos((c) => ({
  botao: {
    minHeight: Alturas.botao,
    minWidth: Alturas.alvoMinimo,
    paddingHorizontal: Espacamento.grande,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Raios.capsula,
    borderCurve: 'continuous',
  },
  compacto: { minHeight: Alturas.botaoCompacto, paddingHorizontal: Espacamento.padrao },
  pressionado: { opacity: 0.7 },
  inativo: { opacity: 0.4 },
  conteudo: { flexDirection: 'row', alignItems: 'center', gap: Espacamento.pequeno },
  texto: { ...Tipografia.headline },
  textoCompacto: { ...Tipografia.subheadline, fontWeight: '600' },

  link: { minHeight: Alturas.alvoMinimo, justifyContent: 'center' },
  textoLink: { ...Tipografia.body, color: c.tint },
  voltar: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minHeight: Alturas.alvoMinimo,
    paddingRight: Espacamento.pequeno,
    marginLeft: -Espacamento.minimo,
  },
  textoVoltar: { ...Tipografia.body, color: c.tint },
}));
