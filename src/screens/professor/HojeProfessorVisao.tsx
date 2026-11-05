// Visão (só apresentação) do "Hoje" do Professor — RF10, RF12, RF13/RN02/RN08 (chamada). Dados
// prontos vêm de professor/DashboardScreen.tsx; a Galeria monta a mesma visão com dados fictícios.
// Tom operacional: saudação curta, seletor de turma em chips, cartão de destaque com a sessão do
// dia (horário e presentes) e a chamada em lista agrupada, com um círculo de check por aluno
// (LinhaChamada). O título grande "Hoje" vem do cabeçalho (iOS) ou da Tela (Android/web).
import { ScrollView, View } from 'react-native';
import { criarEstilos, Espacamento } from '../../theme';
import type { StatusSessao } from '../../types';
import { ROTULO_STATUS_SESSAO, formatarHora } from '../../utils/apresentacao';
import SeloFaixa from '../../components/ui/SeloFaixa';
import Etiqueta from '../../components/ui/Etiqueta';
import Estatistica from '../../components/ui/Estatistica';
import GrupoLista from '../../components/ui/GrupoLista';
import ItemMenu from '../../components/ui/ItemMenu';
import FundoIdentidade from '../../components/ui/FundoIdentidade';
import Avatar from '../../components/ui/Avatar';
import Cartao from '../../components/ui/Cartao';
import Texto from '../../components/ui/Texto';
import Esqueleto from '../../components/ui/Esqueleto';
import EstadoErro from '../../components/ui/EstadoErro';
import EstadoVazio from '../../components/ui/EstadoVazio';
import LinhaChamada, { type StatusChamada } from '../../components/ui/LinhaChamada';
import { IconeTatame } from '../../components/icones';

export type { StatusChamada };

export interface ItemChamadaVisao {
  alunoId: string;
  nome: string;
  fotoUrl?: string;
  status: StatusChamada;
}

interface HojeProfessorVisaoProps {
  nome: string;
  fotoUrl?: string;
  graduacao?: string;
  modalidades: string[];
  turmas: { id: string; nome: string }[];
  turmaSelecionadaId: string | null;
  carregandoTurmas: boolean;
  sessaoHoje: { inicio: Date; status: StatusSessao } | null;
  carregandoPainel: boolean;
  chamada: ItemChamadaVisao[];
  presentes: number;
  processandoAlunoId: string | null;
  erro: string | null;
  // Mantido por compatibilidade com a direção anterior (banda sob o header) — sem efeito
  sobHeader?: boolean;
  onSelecionarTurma: (id: string) => void;
  onTogglePresenca: (alunoId: string) => void;
  onTentarNovamente: () => void;
  onCriarTurma: () => void;
  onGerenciarTurmas: () => void;
}

function primeiroNome(nome: string): string {
  return nome.trim().split(/\s+/)[0] ?? '';
}

