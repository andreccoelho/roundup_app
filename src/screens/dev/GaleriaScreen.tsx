// Galeria de componentes — acessível só em __DEV__ (a rota só é registrada em AuthStack.tsx
// quando __DEV__ é true; este guard extra é defesa em profundidade). Mostra todas as variantes
// e estados dos componentes de src/components/ui/, para revisão sem precisar rodar cada fluxo
// real (ver SCRIPT.md, Passo 2).
import { useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Cores, Espacamento, FamiliaFonte, Raios, TamanhoFonte } from '../../theme';

import {
  IconeLuva,
  IconeFichaTecnica,
  IconeBandeira,
  IconeCartaoPontuacao,
  IconePerfil,
  IconeSino,
  IconeTatame,
  IconeFaixa,
} from '../../components/icones';
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
import Aviso from '../../components/ui/Aviso';
import Abas from '../../components/ui/Abas';
import EstadoVazio from '../../components/ui/EstadoVazio';
import EstadoErro from '../../components/ui/EstadoErro';
import Esqueleto from '../../components/ui/Esqueleto';

import BotaoCheckIn from '../../components/ui/BotaoCheckIn';
import CartaoSessao from '../../components/ui/CartaoSessao';
import BarraProgresso from '../../components/ui/BarraProgresso';
import CartaoMissao from '../../components/ui/CartaoMissao';
import Medalha from '../../components/ui/Medalha';
import IndicadorSequencia from '../../components/ui/IndicadorSequencia';
import LinhaClassificacao from '../../components/ui/LinhaClassificacao';
import SeloFaixa from '../../components/ui/SeloFaixa';
import CartaoAluno from '../../components/ui/CartaoAluno';
import IndicadorFrequencia from '../../components/ui/IndicadorFrequencia';

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <View style={styles.secao}>
      <Text style={styles.secaoTitulo}>{titulo}</Text>
      {children}
    </View>
  );
}

function Linha({ children }: { children: ReactNode }) {
  return <View style={styles.linha}>{children}</View>;
}

