// CabecalhoPerfil — topo das telas de perfil, como o cartão de conta do Ajustes do iOS: avatar
// grande centralizado, nome em Title 2 e até três linhas de detalhe (e-mail, endereço, "membro
// desde"), sobre o FundoIdentidade (lona + marca d'água da antiga BandaIdentidade, num cartão de
// destaque). `variante` segue a da banda: `aluno` com lona, `gestor` só com a marca d'água.
import { criarEstilos, Espacamento } from '../../theme';
import Avatar from './Avatar';
import FundoIdentidade from './FundoIdentidade';
import Texto from './Texto';

interface CabecalhoPerfilProps {
  nome: string;
  fotoUrl?: string;
  detalhes?: (string | undefined)[];
  variante?: 'aluno' | 'gestor';
}

export default function CabecalhoPerfil({ nome, fotoUrl, detalhes = [], variante = 'aluno' }: CabecalhoPerfilProps) {
  const styles = useEstilos();
  const linhas = detalhes.filter((d): d is string => Boolean(d));
  return (
    <FundoIdentidade variante={variante} style={styles.cabecalho}>
      <Avatar nome={nome} fotoUrl={fotoUrl} tamanho={88} />
      <Texto variante="title2" alinhamento="center" style={styles.nome}>
        {nome}
      </Texto>
      {linhas.map((linha, i) => (
        <Texto key={linha} variante={i === 0 ? 'subheadline' : 'footnote'} alinhamento="center">
          {linha}
        </Texto>
      ))}
    </FundoIdentidade>
  );
}

const useEstilos = criarEstilos(() => ({
  cabecalho: { alignItems: 'center', gap: 2, marginBottom: Espacamento.padrao },
  nome: { marginTop: Espacamento.medio },
}));
