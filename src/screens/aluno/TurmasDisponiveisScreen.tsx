// RF11: turmas dos responsáveis com quem o aluno tem vínculo ativo, com opção de matrícula
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Cores, Espacamento } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { listarTurmasDisponiveisParaAluno, listarTurmasDoAluno } from '../../services/turmas';
import { matricularAluno } from '../../services/matriculas';
import { Turma } from '../../types';
import Tela from '../../components/ui/Tela';
import Texto from '../../components/ui/Texto';
import Etiqueta from '../../components/ui/Etiqueta';
import Aviso from '../../components/ui/Aviso';
import MensagemErro from '../../components/ui/MensagemErro';
import CabecalhoSecao from '../../components/ui/CabecalhoSecao';
import LinhaFina from '../../components/LinhaFina';
import { IconeCheck, IconeTatame } from '../../components/icones';
import { rotuloNivel } from '../../utils/apresentacao';
import { mensagemErro } from '../../utils/mensagensErro';
import Botao from '../../components/ui/Botao';
import Esqueleto from '../../components/ui/Esqueleto';
import EstadoVazio from '../../components/ui/EstadoVazio';
import EstadoErro from '../../components/ui/EstadoErro';

export default function TurmasDisponiveisScreen() {
  const { usuario } = useAuth();

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [matriculadasIds, setMatriculadasIds] = useState<Set<string>>(new Set());
  const [matriculando, setMatriculando] = useState<string | null>(null);
  const [erroMatricula, setErroMatricula] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!usuario) return;
    setCarregando(true);
    setErro(null);
    try {
      const [disponiveis, matriculadas] = await Promise.all([
        listarTurmasDisponiveisParaAluno(usuario.id),
        listarTurmasDoAluno(usuario.id),
      ]);
      setTurmas(disponiveis);
      setMatriculadasIds(new Set(matriculadas.map((t) => t.id)));
    } catch (e) {
      setErro(mensagemErro(e, 'Não foi possível carregar as turmas agora.'));
    } finally {
      setCarregando(false);
    }
  }, [usuario]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function handleMatricular(turmaId: string) {
    if (!usuario || matriculando) return;
    setMatriculando(turmaId);
    setErroMatricula(null);
    try {
      await matricularAluno(turmaId, usuario.id);
      setMatriculadasIds((prev) => new Set(prev).add(turmaId));
      setSucesso('Matrícula feita. A turma já aparece na sua agenda.');
    } catch (e) {
      setErroMatricula(mensagemErro(e, 'Não foi possível fazer a matrícula. Tente novamente.'));
    } finally {
      setMatriculando(null);
    }
  }

  if (carregando) {
    return (
      <Tela largura="lista">
        <Esqueleto forma="linha" repeticoes={4} />
      </Tela>
    );
  }

  if (erro) {
    return <EstadoErro mensagem={erro} onTentarNovamente={carregar} />;
  }

  if (turmas.length === 0) {
    return (
      <Tela largura="lista" centralizarVertical>
        <EstadoVazio
          icone={IconeTatame}
          titulo="Nenhuma turma disponível"
          descricao="Você precisa ter vínculo ativo com uma academia ou professor para ver turmas aqui."
        />
      </Tela>
    );
  }

  return (
    <Tela
      largura="lista"
      sobreposicao={<Aviso visivel={sucesso !== null} tipo="sucesso" mensagem={sucesso ?? ''} onFechar={() => setSucesso(null)} />}
    >
      <MensagemErro mensagem={erroMatricula} />
      <CabecalhoSecao titulo="Turmas" contador={`${matriculadasIds.size} matrícula${matriculadasIds.size === 1 ? '' : 's'}`} semMargem />
      {turmas.map((turma, i) => {
        const jaMatriculado = matriculadasIds.has(turma.id);
        return (
          <View key={turma.id}>
            {i > 0 ? <LinhaFina /> : null}
            <View style={styles.linha}>
              <View style={styles.textos}>
                <Texto variante="corpoForte">{turma.nome}</Texto>
                <View style={styles.meta}>
                  <Etiqueta texto={turma.modalidade} />
                  <Etiqueta texto={rotuloNivel(turma.nivel)} />
                </View>
              </View>
              {jaMatriculado ? (
                <View style={styles.matriculado} accessible accessibilityLabel="Matriculado">
                  <IconeCheck tamanho={18} cor={Cores.sucesso} />
                  <Texto variante="rotuloPlacar" cor="sucesso">
                    Matriculado
                  </Texto>
                </View>
              ) : (
                <Botao
                  titulo="Matricular"
                  variante="secundario"
                  compacto
                  carregando={matriculando === turma.id}
                  onPress={() => handleMatricular(turma.id)}
                />
              )}
            </View>
          </View>
        );
      })}
    </Tela>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', gap: Espacamento.medio, paddingVertical: Espacamento.padrao },
  textos: { flex: 1, gap: Espacamento.pequeno },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: Espacamento.minimo + 2 },
  matriculado: { flexDirection: 'row', alignItems: 'center', gap: Espacamento.minimo, minHeight: 44 },
});
