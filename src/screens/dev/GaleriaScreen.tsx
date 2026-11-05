// Galeria de componentes — acessível só em __DEV__ (rota registrada em AuthStack.tsx só quando
// __DEV__ é true; o guard abaixo é defesa em profundidade). Vitrine de tokens, componentes base e
// de domínio, para validar o visual sem backend (docs/DESIGN.md).
import { useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Cores, Espacamento, Raios, type NomeCor } from '../../theme';

import {
  IconeLuva,
  IconeFichaTecnica,
  IconeBandeira,
  IconeCartaoPontuacao,
  IconePerfil,
  IconeSino,
  IconeTatame,
  IconeFaixa,
  IconePoste,
  IconeCorda,
  IconeCadeado,
  IconeCheck,
  IconeChama,
  IconeCinturao,
  IconeRelogio,
  IconeAlerta,
  IconeMais,
  IconeSair,
} from '../../components/icones';
import Tela from '../../components/ui/Tela';
import Texto, { type VarianteTexto } from '../../components/ui/Texto';
import Botao from '../../components/ui/Botao';
import CampoTexto from '../../components/ui/CampoTexto';
import ModalitySelector from '../../components/ui/ModalitySelector';
import Cartao from '../../components/ui/Cartao';
import TexturaLona from '../../components/ui/TexturaLona';
import Etiqueta from '../../components/ui/Etiqueta';
import Avatar from '../../components/ui/Avatar';
import LinhaFina from '../../components/LinhaFina';
import Folha from '../../components/ui/Folha';
import Dialogo from '../../components/ui/Dialogo';
import Aviso, { type TipoAviso } from '../../components/ui/Aviso';
import Abas from '../../components/ui/Abas';
import Toggle from '../../components/ui/Toggle';
import Checkbox from '../../components/ui/Checkbox';
import CabecalhoSecao from '../../components/ui/CabecalhoSecao';
import ItemMenu from '../../components/ui/ItemMenu';
import Estatistica from '../../components/ui/Estatistica';
import BandaIdentidade from '../../components/ui/BandaIdentidade';
import EstadoVazio from '../../components/ui/EstadoVazio';
import EstadoErro from '../../components/ui/EstadoErro';
import Esqueleto from '../../components/ui/Esqueleto';

import CartaoSessao from '../../components/ui/CartaoSessao';
import BarraProgresso from '../../components/ui/BarraProgresso';
import CartaoMissao from '../../components/ui/CartaoMissao';
import Medalha from '../../components/ui/Medalha';
import CelebracaoGraduacao from '../../components/ui/CelebracaoGraduacao';
import IndicadorSequencia from '../../components/ui/IndicadorSequencia';
import LinhaClassificacao from '../../components/ui/LinhaClassificacao';
import Podio from '../../components/ui/Podio';
import SeloFaixa from '../../components/ui/SeloFaixa';
import CartaoAluno from '../../components/ui/CartaoAluno';
import IndicadorFrequencia from '../../components/ui/IndicadorFrequencia';
import HeroCheckIn from '../../components/ui/HeroCheckIn';
import MomentoConquista, { type Conquista } from '../../components/ui/MomentoConquista';
import { COMPOSICOES, ComposicaoPorNome, type Composicao } from './composicoes';

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <View style={styles.secao}>
      <CabecalhoSecao titulo={titulo} semMargem />
      {children}
    </View>
  );
}

function Linha({ children }: { children: ReactNode }) {
  return <View style={styles.linha}>{children}</View>;
}

const VARIANTES: VarianteTexto[] = ['display', 'titulo', 'secao', 'corpo', 'corpoForte', 'legenda', 'rotuloPlacar', 'placar', 'placarGrande', 'placarXL'];
const AMOSTRA: Partial<Record<VarianteTexto, string>> = {
  display: 'Noite de luta',
  secao: 'Próximos treinos',
  rotuloPlacar: 'Nível',
  placar: '1.240',
  placarGrande: '19:30',
  placarXL: '07',
};
const CORES_PALETA: NomeCor[] = ['fundo', 'superficie1', 'superficie2', 'linha', 'linhaForte', 'texto', 'texto2', 'texto3', 'acento', 'sucesso', 'perigo', 'ouro'];
const ICONES = {
  Luva: IconeLuva,
  Ficha: IconeFichaTecnica,
  Bandeira: IconeBandeira,
  Pontuação: IconeCartaoPontuacao,
  Perfil: IconePerfil,
  Sino: IconeSino,
  Tatame: IconeTatame,
  Faixa: IconeFaixa,
  Poste: IconePoste,
  Corda: IconeCorda,
  Cadeado: IconeCadeado,
  Check: IconeCheck,
  Chama: IconeChama,
  Cinturão: IconeCinturao,
  Relógio: IconeRelogio,
  Alerta: IconeAlerta,
  Mais: IconeMais,
  Sair: IconeSair,
};

