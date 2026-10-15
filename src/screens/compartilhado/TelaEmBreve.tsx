// Shell de navegação para abas cujo conteúdo depende de dados ainda bloqueados em
// firestore.rules ou de trabalho de tela ainda não feito. Existe para que a navegação fique
// completa e testável sem esperar o backend — nunca aba oculta, nunca tela em branco.
import Tela from '../../components/ui/Tela';
import EstadoVazio from '../../components/ui/EstadoVazio';
import { IconeRelogio } from '../../components/icones';

interface TelaEmBreveProps {
  titulo: string;
  descricao: string;
}

export default function TelaEmBreve({ titulo, descricao }: TelaEmBreveProps) {
  return (
    <Tela largura="lista" centralizarVertical>
      <EstadoVazio icone={IconeRelogio} titulo={titulo} descricao={descricao} />
    </Tela>
  );
}
