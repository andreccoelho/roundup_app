// Visão (só apresentação) do "Hoje" do Professor — RF10, RF12, RF13/RN02/RN08 (chamada). Dados
// prontos vêm de professor/DashboardScreen.tsx; a Galeria monta a mesma visão com dados fictícios.
// Tom operacional: banda de gestor compacta, seletor de turma, placar da sessão e chamada como
// lista de linhas (sem cards).
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Alturas, Cores, Espacamento, Raios } from '../../theme';
import type { StatusSessao } from '../../types';
import { ROTULO_STATUS_SESSAO, formatarHora } from '../../utils/apresentacao';
import { estiloAnelFoco, estiloSemOutline, useFocoVisivel } from '../../hooks/useFocoVisivel';
import BandaIdentidade from '../../components/ui/BandaIdentidade';
import SeloFaixa from '../../components/ui/SeloFaixa';
import Etiqueta from '../../components/ui/Etiqueta';
import Estatistica from '../../components/ui/Estatistica';
import CabecalhoSecao from '../../components/ui/CabecalhoSecao';
import ItemMenu from '../../components/ui/ItemMenu';
import Avatar from '../../components/ui/Avatar';
import Cartao from '../../components/ui/Cartao';
import Texto from '../../components/ui/Texto';
import Esqueleto from '../../components/ui/Esqueleto';
import EstadoErro from '../../components/ui/EstadoErro';
import EstadoVazio from '../../components/ui/EstadoVazio';
import LinhaFina from '../../components/LinhaFina';
import { IconeCheck, IconeTatame } from '../../components/icones';

export type StatusChamada = 'aguardando' | 'pendente' | 'validado' | 'rejeitado';

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
  sobHeader?: boolean;
  onSelecionarTurma: (id: string) => void;
  onTogglePresenca: (alunoId: string) => void;
  onTentarNovamente: () => void;
  onCriarTurma: () => void;
  onGerenciarTurmas: () => void;
}

function BotaoPresenca({ item, processando, onPress }: { item: ItemChamadaVisao; processando: boolean; onPress: () => void }) {
  const { focado, propsFoco } = useFocoVisivel();
  const presente = item.status === 'validado';
  return (
    <Pressable
      onPress={onPress}
      disabled={processando}
      accessibilityRole="switch"
      accessibilityLabel={`Presença de ${item.nome}`}
      accessibilityState={{ checked: presente, disabled: processando, busy: processando }}
      aria-checked={presente}
      style={({ pressed }) => [
        styles.presenca,
        presente ? styles.presencaAtiva : styles.presencaInativa,
        pressed && styles.pressionado,
        processando && styles.processando,
        estiloSemOutline,
        focado && estiloAnelFoco,
      ]}
      {...propsFoco}
    >
      {presente ? <IconeCheck tamanho={16} cor={Cores.sobreCor} espessura={2.5} /> : null}
      <Texto variante="caption" cor={presente ? 'sobreTint' : 'texto'}>
        {presente ? 'Presente' : 'Confirmar'}
      </Texto>
    </Pressable>
  );
}

