// RF10, RF11, RF12: detalhe da turma — alunos matriculados, sessões, criação de sessão e, para o
// responsável pela turma, mudar o horário e excluir (soft delete, ver services/turmasGestao.ts)
import { useCallback, useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { criarEstilos, Espacamento, useTema } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { buscarTurma } from '../../services/turmas';
import { listarMatriculasPorTurma } from '../../services/matriculas';
import { listarSessoesPorTurma, criarSessao } from '../../services/sessoes';
import { alterarHorarioTurma, excluirTurma, reativarTurma } from '../../services/turmasGestao';
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
import Dialogo from '../../components/ui/Dialogo';
import Aviso from '../../components/ui/Aviso';
import Avatar from '../../components/ui/Avatar';
import ItemMenu from '../../components/ui/ItemMenu';
import MensagemErro from '../../components/ui/MensagemErro';
import GrupoLista from '../../components/ui/GrupoLista';
import LinhaLista from '../../components/ui/LinhaLista';
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
  const styles = useEstilos();
  const { cores } = useTema();
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

  // Mudar horário / excluir: só o responsável pela turma (firestore.rules: turmas.update)
  const [folhaHorarioAberta, setFolhaHorarioAberta] = useState(false);
  const [novoInicio, setNovoInicio] = useState('');
  const [novoFim, setNovoFim] = useState('');
  const [salvandoHorario, setSalvandoHorario] = useState(false);
  const [erroHorario, setErroHorario] = useState<string | null>(null);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [processandoTurma, setProcessandoTurma] = useState(false);

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

  function abrirAlterarHorario() {
    setNovoInicio(turma?.horarioInicio ?? '');
    setNovoFim(turma?.horarioFim ?? '');
    setErroHorario(null);
    setFolhaHorarioAberta(true);
  }

  async function handleAlterarHorario() {
    if (!turma || salvandoHorario) return;
    setErroHorario(null);
    setSalvandoHorario(true);
    try {
      const ajustadas = await alterarHorarioTurma(turma, novoInicio.trim(), novoFim.trim());
      setFolhaHorarioAberta(false);
      setSucesso(
        ajustadas > 0
          ? `Horário atualizado em ${ajustadas} ${ajustadas === 1 ? 'sessão futura' : 'sessões futuras'}.`
          : 'Horário da turma atualizado.',
      );
      await carregarTudo();
    } catch (e) {
      setErroHorario(mensagemErro(e, 'Não foi possível alterar o horário. Tente novamente.'));
    } finally {
      setSalvandoHorario(false);
    }
  }

  async function handleExcluir() {
    if (!turma || processandoTurma) return;
    setProcessandoTurma(true);
    try {
      await excluirTurma(turma);
      setConfirmandoExclusao(false);
      navigation.goBack();
    } catch (e) {
      setConfirmandoExclusao(false);
      setErro(mensagemErro(e, 'Não foi possível excluir a turma. Tente novamente.'));
    } finally {
      setProcessandoTurma(false);
    }
  }

  async function handleReativar() {
    if (!turma || processandoTurma) return;
    setProcessandoTurma(true);
    try {
      await reativarTurma(turma);
      setSucesso('Turma reativada.');
      await carregarTudo();
    } catch (e) {
      setErro(mensagemErro(e, 'Não foi possível reativar a turma. Tente novamente.'));
    } finally {
      setProcessandoTurma(false);
    }
  }

  if (carregando) {
    return (
      <Tela largura="lista" agrupada>
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
      <Tela largura="lista" agrupada centralizarVertical>
        <EstadoVazio icone={IconeTatame} titulo="Turma não encontrada" descricao="Ela pode ter sido removida ou você não tem mais acesso a ela." />
      </Tela>
    );
  }

  const ehResponsavel = usuario?.id === turma.responsavelId;

  const grade =
    turma.diasSemana && turma.diasSemana.length > 0
      ? `${DIAS_SEMANA.filter((item) => turma.diasSemana!.includes(item.valor))
          .map((item) => item.rotulo)
          .join(', ')}${turma.horarioInicio && turma.horarioFim ? `, ${turma.horarioInicio} às ${turma.horarioFim}` : ''}`
      : null;

  return (
    <Tela
      largura="lista"
      agrupada
      sobreposicao={<Aviso visivel={sucesso !== null} tipo="sucesso" mensagem={sucesso ?? ''} onFechar={() => setSucesso(null)} acimaDaTabBar />}
    >
      <Texto variante="title1">{turma.nome}</Texto>
      <View style={styles.meta}>
        <Etiqueta texto={turma.modalidade} />
        <Etiqueta texto={rotuloNivel(turma.nivel)} />
        <Texto variante="subheadline" cor={turma.ativa ? 'sucesso' : 'texto2'}>
          {turma.ativa ? 'Ativa' : 'Inativa'}
        </Texto>
      </View>

      {nomeProfessor || grade ? (
        <GrupoLista titulo="Detalhes" semMargem>
          {nomeProfessor ? <LinhaLista rotulo="Professor" valor={nomeProfessor} /> : null}
          {grade ? <LinhaLista rotulo="Grade" descricao={grade} /> : null}
        </GrupoLista>
      ) : null}

      <View style={styles.acoes}>
        <Botao titulo="Nova sessão" icone={IconeMais} variante="secundario" onPress={() => setFolhaAberta(true)} />
      </View>
      {ehResponsavel ? (
        <View style={styles.acoesTurma}>
          <Botao titulo="Alterar horário" variante="texto" onPress={abrirAlterarHorario} />
          {turma.ativa ? (
            <Botao titulo="Excluir turma" variante="texto" onPress={() => setConfirmandoExclusao(true)} />
          ) : (
            <Botao titulo="Reativar turma" variante="texto" onPress={handleReativar} desabilitado={processandoTurma} />
          )}
        </View>
      ) : null}
      <GrupoLista semMargem>
        <ItemMenu
          rotulo="Relatório de frequência"
          descricao="Presenças por aluno num período"
          icone={IconeFichaTecnica}
          onPress={() => navigation.navigate('RelatorioFrequencia', { turmaId })}
        />
      </GrupoLista>

      <GrupoLista titulo={`Sessões: ${sessoes.length}`}>
        {sessoes.length === 0 ? (
          <LinhaLista rotulo="Nenhuma sessão criada ainda" />
        ) : (
          sessoes.map((sessao) => {
            const inicio = paraData(sessao.inicio);
            return (
              <Pressable
                key={sessao.id}
                onPress={() => navigation.navigate('SessaoDetalhe', { sessaoId: sessao.id })}
                accessibilityRole="button"
                accessibilityLabel={`Sessão de ${formatarDiaHora(inicio)}, ${ROTULO_STATUS_SESSAO[sessao.status]}`}
                style={({ pressed }) => [styles.linha, pressed && styles.pressionada]}
              >
                <View style={styles.horario}>
                  <Texto variante="headline" style={styles.tabular}>
                    {formatarHora(inicio)}
                  </Texto>
                  <Texto variante="footnote" numberOfLines={1}>
                    {rotuloDia(inicio)}
                  </Texto>
                </View>
                <View style={styles.textos}>
                  <Texto variante="subheadline" cor={sessao.status === 'aberta' ? 'sucesso' : 'texto2'}>
                    {ROTULO_STATUS_SESSAO[sessao.status]}
                  </Texto>
                  {sessao.descricao ? <Texto variante="footnote">{sessao.descricao}</Texto> : null}
                </View>
                <IconeChevron tamanho={18} cor={cores.texto3} />
              </Pressable>
            );
          })
        )}
      </GrupoLista>

      <GrupoLista titulo={`Alunos matriculados: ${matriculas.length}`}>
        {matriculas.length === 0 ? (
          <LinhaLista rotulo="Nenhum aluno matriculado ainda" />
        ) : (
          matriculas.map(({ matricula, nomeAluno }) => (
            <View key={matricula.id} style={styles.linhaAluno}>
              <Avatar nome={nomeAluno} tamanho={32} />
              <Texto variante="body">{nomeAluno}</Texto>
            </View>
          ))
        )}
      </GrupoLista>

      <Folha
        visivel={folhaHorarioAberta}
        onFechar={() => setFolhaHorarioAberta(false)}
        titulo="Alterar horário"
        acao={{ titulo: 'Salvar', onPress: handleAlterarHorario, carregando: salvandoHorario }}
      >
        <MensagemErro mensagem={erroHorario} />
        <View style={styles.linhaHorarios}>
          <View style={styles.campoHorario}>
            <CampoTexto rotulo="Início" mascara="hora" valor={novoInicio} onAlterar={setNovoInicio} />
          </View>
          <View style={styles.campoHorario}>
            <CampoTexto rotulo="Fim" mascara="hora" valor={novoFim} onAlterar={setNovoFim} />
          </View>
        </View>
        <Texto variante="subheadline" cor="texto3">
          O novo horário vale para a turma e para as sessões futuras ainda agendadas. Sessões que já aconteceram não mudam.
        </Texto>
      </Folha>

      <Dialogo
        visivel={confirmandoExclusao}
        titulo="Excluir turma"
        mensagem={`Excluir "${turma.nome}"? A turma deixa de aparecer para os alunos e as sessões futuras agendadas serão canceladas. O histórico de presenças e pontos é mantido, e você pode reativar a turma depois.`}
        tituloConfirmar="Excluir"
        destrutivo
        onConfirmar={handleExcluir}
        carregando={processandoTurma}
        tituloCancelar="Cancelar"
        onCancelar={() => setConfirmandoExclusao(false)}
      />

      <Folha
        visivel={folhaAberta}
        onFechar={() => setFolhaAberta(false)}
        titulo="Nova sessão"
        acao={{ titulo: diasSemana.length > 1 ? `Criar ${diasSemana.length}` : 'Criar', onPress: handleCriarSessao, carregando: criando }}
      >
        <MensagemErro mensagem={erroForm} />
        <CampoTexto
          rotulo="Semana de referência"
          mascara="data"
          valor={data}
          onAlterar={setData}
          ajuda="Qualquer data da semana desejada. Uma sessão é criada em cada dia marcado abaixo, nessa semana."
        />
        <Texto variante="subheadline" style={styles.rotuloCampo}>
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
      </Folha>
    </Tela>
  );
}

