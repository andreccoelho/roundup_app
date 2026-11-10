// Visão (só apresentação) do Perfil do Aluno — RF06, RF17, RF19, RF21. Dados prontos vêm de
// aluno/PerfilScreen.tsx; a Galeria monta a mesma visão com dados fictícios.
// Cabeçalho centralizado (avatar, nome, e-mail, "membro desde") → números (nível, sequência,
// treinos) → graduação e modalidades → grade de medalhas → configurações em listas agrupadas.
// "Excluir conta" não fica aqui: vive na subtela "Conta e privacidade". RNF11: a participação na
// classificação é um Toggle no grupo de preferências, com rodapé explicando o efeito.
import { View } from 'react-native';
import { criarEstilos, Espacamento } from '../../theme';
import CabecalhoPerfil from '../../components/ui/CabecalhoPerfil';
import Estatistica from '../../components/ui/Estatistica';
import Cartao from '../../components/ui/Cartao';
import SeloFaixa from '../../components/ui/SeloFaixa';
import Etiqueta from '../../components/ui/Etiqueta';
import Medalha, { type TipoMedalha } from '../../components/ui/Medalha';
import CabecalhoSecao from '../../components/ui/CabecalhoSecao';
import GrupoLista from '../../components/ui/GrupoLista';
import ItemMenu from '../../components/ui/ItemMenu';
import LinhaLista from '../../components/ui/LinhaLista';
import Texto from '../../components/ui/Texto';
import Toggle from '../../components/ui/Toggle';
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
  graduacoes?: Record<string, string>;
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
  participaClassificacao: boolean;
  salvandoParticipacao?: boolean;
  onAlternarParticipacao: (participa: boolean) => void;
  onContaPrivacidade: () => void;
  onSair: () => void;
}

export default function PerfilAlunoVisao({
  nome,
  fotoUrl,
  faixa,
  graduacoes,
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
  participaClassificacao,
  salvandoParticipacao,
  onAlternarParticipacao,
  onContaPrivacidade,
  onSair,
}: PerfilAlunoVisaoProps) {
  const styles = useEstilos();
  const conquistadas = medalhas.filter((m) => m.conquistada).length;

  return (
    <View>
      <CabecalhoPerfil nome={nome} fotoUrl={fotoUrl} detalhes={[email, membroDesde ? `Membro desde ${membroDesde}` : undefined]} />

      <Cartao destaque>
        <View style={styles.stats}>
          <Estatistica valor={nivel} rotulo="Nível" alinhamento="centro" />
          <View style={styles.divisor} />
          <Estatistica valor={sequencia} rotulo="Sequência" icone={IconeChama} alinhamento="centro" />
          <View style={styles.divisor} />
          <Estatistica valor={treinos} rotulo="Treinos" alinhamento="centro" />
        </View>
      </Cartao>

      <GrupoLista titulo="Graduação">
        {graduacoes && Object.keys(graduacoes).length > 0 ? (
          Object.entries(graduacoes).map(([modalidade, grau]) => (
            <LinhaLista key={modalidade}>
              <View style={styles.graduacaoModalidade}>
                <Texto variante="caption" cor="texto2">
                  {modalidade}
                </Texto>
                <SeloFaixa faixaOuGrau={grau || 'Não informada'} />
              </View>
            </LinhaLista>
          ))
        ) : (
          <LinhaLista>
            <SeloFaixa faixaOuGrau={faixa ?? 'Faixa não informada'} />
          </LinhaLista>
        )}
      </GrupoLista>

      {modalidades.length > 0 ? (
        <GrupoLista titulo="Modalidades">
          <View style={styles.modalidades}>
            {modalidades.map((m) => (
              <Etiqueta key={m} texto={m} />
            ))}
          </View>
        </GrupoLista>
      ) : null}

      {medalhas.length > 0 ? (
        <>
          <CabecalhoSecao titulo="Medalhas" contador={`${conquistadas} de ${medalhas.length}`} />
          <Cartao>
            <View style={styles.medalhas}>
              {medalhas.map((m) => (
                <Medalha key={m.id} rotulo={m.rotulo} tipo={m.tipo} numero={m.quantidade} conquistada={m.conquistada} maxima={m.maxima} />
              ))}
            </View>
          </Cartao>
        </>
      ) : null}

      <GrupoLista titulo="Conta">
        <ItemMenu rotulo="Editar perfil" icone={IconePerfil} onPress={onEditar} />
        <ItemMenu rotulo="Vincular-se" descricao="Academias e professores autônomos" icone={IconeCorda} onPress={onVinculos} />
        <ItemMenu rotulo="Conta e privacidade" icone={IconeCadeado} onPress={onContaPrivacidade} />
      </GrupoLista>

      <GrupoLista
        titulo="Preferências"
        rodape="Desligada, você some do ranking dos outros alunos, mas continua vendo a sua pontuação."
      >
        <ItemMenu rotulo="Notificações" icone={IconeSino} onPress={onNotificacoes} />
        <Toggle
          rotulo="Participar da classificação"
          valor={participaClassificacao}
          desabilitado={salvandoParticipacao}
          onAlterar={onAlternarParticipacao}
        />
      </GrupoLista>

      <GrupoLista>
        <ItemMenu rotulo="Sair" icone={IconeSair} destrutivo semChevron onPress={onSair} />
      </GrupoLista>
    </View>
  );
}

const useEstilos = criarEstilos((c) => ({
  graduacaoModalidade: { gap: Espacamento.minimo },
  stats: { flexDirection: 'row', alignItems: 'center' },
  divisor: { width: 0.5, alignSelf: 'stretch', backgroundColor: c.separador },
  modalidades: { flexDirection: 'row', flexWrap: 'wrap', gap: Espacamento.pequeno, padding: Espacamento.padrao },
  medalhas: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', rowGap: Espacamento.padrao },
}));