export default function GaleriaScreen() {
  const [modalidades, setModalidades] = useState<string[]>(['Boxe', 'Muay Thai']);
  const [outraModalidade, setOutraModalidade] = useState('');
  const [folhaAberta, setFolhaAberta] = useState(false);
  const [dialogoAberto, setDialogoAberto] = useState(false);
  const [aviso, setAviso] = useState<TipoAviso | null>(null);
  const [aba, setAba] = useState<'em-curso' | 'concluidas'>('em-curso');
  const [checkInDemoFeito, setCheckInDemoFeito] = useState(false);
  const [celebracaoAberta, setCelebracaoAberta] = useState(false);
  const [toggle, setToggle] = useState(true);
  const [check, setCheck] = useState(false);
  const [nivel, setNivel] = useState('intermediario');
  const [data, setData] = useState('');
  const [hora, setHora] = useState('');
  const [senha, setSenha] = useState('segredo1');
  const [composicao, setComposicao] = useState<Composicao | null>(null);
  const [conquistaDemo, setConquistaDemo] = useState<Conquista | null>(null);

  if (!__DEV__) return null;

  if (composicao) {
    return (
      <Tela largura="lista" preenchimento={false}>
        <View style={styles.voltarComposicao}>
          <Botao variante="voltar" titulo="Voltar à galeria" onPress={() => setComposicao(null)} />
        </View>
        <ComposicaoPorNome nome={composicao} />
      </Tela>
    );
  }

  return (
    <Tela
      largura="lista"
      sobreposicao={
        <Aviso
          visivel={aviso !== null}
          tipo={aviso ?? 'info'}
          mensagem={aviso === 'sucesso' ? 'Check-in registrado.' : aviso === 'erro' ? 'Sem conexão com o servidor.' : 'Sessão começa em 30 min.'}
          onFechar={() => setAviso(null)}
        />
      }
    >
      <Texto variante="display" style={styles.tituloGaleria}>
        Galeria
      </Texto>

      <Secao titulo="Composições (telas com dados fictícios)">
        {COMPOSICOES.map((c, i) => (
          <ItemMenu key={c.valor} rotulo={c.rotulo} separador={i > 0} onPress={() => setComposicao(c.valor)} />
        ))}
      </Secao>

      <Secao titulo="MomentoConquista">
        <View style={styles.pilha}>
          <Botao titulo="Conquista: nível" variante="secundario" onPress={() => setConquistaDemo({ tipo: 'nivel', valor: 5, rotulo: 'Você chegou ao nível 5.' })} />
          <Botao titulo="Conquista: faixa" variante="secundario" onPress={() => setConquistaDemo({ tipo: 'faixa', valor: 'Faixa roxa, 1º grau', rotulo: 'Graduação registrada pelo seu professor.' })} />
          <Botao titulo="Conquista: medalha" variante="secundario" onPress={() => setConquistaDemo({ tipo: 'medalha', valor: 30, rotulo: '30 treinos', icone: 'treinos' })} />
        </View>
        <MomentoConquista conquista={conquistaDemo} onFechar={() => setConquistaDemo(null)} />
      </Secao>

      <Secao titulo="Tipografia">
        {VARIANTES.map((v) => (
          <View key={v} style={styles.amostraTipo}>
            <Texto variante="legenda" cor="texto3" cabecalho={false}>
              {v}
            </Texto>
            <Texto variante={v} cabecalho={false}>
              {AMOSTRA[v] ?? 'Treine. Evolua. Suba de nível.'}
            </Texto>
          </View>
        ))}
        <Texto variante="display" style={styles.amostraTipo}>
          Coração, ação, vínculo
        </Texto>
      </Secao>

      <Secao titulo="Paleta">
        <View style={styles.paleta}>
          {CORES_PALETA.map((nome) => (
            <View key={nome} style={styles.swatch}>
              <View style={[styles.swatchCor, { backgroundColor: Cores[nome] }]} />
              <Texto variante="legenda">{nome}</Texto>
              <Texto variante="legenda" cor="texto3">
                {Cores[nome]}
              </Texto>
            </View>
          ))}
        </View>
      </Secao>

      <Secao titulo="Ícones">
        <View style={styles.paleta}>
          {Object.entries(ICONES).map(([nome, Icone]) => (
            <View key={nome} style={styles.itemIcone}>
              <Icone tamanho={28} cor={Cores.texto} />
              <Texto variante="legenda" cor="texto3">
                {nome}
              </Texto>
            </View>
          ))}
        </View>
      </Secao>

      <Secao titulo="Botao">
        <View style={styles.pilha}>
          <Botao titulo="Primário" onPress={() => {}} />
          <Botao titulo="Fazer check-in" icone={IconeLuva} grande onPress={() => {}} />
          <Botao titulo="Secundário" variante="secundario" onPress={() => {}} />
          <Linha>
            <Botao titulo="Fantasma" variante="fantasma" compacto onPress={() => {}} />
            <Botao titulo="Destrutivo" variante="destrutivo" compacto onPress={() => {}} />
            <Botao titulo="Nova turma" icone={IconeMais} variante="secundario" compacto onPress={() => {}} />
          </Linha>
          <Linha>
            <Botao titulo="Carregando" carregando compacto onPress={() => {}} />
            <Botao titulo="Desabilitado" desabilitado compacto onPress={() => {}} />
            <Botao titulo="Desabilitado" variante="secundario" desabilitado compacto onPress={() => {}} />
          </Linha>
          <Botao variante="voltar" onPress={() => {}} />
          <Botao titulo="Esqueci minha senha" variante="texto" onPress={() => {}} />
        </View>
      </Secao>

      <Secao titulo="CampoTexto">
        <CampoTexto rotulo="E-mail" placeholder="seuemail@exemplo.com" valor="" onAlterar={() => {}} />
        <CampoTexto rotulo="Senha" secureTextEntry valor={senha} onAlterar={setSenha} />
        <CampoTexto rotulo="Com erro" valor="abc" onAlterar={() => {}} erro="E-mail inválido." />
        <Linha>
          <View style={styles.flex}>
            <CampoTexto rotulo="Data (máscara)" valor={data} onAlterar={setData} mascara="data" />
          </View>
          <View style={styles.flex}>
            <CampoTexto rotulo="Hora (máscara)" valor={hora} onAlterar={setHora} mascara="hora" />
          </View>
        </Linha>
        <CampoTexto rotulo="Com ajuda" valor="" onAlterar={() => {}} ajuda="Aparece no seu perfil e no ranking." />
      </Secao>

      <Secao titulo="Etiqueta e ModalitySelector">
        <Linha>
          <Etiqueta texto="Muay Thai" />
          <Etiqueta texto="Boxe" />
        </Linha>
        <Linha>
          {['iniciante', 'intermediario', 'avancado'].map((n) => (
            <Etiqueta
              key={n}
              texto={n === 'intermediario' ? 'Intermediário' : n === 'avancado' ? 'Avançado' : 'Iniciante'}
              selecionada={nivel === n}
              onPress={() => setNivel(n)}
            />
          ))}
          <Etiqueta texto="Desabilitada" desabilitada onPress={() => {}} />
        </Linha>
        <ModalitySelector
          rotulo="Modalidades praticadas"
          selecionadas={modalidades}
          outraTexto={outraModalidade}
          onAlterarSelecionadas={setModalidades}
          onAlterarOutraTexto={setOutraModalidade}
        />
      </Secao>

      <Secao titulo="Abas, Toggle, Checkbox">
        <Abas
          opcoes={[
            { valor: 'em-curso', rotulo: 'Em curso' },
            { valor: 'concluidas', rotulo: 'Concluídas' },
          ]}
          selecionada={aba}
          onSelecionar={setAba}
        />
        <Toggle rotulo="Lembrete de sessão" descricao="Avisa antes do horário dos seus treinos." valor={toggle} onAlterar={setToggle} />
        <LinhaFina />
        <Toggle rotulo="Desabilitado" valor={false} onAlterar={() => {}} desabilitado />
        <Checkbox rotulo="Li e aceito a política de privacidade." marcado={check} onAlterar={setCheck} />
      </Secao>

      <Secao titulo="CabecalhoSecao, ItemMenu, Estatistica">
        <CabecalhoSecao titulo="Próximos treinos" acaoTitulo="Ver agenda" onAcao={() => {}} semMargem />
        <CabecalhoSecao titulo="Medalhas" contador="3 de 6" semMargem />
        <ItemMenu rotulo="Turmas disponíveis" icone={IconeTatame} onPress={() => {}} />
        <ItemMenu rotulo="Histórico" descricao="Seus check-ins validados e pendentes" icone={IconeFichaTecnica} onPress={() => {}} separador />
        <ItemMenu rotulo="Solicitações pendentes" icone={IconeCorda} valor="3" onPress={() => {}} separador />
        <ItemMenu rotulo="Sair" icone={IconeSair} destrutivo semChevron onPress={() => {}} separador />
        <View style={[styles.linha, styles.estatisticas]}>
          <Estatistica valor={7} rotulo="Nível" alinhamento="centro" />
          <Estatistica valor={12} rotulo="Sequência" icone={IconeChama} alinhamento="centro" />
          <Estatistica valor={86} rotulo="Treinos" alinhamento="centro" />
        </View>
        <Estatistica valor="18/24" rotulo="Presentes" tamanho="grande" />
      </Secao>

      <Secao titulo="BandaIdentidade">
        <View style={styles.sangria}>
          <BandaIdentidade
            compacta
            sobHeader
            sobretitulo="Treinar"
            nome="Ana Beatriz"
            selo={<SeloFaixa faixaOuGrau="Faixa roxa, 2º grau" />}
          />
          <View style={styles.espaco} />
          <BandaIdentidade
            sobHeader
            nome="Ana Beatriz Souza"
            selo={<SeloFaixa faixaOuGrau="Faixa roxa, 2º grau" />}
            detalhes={['Membro desde setembro de 2026']}
          />
          <View style={styles.espaco} />
          <BandaIdentidade variante="gestor" compacta sobHeader sobretitulo="Hoje" nome="Academia Corner" detalhes={['Rua do Ringue, 120']} />
        </View>
      </Secao>

      <Secao titulo="Cartao e TexturaLona">
        <Cartao>
          <Texto variante="corpo">Cartão padrão: superficie1, canto vivo, sem borda.</Texto>
        </Cartao>
        <View style={styles.espaco} />
        <Cartao corteDiagonal corFilete={Cores.acento}>
          <Texto variante="corpo">Corte diagonal com filete: uma vez por tela.</Texto>
        </Cartao>
        <View style={styles.espaco} />
        <View style={styles.amostraTextura}>
          <TexturaLona opacidade={0.1} />
          <Texto variante="legenda">TexturaLona (opacidade 0,10 só nesta amostra).</Texto>
        </View>
        <View style={styles.espaco} />
        <Linha>
          <Avatar nome="Maria Silva" tamanho={32} />
          <Avatar nome="João" tamanho={44} />
          <Avatar nome="Ana Beatriz Souza" tamanho={64} />
        </Linha>
        <LinhaFina corda />
      </Secao>

      <Secao titulo="Folha, Diálogo, Aviso">
        <View style={styles.pilha}>
          <Botao titulo="Abrir folha" variante="secundario" onPress={() => setFolhaAberta(true)} />
          <Botao titulo="Abrir diálogo" variante="secundario" onPress={() => setDialogoAberto(true)} />
          <Linha>
            <Botao titulo="Aviso sucesso" variante="fantasma" compacto onPress={() => setAviso('sucesso')} />
            <Botao titulo="Aviso erro" variante="fantasma" compacto onPress={() => setAviso('erro')} />
            <Botao titulo="Aviso info" variante="fantasma" compacto onPress={() => setAviso('info')} />
          </Linha>
        </View>
        <Folha visivel={folhaAberta} onFechar={() => setFolhaAberta(false)} titulo="Nova missão">
          <CampoTexto rotulo="Título" placeholder="Ex.: Treinar 3x na semana" valor="" onAlterar={() => {}} />
          <CampoTexto rotulo="Descrição" placeholder="Critério de conclusão" valor="" onAlterar={() => {}} />
          <Botao titulo="Criar missão" onPress={() => setFolhaAberta(false)} />
        </Folha>
        <Dialogo
          visivel={dialogoAberto}
          titulo="Recusar solicitação?"
          mensagem="Esta ação não pode ser desfeita."
          tituloConfirmar="Recusar"
          destrutivo
          onConfirmar={() => setDialogoAberto(false)}
          tituloCancelar="Cancelar"
          onCancelar={() => setDialogoAberto(false)}
        />
      </Secao>

      <Secao titulo="Estados">
        <EstadoVazio
          icone={IconeTatame}
          titulo="Nenhuma turma criada ainda"
          descricao="Crie sua primeira turma para começar a receber alunos."
          acaoTitulo="Nova turma"
          onAcao={() => {}}
        />
        <LinhaFina />
        <EstadoErro compacto mensagem="Sem conexão com o servidor. Verifique sua internet e tente novamente." onTentarNovamente={() => {}} />
        <LinhaFina />
        <View style={styles.espaco} />
        <Esqueleto forma="linha" repeticoes={2} />
        <View style={styles.espaco} />
        <Esqueleto altura={72} repeticoes={1} />
      </Secao>

      <Secao titulo="HeroCheckIn — 3 estados (RN08)">
        <HeroCheckIn
          nomeTurma="Muay Thai — Turma A"
          professor="Mestre Kleber"
          inicio={new Date(Date.now() + 25 * 60000)}
          janelaInicio={new Date(Date.now() - 5 * 60000)}
          janelaFim={new Date(Date.now() + 55 * 60000)}
          estado={checkInDemoFeito ? 'realizado' : 'disponivel'}
          onCheckIn={() => setCheckInDemoFeito(true)}
        />
        {checkInDemoFeito ? <Botao titulo="Reiniciar demo" variante="texto" onPress={() => setCheckInDemoFeito(false)} /> : null}
        <View style={styles.espaco} />
        <HeroCheckIn
          nomeTurma="Boxe — Fundamentos"
          inicio={new Date(Date.now() + 150 * 60000)}
          janelaInicio={new Date(Date.now() + 120 * 60000)}
          janelaFim={new Date(Date.now() + 180 * 60000)}
          estado="foraDaJanela"
          onCheckIn={() => {}}
        />
        <View style={styles.espaco} />
        <HeroCheckIn
          nomeTurma="Muay Thai — Clinch"
          inicio={new Date(Date.now() - 20 * 60000)}
          janelaInicio={new Date(Date.now() - 50 * 60000)}
          janelaFim={new Date(Date.now() + 10 * 60000)}
          estado="realizado"
          onCheckIn={() => {}}
        />
      </Secao>

      <Secao titulo="Linhas de sessão (CartaoSessao + BotaoCheckIn)">
        <CartaoSessao nomeTurma="Muay Thai — Turma A" detalhe="com Mestre Kleber" inicio={new Date(Date.now() + 25 * 60000)} estado="disponivel" onCheckIn={() => {}} />
        <LinhaFina />
        <CartaoSessao nomeTurma="Boxe — Turma B" inicio={new Date(Date.now() + 26 * 3600000)} estado="foraDaJanela" motivo="Abre amanhã" />
        <LinhaFina />
        <CartaoSessao nomeTurma="Muay Thai — Turma C" inicio={new Date(Date.now() - 20 * 3600000)} estado="realizado" />
        <LinhaFina />
        <CartaoSessao nomeTurma="Sem horário (lista antiga)" detalhe="15/10/2026, 19:00" estado="disponivel" onCheckIn={() => {}} />
      </Secao>

      <Secao titulo="Progresso">
        <BarraProgresso nivel={4} xpAtual={320} xpProximoNivel={500} />
        <View style={styles.espaco} />
        <BarraProgresso nivel={11} xpAtual={1} xpProximoNivel={1} />
        <View style={styles.espaco} />
        <IndicadorSequencia treinos={7} />
      </Secao>

      <Secao titulo="Missões">
        <CartaoMissao titulo="Treine 3 vezes esta semana" descricao="Presença" progressoAtual={2} meta={3} pontos={30} />
        <LinhaFina />
        <CartaoMissao titulo="Primeiro check-in" descricao="Boas-vindas" progressoAtual={1} meta={1} concluida />
        <LinhaFina />
        <CartaoMissao titulo="500 pontos no mês" descricao="Pontuação" progressoAtual={320} meta={500} />
      </Secao>

      <Secao titulo="Medalhas">
        <Linha>
          <Medalha rotulo="10 treinos" tipo="treinos" numero={10} />
          <Medalha rotulo="7 treinos seguidos" tipo="sequencia" numero={7} />
          <Medalha rotulo="100 treinos" tipo="treinos" numero={100} maxima />
          <Medalha rotulo="Primeira graduação" tipo="graduacoes" numero={1} conquistada={false} />
        </Linha>
      </Secao>

      <Secao titulo="SeloFaixa (texto livre interpretado)">
        {['Faixa branca', 'Faixa azul, 2º grau', 'Roxa grau 3', 'Faixa marrom 1º grau', 'Faixa preta, 4º dan', 'Prajied vermelha', 'Kruang 5', 'Faixa não informada'].map((t) => (
          <View key={t} style={styles.amostraFaixa}>
            <SeloFaixa faixaOuGrau={t} />
          </View>
        ))}
        <View style={styles.espaco} />
        <Cartao corteDiagonal>
          <Texto variante="rotuloPlacar" alinhamento="center">
            Graduação
          </Texto>
          <View style={styles.espaco} />
          <SeloFaixa faixaOuGrau="Faixa preta, 2º grau" tamanho="grande" />
        </Cartao>
        <View style={styles.espaco} />
        <Botao titulo="Simular graduação registrada" variante="secundario" onPress={() => setCelebracaoAberta(true)} />
        <CelebracaoGraduacao
          visivel={celebracaoAberta}
          nomeAluno="Maria Silva"
          grau="Faixa azul, 1º grau"
          modalidade="Muay Thai"
          onFechar={() => setCelebracaoAberta(false)}
        />
      </Secao>

      <Secao titulo="Classificação">
        <Podio
          primeiro={{ posicao: 1, nome: 'Ana Beatriz', pontos: 980 }}
          segundo={{ posicao: 2, nome: 'Carlos Eduardo', pontos: 860, destaque: true }}
          terceiro={{ posicao: 3, nome: 'João Pedro', pontos: 790 }}
        />
        <LinhaClassificacao posicao={4} nome="Marina Costa" pontos={710} destaque />
        <LinhaFina />
        <LinhaClassificacao posicao={5} nome="Rafael Souza" pontos={640} />
      </Secao>

      <Secao titulo="Gestor: aluno e frequência">
        <CartaoAluno nome="Maria Silva" faixaOuGrau="Faixa azul" frequenciaRecente={[true, true, false, true, true]} />
        <LinhaFina />
        <CartaoAluno nome="Pedro Lima" faixaOuGrau="Faixa branca" frequenciaRecente={[true, false, false, false, false]} alerta="Queda de frequência" />
        <View style={styles.espaco} />
        <IndicadorFrequencia presencas={[true, false, true, true, true]} />
      </Secao>
    </Tela>
  );
}

