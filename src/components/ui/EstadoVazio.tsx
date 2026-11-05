// EstadoVazio — convite à ação: ícone próprio em 64px, título, descrição e CTA opcional.
import type { ComponentType } from 'react';
import { StyleSheet, View } from 'react-native';
import { Cores, Espacamento } from '../../theme';
import { IconeLuva } from '../icones';
import Botao from './Botao';
import Texto from './Texto';

interface EstadoVazioProps {
  titulo: string;
  descricao?: string;
  icone?: ComponentType<{ tamanho?: number; cor?: string; espessura?: number }>;
  acaoTitulo?: string;
  onAcao?: () => void;
  // CTA em acento quando é a ação principal da tela (ex.: bloqueio de vínculo).
  acaoPrimaria?: boolean;
}

export default function EstadoVazio({ titulo, descricao, icone: Icone = IconeLuva, acaoTitulo, onAcao, acaoPrimaria }: EstadoVazioProps) {
  return (
    <View style={styles.container}>
      <View aria-hidden importantForAccessibility="no-hide-descendants">
        <Icone tamanho={64} cor={Cores.texto3} espessura={1.2} />
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
          <Botao titulo={acaoTitulo} variante={acaoPrimaria ? 'primario' : 'secundario'} onPress={onAcao} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', paddingVertical: Espacamento.extraGrande, paddingHorizontal: Espacamento.grande },
  titulo: { marginTop: Espacamento.padrao },
  descricao: { marginTop: Espacamento.minimo, maxWidth: 360 },
  acao: { marginTop: Espacamento.grande, alignSelf: 'stretch', maxWidth: 320, width: '100%', marginHorizontal: 'auto' },
});
