// RF23: criação e gestão de missões personalizadas pelo responsável (professor autônomo ou
// academia). Campos usados são só os que existem em types/index.ts (Missao) — "público-alvo" e
// "período de vigência" do RF23 original não têm campo modelado ainda, ficam de fora.
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Espacamento } from '../../theme';
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
import Tela from '../../components/ui/Tela';
import Texto from '../../components/ui/Texto';
import Toggle from '../../components/ui/Toggle';
import CampoTexto from '../../components/ui/CampoTexto';
import CabecalhoSecao from '../../components/ui/CabecalhoSecao';
import MensagemErro from '../../components/ui/MensagemErro';
import { IconeBandeira, IconeMais } from '../../components/icones';
import { mensagemErro } from '../../utils/mensagensErro';

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


  const ativas = missoes.filter((m) => m.ativa).length;

  return (
    <Tela largura="lista">
      <Botao titulo="Nova missão" icone={IconeMais} onPress={() => setFolhaAberta(true)} />

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
            </View>
          ))}
        </>
      )}

      <Folha visivel={folhaAberta} onFechar={() => setFolhaAberta(false)} titulo="Nova missão">
        <MensagemErro mensagem={erroForm} />

        <CampoTexto rotulo="Título" valor={titulo} onAlterar={setTitulo} placeholder="Ex.: Treinar 3x na semana" />
        <CampoTexto rotulo="Descrição" valor={descricao} onAlterar={setDescricao} placeholder="Critério de conclusão" />

        <Texto variante="legenda" style={styles.rotuloCampo}>
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