const styles = StyleSheet.create({
  tituloGaleria: { marginBottom: Espacamento.padrao },
  secao: { marginBottom: Espacamento.extraGrande },
  linha: { flexDirection: 'row', gap: Espacamento.pequeno, marginBottom: Espacamento.pequeno, flexWrap: 'wrap', alignItems: 'flex-start' },
  pilha: { gap: Espacamento.pequeno },
  flex: { flex: 1, minWidth: 140 },
  espaco: { height: Espacamento.padrao },
  amostraTipo: { marginBottom: Espacamento.medio },
  paleta: { flexDirection: 'row', flexWrap: 'wrap', gap: Espacamento.padrao },
  swatch: { width: 96 },
  swatchCor: { height: 40, borderRadius: Raios.pequeno, borderWidth: 1, borderColor: Cores.linha, marginBottom: Espacamento.minimo },
  itemIcone: { width: 64, alignItems: 'center', gap: Espacamento.minimo },
  estatisticas: { marginTop: Espacamento.padrao, marginBottom: Espacamento.padrao },
  sangria: { marginHorizontal: -Espacamento.padrao },
  amostraFaixa: { marginBottom: Espacamento.pequeno },
  voltarComposicao: { paddingHorizontal: Espacamento.padrao },
  amostraTextura: { position: 'relative', backgroundColor: Cores.superficie1, borderRadius: Raios.pequeno, padding: Espacamento.padrao, overflow: 'hidden' },
});