export default function HojeProfessorVisao({
  nome,
  fotoUrl,
  graduacao,
  modalidades,
  turmas,
  turmaSelecionadaId,
  carregandoTurmas,
  sessaoHoje,
  carregandoPainel,
  chamada,
  presentes,
  processandoAlunoId,
  erro,
  sobHeader,
  onSelecionarTurma,
  onTogglePresenca,
  onTentarNovamente,
  onCriarTurma,
  onGerenciarTurmas,
}: HojeProfessorVisaoProps) {
  const turma = turmas.find((t) => t.id === turmaSelecionadaId);

  return (
    <View>
      <BandaIdentidade
        variante="gestor"
        compacta
        sobHeader={sobHeader}
        sobretitulo="Hoje"
        nome={nome}
        fotoUrl={fotoUrl}
        selo={graduacao ? <SeloFaixa faixaOuGrau={graduacao} /> : undefined}
      >
        {modalidades.length > 0 ? (
          <View style={styles.linhaChips}>
            {modalidades.map((m) => (
              <Etiqueta key={m} texto={m} />
            ))}
          </View>
        ) : null}
      </BandaIdentidade>

      {carregandoTurmas ? (
        <View style={styles.corpo}>
          <Esqueleto altura={160} />
        </View>
      ) : erro && turmas.length === 0 ? (
        <EstadoErro compacto mensagem={erro} onTentarNovamente={onTentarNovamente} />
      ) : turmas.length === 0 ? (
        <EstadoVazio
          icone={IconeTatame}
          titulo="Você ainda não tem turmas"
          descricao="Crie sua primeira turma para abrir sessões e fazer a chamada."
          acaoTitulo="Criar turma"
          acaoPrimaria
          onAcao={onCriarTurma}
        />
      ) : (
        <>
          {turmas.length > 1 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.seletor} accessibilityRole="radiogroup" accessibilityLabel="Turma">
              {turmas.map((t) => (
                <Etiqueta key={t.id} texto={t.nome} selecionada={turmaSelecionadaId === t.id} onPress={() => onSelecionarTurma(t.id)} />
              ))}
            </ScrollView>
          ) : null}

          <View style={styles.corpo}>
            <Cartao>
              <Texto variante="caption" cor="texto3">
                {turma?.nome ?? 'Turma'}
              </Texto>
              {sessaoHoje ? (
                <View style={styles.sessao}>
                  <View>
                    <Texto variante="caption" cor={sessaoHoje.status === 'aberta' ? 'sucesso' : 'texto2'}>
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
              <Texto variante="subheadline" cor="perigo" style={styles.erro} accessibilityRole="alert">
                {erro}
              </Texto>
            ) : null}

            <CabecalhoSecao titulo="Chamada" contador={sessaoHoje ? `${chamada.length} matriculados` : undefined} />
            {carregandoPainel ? (
              <Esqueleto forma="linha" repeticoes={3} />
            ) : !sessaoHoje ? (
              <Texto variante="subheadline">Sem sessão hoje: nada para chamar.</Texto>
            ) : chamada.length === 0 ? (
              <Texto variante="subheadline">Nenhum aluno matriculado nesta turma.</Texto>
            ) : (
              chamada.map((item, i) => (
                <View key={item.alunoId}>
                  {i > 0 ? <LinhaFina /> : null}
                  <View style={styles.linhaChamada}>
                    <Avatar nome={item.nome} fotoUrl={item.fotoUrl} tamanho={36} />
                    <Texto variante="headline" style={styles.nomeAluno} numberOfLines={1}>
                      {item.nome}
                    </Texto>
                    {item.status === 'aguardando' ? (
                      <Texto variante="subheadline" cor="texto3">
                        Sem check-in
                      </Texto>
                    ) : item.status === 'rejeitado' ? (
                      <Texto variante="subheadline" cor="perigo">
                        Rejeitado
                      </Texto>
                    ) : (
                      <BotaoPresenca item={item} processando={processandoAlunoId === item.alunoId} onPress={() => onTogglePresenca(item.alunoId)} />
                    )}
                  </View>
                </View>
              ))
            )}

            <CabecalhoSecao titulo="Atalhos" />
            <ItemMenu rotulo="Gerenciar turmas" descricao="Turmas, sessões e relatório de frequência" icone={IconeTatame} onPress={onGerenciarTurmas} />
          </View>
        </>
      )}
      <View style={styles.respiro} />
    </View>
  );
}

const styles = StyleSheet.create({
  linhaChips: { flexDirection: 'row', flexWrap: 'wrap', gap: Espacamento.pequeno },
  seletor: { paddingHorizontal: Espacamento.padrao, paddingTop: Espacamento.padrao, gap: Espacamento.pequeno },
  corpo: { paddingHorizontal: Espacamento.padrao, paddingTop: Espacamento.padrao },
  sessao: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: Espacamento.pequeno },
  semSessao: { marginTop: Espacamento.pequeno },
  erro: { marginTop: Espacamento.medio },
  linhaChamada: { flexDirection: 'row', alignItems: 'center', gap: Espacamento.medio, minHeight: Alturas.botaoHero + 8 },
  nomeAluno: { flex: 1 },
  presenca: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacamento.minimo,
    minHeight: Alturas.alvoMinimo,
    minWidth: 112,
    justifyContent: 'center',
    paddingHorizontal: Espacamento.medio,
    borderRadius: Raios.vivo,
  },
  presencaAtiva: { backgroundColor: Cores.sucesso },
  presencaInativa: { borderWidth: 1.5, borderColor: Cores.texto },
  pressionado: { opacity: 0.8 },
  processando: { opacity: 0.5 },
  respiro: { height: Espacamento.enorme },
});
