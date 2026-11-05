// CabecalhoPerfil — topo das telas de perfil, como o cartão de conta do Ajustes do iOS: avatar
// grande centralizado, nome em Title 2 e até três linhas de detalhe (e-mail, endereço, "membro
// desde"). Substitui a BandaIdentidade da direção anterior.
import { View } from 'react-native';
import { criarEstilos, Espacamento } from '../../theme';
import Avatar from './Avatar';
import Texto from './Texto';

interface CabecalhoPerfilProps {
  nome: string;
  fotoUrl?: string;
  detalhes?: (string | undefined)[];
}

export default function CabecalhoPerfil({ nome, fotoUrl, detalhes = [] }: CabecalhoPerfilProps) {
  const styles = useEstilos();
  const linhas = detalhes.filter((d): d is string => Boolean(d));
  return (
    <View style={styles.cabecalho}>
      <Avatar nome={nome} fotoUrl={fotoUrl} tamanho={88} />
      <Texto variante="title2" alinhamento="center" style={styles.nome}>
        {nome}
      </Texto>
      {linhas.map((linha, i) => (
        <Texto key={linha} variante={i === 0 ? 'subheadline' : 'footnote'} alinhamento="center">
          {linha}
        </Texto>
      ))}
    </View>
  );
}

const useEstilos = criarEstilos(() => ({
  cabecalho: { alignItems: 'center', paddingTop: Espacamento.pequeno, paddingBottom: Espacamento.grande, gap: 2 },
  nome: { marginTop: Espacamento.medio },
}));
