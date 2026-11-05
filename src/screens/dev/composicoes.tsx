// Composições da Galeria — as visões reais das telas autenticadas (Home do Aluno, Perfil,
// Classificação, Hoje do Professor) montadas com dados fictícios, para validar o visual sem
// logar nem tocar no Firebase. Só __DEV__ (importado apenas pela GaleriaScreen).
import { useState } from 'react';
import { View } from 'react-native';
import { Espacamento } from '../../theme';
import HomeAlunoVisao, { type SessaoHome } from '../aluno/HomeAlunoVisao';
import PerfilAlunoVisao, { type MedalhaPerfil } from '../aluno/PerfilAlunoVisao';
import ClassificacaoVisao, { type LinhaRanking } from '../aluno/ClassificacaoVisao';
import HojeProfessorVisao, { type ItemChamadaVisao } from '../professor/HojeProfessorVisao';
import { calcularProgressoNivel } from '../../utils/gamificacao';
import type { EstadoCheckIn } from '../../utils/statusCheckIn';

export type Composicao = 'home' | 'perfil' | 'classificacao' | 'hoje';

export const COMPOSICOES: { valor: Composicao; rotulo: string }[] = [
  { valor: 'home', rotulo: 'Home do Aluno' },
  { valor: 'perfil', rotulo: 'Perfil do Aluno' },
  { valor: 'classificacao', rotulo: 'Classificação' },
  { valor: 'hoje', rotulo: 'Hoje do Professor' },
];

function emMinutos(min: number): Date {
  return new Date(Date.now() + min * 60000);
}

function sessoesFicticias(estadoHero: EstadoCheckIn): SessaoHome[] {
  const heroInicio = estadoHero === 'foraDaJanela' ? emMinutos(150) : emMinutos(25);
  return [
    {
      id: 's1',
      nomeTurma: 'Muay Thai — Turma A',
      professor: 'Mestre Kleber',
      inicio: heroInicio,
      janelaInicio: new Date(heroInicio.getTime() - 30 * 60000),
      janelaFim: new Date(heroInicio.getTime() + 30 * 60000),
      estado: estadoHero,
    },
    {
      id: 's2',
      nomeTurma: 'Boxe — Fundamentos',
      professor: 'Prof. Carla',
      inicio: emMinutos(24 * 60 + 60),
      janelaInicio: emMinutos(24 * 60 + 30),
      janelaFim: emMinutos(24 * 60 + 90),
      estado: 'foraDaJanela',
      motivo: 'Abre amanhã',
    },
    {
      id: 's3',
      nomeTurma: 'Muay Thai — Clinch',
      professor: 'Mestre Kleber',
      inicio: emMinutos(3 * 24 * 60),
      janelaInicio: emMinutos(3 * 24 * 60 - 30),
      janelaFim: emMinutos(3 * 24 * 60 + 30),
      estado: 'foraDaJanela',
      motivo: 'Ainda não abriu',
    },
  ];
}

const MEDALHAS: MedalhaPerfil[] = [
  { id: 'treinos-10', rotulo: '10 treinos', tipo: 'treinos', quantidade: 10, conquistada: true },
  { id: 'treinos-30', rotulo: '30 treinos', tipo: 'treinos', quantidade: 30, conquistada: true },
  { id: 'treinos-100', rotulo: '100 treinos', tipo: 'treinos', quantidade: 100, conquistada: true, maxima: true },
  { id: 'sequencia-7', rotulo: '7 treinos seguidos', tipo: 'sequencia', quantidade: 7, conquistada: true },
  { id: 'sequencia-30', rotulo: '30 treinos seguidos', tipo: 'sequencia', quantidade: 30, conquistada: false },
  { id: 'graduacoes-1', rotulo: 'Primeira graduação', tipo: 'graduacoes', quantidade: 1, conquistada: false },
];

const RANKING: LinhaRanking[] = [
  { alunoId: 'a1', nome: 'Ana Beatriz', pontos: 980 },
  { alunoId: 'a2', nome: 'Carlos Eduardo', pontos: 860 },
  { alunoId: 'a3', nome: 'João Pedro', pontos: 790 },
  { alunoId: 'a4', nome: 'Marina Costa', pontos: 710 },
  { alunoId: 'eu', nome: 'Rafael Souza', pontos: 640 },
  { alunoId: 'a6', nome: 'Bianca Lopes', pontos: 520 },
  { alunoId: 'a7', nome: 'Diego Ramos', pontos: 410 },
];

