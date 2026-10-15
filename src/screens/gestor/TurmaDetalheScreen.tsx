// RF10, RF11, RF12: detalhe da turma — alunos matriculados, sessões e criação de sessão
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Cores, Espacamento } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { buscarTurma } from '../../services/turmas';
import { listarMatriculasPorTurma } from '../../services/matriculas';
import { listarSessoesPorTurma, criarSessao } from '../../services/sessoes';
import { buscarUsuario } from '../../services/usuarios';
import { Matricula, Sessao, Turma } from '../../types';
import { combinarDataHora, gerarDatasRecorrentes, paraData, parseDataBr, semanaContendo } from '../../utils/datas';
import { formatarDiaHora, formatarHora, rotuloDia, rotuloNivel, ROTULO_STATUS_SESSAO } from '../../utils/apresentacao';
import { mensagemErro } from '../../utils/mensagensErro';
import { GestorStackParamList } from '../../navigation/types';
import { DIAS_SEMANA } from '../../constants/diasSemana';
import CampoTexto from '../../components/ui/CampoTexto';
import Etiqueta from '../../components/ui/Etiqueta';
import Botao from '../../components/ui/Botao';
import Tela from '../../components/ui/Tela';
import Texto from '../../components/ui/Texto';
import Folha from '../../components/ui/Folha';
import Aviso from '../../components/ui/Aviso';
import Avatar from '../../components/ui/Avatar';
import ItemMenu from '../../components/ui/ItemMenu';
import MensagemErro from '../../components/ui/MensagemErro';
import CabecalhoSecao from '../../components/ui/CabecalhoSecao';
import LinhaFina from '../../components/LinhaFina';
import { IconeChevron, IconeFichaTecnica, IconeMais, IconeTatame } from '../../components/icones';
import Esqueleto from '../../components/ui/Esqueleto';
import EstadoVazio from '../../components/ui/EstadoVazio';
import EstadoErro from '../../components/ui/EstadoErro';

type TurmaDetalheRoute = RouteProp<GestorStackParamList, 'TurmaDetalhe'>;

interface MatriculaComNome {
  matricula: Matricula;
  nomeAluno: string;
}

