// Visão (só apresentação) da Home do Aluno — RF13, RF14, RF17, RF21. Recebe dados prontos; quem
// busca no Firestore é aluno/DashboardScreen.tsx. A Galeria monta esta mesma visão com dados
// fictícios ("Composições") para validar o visual sem backend.
//
// Ordem (docs/DESIGN.md), no espírito do Resumo do app Fitness: saudação curta (avatar, nome e
// faixa) → cartão de destaque do próximo treino (HeroCheckIn) → progresso (anel de nível) e
// sequência → próximos treinos em lista agrupada → atalhos. O título grande "Treinar" vem do
// cabeçalho (iOS) ou da Tela (Android/web).
import { View } from 'react-native';
import { criarEstilos, Espacamento } from '../../theme';
import type { EstadoCheckIn } from '../../utils/statusCheckIn';
import type { ProgressoNivel } from '../../utils/gamificacao';
import HeroCheckIn from '../../components/ui/HeroCheckIn';
import AnelProgresso from '../../components/ui/AnelProgresso';
import IndicadorSequencia from '../../components/ui/IndicadorSequencia';
import CartaoSessao from '../../components/ui/CartaoSessao';
import CabecalhoSecao from '../../components/ui/CabecalhoSecao';
import GrupoLista from '../../components/ui/GrupoLista';
import ItemMenu from '../../components/ui/ItemMenu';
import Cartao from '../../components/ui/Cartao';
import FundoIdentidade from '../../components/ui/FundoIdentidade';
import Avatar from '../../components/ui/Avatar';
import SeloFaixa from '../../components/ui/SeloFaixa';
import Esqueleto from '../../components/ui/Esqueleto';
import EstadoErro from '../../components/ui/EstadoErro';
import EstadoVazio from '../../components/ui/EstadoVazio';
import Texto from '../../components/ui/Texto';
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
  // Mantido por compatibilidade com a direção anterior (banda sob o header) — sem efeito
  sobHeader?: boolean;
  onCheckIn: (sessaoId: string) => void;
  onTentarNovamente: () => void;
  onVerAgenda: () => void;
  onTurmasDisponiveis: () => void;
  onHistorico: () => void;
}

function primeiroNome(nome: string): string {
  return nome.trim().split(/\s+/)[0] ?? '';
}

export default function HomeAlunoVisao({
  nome,
  fotoUrl,
  faixa,
  sessoes,
  carregando,
  erro,
  enviandoId,
  progresso,
  sequencia,
  onCheckIn,
  onTentarNovamente,
  onVerAgenda,
  onTurmasDisponiveis,
  onHistorico,
}: HomeAlunoVisaoProps) {
  const styles = useEstilos();
  const [proxima, ...demais] = sessoes;

  return (
    <View>
      <FundoIdentidade compacto variante="aluno" style={styles.saudacaoFundo}>
        <View style={styles.saudacao}>
          <Avatar nome={nome} fotoUrl={fotoUrl} tamanho={44} />
          <View style={styles.saudacaoTextos}>
            <Texto variante="title3" cabecalho={false}>{`Olá, ${primeiroNome(nome)}`}</Texto>
            <SeloFaixa faixaOuGrau={faixa ?? 'Faixa não informada'} />
          </View>
        </View>
      </FundoIdentidade>

      {carregando ? (
        <Esqueleto altura={212} raio={16} />
      ) : erro ? (
        <Cartao>
          <EstadoErro compacto mensagem={erro} onTentarNovamente={onTentarNovamente} />
        </Cartao>
      ) : !proxima ? (
        <Cartao>
          <EstadoVazio
            icone={IconeFichaTecnica}
            titulo="Nenhum treino agendado"
            descricao="Quando suas turmas tiverem sessões marcadas, o próximo treino aparece aqui."
            acaoTitulo="Ver turmas disponíveis"
            onAcao={onTurmasDisponiveis}
          />
        </Cartao>
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
          <Cartao destaque>
            <AnelProgresso nivel={progresso.nivel} xpAtual={progresso.xpAtual} xpProximoNivel={progresso.xpProximoNivel} tamanho={96} />
          </Cartao>
          <View style={styles.espaco} />
          <IndicadorSequencia treinos={sequencia} />
        </>
      ) : null}

      {!carregando && !erro && demais.length > 0 ? (
        <>
          <CabecalhoSecao titulo="Próximos treinos" acaoTitulo="Ver agenda" onAcao={onVerAgenda} />
          <GrupoLista semMargem>
            {demais.map((s) => (
              <CartaoSessao
                key={s.id}
                nomeTurma={s.nomeTurma}
                detalhe={s.professor ? `com ${s.professor}` : undefined}
                inicio={s.inicio}
                estado={s.estado}
                motivo={s.motivo}
                carregando={enviandoId === s.id}
                onCheckIn={() => onCheckIn(s.id)}
              />
            ))}
          </GrupoLista>
        </>
      ) : null}

      <GrupoLista titulo="Atalhos">
        <ItemMenu rotulo="Turmas disponíveis" descricao="Matricule-se em novas turmas" icone={IconeTatame} onPress={onTurmasDisponiveis} />
        <ItemMenu rotulo="Histórico" descricao="Seus check-ins validados e pendentes" icone={IconeFichaTecnica} onPress={onHistorico} />
      </GrupoLista>
    </View>
  );
}

const useEstilos = criarEstilos(() => ({
  saudacaoFundo: { marginBottom: Espacamento.padrao },
  saudacao: { flexDirection: 'row', alignItems: 'center', gap: Espacamento.medio },
  saudacaoTextos: { flex: 1, gap: 2 },
  espaco: { height: Espacamento.medio },
}));
