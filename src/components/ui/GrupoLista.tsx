// GrupoLista — seção de lista agrupada inserida (inset grouped) do iOS: cabeçalho em Footnote,
// bloco em `superficie` com raio 12 contínuo e rodapé explicativo opcional. Padrão para perfil,
// configurações, alunos, turmas e missões. Separadores recuados entre as linhas: LinhaLista,
// Toggle e ItemMenu desenham o próprio (marca `desenhaSeparador`); qualquer outro filho ganha uma
// linha recuada de 16pt acima.
import { Children, cloneElement, Fragment, isValidElement, type ReactElement, type ReactNode } from 'react';
import { View } from 'react-native';
import { criarEstilos, Espacamento, Raios } from '../../theme';
import LinhaFina from '../LinhaFina';
import Texto from './Texto';

interface GrupoListaProps {
  titulo?: string;
  rodape?: string;
  children: ReactNode;
  // Sem margem superior (primeiro grupo da tela)
  semMargem?: boolean;
}

function desenhaSeparador(filho: ReactElement): boolean {
  return Boolean((filho.type as { desenhaSeparador?: boolean }).desenhaSeparador);
}

export default function GrupoLista({ titulo, rodape, children, semMargem }: GrupoListaProps) {
  const styles = useEstilos();
  const filhos = Children.toArray(children).filter(isValidElement) as ReactElement<{ separadorAcima?: boolean }>[];

  return (
    <View style={[styles.grupo, !semMargem && styles.margem]}>
      {titulo ? (
        <Texto variante="footnote" cabecalho style={styles.titulo}>
          {titulo}
        </Texto>
      ) : null}
      <View style={styles.bloco}>
        {filhos.map((filho, i) => {
          if (i === 0) return filho;
          if (desenhaSeparador(filho)) return cloneElement(filho, { separadorAcima: true });
          return (
            <Fragment key={filho.key ?? i}>
              <LinhaFina recuo={Espacamento.padrao} />
              {filho}
            </Fragment>
          );
        })}
      </View>
      {rodape ? (
        <Texto variante="footnote" style={styles.rodape}>
          {rodape}
        </Texto>
      ) : null}
    </View>
  );
}

const useEstilos = criarEstilos((c) => ({
  grupo: {},
  margem: { marginTop: Espacamento.grande + Espacamento.minimo },
  titulo: { marginLeft: Espacamento.padrao, marginBottom: Espacamento.pequeno - 2 },
  bloco: { backgroundColor: c.superficie, borderRadius: Raios.lista, borderCurve: 'continuous', overflow: 'hidden' },
  rodape: { marginHorizontal: Espacamento.padrao, marginTop: Espacamento.pequeno - 2 },
}));
