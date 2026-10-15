// Visão (só apresentação) do Perfil do Aluno — RF06, RF17, RF19, RF21. Dados prontos vêm de
// aluno/PerfilScreen.tsx; a Galeria monta a mesma visão com dados fictícios.
// Banda de identidade → estatísticas (Oswald) → card de faixa (único corte diagonal da tela) →
// modalidades → medalhas → configurações como lista de ItemMenu. "Excluir conta" não fica aqui:
// vive na subtela "Conta e privacidade".
import { StyleSheet, View } from 'react-native';
import { Cores, Espacamento } from '../../theme';
import BandaIdentidade from '../../components/ui/BandaIdentidade';
import Estatistica from '../../components/ui/Estatistica';
import Cartao from '../../components/ui/Cartao';
import SeloFaixa from '../../components/ui/SeloFaixa';
import Etiqueta from '../../components/ui/Etiqueta';
import Medalha, { type TipoMedalha } from '../../components/ui/Medalha';
import CabecalhoSecao from '../../components/ui/CabecalhoSecao';
import ItemMenu from '../../components/ui/ItemMenu';
import Texto from '../../components/ui/Texto';
import { IconeCadeado, IconeChama, IconeCorda, IconePerfil, IconeSair, IconeSino } from '../../components/icones';

export interface MedalhaPerfil {
  id: string;
  rotulo: string;
  tipo: TipoMedalha;
  quantidade: number;
  conquistada: boolean;
  maxima?: boolean;
}

interface PerfilAlunoVisaoProps {
  nome: string;
  fotoUrl?: string;
  faixa?: string;
  email?: string;
  membroDesde?: string;
  nivel: number;
  sequencia: number;
  treinos: number;
  modalidades: string[];
  medalhas: MedalhaPerfil[];
  onEditar: () => void;
  onVinculos: () => void;
  onNotificacoes: () => void;
  onContaPrivacidade: () => void;
  onSair: () => void;
}

export default function PerfilAlunoVisao({
  nome,
  fotoUrl,
  faixa,
  email,
  membroDesde,
  nivel,
  sequencia,
  treinos,
  modalidades,
  medalhas,
  onEditar,
  onVinculos,
  onNotificacoes,
  onContaPrivacidade,
  onSair,
}: PerfilAlunoVisaoProps) {
  const conquistadas = medalhas.filter((m) => m.conquistada).length;
  const detalhes = [email, membroDesde ? `Membro desde ${membroDesde}` : undefined].filter((d): d is string => Boolean(d));

  return (
    <View>
      <BandaIdentidade sobHeader nome={nome} fotoUrl={fotoUrl} detalhes={detalhes} />

      <View style={styles.stats}>
        <Estatistica valor={nivel} rotulo="Nível" alinhamento="centro" />
        <View style={styles.divisor} />
        <Estatistica valor={sequencia} rotulo="Sequência" icone={IconeChama} alinhamento="centro" />
        <View style={styles.divisor} />
        <Estatistica valor={treinos} rotulo="Treinos" alinhamento="centro" />
      </View>

      <View style={styles.corpo}>
        <Cartao corteDiagonal>
          <Texto variante="rotuloPlacar" alinhamento="center">
            Graduação
          </Texto>
          <View style={styles.faixa}>
            <SeloFaixa faixaOuGrau={faixa ?? 'Faixa não informada'} tamanho="grande" />
          </View>
        </Cartao>

        {modalidades.length > 0 ? (
          <>
            <CabecalhoSecao titulo="Modalidades" />
            <View style={styles.modalidades}>
              {modalidades.map((m) => (
                <Etiqueta key={m} texto={m} />
              ))}
            </View>
          </>
        ) : null}

        {medalhas.length > 0 ? (
          <>
            <CabecalhoSecao titulo="Medalhas" contador={`${conquistadas} de ${medalhas.length}`} />
            <View style={styles.medalhas}>
              {medalhas.map((m) => (
                <Medalha key={m.id} rotulo={m.rotulo} tipo={m.tipo} numero={m.quantidade} conquistada={m.conquistada} maxima={m.maxima} />
              ))}
            </View>
          </>
        ) : null}

        <CabecalhoSecao titulo="Conta" />
        <ItemMenu rotulo="Editar perfil" icone={IconePerfil} onPress={onEditar} />
        <ItemMenu rotulo="Vincular-se" descricao="Academias e professores autônomos" icone={IconeCorda} onPress={onVinculos} separador />
        <ItemMenu rotulo="Notificações" icone={IconeSino} onPress={onNotificacoes} separador />
        <ItemMenu rotulo="Conta e privacidade" icone={IconeCadeado} onPress={onContaPrivacidade} separador />
        <ItemMenu rotulo="Sair" icone={IconeSair} semChevron onPress={onSair} separador />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stats: {
    flexDirection: 'row',
    paddingVertical: Espacamento.padrao,
    paddingHorizontal: Espacamento.padrao,
    borderBottomWidth: 1,
    borderBottomColor: Cores.linha,
  },
  divisor: { width: 1, backgroundColor: Cores.linha },
  corpo: { paddingHorizontal: Espacamento.padrao, paddingTop: Espacamento.grande, paddingBottom: Espacamento.enorme },
  faixa: { marginTop: Espacamento.padrao, marginBottom: Espacamento.pequeno },
  modalidades: { flexDirection: 'row', flexWrap: 'wrap', gap: Espacamento.pequeno },
  medalhas: { flexDirection: 'row', flexWrap: 'wrap', gap: Espacamento.padrao, justifyContent: 'flex-start' },
});
