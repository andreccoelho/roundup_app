// RF15: histórico de check-ins do aluno, em ordem decrescente de data.
// Não reaproveita CartaoSessao: aquele componente é orientado à ação (BotaoCheckIn, estado
// EstadoCheckIn 'disponivel'/'foraDaJanela'/'realizado'); aqui os registros já são passado,
// somente leitura, com o enum diferente StatusCheckIn 'pendente'/'validado'/'rejeitado' — forçar
// o componente errado esconderia esse status atrás de um rótulo que não é o dele.
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Cores, Espacamento, type NomeCor } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { listarHistoricoDoAluno } from '../../services/checkins';
import { buscarTurma } from '../../services/turmas';
import { CheckIn, StatusCheckIn } from '../../types';
import { paraData } from '../../utils/datas';
import { formatarDiaHora, ROTULO_STATUS_CHECKIN } from '../../utils/apresentacao';
import { mensagemErro } from '../../utils/mensagensErro';
import Tela from '../../components/ui/Tela';
import Texto from '../../components/ui/Texto';
import Estatistica from '../../components/ui/Estatistica';
import CabecalhoSecao from '../../components/ui/CabecalhoSecao';
import LinhaFina from '../../components/LinhaFina';
import { IconeCheck, IconeFichaTecnica, IconeRelogio, IconeAlerta } from '../../components/icones';
import Esqueleto from '../../components/ui/Esqueleto';
import EstadoVazio from '../../components/ui/EstadoVazio';
import EstadoErro from '../../components/ui/EstadoErro';

interface ItemHistorico {
  checkIn: CheckIn;
  nomeTurma: string;
}

const COR_STATUS: Record<StatusCheckIn, NomeCor> = {
  pendente: 'texto2',
  validado: 'sucesso',
  rejeitado: 'perigo',
};

// Status com ícone + texto, nunca só cor.
const ICONE_STATUS = { pendente: IconeRelogio, validado: IconeCheck, rejeitado: IconeAlerta };

export default function HistoricoScreen() {
  const { usuario } = useAuth();

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [itens, setItens] = useState<ItemHistorico[]>([]);

  const carregar = useCallback(async () => {
    if (!usuario) return;
    setCarregando(true);
    setErro(null);
    try {
      const checkIns = await listarHistoricoDoAluno(usuario.id);
      const comNomeTurma = await Promise.all(
        checkIns.map(async (checkIn) => {
          const turma = await buscarTurma(checkIn.turmaId);
          return { checkIn, nomeTurma: turma?.nome ?? 'Turma' };
        }),
      );
      setItens(comNomeTurma);
    } catch (e) {
      setErro(mensagemErro(e, 'Não foi possível carregar seu histórico agora.'));
    } finally {
      setCarregando(false);
    }
  }, [usuario]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  if (carregando) {
    return (
      <Tela largura="lista">
        <Esqueleto forma="linha" repeticoes={6} />
      </Tela>
    );
  }

  if (erro) {
    return <EstadoErro mensagem={erro} onTentarNovamente={carregar} />;
  }

  if (itens.length === 0) {
    return (
      <Tela largura="lista" centralizarVertical>
        <EstadoVazio icone={IconeFichaTecnica} titulo="Nenhum check-in registrado ainda" descricao="Seus check-ins validados e pendentes aparecem aqui." />
      </Tela>
    );
  }

  const validados = itens.filter((i) => i.checkIn.status === 'validado').length;

  return (
    <Tela largura="lista">
      <View style={styles.resumo}>
        <Estatistica valor={itens.length} rotulo="Check-ins" />
        <Estatistica valor={validados} rotulo="Validados" />
      </View>
      <CabecalhoSecao titulo="Registros" />
      {itens.map(({ checkIn, nomeTurma }, i) => {
        const Icone = ICONE_STATUS[checkIn.status];
        return (
          <View key={checkIn.id}>
            {i > 0 ? <LinhaFina /> : null}
            <View
              style={styles.linha}
              accessible
              accessibilityLabel={`${nomeTurma}, ${formatarDiaHora(paraData(checkIn.dataHora))}, ${ROTULO_STATUS_CHECKIN[checkIn.status]}`}
            >
              <View style={styles.textos}>
                <Texto variante="corpoForte">{nomeTurma}</Texto>
                <Texto variante="legenda">{formatarDiaHora(paraData(checkIn.dataHora))}</Texto>
              </View>
              <View style={styles.status}>
                <Icone tamanho={16} cor={Cores[COR_STATUS[checkIn.status]]} />
                <Texto variante="rotuloPlacar" cor={COR_STATUS[checkIn.status]}>
                  {ROTULO_STATUS_CHECKIN[checkIn.status]}
                </Texto>
              </View>
            </View>
          </View>
        );
      })}
    </Tela>
  );
}

const styles = StyleSheet.create({
  resumo: { flexDirection: 'row', gap: Espacamento.grande },
  linha: { flexDirection: 'row', alignItems: 'center', gap: Espacamento.medio, minHeight: 64, paddingVertical: Espacamento.medio },
  textos: { flex: 1, gap: 2 },
  status: { flexDirection: 'row', alignItems: 'center', gap: Espacamento.minimo, maxWidth: 160 },
});
