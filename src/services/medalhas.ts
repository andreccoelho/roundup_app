// RF19: medalhas conquistadas do aluno, com data. Só leitura — quem grava é a Cloud Function
// concederMedalhasNoCheckIn / concederMedalhasNaGraduacao (functions/src/medalhas.ts).
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { MedalhaConquistada } from '../types';

export async function listarMedalhasDoAluno(alunoId: string): Promise<MedalhaConquistada[]> {
  const snap = await getDocs(collection(db, 'usuarios', alunoId, 'medalhas'));
  return snap.docs.map((d) => d.data() as MedalhaConquistada);
}
