// RF23: criação e gestão de missões personalizadas pelo responsável (professor autônomo ou
// academia): título, critério (descrição + tipo + meta), recompensa em pontos, público-alvo (todos
// os alunos vinculados, uma turma ou alunos escolhidos) e período de vigência (datas de início e
// fim). Quem vê a missão e quando é decidido no servidor (Cloud Function + firestore.rules), não aqui.
// RF18: missões presença/pontuação/sequência têm progresso automático (Cloud Function); só as
// personalizadas ganham o botão "Marcar conclusões", que abre a lista de alunos vinculados.
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Espacamento } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import {
  criarMissao, listarMissoesPorResponsavel, atualizarMissao, listarProgressoDaMissao, marcarConclusaoPersonalizada,
} from '../../services/missoes';
import { listarVinculosAceitosDaAcademia } from '../../services/vinculos';
import { listarTurmasPorResponsavel } from '../../services/turmas';
import { listarMatriculasPorTurma } from '../../services/matriculas';
import { Timestamp } from 'firebase/firestore';
import { ROTULOS_PUBLICO, situacaoDaMissao, textoDataBr, textoVigencia, vigenciaDeDatas } from '../../utils/missoes';
import { buscarUsuario } from '../../services/usuarios';
import { buscarConfiguracao, valoresEfetivos } from '../../services/configuracoesGamificacao';
import { LIMITES_CONFIGURACAO } from '../../config/gamificacao';
import { Missao, PublicoAlvo, SituacaoMissao, TipoMissao, Turma } from '../../types';
import Botao from '../../components/ui/Botao';
import Etiqueta from '../../components/ui/Etiqueta';
import Folha from '../../components/ui/Folha';
import GrupoLista from '../../components/ui/GrupoLista';
import LinhaLista from '../../components/ui/LinhaLista';
import Esqueleto from '../../components/ui/Esqueleto';
import EstadoVazio from '../../components/ui/EstadoVazio';
import EstadoErro from '../../components/ui/EstadoErro';
import Tela from '../../components/ui/Tela';
import Texto from '../../components/ui/Texto';
import Toggle from '../../components/ui/Toggle';
import CampoTexto from '../../components/ui/CampoTexto';
import MensagemErro from '../../components/ui/MensagemErro';
import { IconeBandeira, IconeCheckCirculo, IconeMais } from '../../components/icones';
import { mensagemErro } from '../../utils/mensagensErro';

interface AlunoConclusao {
  alunoId: string;
  nome: string;
  concluida: boolean;
}

interface AlunoVinculado {
  id: string;
  nome: string;
}

const PUBLICOS: PublicoAlvo[] = ['todos', 'turma', 'alunos'];

const ROTULO_SITUACAO: Record<SituacaoMissao, string> = {
  agendada: 'começa em breve',
  vigente: 'vigente',
  encerrada: 'encerrada',
  inativa: 'desligada',
};

function hojeMaisDias(dias: number): string {
  const d = new Date();
  return textoDataBr(new Date(d.getFullYear(), d.getMonth(), d.getDate() + dias));
}

const TIPOS: { valor: TipoMissao; rotulo: string }[] = [
  { valor: 'presenca', rotulo: 'Presença' },
  { valor: 'pontuacao', rotulo: 'Pontuação' },
  { valor: 'sequencia', rotulo: 'Sequência' },
  { valor: 'personalizada', rotulo: 'Personalizada' },
];

