// CartaoAluno — linha de aluno na lista do gestor (RF24), dentro de um GrupoLista: avatar, nome,
// faixa e frequência recente. `alerta` (RF32) sinaliza queda de frequência com ícone + texto (não
// só cor).
import { View } from 'react-native';
import { Alturas, criarEstilos, Espacamento, useTema } from '../../theme';
import { IconeAlerta } from '../icones';
import Avatar from './Avatar';
import SeloFaixa from './SeloFaixa';
import IndicadorFrequencia from './IndicadorFrequencia';
import Texto from './Texto';

interface CartaoAlunoProps {
  nome: string;
  faixaOuGrau?: string;
  fotoUrl?: string;
  frequenciaRecente: boolean[];
  alerta?: string;
}

export default function CartaoAluno({ nome, faixaOuGrau, fotoUrl, frequenciaRecente, alerta }: CartaoAlunoProps) {
  const { cores } = useTema();
  const styles = useEstilos();
  return (
    <View style={styles.linha}>
      <Avatar nome={nome} fotoUrl={fotoUrl} tamanho={40} />
      <View style={styles.textos}>
        <Texto variante="body" numberOfLines={1}>
          {nome}
        </Texto>
        {faixaOuGrau ? <SeloFaixa faixaOuGrau={faixaOuGrau} /> : null}
        {alerta ? (
          <View style={styles.alerta}>
            <IconeAlerta tamanho={14} cor={cores.perigo} />
            <Texto variante="footnote" cor="perigo">
              {alerta}
            </Texto>
          </View>
        ) : null}
      </View>
      <IndicadorFrequencia presencas={frequenciaRecente} />
    </View>
  );
}

const useEstilos = criarEstilos(() => ({
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacamento.medio,
    minHeight: Alturas.linha + 20,
    paddingVertical: Espacamento.medio - 2,
    paddingHorizontal: Espacamento.padrao,
  },
  textos: { flex: 1, gap: Espacamento.minimo },
  alerta: { flexDirection: 'row', alignItems: 'center', gap: Espacamento.minimo },
}));
