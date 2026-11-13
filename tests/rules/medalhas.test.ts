// RF19: usuarios/{alunoId}/medalhas — lidas pelo aluno e pelos responsáveis dele; nunca escritas
// pelo client (a Cloud Function concederMedalhas* grava com Admin SDK).
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import {
  iniciarAmbiente, encerrarAmbiente, limparDados, comoUsuario, semear,
  usuarioBase, vinculosPrivadoBase, AGORA,
} from './helpers';

beforeAll(iniciarAmbiente);
afterAll(encerrarAmbiente);
afterEach(limparDados);

const MEDALHA = {
  id: 'treinos-10', tipo: 'treinos', quantidade: 10, rotulo: '10 treinos',
  conquistadaEm: AGORA, origem: 'checkin', registradaEm: AGORA,
};

async function semearCenario() {
  await semear(async (db) => {
    await setDoc(doc(db, 'usuarios', 'academia1'), usuarioBase({ perfil: 'academia' }));
    await setDoc(doc(db, 'usuarios', 'academia2'), usuarioBase({ perfil: 'academia' }));
    await setDoc(doc(db, 'usuarios', 'aluno1'), usuarioBase({ perfil: 'aluno' }));
    await setDoc(doc(db, 'usuarios', 'aluno2'), usuarioBase({ perfil: 'aluno' }));
    await setDoc(doc(db, 'usuarios', 'aluno1', 'privado', 'vinculos'), vinculosPrivadoBase(['academia1']));
    await setDoc(doc(db, 'usuarios', 'aluno1', 'medalhas', 'treinos-10'), MEDALHA);
  });
}

describe('medalhas (RF19)', () => {
  test('aluno lê as próprias medalhas, um documento e a coleção inteira', async () => {
    await semearCenario();
    const db = comoUsuario('aluno1');
    await assertSucceeds(getDoc(doc(db, 'usuarios', 'aluno1', 'medalhas', 'treinos-10')));
    const snap = await assertSucceeds(getDocs(collection(db, 'usuarios', 'aluno1', 'medalhas')));
    expect(snap.size).toBe(1);
  });

  test('responsável com vínculo aceito lê; outro responsável e outro aluno não', async () => {
    await semearCenario();
    await assertSucceeds(getDocs(collection(comoUsuario('academia1'), 'usuarios', 'aluno1', 'medalhas')));
    await assertFails(getDocs(collection(comoUsuario('academia2'), 'usuarios', 'aluno1', 'medalhas')));
    await assertFails(getDoc(doc(comoUsuario('aluno2'), 'usuarios', 'aluno1', 'medalhas', 'treinos-10')));
  });

  test('aluno não se dá medalha nem mexe na data', async () => {
    await semearCenario();
    const db = comoUsuario('aluno1');
    await assertFails(setDoc(doc(db, 'usuarios', 'aluno1', 'medalhas', 'treinos-100'), { ...MEDALHA, id: 'treinos-100' }));
    await assertFails(updateDoc(doc(db, 'usuarios', 'aluno1', 'medalhas', 'treinos-10'), { conquistadaEm: AGORA }));
    await assertFails(deleteDoc(doc(db, 'usuarios', 'aluno1', 'medalhas', 'treinos-10')));
  });

  test('responsável também não escreve medalha', async () => {
    await semearCenario();
    await assertFails(setDoc(doc(comoUsuario('academia1'), 'usuarios', 'aluno1', 'medalhas', 'sequencia-7'), { ...MEDALHA, id: 'sequencia-7' }));
  });
});