export default function HojeProfessorVisao({
  nome,
  fotoUrl,
  graduacao,
  turmas,
  turmaSelecionadaId,
  carregandoTurmas,
  sessaoHoje,
  carregandoPainel,
  chamada,
  presentes,
  processandoAlunoId,
  erro,
  onSelecionarTurma,
  onTogglePresenca,
  onTentarNovamente,
  onCriarTurma,
  onGerenciarTurmas,
}: HojeProfessorVisaoProps) {
  const styles = useEstilos();
  const turma = turmas.find((t) => t.id === turmaSelecionadaId);

  return (
    <View>
      <FundoIdentidade compacto variante="gestor" style={styles.saudacaoFundo}>
        <View style={styles.saudacao}>
          <Avatar nome={nome} fotoUrl={fotoUrl} tamanho={44} />
          <View style={styles.saudacaoTextos}>
            <Texto variante="title3" cabecalho={false}>{`Olá, ${primeiroNome(nome)}`}</Texto>
            {graduacao ? <SeloFaixa faixaOuGrau={graduacao} /> : null}
          </View>
        </View>
      </FundoIdentidade>

      {carregandoTurmas ? (
        <Esqueleto altura={150} raio={16} />
      ) : erro && turmas.length === 0 ? (
        <Cartao>
          <EstadoErro compacto mensagem={erro} onTentarNovamente={onTentarNovamente} />
        </Cartao>
      ) : turmas.length === 0 ? (
        <Cartao>
          <EstadoVazio
            icone={IconeTatame}
            titulo="Você ainda não tem turmas"
            descricao="Crie sua primeira turma para abrir sessões e fazer a chamada."
            acaoTitulo="Criar turma"
            acaoPrimaria
            onAcao={onCriarTurma}
          />
        </Cartao>
      ) : (
        <>
          {turmas.length > 1 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.seletorArea}
              contentContainerStyle={styles.seletor}
              accessibilityRole="radiogroup"
              accessibilityLabel="Turma"
            >
              {turmas.map((t) => (
                <Etiqueta key={t.id} texto={t.nome} selecionada={turmaSelecionadaId === t.id} onPress={() => onSelecionarTurma(t.id)} />
              ))}
            </ScrollView>
          ) : null}

          <Cartao destaque>
            <Texto variante="footnote">{turma?.nome ?? 'Turma'}</Texto>
            {sessaoHoje ? (
              <View style={styles.sessao}>
                <View>
                  <Texto variante="subheadline" cor={sessaoHoje.status === 'aberta' ? 'sucesso' : 'texto2'}>
                    {ROTULO_STATUS_SESSAO[sessaoHoje.status]}
                  </Texto>
                  <Texto variante="numeroGrande">{formatarHora(sessaoHoje.inicio)}</Texto>
                </View>
                <Estatistica valor={`${presentes}/${chamada.length}`} rotulo="Presentes" tamanho="grande" alinhamento="centro" />
              </View>
            ) : (
              <Texto variante="body" cor="texto2" style={styles.semSessao}>
                Nenhuma sessão hoje nesta turma.
              </Texto>
            )}
          </Cartao>

          {erro ? (
            <Texto variante="footnote" cor="perigo" style={styles.erro} accessibilityRole="alert">
              {erro}
            </Texto>
          ) : null}

          {carregandoPainel ? (
            <View style={styles.esqueleto}>
              <Esqueleto forma="linha" repeticoes={3} />
            </View>
          ) : !sessaoHoje ? null : chamada.length === 0 ? (
            <GrupoLista titulo="Chamada">
              <View style={styles.vazio}>
                <Texto variante="subheadline">Nenhum aluno matriculado nesta turma.</Texto>
              </View>
            </GrupoLista>
          ) : (
            <GrupoLista
              titulo={`Chamada: ${chamada.length} ${chamada.length === 1 ? 'matriculado' : 'matriculados'}`}
              rodape="Toque no círculo para confirmar a presença de quem fez check-in."
            >
              {chamada.map((item) => (
                <LinhaChamada
                  key={item.alunoId}
                  nome={item.nome}
                  fotoUrl={item.fotoUrl}
                  status={item.status}
                  processando={processandoAlunoId === item.alunoId}
                  onAlternar={() => onTogglePresenca(item.alunoId)}
                />
              ))}
            </GrupoLista>
          )}

          <GrupoLista titulo="Atalhos">
            <ItemMenu rotulo="Gerenciar turmas" descricao="Turmas, sessões e relatório de frequência" icone={IconeTatame} onPress={onGerenciarTurmas} />
          </GrupoLista>
        </>
      )}
    </View>
  );
}

const useEstilos = criarEstilos(() => ({
  saudacaoFundo: { marginBottom: Espacamento.padrao },
  saudacao: { flexDirection: 'row', alignItems: 'center', gap: Espacamento.medio },
  saudacaoTextos: { flex: 1, gap: 2 },
  seletorArea: { marginHorizontal: -Espacamento.padrao, marginBottom: Espacamento.medio },
  seletor: { paddingHorizontal: Espacamento.padrao, gap: Espacamento.pequeno },
  sessao: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: Espacamento.pequeno },
  semSessao: { marginTop: Espacamento.pequeno },
  erro: { marginTop: Espacamento.medio, marginHorizontal: Espacamento.padrao },
  esqueleto: { marginTop: Espacamento.grande },
  vazio: { padding: Espacamento.padrao },
}));