const CHAMADA_INICIAL: ItemChamadaVisao[] = [
  { alunoId: 'c1', nome: 'Ana Beatriz', status: 'validado' },
  { alunoId: 'c2', nome: 'Carlos Eduardo', status: 'pendente' },
  { alunoId: 'c3', nome: 'João Pedro', status: 'validado' },
  { alunoId: 'c4', nome: 'Marina Costa', status: 'aguardando' },
  { alunoId: 'c5', nome: 'Rafael Souza', status: 'pendente' },
];

const nada = () => {};

export function ComposicaoHome() {
  const [estado, setEstado] = useState<EstadoCheckIn>('disponivel');
  const [enviando, setEnviando] = useState<string | null>(null);
  return (
    <HomeAlunoVisao
      sobHeader
      nome="Rafael Souza"
      faixa="Faixa azul, 2º grau"
      modalidades={['Muay Thai', 'Boxe']}
      sessoes={sessoesFicticias(estado)}
      carregando={false}
      erro={null}
      enviandoId={enviando}
      progresso={calcularProgressoNivel(640)}
      sequencia={5}
      onCheckIn={(id) => {
        setEnviando(id);
        setTimeout(() => {
          setEnviando(null);
          setEstado('realizado');
        }, 600);
      }}
      onTentarNovamente={nada}
      onVerAgenda={nada}
      onTurmasDisponiveis={nada}
      onHistorico={nada}
    />
  );
}

export function ComposicaoPerfil() {
  return (
    <PerfilAlunoVisao
      nome="Rafael Souza"
      faixa="Faixa azul, 2º grau"
      email="rafael@exemplo.com"
      membroDesde="setembro de 2026"
      nivel={calcularProgressoNivel(640).nivel}
      sequencia={5}
      treinos={64}
      modalidades={['Muay Thai', 'Boxe']}
      medalhas={MEDALHAS}
      onEditar={nada}
      onVinculos={nada}
      onNotificacoes={nada}
      participaClassificacao
      onAlternarParticipacao={nada}
      onContaPrivacidade={nada}
      onSair={nada}
    />
  );
}

export function ComposicaoClassificacao() {
  return (
    <View style={{ padding: Espacamento.padrao }}>
      <ClassificacaoVisao linhas={RANKING} usuarioId="eu" />
    </View>
  );
}

export function ComposicaoHoje() {
  const [chamada, setChamada] = useState(CHAMADA_INICIAL);
  const [turma, setTurma] = useState('t1');
  return (
    <HojeProfessorVisao
      sobHeader
      nome="Mestre Kleber"
      graduacao="Faixa preta, 3º grau"
      modalidades={['Muay Thai']}
      turmas={[
        { id: 't1', nome: 'Muay Thai — Turma A' },
        { id: 't2', nome: 'Muay Thai — Clinch' },
        { id: 't3', nome: 'Kids' },
      ]}
      turmaSelecionadaId={turma}
      carregandoTurmas={false}
      sessaoHoje={{ inicio: emMinutos(-10), status: 'aberta' }}
      carregandoPainel={false}
      chamada={chamada}
      presentes={chamada.filter((c) => c.status === 'validado' || c.status === 'pendente').length}
      processandoAlunoId={null}
      erro={null}
      onSelecionarTurma={setTurma}
      onTogglePresenca={(id) =>
        setChamada((prev) => prev.map((c) => (c.alunoId === id ? { ...c, status: c.status === 'validado' ? 'pendente' : 'validado' } : c)))
      }
      onTentarNovamente={nada}
      onCriarTurma={nada}
      onGerenciarTurmas={nada}
    />
  );
}

export function ComposicaoPorNome({ nome }: { nome: Composicao }) {
  if (nome === 'home') return <ComposicaoHome />;
  if (nome === 'perfil') return <ComposicaoPerfil />;
  if (nome === 'classificacao') return <ComposicaoClassificacao />;
  return <ComposicaoHoje />;
}
