// RF31: preferências de notificação por tipo, compartilhada pelas 3 raízes (aluno/professor/
// academia — a lista de tipos é a mesma para todos os perfis). Persiste em
// usuarios.preferenciasNotificacao via atualizarUsuario() — a regra de usuarios.update já
// permite o próprio dono alterar qualquer campo (só confere que `perfil` não muda), sem
// precisar de mudança em firestore.rules.
//
// O envio é das Cloud Functions em functions/src/notificacoes.ts, que leem esta preferência a cada
// envio; o registro do aparelho (token) é feito no login, em src/services/notificacoes.ts.
// "Testar neste aparelho" manda uma notificação de exemplo de cada tipo só para o próprio usuário
// (Cloud Function enviarNotificacaoDeTeste), para validar o push no celular sem montar o cenário
// real — docs/ROTEIRO_TESTE_NOTIFICACOES.md.
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Espacamento } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { atualizarUsuario } from '../../services/usuarios';
import { enviarNotificacaoDeTeste, type StatusTeste } from '../../services/notificacoes';
import LinhaLista from '../../components/ui/LinhaLista';
import { PreferenciasNotificacao } from '../../types';
import Toggle from '../../components/ui/Toggle';
import Tela from '../../components/ui/Tela';
import Texto from '../../components/ui/Texto';
import GrupoLista from '../../components/ui/GrupoLista';
import { mensagemErro } from '../../utils/mensagensErro';

const PADRAO: PreferenciasNotificacao = { lembreteSessao: true, novaMissao: true, conquista: true };

const TIPOS: { chave: keyof PreferenciasNotificacao; titulo: string; descricao: string }[] = [
  { chave: 'lembreteSessao', titulo: 'Lembrete de sessão', descricao: 'Avisa antes do horário dos seus treinos agendados.' },
  { chave: 'novaMissao', titulo: 'Nova missão', descricao: 'Avisa quando uma missão nova for publicada para você.' },
  { chave: 'conquista', titulo: 'Conquista', descricao: 'Avisa quando você ganhar uma medalha ou subir de nível.' },
];

// O que cada resultado do teste quer dizer, em linguagem do usuário
const RESULTADO_TESTE: Record<StatusTeste, string> = {
  enviado: 'Enviado. Deve chegar em alguns segundos (com o app aberto ou fechado).',
  simulado: 'Simulado: o servidor está em modo de teste (emulador), nada sai para o celular.',
  semDispositivo: 'Este aparelho não está registrado. Confira se permitiu notificações e se está no app instalado (não no Expo Go nem na web).',
  desligado: 'Este tipo de aviso está desligado acima. Ligue e teste de novo.',
  erro: 'O serviço de push recusou o envio. Veja a coleção "notificacoes" e o log das functions.',
};

export default function PreferenciasNotificacaoScreen() {
  const { usuario } = useAuth();
  const [preferencias, setPreferencias] = useState<PreferenciasNotificacao>(PADRAO);
  const [salvandoChave, setSalvandoChave] = useState<keyof PreferenciasNotificacao | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [testando, setTestando] = useState<keyof PreferenciasNotificacao | null>(null);
  const [resultadoTeste, setResultadoTeste] = useState<string | null>(null);

  async function handleTestar(chave: keyof PreferenciasNotificacao, titulo: string) {
    if (!usuario || testando) return;
    setTestando(chave);
    setResultadoTeste(null);
    try {
      const status = await enviarNotificacaoDeTeste(usuario.id, chave);
      setResultadoTeste(`${titulo}: ${RESULTADO_TESTE[status]}`);
    } catch (e) {
      setResultadoTeste(`${titulo}: ${mensagemErro(e, 'Não foi possível pedir o teste agora. Tente de novo em alguns segundos.')}`);
    } finally {
      setTestando(null);
    }
  }

  useEffect(() => {
    if (usuario?.preferenciasNotificacao) {
      setPreferencias(usuario.preferenciasNotificacao);
    }
  }, [usuario]);

  async function handleAlternar(chave: keyof PreferenciasNotificacao) {
    if (!usuario) return;
    const novasPreferencias = { ...preferencias, [chave]: !preferencias[chave] };
    setErro(null);
    setSalvandoChave(chave);
    try {
      await atualizarUsuario(usuario.id, { preferenciasNotificacao: novasPreferencias });
      setPreferencias(novasPreferencias);
    } catch (e: any) {
      setErro(mensagemErro(e, 'Não foi possível salvar a preferência. Tente novamente.'));
    } finally {
      setSalvandoChave(null);
    }
  }

  return (
    <Tela largura="lista" agrupada>
      <Texto variante="subheadline" style={styles.intro}>
        Escolha quais avisos o RoundUp pode mandar para você.
      </Texto>
      {erro ? (
        <Texto variante="subheadline" cor="perigo" style={styles.erro} accessibilityRole="alert" accessibilityLiveRegion="polite">
          {erro}
        </Texto>
      ) : null}

      <GrupoLista semMargem rodape="As mudanças valem na hora, para este e para os outros aparelhos em que você entrar.">
        {TIPOS.map(({ chave, titulo, descricao }) => (
          <Toggle
            key={chave}
            rotulo={titulo}
            descricao={descricao}
            valor={preferencias[chave]}
            desabilitado={salvandoChave === chave}
            onAlterar={() => handleAlternar(chave)}
          />
        ))}
      </GrupoLista>

      <GrupoLista
        titulo="Testar neste aparelho"
        rodape={resultadoTeste ?? 'Manda um aviso de exemplo só para você, pelo mesmo caminho dos avisos de verdade.'}
      >
        {TIPOS.map(({ chave, titulo }) => (
          <LinhaLista
            key={`teste-${chave}`}
            rotulo={testando === chave ? `Enviando ${titulo.toLowerCase()}…` : `Enviar teste: ${titulo.toLowerCase()}`}
            semChevron
            onPress={() => handleTestar(chave, titulo)}
            accessibilityLabel={`Enviar notificação de teste: ${titulo}`}
          />
        ))}
      </GrupoLista>
    </Tela>
  );
}

const styles = StyleSheet.create({
  intro: { marginBottom: Espacamento.padrao, marginHorizontal: Espacamento.padrao },
  erro: { marginBottom: Espacamento.padrao },
});
