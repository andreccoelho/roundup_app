// ItemMenu — linha de navegação de menu (perfil, configurações): ícone em tint, rótulo, chevron.
// É uma LinhaLista com a API antiga; vai dentro de um GrupoLista, que cuida dos separadores.
import type { ComponentType } from 'react';
import LinhaLista from './LinhaLista';

interface ItemMenuProps {
  rotulo: string;
  onPress: () => void;
  icone?: ComponentType<{ tamanho?: number; cor?: string }>;
  descricao?: string;
  valor?: string;
  destrutivo?: boolean;
  // Separador acima — o GrupoLista liga sozinho; fora de um grupo, a tela pode ligar
  separador?: boolean;
  separadorAcima?: boolean;
  semChevron?: boolean;
}

function ItemMenu({ separador, separadorAcima, ...resto }: ItemMenuProps) {
  return <LinhaLista {...resto} separadorAcima={separadorAcima ?? separador} />;
}

ItemMenu.desenhaSeparador = true;

export default ItemMenu;
