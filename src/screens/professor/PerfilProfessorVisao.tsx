// Visão (só apresentação) do Perfil do Professor — RF05. Dados prontos vêm de
// professor/PerfilScreen.tsx; a Galeria monta a mesma visão com dados fictícios.
// Mesma linguagem do Perfil do Aluno: cabeçalho centralizado, graduação e modalidades e as
// configurações em listas agrupadas. "Excluir conta" vive na subtela "Conta e privacidade".
import { View } from 'react-native';
import { criarEstilos, Espacamento } from '../../theme';
import CabecalhoPerfil from '../../components/ui/CabecalhoPerfil';
import SeloFaixa from '../../components/ui/SeloFaixa';
import Etiqueta from '../../components/ui/Etiqueta';
import GrupoLista from '../../components/ui/GrupoLista';
import LinhaLista from '../../components/ui/LinhaLista';
import ItemMenu from '../../components/ui/ItemMenu';
import { IconeCadeado, IconeCartaoPontuacao, IconeCorda, IconePerfil, IconePoste, IconeSair, IconeSino } from '../../components/icones';

interface PerfilProfessorVisaoProps {
  nome: string;
  fotoUrl?: string;
  email?: string;
  autonomo?: boolean;
  membroDesde?: string;
  graduacao?: string;
  modalidades: string[];
  onSolicitacoes: () => void;
  onVincularAcademia: () => void;
  onPontuacao: () => void;
  onEditar: () => void;
  onNotificacoes: () => void;
  onContaPrivacidade: () => void;
  onSair: () => void;
}

export default function PerfilProfessorVisao({
  nome,
  fotoUrl,
  email,
  autonomo,
  membroDesde,
  graduacao,
  modalidades,
  onSolicitacoes,
  onVincularAcademia,
  onPontuacao,
  onEditar,
  onNotificacoes,
  onContaPrivacidade,
  onSair,
}: PerfilProfessorVisaoProps) {
  const styles = useEstilos();
  return (
    <>
      <CabecalhoPerfil
        variante="gestor"
        nome={nome}
        fotoUrl={fotoUrl}
        detalhes={[
          email,
          autonomo ? 'Atuação autônoma' : 'Vinculado a uma academia',
          membroDesde ? `Membro desde ${membroDesde}` : undefined,
        ]}
      />

      <GrupoLista titulo="Graduação" semMargem>
        <LinhaLista>
          <SeloFaixa faixaOuGrau={graduacao || 'Graduação não informada'} />
        </LinhaLista>
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

      <GrupoLista titulo="Gestão">
        <ItemMenu rotulo="Solicitações pendentes" descricao="Pedidos de vínculo de alunos" icone={IconeCorda} onPress={onSolicitacoes} />
        <ItemMenu rotulo="Vincular-se a uma academia" icone={IconePoste} onPress={onVincularAcademia} />
        <ItemMenu rotulo="Pontuação e níveis" descricao="Pontos por check-in, por missão e tabela de níveis" icone={IconeCartaoPontuacao} onPress={onPontuacao} />
      </GrupoLista>

      <GrupoLista titulo="Conta">
        <ItemMenu rotulo="Editar perfil" icone={IconePerfil} onPress={onEditar} />
        <ItemMenu rotulo="Notificações" icone={IconeSino} onPress={onNotificacoes} />
        <ItemMenu rotulo="Conta e privacidade" icone={IconeCadeado} onPress={onContaPrivacidade} />
      </GrupoLista>

      <GrupoLista>
        <ItemMenu rotulo="Sair" icone={IconeSair} destrutivo semChevron onPress={onSair} />
      </GrupoLista>
    </>
  );
}

const useEstilos = criarEstilos(() => ({
  modalidades: { flexDirection: 'row', flexWrap: 'wrap', gap: Espacamento.pequeno, padding: Espacamento.padrao },
}));
