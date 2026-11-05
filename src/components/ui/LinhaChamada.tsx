// LinhaChamada — aluno na chamada do professor (RF13, RF22, RN02, RN08), dentro de um GrupoLista:
// avatar, nome, situação em Footnote e, à direita, um controle claro de presença — o círculo de
// check do iOS (vazio = confirmar; verde preenchido = presente), com haptic leve ao marcar. Quem
// ainda não fez check-in não tem controle (o responsável não cria check-in pelo aluno). Papel
// "switch" para leitor de tela, como antes.
import { ActivityIndicator, Pressable, View } from 'react-native';
import { Alturas, criarEstilos, Espacamento, useTema } from '../../theme';
import { estiloAnelFoco, estiloSemOutline, useFocoVisivel } from '../../hooks/useFocoVisivel';
import { hapticaImpacto } from '../../utils/haptica';
import { IconeCheckCirculo, IconeCirculo } from '../icones';
import LinhaFina from '../LinhaFina';
import Avatar from './Avatar';
import Texto from './Texto';

export type StatusChamada = 'aguardando' | 'pendente' | 'validado' | 'rejeitado';

interface LinhaChamadaProps {
  nome: string;
  fotoUrl?: string;
  status: StatusChamada;
  processando?: boolean;
  onAlternar: () => void;
  separadorAcima?: boolean;
}

const SITUACAO: Record<StatusChamada, string> = {
  aguardando: 'Sem check-in',
  pendente: 'Fez check-in, confirme a presença',
  validado: 'Presente',
  rejeitado: 'Rejeitado',
};

const RECUO = Espacamento.padrao + 36 + Espacamento.medio;

function LinhaChamada({ nome, fotoUrl, status, processando, onAlternar, separadorAcima }: LinhaChamadaProps) {
  const { cores } = useTema();
  const styles = useEstilos();
  const { focado, propsFoco } = useFocoVisivel();
  const presente = status === 'validado';
  const temControle = status === 'pendente' || status === 'validado';

  return (
    <View>
      {separadorAcima ? <LinhaFina recuo={RECUO} /> : null}
      <View style={styles.linha}>
        <Avatar nome={nome} fotoUrl={fotoUrl} tamanho={36} />
        <View style={styles.textos}>
          <Texto variante="body" numberOfLines={1}>
            {nome}
          </Texto>
          <Texto variante="footnote" cor={status === 'rejeitado' ? 'perigo' : presente ? 'sucesso' : 'texto2'}>
            {SITUACAO[status]}
          </Texto>
        </View>
        {temControle ? (
          <Pressable
            onPress={() => {
              hapticaImpacto();
              onAlternar();
            }}
            disabled={processando}
            hitSlop={8}
            accessibilityRole="switch"
            accessibilityLabel={`Presença de ${nome}`}
            accessibilityState={{ checked: presente, disabled: Boolean(processando), busy: Boolean(processando) }}
            aria-checked={presente}
            style={({ pressed }) => [styles.controle, pressed && styles.pressionado, estiloSemOutline, focado && estiloAnelFoco]}
            {...propsFoco}
          >
            {processando ? (
              <ActivityIndicator color={cores.texto2} />
            ) : presente ? (
              <IconeCheckCirculo tamanho={30} cor={cores.sucesso} preenchido />
            ) : (
              <IconeCirculo tamanho={30} cor={cores.texto3} espessura={1.75} />
            )}
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

LinhaChamada.desenhaSeparador = true;

export default LinhaChamada;

const useEstilos = criarEstilos(() => ({
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacamento.medio,
    minHeight: Alturas.linha + 12,
    paddingVertical: Espacamento.pequeno,
    paddingHorizontal: Espacamento.padrao,
  },
  textos: { flex: 1, gap: 1 },
  controle: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: -6, borderRadius: 22 },
  pressionado: { opacity: 0.6 },
}));
