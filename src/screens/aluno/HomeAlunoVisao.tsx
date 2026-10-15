// Visão (só apresentação) da Home do Aluno — RF13, RF14, RF17, RF21. Recebe dados prontos; quem
// busca no Firestore é aluno/DashboardScreen.tsx. A Galeria monta esta mesma visão com dados
// fictícios ("Composições") para validar o visual sem backend.
//
// Ordem (docs/DESIGN.md): banda de identidade compacta → HeroCheckIn (próximo treino) →
// progresso (XP + sequência) → próximos treinos → atalhos.
import { StyleSheet, View } from 'react-native';
import { Espacamento } from '../../theme';
import type { EstadoCheckIn } from '../../utils/statusCheckIn';
import type { ProgressoNivel } from '../../utils/gamificacao';
import BandaIdentidade from '../../components/ui/BandaIdentidade';
import HeroCheckIn from '../../components/ui/HeroCheckIn';
import BarraProgresso from '../../components/ui/BarraProgresso';
import IndicadorSequencia from '../../components/ui/IndicadorSequencia';
import CartaoSessao from '../../components/ui/CartaoSessao';
import CabecalhoSecao from '../../components/ui/CabecalhoSecao';
import ItemMenu from '../../components/ui/ItemMenu';
import Etiqueta from '../../components/ui/Etiqueta';
import SeloFaixa from '../../components/ui/SeloFaixa';
import Esqueleto from '../../components/ui/Esqueleto';
import EstadoErro from '../../components/ui/EstadoErro';
import EstadoVazio from '../../components/ui/EstadoVazio';
import LinhaFina from '../../components/LinhaFina';
import { IconeFichaTecnica, IconeTatame } from '../../components/icones';

export interface SessaoHome {
  id: string;
  nomeTurma: string;
  professor?: string;
  inicio: Date;
  janelaInicio: Date;
  janelaFim: Date;
  estado: EstadoCheckIn;
  motivo?: string;
}

interface HomeAlunoVisaoProps {
  nome: string;
  fotoUrl?: string;
  faixa?: string;
  modalidades: string[];
  sessoes: SessaoHome[];
  carregando: boolean;
  erro: string | null;
  enviandoId: string | null;
  progresso: ProgressoNivel | null;
  sequencia: number;
  sobHeader?: boolean;
  onCheckIn: (sessaoId: string) => void;
  onTentarNovamente: () => void;
  onVerAgenda: () => void;
  onTurmasDisponiveis: () => void;
  onHistorico: () => void;
}

export default function HomeAlunoVisao({
  nome,
  fotoUrl,
  faixa,
  modalidades,
  sessoes,
  carregando,
  erro,
  enviandoId,
  progresso,
  sequencia,
  sobHeader,
  onCheckIn,
  onTentarNovamente,
  onVerAgenda,
  onTurmasDisponiveis,
  onHistorico,
}: HomeAlunoVisaoProps) {
  const [proxima, ...demais] = sessoes;

  return (
    <View>
      <BandaIdentidade compacta sobHeader={sobHeader} sobretitulo="Treinar" nome={nome} fotoUrl={fotoUrl} selo={<SeloFaixa faixaOuGrau={faixa ?? 'Faixa não informada'} />}>
        {modalidades.length > 0 ? (
          <View style={styles.modalidades}>
            {modalidades.map((m) => (
              <Etiqueta key={m} texto={m} />
            ))}
          </View>
        ) : null}
      </BandaIdentidade>

      <View style={styles.corpo}>
        {carregando ? (
          <Esqueleto altura={196} />
        ) : erro ? (
          <EstadoErro compacto mensagem={erro} onTentarNovamente={onTentarNovamente} />
        ) : !proxima ? (
          <EstadoVazio
            icone={IconeFichaTecnica}
            titulo="Nenhum treino agendado"
            descricao="Quando suas turmas tiverem sessões marcadas, o próximo treino aparece aqui."
            acaoTitulo="Ver turmas disponíveis"
            onAcao={onTurmasDisponiveis}
          />
        ) : (
          <HeroCheckIn
            nomeTurma={proxima.nomeTurma}
            professor={proxima.professor}
            inicio={proxima.inicio}
            janelaInicio={proxima.janelaInicio}
            janelaFim={proxima.janelaFim}
            estado={proxima.estado}
            carregando={enviandoId === proxima.id}
            onCheckIn={() => onCheckIn(proxima.id)}
          />
        )}

        {progresso ? (
          <>
            <CabecalhoSecao titulo="Progresso" />
            <BarraProgresso nivel={progresso.nivel} xpAtual={progresso.xpAtual} xpProximoNivel={progresso.xpProximoNivel} />
            <View style={styles.sequencia}>
              <IndicadorSequencia dias={sequencia} />
            </View>
          </>
        ) : null}

        {!carregando && !erro && demais.length > 0 ? (
          <>
            <CabecalhoSecao titulo="Próximos treinos" acaoTitulo="Ver agenda" onAcao={onVerAgenda} />
            {demais.map((s, i) => (
              <View key={s.id}>
                {i > 0 ? <LinhaFina /> : null}
                <CartaoSessao
                  nomeTurma={s.nomeTurma}
                  detalhe={s.professor ? `com ${s.professor}` : undefined}
                  inicio={s.inicio}
                  estado={s.estado}
                  motivo={s.motivo}
                  carregando={enviandoId === s.id}
                  onCheckIn={() => onCheckIn(s.id)}
                />
              </View>
            ))}
          </>
        ) : null}

        <CabecalhoSecao titulo="Atalhos" />
        <ItemMenu rotulo="Turmas disponíveis" descricao="Matricule-se em novas turmas" icone={IconeTatame} onPress={onTurmasDisponiveis} />
        <ItemMenu rotulo="Histórico" descricao="Seus check-ins validados e pendentes" icone={IconeFichaTecnica} onPress={onHistorico} separador />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  modalidades: { flexDirection: 'row', flexWrap: 'wrap', gap: Espacamento.pequeno },
  corpo: { paddingHorizontal: Espacamento.padrao, paddingTop: Espacamento.grande, paddingBottom: Espacamento.enorme },
  sequencia: { marginTop: Espacamento.padrao },
});