export default function MissoesGestorScreen() {
  const { usuario } = useAuth();
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [missoes, setMissoes] = useState<Missao[]>([]);
  const [processandoId, setProcessandoId] = useState<string | null>(null);

  const [folhaAberta, setFolhaAberta] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [tipo, setTipo] = useState<TipoMissao>('presenca');
  const [meta, setMeta] = useState('');
  const [pontos, setPontos] = useState('');
  // RF23: público-alvo e vigência (padrão: todos os alunos, de hoje até 30 dias)
  const [publico, setPublico] = useState<PublicoAlvo>('todos');
  const [turmaId, setTurmaId] = useState('');
  const [alunosAlvo, setAlunosAlvo] = useState<string[]>([]);
  const [inicio, setInicio] = useState(hojeMaisDias(0));
  const [fim, setFim] = useState(hojeMaisDias(29));
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [alunosVinculados, setAlunosVinculados] = useState<AlunoVinculado[]>([]);
  const [erroForm, setErroForm] = useState<string | null>(null);
  const [criando, setCriando] = useState(false);
  // RF33: valor sugerido de pontos ao criar uma missão (configuração do responsável ou padrão)
  const [pontosSugeridos, setPontosSugeridos] = useState('');

  const [missaoConclusoes, setMissaoConclusoes] = useState<Missao | null>(null);
  const [alunosConclusao, setAlunosConclusao] = useState<AlunoConclusao[]>([]);
  const [carregandoConclusoes, setCarregandoConclusoes] = useState(false);
  const [erroConclusoes, setErroConclusoes] = useState<string | null>(null);
  const [salvandoAlunoId, setSalvandoAlunoId] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!usuario) return;
    setCarregando(true);
    setErro(null);
    try {
      const [lista, config, listaTurmas, vinculos] = await Promise.all([
        listarMissoesPorResponsavel(usuario.id),
        buscarConfiguracao(usuario.id),
        listarTurmasPorResponsavel(usuario.id),
        listarVinculosAceitosDaAcademia(usuario.id, 'aluno'),
      ]);
      setMissoes(lista);
      setTurmas(listaTurmas.filter((t) => t.ativa));
      const alunos = await Promise.all(
        vinculos.map(async (v) => ({ id: v.solicitanteId, nome: (await buscarUsuario(v.solicitanteId))?.nome ?? 'Aluno' })),
      );
      setAlunosVinculados(alunos.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')));
      setPontosSugeridos(String(valoresEfetivos(config).pontosPorMissao));
    } catch (e: any) {
      setErro(mensagemErro(e));
    } finally {
      setCarregando(false);
    }
  }, [usuario]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function limparFormulario() {
    setTitulo('');
    setDescricao('');
    setTipo('presenca');
    setMeta('');
    setPontos(pontosSugeridos);
    setPublico('todos');
    setTurmaId('');
    setAlunosAlvo([]);
    setInicio(hojeMaisDias(0));
    setFim(hojeMaisDias(29));
    setErroForm(null);
  }

  async function handleCriar() {
    if (!usuario) return;
    const metaNumero = Number(meta);
    const pontosNumero = Number(pontos);
    if (!titulo.trim() || !descricao.trim()) {
      setErroForm('Preencha título e descrição.');
      return;
    }
    if (!meta.trim() || Number.isNaN(metaNumero) || metaNumero <= 0) {
      setErroForm('Meta precisa ser um número maior que zero.');
      return;
    }
    const { minimo, maximo } = LIMITES_CONFIGURACAO.pontosPorMissao;
    if (!pontos.trim() || !Number.isInteger(pontosNumero) || pontosNumero < minimo || pontosNumero > maximo) {
      setErroForm(`Pontos precisa ser um número inteiro de ${minimo} a ${maximo}.`);
      return;
    }

    const vigencia = vigenciaDeDatas(inicio, fim);
    if (typeof vigencia === 'string') {
      setErroForm(vigencia);
      return;
    }
    if (publico === 'turma' && !turmaId) {
      setErroForm('Escolha a turma da missão.');
      return;
    }
    if (publico === 'alunos' && alunosAlvo.length === 0) {
      setErroForm('Escolha pelo menos um aluno.');
      return;
    }

    setCriando(true);
    setErroForm(null);
    try {
      await criarMissao({
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        tipo,
        meta: metaNumero,
        pontos: pontosNumero,
        responsavelId: usuario.id,
        ativa: true,
        publicoAlvo: publico,
        ...(publico === 'turma' ? { turmaId } : {}),
        ...(publico === 'alunos' ? { alunosAlvoIds: alunosAlvo } : {}),
        vigenciaInicio: Timestamp.fromDate(vigencia.inicio),
        vigenciaFim: Timestamp.fromDate(vigencia.fim),
      });
      limparFormulario();
      setFolhaAberta(false);
      await carregar();
    } catch (e: any) {
      setErroForm(mensagemErro(e, 'Não foi possível criar a missão. Tente novamente.'));
    } finally {
      setCriando(false);
    }
  }

  async function handleAlternarAtiva(missao: Missao) {
    setProcessandoId(missao.id);
    try {
      await atualizarMissao(missao.id, { ativa: !missao.ativa });
      setMissoes((prev) => prev.map((m) => (m.id === missao.id ? { ...m, ativa: !m.ativa } : m)));
    } catch (e: any) {
      setErro(mensagemErro(e, 'Não foi possível atualizar a missão. Tente novamente.'));
    } finally {
      setProcessandoId(null);
    }
  }

  // RF18: alunos com vínculo aceito (listarVinculosAceitosDaAcademia filtra por destinatarioId,
  // serve igual para professor autônomo) e o progresso atual de cada um nesta missão
  async function abrirConclusoes(missao: Missao) {
    if (!usuario) return;
    setMissaoConclusoes(missao);
    setCarregandoConclusoes(true);
    setErroConclusoes(null);
    try {
      const [vinculos, progresso, matriculas] = await Promise.all([
        listarVinculosAceitosDaAcademia(usuario.id, 'aluno'),
        listarProgressoDaMissao(missao.id, usuario.id),
        missao.publicoAlvo === 'turma' && missao.turmaId ? listarMatriculasPorTurma(missao.turmaId, usuario.id) : Promise.resolve([]),
      ]);
      const concluidos = new Set(progresso.filter((p) => p.concluida).map((p) => p.alunoId));
      // RF23: só alunos do público-alvo (a regra do Firestore confere de novo ao marcar)
      const matriculados = new Set(matriculas.filter((m) => m.status === 'ativa').map((m) => m.alunoId));
      const doPublico = vinculos.filter((v) =>
        missao.publicoAlvo === 'turma' ? matriculados.has(v.solicitanteId)
          : missao.publicoAlvo === 'alunos' ? (missao.alunosAlvoIds ?? []).includes(v.solicitanteId)
            : true);
      const alunos = await Promise.all(
        doPublico.map(async (v) => {
          const aluno = await buscarUsuario(v.solicitanteId);
          return { alunoId: v.solicitanteId, nome: aluno?.nome ?? 'Aluno', concluida: concluidos.has(v.solicitanteId) };
        }),
      );
      setAlunosConclusao(alunos.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')));
    } catch (e: any) {
      setErroConclusoes(mensagemErro(e, 'Não foi possível carregar os alunos. Tente novamente.'));
    } finally {
      setCarregandoConclusoes(false);
    }
  }

  async function handleAlternarConclusao(aluno: AlunoConclusao) {
    if (!missaoConclusoes) return;
    setSalvandoAlunoId(aluno.alunoId);
    setErroConclusoes(null);
    try {
      await marcarConclusaoPersonalizada(missaoConclusoes, aluno.alunoId, !aluno.concluida);
      setAlunosConclusao((prev) => prev.map((a) => (a.alunoId === aluno.alunoId ? { ...a, concluida: !a.concluida } : a)));
    } catch (e: any) {
      setErroConclusoes(mensagemErro(e, 'Não foi possível salvar a conclusão. Tente novamente.'));
    } finally {
      setSalvandoAlunoId(null);
    }
  }

  const ativas = missoes.filter((m) => m.ativa).length;
  // RF23: fora da vigência só dá para desmarcar (a regra recusa marcar)
  const conclusoesAbertas = missaoConclusoes ? situacaoDaMissao(missaoConclusoes) === 'vigente' : false;

  function descricaoMissao(missao: Missao): string {
    const tipoRotulo = TIPOS.find((t) => t.valor === missao.tipo)?.rotulo ?? missao.tipo;
    const alvo = missao.publicoAlvo === 'turma'
      ? `turma ${turmas.find((t) => t.id === missao.turmaId)?.nome ?? ''}`.trim()
      : missao.publicoAlvo === 'alunos'
        ? `${missao.alunosAlvoIds?.length ?? 0} aluno(s)`
        : 'todos os alunos';
    const vigencia = textoVigencia(missao);
    return `${tipoRotulo}: meta ${missao.meta}, vale ${missao.pontos} pts. Para ${alvo}. `
      + `${vigencia ? `${vigencia}, ` : ''}${ROTULO_SITUACAO[situacaoDaMissao(missao)]}.`;
  }

  return (
    <Tela largura="lista" agrupada tituloGrande="Missões">
      <Botao
        titulo="Nova missão"
        icone={IconeMais}
        variante="secundario"
        onPress={() => {
          if (!pontos) setPontos(pontosSugeridos);
          setFolhaAberta(true);
        }}
      />

      {carregando ? (
        <View style={styles.espacoTopo}>
          <Esqueleto forma="linha" repeticoes={3} />
        </View>
      ) : erro ? (
        <EstadoErro mensagem={erro} onTentarNovamente={carregar} />
      ) : missoes.length === 0 ? (
        <EstadoVazio
          icone={IconeBandeira}
          titulo="Nenhuma missão criada"
          descricao="Crie a primeira missão para seus alunos com o botão acima."
        />
      ) : (
        <>
          <GrupoLista
            titulo={`Missões: ${ativas} de ${missoes.length} ativas`}
            rodape="Os alunos só veem a missão durante a vigência e se estiverem no público-alvo; depois do fim, ela fica no histórico de quem concluiu. Desligue para tirá-la de circulação. Missões personalizadas são concluídas à mão."
          >
            {missoes.flatMap((missao) => [
              <Toggle
                key={missao.id}
                rotulo={missao.titulo}
                descricao={descricaoMissao(missao)}
                valor={missao.ativa}
                desabilitado={processandoId === missao.id}
                onAlterar={() => handleAlternarAtiva(missao)}
              />,
              ...(missao.tipo === 'personalizada'
                ? [
                    <LinhaLista
                      key={`${missao.id}-conclusoes`}
                      rotulo="Marcar conclusões"
                      icone={IconeCheckCirculo}
                      accessibilityLabel={`Marcar conclusões de ${missao.titulo}`}
                      onPress={() => abrirConclusoes(missao)}
                    />,
                  ]
                : []),
            ])}
          </GrupoLista>
        </>
      )}

      <Folha
        visivel={folhaAberta}
        onFechar={() => setFolhaAberta(false)}
        titulo="Nova missão"
        acao={{ titulo: 'Criar', onPress: handleCriar, carregando: criando }}
      >
        <MensagemErro mensagem={erroForm} />

        <CampoTexto rotulo="Título" valor={titulo} onAlterar={setTitulo} placeholder="Ex.: Treinar 3x na semana" />
        <CampoTexto rotulo="Descrição" valor={descricao} onAlterar={setDescricao} placeholder="Critério de conclusão" />

        <Texto variante="subheadline" style={styles.rotuloCampo}>
          Tipo
        </Texto>
        <View style={styles.linhaTipos} accessibilityRole="radiogroup" accessibilityLabel="Tipo da missão">
          {TIPOS.map((opcao) => (
            <Etiqueta key={opcao.valor} texto={opcao.rotulo} selecionada={tipo === opcao.valor} onPress={() => setTipo(opcao.valor)} />
          ))}
        </View>

        <View style={styles.linhaNumeros}>
          <View style={styles.campoNumero}>
            <CampoTexto rotulo="Meta" valor={meta} onAlterar={setMeta} placeholder="Ex.: 3" keyboardType="number-pad" />
          </View>
          <View style={styles.campoNumero}>
            <CampoTexto rotulo="Pontos" valor={pontos} onAlterar={setPontos} placeholder="Ex.: 30" keyboardType="number-pad" />
          </View>
        </View>

        <Texto variante="subheadline" style={styles.rotuloCampo}>
          Público-alvo
        </Texto>
        <View style={styles.linhaTipos} accessibilityRole="radiogroup" accessibilityLabel="Público-alvo da missão">
          {PUBLICOS.map((opcao) => (
            <Etiqueta key={opcao} texto={ROTULOS_PUBLICO[opcao]} selecionada={publico === opcao} onPress={() => setPublico(opcao)} />
          ))}
        </View>
        {publico === 'turma' ? (
          turmas.length === 0 ? (
            <Texto variante="footnote" cor="texto2" style={styles.rotuloCampo}>Você ainda não tem turma ativa.</Texto>
          ) : (
            <View style={styles.linhaTipos} accessibilityRole="radiogroup" accessibilityLabel="Turma">
              {turmas.map((t) => (
                <Etiqueta key={t.id} texto={t.nome} selecionada={turmaId === t.id} onPress={() => setTurmaId(t.id)} />
              ))}
            </View>
          )
        ) : null}
        {publico === 'alunos' ? (
          alunosVinculados.length === 0 ? (
            <Texto variante="footnote" cor="texto2" style={styles.rotuloCampo}>Nenhum aluno vinculado ainda.</Texto>
          ) : (
            <View style={styles.linhaTipos} accessibilityLabel="Alunos da missão">
              {alunosVinculados.map((a) => (
                <Etiqueta
                  key={a.id}
                  texto={a.nome}
                  modo="multiplo"
                  selecionada={alunosAlvo.includes(a.id)}
                  onPress={() => setAlunosAlvo((atual) => (atual.includes(a.id) ? atual.filter((id) => id !== a.id) : [...atual, a.id]))}
                />
              ))}
            </View>
          )
        ) : null}

        <View style={styles.linhaNumeros}>
          <View style={styles.campoNumero}>
            <CampoTexto rotulo="Início" valor={inicio} onAlterar={setInicio} mascara="data" keyboardType="number-pad" />
          </View>
          <View style={styles.campoNumero}>
            <CampoTexto rotulo="Fim" valor={fim} onAlterar={setFim} mascara="data" keyboardType="number-pad" />
          </View>
        </View>
      </Folha>

      <Folha
        visivel={missaoConclusoes !== null}
        onFechar={() => setMissaoConclusoes(null)}
        titulo={missaoConclusoes ? missaoConclusoes.titulo : 'Conclusões'}
        tituloCancelar="Fechar"
      >
        <Texto variante="subheadline" style={styles.rotuloCampo}>
          {conclusoesAbertas
            ? `Marque quem cumpriu a missão. Cada conclusão vale ${missaoConclusoes?.pontos ?? 0} pts na classificação do mês.`
            : 'A missão está fora da vigência (ou desligada): dá para desmarcar uma conclusão, mas não marcar novas.'}
        </Texto>
        <MensagemErro mensagem={erroConclusoes} />
        {carregandoConclusoes ? (
          <Esqueleto forma="linha" repeticoes={3} />
        ) : alunosConclusao.length === 0 && !erroConclusoes ? (
          <Texto variante="body" cor="texto2">
            Nenhum aluno do público-alvo ainda.
          </Texto>
        ) : (
          <GrupoLista semMargem>
            {alunosConclusao.map((aluno) => (
              <Toggle
                key={aluno.alunoId}
                rotulo={aluno.nome}
                descricao={aluno.concluida ? 'Concluída' : 'Em curso'}
                valor={aluno.concluida}
                desabilitado={salvandoAlunoId === aluno.alunoId || (!conclusoesAbertas && !aluno.concluida)}
                onAlterar={() => handleAlternarConclusao(aluno)}
              />
            ))}
          </GrupoLista>
        )}
      </Folha>
    </Tela>
  );
}

const styles = StyleSheet.create({
  espacoTopo: { marginTop: Espacamento.grande },
  rotuloCampo: { marginBottom: Espacamento.pequeno },
  linhaTipos: { flexDirection: 'row', flexWrap: 'wrap', gap: Espacamento.pequeno, marginBottom: Espacamento.padrao },
  linhaNumeros: { flexDirection: 'row', gap: Espacamento.padrao },
  campoNumero: { flex: 1 },
});
