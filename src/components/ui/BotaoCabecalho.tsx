// BotaoCabecalho — ação de texto na barra de navegação ("Cancelar", "Salvar"), em tint, no padrão
// do iOS: Body regular para cancelar, semibold para a ação de confirmar. Usado nos fluxos curtos
// apresentados como sheet (opcoesCasca.tsx) e pelas telas que põem o "Salvar" no cabeçalho.
import { ActivityIndicator, Pressable, Text } from 'react-native';
import { criarEstilos, Tipografia, useTema } from '../../theme';
import { estiloAnelFoco, estiloSemOutline, useFocoVisivel } from '../../hooks/useFocoVisivel';

interface BotaoCabecalhoProps {
  titulo: string;
  onPress: () => void;
  forte?: boolean;
  desabilitado?: boolean;
  carregando?: boolean;
}

export default function BotaoCabecalho({ titulo, onPress, forte, desabilitado, carregando }: BotaoCabecalhoProps) {
  const { focado, propsFoco } = useFocoVisivel();
  const { cores } = useTema();
  const styles = useEstilos();
  if (carregando) return <ActivityIndicator color={cores.tint} style={styles.botao} accessibilityLabel={`${titulo}: carregando`} />;
  return (
    <Pressable
      onPress={onPress}
      disabled={desabilitado}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={titulo}
      accessibilityState={{ disabled: Boolean(desabilitado) }}
      style={({ pressed }) => [styles.botao, pressed && styles.pressionado, desabilitado && styles.inativo, estiloSemOutline, focado && estiloAnelFoco]}
      {...propsFoco}
    >
      <Text style={[styles.texto, forte && styles.forte]}>{titulo}</Text>
    </Pressable>
  );
}

const useEstilos = criarEstilos((c) => ({
  botao: { minHeight: 44, minWidth: 44, justifyContent: 'center', paddingHorizontal: 8 },
  texto: { ...Tipografia.body, color: c.tint },
  forte: { fontWeight: '600' },
  pressionado: { opacity: 0.6 },
  inativo: { opacity: 0.4 },
}));