export default function GaleriaScreen() {
  if (!__DEV__) return null;

  const [modalidades, setModalidades] = useState<string[]>(['Boxe']);
  const [outraModalidade, setOutraModalidade] = useState('');
  const [folhaAberta, setFolhaAberta] = useState(false);
  const [dialogoAberto, setDialogoAberto] = useState(false);
  const [avisoVisivel, setAvisoVisivel] = useState(false);
  const [aba, setAba] = useState<'em-curso' | 'concluidas'>('em-curso');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.conteudo}>
      <Text style={styles.tituloGaleria}>Galeria de componentes</Text>

      <Secao titulo="Teste de acentuação — Homebase">
        <Text style={styles.tituloScreenHomebase}>Coração</Text>
        <Text style={styles.tituloScreenHomebase}>Ação</Text>
        <Text style={styles.tituloScreenHomebase}>Vínculo</Text>
        <Text style={styles.notaTecnica}>
          Fonte "Homebase", tamanho de título de tela (xxl). Checagem de cobertura de glifos via
          cmap: ã, Ã, ç, Ç, í, Í presentes no arquivo (assets/fonts/homebase.ttf) — falta
          confirmação visual de kerning/legibilidade neste tamanho.
        </Text>
      </Secao>

      <Secao titulo="Ícones da tab bar — uma metáfora por aba">
        <View style={styles.linhaIcones}>
          <View style={styles.itemIcone}>
            <IconeLuva tamanho={24} cor={Cores.preto} />
            <Text style={styles.rotuloIcone}>Treinar</Text>
          </View>
          <View style={styles.itemIcone}>
            <IconeFichaTecnica tamanho={24} cor={Cores.preto} />
            <Text style={styles.rotuloIcone}>Agenda</Text>
          </View>
          <View style={styles.itemIcone}>
            <IconeBandeira tamanho={24} cor={Cores.preto} />
            <Text style={styles.rotuloIcone}>Missões</Text>
          </View>
          <View style={styles.itemIcone}>
            <IconeCartaoPontuacao tamanho={24} cor={Cores.preto} />
            <Text style={styles.rotuloIcone}>Classificação</Text>
          </View>
          <View style={styles.itemIcone}>
            <IconePerfil tamanho={24} cor={Cores.preto} />
            <Text style={styles.rotuloIcone}>Perfil</Text>
          </View>
        </View>
        <View style={styles.linhaIcones}>
          <View style={styles.itemIcone}>
            <IconeSino tamanho={24} cor={Cores.preto} />
            <Text style={styles.rotuloIcone}>Hoje</Text>
          </View>
          <View style={styles.itemIcone}>
            <IconeTatame tamanho={24} cor={Cores.preto} />
            <Text style={styles.rotuloIcone}>Turmas</Text>
          </View>
          <View style={styles.itemIcone}>
            <IconeFaixa tamanho={24} cor={Cores.preto} />
            <Text style={styles.rotuloIcone}>Alunos</Text>
          </View>
        </View>
        <Text style={styles.notaTecnica}>
          IconeLuva, IconeSino e IconeFaixa já existiam (reaproveitados aqui); IconeFichaTecnica,
          IconeBandeira, IconeCartaoPontuacao, IconePerfil e IconeTatame são novos.
        </Text>
      </Secao>

      <Secao titulo="Botao — variantes">
        <Linha>
          <Botao titulo="Primário" onPress={() => {}} />
          <Botao titulo="Secundário" variante="secundario" onPress={() => {}} />
        </Linha>
        <Linha>
          <Botao titulo="Fantasma" variante="fantasma" onPress={() => {}} />
          <Botao titulo="Destrutivo" variante="destrutivo" onPress={() => {}} />
        </Linha>
        <Linha>
          <Botao titulo="Carregando" onPress={() => {}} carregando />
          <Botao titulo="Desabilitado" onPress={() => {}} desabilitado />
        </Linha>
        <Botao titulo="Texto (link)" variante="texto" onPress={() => {}} />
      </Secao>

      <Secao titulo="Campo (CampoTexto)">
        <CampoTexto rotulo="Texto" placeholder="Exemplo" valor="" onAlterar={() => {}} />
        <CampoTexto rotulo="Senha" placeholder="••••••••" secureTextEntry valor="" onAlterar={() => {}} />
        <CampoTexto rotulo="Com erro" placeholder="Exemplo" valor="" onAlterar={() => {}} erro="Mensagem de erro." />
        <ModalitySelector
          rotulo="Seleção (ModalitySelector)"
          selecionadas={modalidades}
          outraTexto={outraModalidade}
          onAlterarSelecionadas={setModalidades}
          onAlterarOutraTexto={setOutraModalidade}
        />
      </Secao>

      <Secao titulo="Cartao">
        <Cartao>
          <Text style={styles.textoDemo}>Cartão padrão (raio médio, borda 1px).</Text>
        </Cartao>
        <View style={styles.espaco} />
        <Cartao raio={16}>
          <Text style={styles.textoDemo}>Cartão com raio grande — tratamento distinto para outro tipo de conteúdo.</Text>
        </Cartao>
        <View style={styles.espaco} />
        <Cartao corteDiagonal corFundo={Cores.cinzaFundo}>
          <Text style={styles.textoDemo}>corteDiagonal — script.md, item 1: "placa de ringue", não retângulo uniforme.</Text>
        </Cartao>
      </Secao>

      <Secao titulo="TexturaLona — script.md, item 1 (fundo sutil para telas-chave)">
        <View style={styles.amostraTextura}>
          <TexturaLona opacidade={0.12} />
          <Text style={styles.textoDemo}>opacidade ampliada aqui (0.12) só pra essa amostra ficar visível — uso real é bem mais discreto (0.05).</Text>
        </View>
      </Secao>

      <Secao titulo="Etiqueta">
        <Linha>
          <Etiqueta texto="iniciante" onPress={() => {}} />
          <Etiqueta texto="intermediario" selecionada onPress={() => {}} />
          <Etiqueta texto="avancado" desabilitada onPress={() => {}} />
        </Linha>
      </Secao>

      <Secao titulo="Avatar">
        <Linha>
          <Avatar nome="Maria Silva" tamanho={32} />
          <Avatar nome="João" tamanho={40} />
          <Avatar nome="Ana Beatriz Souza" tamanho={56} />
        </Linha>
      </Secao>

      <Secao titulo="Divisor (LinhaFina)">
        <Text style={styles.textoDemo}>Acima</Text>
        <LinhaFina />
        <Text style={styles.textoDemo}>Abaixo</Text>
      </Secao>

      <Secao titulo="Abas">
        <Abas
          opcoes={[
            { valor: 'em-curso', rotulo: 'Em curso' },
            { valor: 'concluidas', rotulo: 'Concluídas' },
          ]}
          selecionada={aba}
          onSelecionar={setAba}
        />
      </Secao>

      <Secao titulo="Folha (bottom sheet)">
        <Botao titulo="Abrir folha" variante="secundario" onPress={() => setFolhaAberta(true)} />
        <Folha visivel={folhaAberta} onFechar={() => setFolhaAberta(false)}>
          <Text style={styles.textoDemo}>Conteúdo da folha.</Text>
          <View style={styles.espaco} />
          <Botao titulo="Fechar" onPress={() => setFolhaAberta(false)} />
        </Folha>
      </Secao>

      <Secao titulo="Dialogo">
        <Botao titulo="Abrir diálogo" variante="secundario" onPress={() => setDialogoAberto(true)} />
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

      <Secao titulo="Aviso (toast)">
        <Botao titulo="Mostrar aviso" variante="secundario" onPress={() => setAvisoVisivel(true)} />
        <Aviso mensagem="Check-in registrado." visivel={avisoVisivel} onFechar={() => setAvisoVisivel(false)} />
      </Secao>

      <Secao titulo="EstadoVazio">
        <EstadoVazio
          titulo="Nenhuma turma criada ainda"
          descricao="Crie sua primeira turma para começar a receber alunos."
          acaoTitulo="Criar turma"
          onAcao={() => {}}
        />
      </Secao>

      <Secao titulo="EstadoErro">
        <EstadoErro mensagem="Não foi possível carregar seus dados." onTentarNovamente={() => {}} />
      </Secao>

      <Secao titulo="Esqueleto (shimmer)">
        <Esqueleto altura={72} repeticoes={3} />
      </Secao>

      <Secao titulo="BotaoCheckIn — 3 estados de RN08">
        <Linha>
          <BotaoCheckIn estado="disponivel" onPress={() => {}} />
          <BotaoCheckIn estado="disponivel" carregando onPress={() => {}} />
        </Linha>
        <View style={styles.espaco} />
        <BotaoCheckIn estado="foraDaJanela" motivo="Check-in ainda não abriu" />
        <View style={styles.espaco} />
        <BotaoCheckIn estado="realizado" />
      </Secao>

      <Secao titulo="CartaoSessao">
        <CartaoSessao nomeTurma="Muay Thai — Turma A" detalhe="Hoje, 19:00" estado="disponivel" onCheckIn={() => {}} />
        <LinhaFina />
        <CartaoSessao nomeTurma="Boxe — Turma B" detalhe="Amanhã, 07:00 · Prof. Carlos" estado="foraDaJanela" motivo="Check-in ainda não abriu" />
        <LinhaFina />
        <CartaoSessao nomeTurma="Jiu-Jitsu — Turma C" detalhe="Ontem, 20:00" estado="realizado" />
      </Secao>

      <Secao titulo="BarraProgresso (Ciclo 2, sem consumidor real ainda)">
        <BarraProgresso nivel={4} xpAtual={320} xpProximoNivel={500} />
      </Secao>

      <Secao titulo="CartaoMissao (Ciclo 2, sem consumidor real ainda)">
        <CartaoMissao titulo="Treine 3 vezes esta semana" descricao="Missão semanal" progressoAtual={2} meta={3} />
        <View style={styles.espaco} />
        <CartaoMissao titulo="Primeiro check-in" descricao="Missão de boas-vindas" progressoAtual={1} meta={1} concluida />
      </Secao>

      <Secao titulo="Medalha (Ciclo 2, sem consumidor real ainda)">
        <Linha>
          <Medalha rotulo="10 treinos" />
          <Medalha rotulo="30 dias seguidos" conquistada={false} />
        </Linha>
      </Secao>

      <Secao titulo="IndicadorSequencia (Ciclo 2, sem consumidor real ainda)">
        <IndicadorSequencia dias={7} />
      </Secao>

      <Secao titulo="LinhaClassificacao (Ciclo 2, sem consumidor real ainda)">
        <LinhaClassificacao posicao={1} nome="Ana Beatriz" pontos={980} destaque />
        <LinhaFina />
        <LinhaClassificacao posicao={2} nome="Carlos Eduardo" pontos={860} />
      </Secao>

      <Secao titulo="SeloFaixa — usado na banda de topo do Dashboard do Aluno">
        <SeloFaixa faixaOuGrau="Faixa roxa, 2º grau" />
        <View style={styles.amostraEscura}>
          <SeloFaixa faixaOuGrau="Faixa roxa, 2º grau" sobreEscuro />
        </View>
      </Secao>

      <Secao titulo="CartaoAluno (Ciclo 3, sem consumidor real ainda)">
        <CartaoAluno nome="Maria Silva" faixaOuGrau="Faixa azul" frequenciaRecente={[true, true, false, true, true]} />
      </Secao>

      <Secao titulo="IndicadorFrequencia (Ciclo 3, sem consumidor real ainda)">
        <IndicadorFrequencia presencas={[true, false, true, true, true]} />
      </Secao>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Cores.branco },
  conteudo: { padding: Espacamento.padrao, paddingBottom: Espacamento.enorme },
  tituloGaleria: { fontSize: TamanhoFonte.xxl, fontWeight: '700', color: Cores.preto, marginBottom: Espacamento.padrao },

  secao: { marginBottom: Espacamento.grande },
  secaoTitulo: { fontSize: TamanhoFonte.sm, color: Cores.cinzaMedio, marginBottom: Espacamento.pequeno, fontWeight: '600' },

  linha: { flexDirection: 'row', gap: Espacamento.pequeno, marginBottom: Espacamento.pequeno, flexWrap: 'wrap' },
  espaco: { height: Espacamento.pequeno },
  textoDemo: { fontSize: TamanhoFonte.sm, color: Cores.preto },
  notaTecnica: { fontSize: TamanhoFonte.xs, color: Cores.cinzaMedio, marginTop: Espacamento.pequeno },
  linhaIcones: { flexDirection: 'row', flexWrap: 'wrap', gap: Espacamento.grande, marginBottom: Espacamento.pequeno },
  itemIcone: { alignItems: 'center', width: 72, gap: Espacamento.minimo },
  rotuloIcone: { fontSize: TamanhoFonte.xs, color: Cores.cinzaMedio, textAlign: 'center' },

  tituloScreenHomebase: { fontFamily: FamiliaFonte.homebaseDisplay, fontSize: TamanhoFonte.xxl, color: Cores.preto },

  amostraEscura: {
    backgroundColor: Cores.preto,
    borderRadius: Raios.medio,
    padding: Espacamento.padrao,
    marginTop: Espacamento.pequeno,
    alignItems: 'flex-start',
  },
  amostraTextura: {
    position: 'relative',
    backgroundColor: Cores.branco,
    borderWidth: 1,
    borderColor: Cores.cinzaBorda,
    borderRadius: Raios.medio,
    padding: Espacamento.padrao,
    overflow: 'hidden',
  },
});
