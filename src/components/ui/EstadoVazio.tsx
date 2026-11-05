// EstadoVazio — padrão do iOS (ContentUnavailableView): ícone grande em texto3, título em
// Title 3, uma linha de explicação e um botão opcional.
import type { ComponentType } from 'react';
import { View } from 'react-native';
import { criarEstilos, Espacamento, useTema } from '../../theme';
import { IconeLuva } from '../icones';
import Botao from './Botao';
import Texto from './Texto';

interface EstadoVazioProps {
  titulo: string;
  descricao?: string;
  icone?: ComponentType<{ tamanho?: number; cor?: string; espessura?: number }>;
  acaoTitulo?: string;
  onAcao?: () => void;
  // Botão cheio no tint quando é a ação principal da tela (ex.: bloqueio de vínculo)
  acaoPrimaria?: boolean;
}

export default function EstadoVazio({ titulo, descricao, icone: Icone = IconeLuva, acaoTitulo, onAcao, acaoPrimaria }: EstadoVazioProps) {
  const styles = useEstilos();
  const { cores } = useTema();
  return (
    <View style={styles.container}>
      <View aria-hidden importantForAccessibility="no-hide-descendants">
        <Icone tamanho={56} cor={cores.texto3} espessura={1.6} />
      </View>
      <Texto variante="title3" alinhamento="center" style={styles.titulo}>
        {titulo}
      </Texto>
      {descricao ? (
        <Texto variante="subheadline" alinhamento="center" style={styles.descricao}>
          {descricao}
        </Texto>
      ) : null}
      {acaoTitulo && onAcao ? (
        <View style={styles.acao}>
          <Botao titulo={acaoTitulo} variante={acaoPrimaria ? 'primario' : 'secundario'} compacto={!acaoPrimaria} onPress={onAcao} />
        </View>
      ) : null}
    </View>
  );
}

const useEstilos = criarEstilos(() => ({
  container: { alignItems: 'center', justifyContent: 'center', paddingVertical: Espacamento.extraGrande, paddingHorizontal: Espacamento.grande },
  titulo: { marginTop: Espacamento.padrao },
  descricao: { marginTop: Espacamento.minimo, maxWidth: 320 },
  acao: { marginTop: Espacamento.padrao + 4, alignItems: 'center' },
}));