export default function TurmaDetalheScreen() {
  const { usuario } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<GestorStackParamList, 'TurmaDetalhe'>>();
  const route = useRoute<TurmaDetalheRoute>();
  const { turmaId } = route.params;

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [turma, setTurma] = useState<Turma | null>(null);
  const [matriculas, setMatriculas] = useState<MatriculaComNome[]>([]);
  const [sessoes, setSessoes] = useState<Sessao[]>([]);
  const [nomeProfessor, setNomeProfessor] = useState<string | null>(null);

  const [data, setData] = useState('');
  const [diasSemana, setDiasSemana] = useState<number[]>([]);
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFim, setHoraFim] = useState('');
  const [descricao, setDescricao] = useState('');
  const [criando, setCriando] = useState(false);
  const [erroForm, setErroForm] = useState<string | null>(null);
  const [folhaAberta, setFolhaAberta] = useState(false);
  const [sucesso, setSucesso] = useState<string | null>(null);

  function alternarDiaSemana(valor: number) {
    setDiasSemana((atual) => (atual.includes(valor) ? atual.filter((d) => d !== valor) : [...atual, valor]));
  }

  const carregarTudo = useCallback(async () => {
    if (!usuario) return;
    setCarregando(true);
    setErro(null);
    try {
      const [turmaEncontrada, listaMatriculas, listaSessoes] = await Promise.all([
        buscarTurma(turmaId),
        listarMatriculasPorTurma(turmaId, usuario.id),
        listarSessoesPorTurma(turmaId, usuario.id),
      ]);
      setTurma(turmaEncontrada);
      setSessoes(listaSessoes.sort((a, b) => b.inicio.toMillis() - a.inicio.toMillis()));
      setNomeProfessor(
        turmaEncontrada?.professorId ? (await buscarUsuario(turmaEncontrada.professorId))?.nome ?? 'Professor' : null,
      );

      const comNome = await Promise.all(
        listaMatriculas
          .filter((m) => m.status === 'ativa')
          .map(async (matricula) => {
            const aluno = await buscarUsuario(matricula.alunoId);
            return { matricula, nomeAluno: aluno?.nome ?? 'Aluno' };
          }),
      );
      setMatriculas(comNome);
    } catch (e) {
      setErro(mensagemErro(e, 'Não foi possível carregar a turma agora.'));
    } finally {
      setCarregando(false);
    }
  }, [usuario, turmaId]);

  useEffect(() => {
    carregarTudo();
  }, [carregarTudo]);

  // RF12: gera uma sessão por dia da semana selecionado, dentro da semana (segunda a domingo)
  // que contém a data informada — "grade semanal" da RF12, não apenas uma sessão avulsa, sem
  // exigir uma data final separada.
  async function handleCriarSessao() {
    if (!usuario || criando) return;
    setErroForm(null);

    const referencia = parseDataBr(data);
    if (!referencia) {
      setErroForm('Preencha a data no formato DD/MM/AAAA.');
      return;
    }
    if (diasSemana.length === 0) {
      setErroForm('Selecione ao menos um dia da semana.');
      return;
    }

    // toda semana (segunda a domingo) contém exatamente um dia para cada valor de getDay(),
    // então `datas` sempre tem uma entrada por dia selecionado — no máximo 7.
    const { inicio, fim } = semanaContendo(referencia);
    const datas = gerarDatasRecorrentes(inicio, fim, diasSemana);

    const inicios = datas.map((dia) => combinarDataHora(dia, horaInicio));
    const fins = datas.map((dia) => combinarDataHora(dia, horaFim));
    if (inicios.some((d) => !d) || fins.some((d) => !d)) {
      setErroForm('Preencha os horários de início e fim no formato HH:MM.');
      return;
    }
    if (inicios.some((ini, i) => fins[i]!.getTime() <= ini!.getTime())) {
      setErroForm('O horário de término deve ser depois do horário de início.');
      return;
    }

    setCriando(true);
    try {
      for (let i = 0; i < datas.length; i++) {
        await criarSessao({
          turmaId,
          inicio: inicios[i]!,
          fim: fins[i]!,
          descricao: descricao.trim() || undefined,
          autorId: usuario.id,
        });
      }
      setData('');
      setDiasSemana([]);
      setHoraInicio('');
      setHoraFim('');
      setDescricao('');
      setFolhaAberta(false);
      setSucesso(datas.length > 1 ? `${datas.length} sessões criadas.` : 'Sessão criada.');
      await carregarTudo();
    } catch (e) {
      setErroForm(mensagemErro(e, 'Não foi possível criar a sessão. Tente novamente.'));
    } finally {
      setCriando(false);
    }
  }

  if (carregando) {
    return (
      <Tela largura="lista">
        <Esqueleto altura={96} />
        <Esqueleto forma="linha" repeticoes={3} />
      </Tela>
    );
  }

  if (erro) {
    return <EstadoErro mensagem={erro} onTentarNovamente={carregarTudo} />;
  }

  if (!turma) {
    return (
      <Tela largura="lista" centralizarVertical>
        <EstadoVazio icone={IconeTatame} titulo="Turma não encontrada" descricao="Ela pode ter sido removida ou você não tem mais acesso a ela." />
      </Tela>
    );
  }

  const grade =
    turma.diasSemana && turma.diasSemana.length > 0
      ? `${DIAS_SEMANA.filter((item) => turma.diasSemana!.includes(item.valor))
          .map((item) => item.rotulo)
          .join(', ')}${turma.horarioInicio && turma.horarioFim ? `, ${turma.horarioInicio} às ${turma.horarioFim}` : ''}`
      : null;

  return (
    <Tela
      largura="lista"
      sobreposicao={<Aviso visivel={sucesso !== null} tipo="sucesso" mensagem={sucesso ?? ''} onFechar={() => setSucesso(null)} acimaDaTabBar />}
    >
      <Texto variante="display">{turma.nome}</Texto>
      <View style={styles.meta}>
        <Etiqueta texto={turma.modalidade} />
        <Etiqueta texto={rotuloNivel(turma.nivel)} />
        <Texto variante="rotuloPlacar" cor={turma.ativa ? 'sucesso' : 'texto3'}>
          {turma.ativa ? 'Ativa' : 'Inativa'}
        </Texto>
      </View>
      {nomeProfessor ? <Texto variante="legenda">{`Professor: ${nomeProfessor}`}</Texto> : null}
      {grade ? <Texto variante="legenda">{`Grade: ${grade}`}</Texto> : null}

      <View style={styles.acoes}>
        <Botao titulo="Nova sessão" icone={IconeMais} onPress={() => setFolhaAberta(true)} />
      </View>
      <ItemMenu
        rotulo="Relatório de frequência"
        descricao="Presenças por aluno num período"
        icone={IconeFichaTecnica}
        onPress={() => navigation.navigate('RelatorioFrequencia', { turmaId })}
      />

      <CabecalhoSecao titulo="Sessões" contador={sessoes.length} />
      {sessoes.length === 0 ? (
        <Texto variante="legenda">Nenhuma sessão criada ainda.</Texto>
      ) : (
        sessoes.map((sessao, i) => {
          const inicio = paraData(sessao.inicio);
          return (
            <View key={sessao.id}>
              {i > 0 ? <LinhaFina /> : null}
              <Pressable
                onPress={() => navigation.navigate('SessaoDetalhe', { sessaoId: sessao.id })}
                accessibilityRole="button"
                accessibilityLabel={`Sessão de ${formatarDiaHora(inicio)}, ${ROTULO_STATUS_SESSAO[sessao.status]}`}
                style={({ pressed }) => [styles.linha, pressed && styles.pressionada]}
              >
                <View style={styles.horario}>
                  <Texto variante="placar">{formatarHora(inicio)}</Texto>
                  <Texto variante="rotuloPlacar" cor="texto3" numberOfLines={1}>
                    {rotuloDia(inicio)}
                  </Texto>
                </View>
                <View style={styles.textos}>
                  <Texto variante="rotuloPlacar" cor={sessao.status === 'aberta' ? 'sucesso' : sessao.status === 'cancelada' ? 'texto3' : 'texto2'}>
                    {ROTULO_STATUS_SESSAO[sessao.status]}
                  </Texto>
                  {sessao.descricao ? <Texto variante="legenda">{sessao.descricao}</Texto> : null}
                </View>
                <IconeChevron tamanho={20} cor={Cores.texto3} />
              </Pressable>
            </View>
          );
        })
      )}

      <CabecalhoSecao titulo="Alunos matriculados" contador={matriculas.length} />
      {matriculas.length === 0 ? (
        <Texto variante="legenda">Nenhum aluno matriculado ainda.</Texto>
      ) : (
        matriculas.map(({ matricula, nomeAluno }, i) => (
          <View key={matricula.id}>
            {i > 0 ? <LinhaFina /> : null}
            <View style={styles.linhaAluno}>
              <Avatar nome={nomeAluno} tamanho={32} />
              <Texto variante="corpo">{nomeAluno}</Texto>
            </View>
          </View>
        ))
      )}

      <Folha visivel={folhaAberta} onFechar={() => setFolhaAberta(false)} titulo="Nova sessão">
        <MensagemErro mensagem={erroForm} />
        <CampoTexto
          rotulo="Semana de referência"
          mascara="data"
          valor={data}
          onAlterar={setData}
          ajuda="Qualquer data da semana desejada. Uma sessão é criada em cada dia marcado abaixo, nessa semana."
        />
        <Texto variante="legenda" style={styles.rotuloCampo}>
          Dias da semana
        </Texto>
        <View style={styles.linhaChips}>
          {DIAS_SEMANA.map(({ valor, rotulo }) => (
            <Etiqueta key={valor} texto={rotulo} modo="multiplo" selecionada={diasSemana.includes(valor)} onPress={() => alternarDiaSemana(valor)} />
          ))}
        </View>
        <View style={styles.linhaHorarios}>
          <View style={styles.campoHorario}>
            <CampoTexto rotulo="Início" mascara="hora" valor={horaInicio} onAlterar={setHoraInicio} />
          </View>
          <View style={styles.campoHorario}>
            <CampoTexto rotulo="Fim" mascara="hora" valor={horaFim} onAlterar={setHoraFim} />
          </View>
        </View>
        <CampoTexto rotulo="Descrição (opcional)" placeholder="Ex.: Foco em defesa pessoal" valor={descricao} onAlterar={setDescricao} />
        <Botao titulo={diasSemana.length > 1 ? `Criar ${diasSemana.length} sessões` : 'Criar sessão'} onPress={handleCriarSessao} carregando={criando} />
      </Folha>
    </Tela>
  );
}

const styles = StyleSheet.create({
  meta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Espacamento.minimo + 2, marginTop: Espacamento.pequeno, marginBottom: Espacamento.pequeno },
  acoes: { marginTop: Espacamento.grande, marginBottom: Espacamento.pequeno },
  linha: { flexDirection: 'row', alignItems: 'center', gap: Espacamento.medio, minHeight: 64, paddingVertical: Espacamento.medio },
  pressionada: { backgroundColor: Cores.superficie1 },
  horario: { width: 76 },
  textos: { flex: 1, gap: 2 },
  linhaAluno: { flexDirection: 'row', alignItems: 'center', gap: Espacamento.medio, minHeight: 52 },
  rotuloCampo: { marginBottom: Espacamento.pequeno },
  linhaChips: { flexDirection: 'row', flexWrap: 'wrap', gap: Espacamento.pequeno, marginBottom: Espacamento.padrao },
  linhaHorarios: { flexDirection: 'row', gap: Espacamento.padrao },
  campoHorario: { flex: 1 },
});
