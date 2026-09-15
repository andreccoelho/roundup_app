// RF06: upload da foto de perfil. Caminho fixo por usuário (usuarios/{uid}/foto.jpg) — um novo
// envio sobrescreve o anterior, sem acumular arquivo órfão a cada troca de foto.
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from './firebase';

export async function enviarFotoPerfil(usuarioId: string, uriLocal: string): Promise<string> {
  const resposta = await fetch(uriLocal);
  const blob = await resposta.blob();
  const referencia = ref(storage, `usuarios/${usuarioId}/foto.jpg`);
  await uploadBytes(referencia, blob, { contentType: 'image/jpeg' });
  return getDownloadURL(referencia);
}
