// RF23: criação e gestão de missões personalizadas pelo responsável (professor autônomo ou
// academia). Campos usados são só os que existem em types/index.ts (Missao) — "público-alvo" e
// "período de vigência" do RF23 original não têm campo modelado ainda, ficam de fora.
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Cores, Espacamento, TamanhoFonte } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { criarMissao, listarMissoesPorResponsavel, atualizarMissao } from '../../services/missoes';
import { Missao, TipoMissao } from '../../types';
import Botao from '../../components/ui/Botao';
import Etiqueta from '../../components/ui/Etiqueta';
import Folha from '../../components/ui/Folha';
import LinhaFina from '../../components/LinhaFina';
import Esqueleto from '../../components/ui/Esqueleto';
import EstadoVazio from '../../components/ui/EstadoVazio';
import EstadoErro from '../../components/ui/EstadoErro';

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

  const carregar = useCallback(async () => {
    if (!usuario) return;
    setCarregando(true);
    setErro(null);
    try {
      setMissoes(await listarMissoesPorResponsavel(usuario.id));
    } catch (e: any) {
      setErro(e.message);
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
    setPontos('');
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
    if (!pontos.trim() || Number.isNaN(pontosNumero) || pontosNumero < 0) {
      setErroForm('Pontos precisa ser um número válido.');
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
      setErroForm(e.message);
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
      setErro(e.message);
    } finally {
      setProcessandoId(null);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.cabecalho}>
        <Botao titulo="Nova missão" onPress={() => setFolhaAberta(true)} />
      </View>

      {carregando ? (
        <View style={styles.conteudo}>
          <Esqueleto altura={72} repeticoes={3} />
        </View>
      ) : erro ? (
        <EstadoErro mensagem={erro} onTentarNovamente={carregar} />
      ) : missoes.length === 0 ? (
        <View style={styles.conteudo}>
          <EstadoVazio
            titulo="Nenhuma missão criada"
            descricao="Crie a primeira missão para seus alunos com o botão acima."
          />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.conteudo}>
          {missoes.map((missao, i) => (
            <View key={missao.id}>
              <View style={styles.linhaMissao}>
                <View style={styles.linhaMissaoTextos}>
                  <Text style={styles.tituloMissao}>{missao.titulo}</Text>
                  <Text style={styles.detalheMissao}>
                    {TIPOS.find((t) => t.valor === missao.tipo)?.rotulo ?? missao.tipo} · meta {missao.meta} · {missao.pontos} pts
                  </Text>
                </View>
                <Etiqueta
                  texto={missao.ativa ? 'Ativa' : 'Inativa'}
                  selecionada={missao.ativa}
                  desabilitada={processandoId === missao.id}
                  onPress={() => handleAlternarAtiva(missao)}
                />
              </View>
              {i < missoes.length - 1 && <LinhaFina />}
            </View>
          ))}
        </ScrollView>
      )}

      <Folha visivel={folhaAberta} onFechar={() => setFolhaAberta(false)}>
        <Text style={styles.tituloFolha}>Nova missão</Text>
        {erroForm ? <Text style={styles.erroForm}>{erroForm}</Text> : null}

        <Text style={styles.rotuloCampo}>Título</Text>
        <TextInput style={styles.input} value={titulo} onChangeText={setTitulo} placeholder="Ex.: Treinar 3x na semana" />

        <Text style={styles.rotuloCampo}>Descrição</Text>
        <TextInput style={styles.input} value={descricao} onChangeText={setDescricao} placeholder="Critério de conclusão" />

        <Text style={styles.rotuloCampo}>Tipo</Text>
        <View style={styles.linhaTipos}>
          {TIPOS.map((opcao) => (
            <Etiqueta key={opcao.valor} texto={opcao.rotulo} selecionada={tipo === opcao.valor} onPress={() => setTipo(opcao.valor)} />
          ))}
        </View>

        <Text style={styles.rotuloCampo}>Meta</Text>
        <TextInput style={styles.input} value={meta} onChangeText={setMeta} placeholder="Ex.: 3" keyboardType="number-pad" />

        <Text style={styles.rotuloCampo}>Pontos de recompensa</Text>
        <TextInput style={styles.input} value={pontos} onChangeText={setPontos} placeholder="Ex.: 30" keyboardType="number-pad" />

        <View style={styles.espaco} />
        <Botao titulo="Criar missão" onPress={handleCriar} carregando={criando} />
      </Folha>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Cores.branco },
  cabecalho: { padding: Espacamento.padrao, paddingBottom: 0 },
  conteudo: { padding: Espacamento.padrao },

  linhaMissao: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Espacamento.medio, gap: Espacamento.medio },
  linhaMissaoTextos: { flex: 1 },
  tituloMissao: { fontSize: TamanhoFonte.md, fontWeight: '600', color: Cores.preto },
  detalheMissao: { fontSize: TamanhoFonte.xs, color: Cores.cinzaMedio, marginTop: 2 },

  tituloFolha: { fontSize: TamanhoFonte.lg, fontWeight: '700', color: Cores.preto, marginBottom: Espacamento.medio },
  erroForm: { color: Cores.alerta, fontSize: TamanhoFonte.sm, marginBottom: Espacamento.medio },
  rotuloCampo: { fontSize: TamanhoFonte.sm, color: Cores.cinzaMedio, marginBottom: Espacamento.minimo, marginTop: Espacamento.medio },
  input: { borderBottomWidth: 1, borderBottomColor: Cores.cinzaBorda, paddingVertical: Espacamento.pequeno, fontSize: TamanhoFonte.md, color: Cores.preto },
  linhaTipos: { flexDirection: 'row', flexWrap: 'wrap', gap: Espacamento.pequeno },
  espaco: { height: Espacamento.padrao },
});
