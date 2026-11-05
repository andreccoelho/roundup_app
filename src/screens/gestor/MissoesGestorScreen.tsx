// RF23: criação e gestão de missões personalizadas pelo responsável (professor autônomo ou
// academia). Campos usados são só os que existem em types/index.ts (Missao) — "público-alvo" e
// "período de vigência" do RF23 original não têm campo modelado ainda, ficam de fora.
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
import { buscarUsuario } from '../../services/usuarios';
import { buscarConfiguracao, valoresEfetivos } from '../../services/configuracoesGamificacao';
import { LIMITES_CONFIGURACAO } from '../../config/gamificacao';
import { Missao, TipoMissao } from '../../types';
import Botao from '../../components/ui/Botao';
import Etiqueta from '../../components/ui/Etiqueta';
import Folha from '../../components/ui/Folha';
import LinhaFina from '../../components/LinhaFina';
import Esqueleto from '../../components/ui/Esqueleto';
import EstadoVazio from '../../components/ui/EstadoVazio';
import EstadoErro from '../../components/ui/EstadoErro';
import Tela from '../../components/ui/Tela';
import Texto from '../../components/ui/Texto';
import Toggle from '../../components/ui/Toggle';
import CampoTexto from '../../components/ui/CampoTexto';
import CabecalhoSecao from '../../components/ui/CabecalhoSecao';
import MensagemErro from '../../components/ui/MensagemErro';
import { IconeBandeira, IconeMais } from '../../components/icones';
import { mensagemErro } from '../../utils/mensagensErro';

interface AlunoConclusao {
  alunoId: string;
  nome: string;
  concluida: boolean;
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
      const [lista, config] = await Promise.all([listarMissoesPorResponsavel(usuario.id), buscarConfiguracao(usuario.id)]);
      setMissoes(lista);
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
      const [vinculos, progresso] = await Promise.all([
        listarVinculosAceitosDaAcademia(usuario.id, 'aluno'),
        listarProgressoDaMissao(missao.id, usuario.id),
      ]);
      const concluidos = new Set(progresso.filter((p) => p.concluida).map((p) => p.alunoId));
      const alunos = await Promise.all(
        vinculos.map(async (v) => {
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

  return (
    <Tela largura="lista">
      <Botao
        titulo="Nova missão"
        icone={IconeMais}
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
          <CabecalhoSecao titulo="Missões" contador={`${ativas} de ${missoes.length} ativas`} />
          {missoes.map((missao, i) => (
            <View key={missao.id}>
              {i > 0 ? <LinhaFina /> : null}
              <Toggle
                rotulo={missao.titulo}
                descricao={`${TIPOS.find((t) => t.valor === missao.tipo)?.rotulo ?? missao.tipo}: meta ${missao.meta}, vale ${missao.pontos} pts`}
                valor={missao.ativa}
                desabilitado={processandoId === missao.id}
                onAlterar={() => handleAlternarAtiva(missao)}
              />
              {missao.tipo === 'personalizada' ? (
                <View style={styles.acaoMissao}>
                  <Botao compacto variante="secundario" titulo="Marcar conclusões" onPress={() => abrirConclusoes(missao)} />
                </View>
              ) : null}
            </View>
          ))}
        </>
      )}

      <Folha visivel={folhaAberta} onFechar={() => setFolhaAberta(false)} titulo="Nova missão">
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

        <Botao titulo="Criar missão" onPress={handleCriar} carregando={criando} />
      </Folha>

      <Folha
        visivel={missaoConclusoes !== null}
        onFechar={() => setMissaoConclusoes(null)}
        titulo={missaoConclusoes ? `Conclusões: ${missaoConclusoes.titulo}` : 'Conclusões'}
      >
        <Texto variante="subheadline" style={styles.rotuloCampo}>
          {`Marque quem cumpriu a missão. Cada conclusão vale ${missaoConclusoes?.pontos ?? 0} pts na classificação do mês.`}
        </Texto>
        <MensagemErro mensagem={erroConclusoes} />
        {carregandoConclusoes ? (
          <Esqueleto forma="linha" repeticoes={3} />
        ) : alunosConclusao.length === 0 && !erroConclusoes ? (
          <Texto variante="body" cor="texto2">
            Nenhum aluno vinculado ainda.
          </Texto>
        ) : (
          alunosConclusao.map((aluno, i) => (
            <View key={aluno.alunoId}>
              {i > 0 ? <LinhaFina /> : null}
              <Toggle
                rotulo={aluno.nome}
                descricao={aluno.concluida ? 'Concluída' : 'Em curso'}
                valor={aluno.concluida}
                desabilitado={salvandoAlunoId === aluno.alunoId}
                onAlterar={() => handleAlternarConclusao(aluno)}
              />
            </View>
          ))
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
  acaoMissao: { alignItems: 'flex-start', marginBottom: Espacamento.pequeno },
});