const useEstilos = criarEstilos((c) => ({
  meta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Espacamento.minimo + 2, marginTop: Espacamento.pequeno, marginBottom: Espacamento.pequeno },
  acoes: { marginTop: Espacamento.grande, marginBottom: Espacamento.medio },
  acoesTurma: { flexDirection: 'row', justifyContent: 'center', gap: Espacamento.grande, marginBottom: Espacamento.medio },
  linha: { flexDirection: 'row', alignItems: 'center', gap: Espacamento.medio, minHeight: 60, paddingVertical: Espacamento.pequeno + 2, paddingHorizontal: Espacamento.padrao },
  pressionada: { backgroundColor: c.preenchimento },
  horario: { width: 64 },
  tabular: { fontVariant: ['tabular-nums'] },
  textos: { flex: 1, gap: 2 },
  linhaAluno: { flexDirection: 'row', alignItems: 'center', gap: Espacamento.medio, minHeight: 52, paddingHorizontal: Espacamento.padrao },
  rotuloCampo: { marginBottom: Espacamento.pequeno },
  linhaChips: { flexDirection: 'row', flexWrap: 'wrap', gap: Espacamento.pequeno, marginBottom: Espacamento.padrao },
  linhaHorarios: { flexDirection: 'row', gap: Espacamento.padrao },
  campoHorario: { flex: 1 },
}));
