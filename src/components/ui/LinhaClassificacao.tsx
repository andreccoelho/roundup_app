// LinhaClassificacao — linha de ranking (RF20) dentro de um GrupoLista: posição, avatar circular,
// nome e pontos (algarismos tabulares). A linha do próprio aluno ganha fundo de tint muito suave
// (tintSuave), posição no tint e o rótulo "Você". Desenha o próprio separador recuado.
import { View } from 'react-native';
import { Alturas, criarEstilos, Espacamento } from '../../theme';
import LinhaFina from '../LinhaFina';
import Avatar from './Avatar';
import Texto from './Texto';

interface LinhaClassificacaoProps {
  posicao: number;
  nome: string;
  pontos: number;
  fotoUrl?: string;
  destaque?: boolean; // linha do próprio aluno
  separadorAcima?: boolean;
}

const RECUO = Espacamento.padrao + 28 + Espacamento.medio + 36 + Espacamento.medio;

function LinhaClassificacao({ posicao, nome, pontos, fotoUrl, destaque, separadorAcima }: LinhaClassificacaoProps) {
  const styles = useEstilos();
  return (
    <View>
      {separadorAcima ? <LinhaFina recuo={RECUO} /> : null}
      <View
        style={[styles.linha, destaque && styles.linhaDestaque]}
        accessible
        accessibilityLabel={`${posicao}º lugar: ${nome}, ${pontos} pontos${destaque ? ', você' : ''}`}
      >
        <Texto variante="headline" cor={destaque ? 'tint' : 'texto2'} style={styles.posicao}>
          {posicao}
        </Texto>
        <Avatar nome={nome} fotoUrl={fotoUrl} tamanho={36} />
        <View style={styles.nome}>
          <Texto variante="body" numberOfLines={1}>
            {nome}
          </Texto>
          {destaque ? (
            <Texto variante="caption" cor="tint">
              Você
            </Texto>
          ) : null}
        </View>
        <Texto variante="headline" style={styles.pontos}>
          {pontos}
        </Texto>
      </View>
    </View>
  );
}

LinhaClassificacao.desenhaSeparador = true;

export default LinhaClassificacao;

const useEstilos = criarEstilos((c) => ({
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacamento.medio,
    minHeight: Alturas.linha + 12,
    paddingVertical: Espacamento.pequeno,
    paddingHorizontal: Espacamento.padrao,
  },
  linhaDestaque: { backgroundColor: c.tintSuave },
  posicao: { width: 28, textAlign: 'center', fontVariant: ['tabular-nums'] },
  nome: { flex: 1 },
  pontos: { fontVariant: ['tabular-nums'] },
}));
