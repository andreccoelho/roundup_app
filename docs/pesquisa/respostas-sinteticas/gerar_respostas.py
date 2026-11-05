"""RoundUp: geracao das 65 respostas SINTETICAS usadas apenas para testar o
formulario e a analise (TCC, Apendice C). Nao sao dados de pesquisa.

Gera respostas.json com chaves = indice do item no Google Forms (ver
enviar_respostas.gs). Semente fixa (26102026): a saida e reproduzivel.
Uso: python3 gerar_respostas.py
"""
import os
import json, random
random.seed(26102026)
R = random.choice
def pick(lst, k): return random.sample(lst, k)

MOD = ["Boxe","Muay Thai","Jiu-Jitsu","Karatê","Taekwondo","Judô","MMA"]
MODW = ["Jiu-Jitsu"]*5+["Muay Thai"]*3+["Boxe"]*3+["MMA","Judô","Karatê","Taekwondo"]
MOTIVOS_AT = ["Saúde física e condicionamento","Saúde mental e alívio do estresse","Evolução técnica e aprendizado","Competição","Amizades e convívio com a turma","Relação com o professor","Defesa pessoal","Estética e composição corporal","Disciplina e rotina"]
FAT = ["Falta de tempo ou conflito com a rotina","Questões financeiras","Não perceber evolução técnica","Ausência de metas claras","Lesão ou problema de saúde","Vergonha, insegurança ou intimidação","Falta de vínculo com a turma","Pouca proximidade com o professor","Horários das aulas","Mudança de cidade ou bairro","Cansaço e desgaste da rotina de treino","Perda de interesse pela modalidade"]
AGES = ["Menos que 18 anos","18 a 24 anos","25 a 34 anos","35 a 44 anos","45 a 54 anos","55 anos ou mais"]

def gender(age):
    r = random.random()
    return "Prefiro não dizer" if r<0.04 else ("Feminino" if r<0.36 else "Masculino")

# likert archetypes
def likert(n, arche, social_idx=(), notif_idx=(), comp_idx=()):
    if arche=="uniforme": v=R([5,4,5,3]); return [v]*n
    out=[]
    for i in range(n):
        if arche=="moderado": x=R([3,4,4,4,3,5])
        elif arche=="entusiasta": x=R([5,5,4,5,4])
        elif arche=="critico": x=R([1,1,2,2,3])
        elif arche=="privado": x=R([4,5,4,3])
        else: x=R([2,3,4,4,5])
        if arche=="critico" and i in (8,): x=R([3,4])
        if arche=="privado" and (i in social_idx or i in comp_idx): x=R([1,1,2])
        if arche in ("moderado","misto") and i in notif_idx and random.random()<0.35: x=R([1,2])
        if arche=="entusiasta" and i in notif_idx: x=R([2,3,4])
        out.append(x)
    return out

def arche_for(age):
    if age in AGES[:2]: return R(["entusiasta","entusiasta","moderado","uniforme","misto","privado"])
    if age==AGES[2]: return R(["moderado","privado","misto","uniforme","entusiasta"])
    return R(["moderado","uniforme","critico","misto","critico","privado"])

def maybe(lst, p_blank=0.0):
    return "" if random.random()<p_blank else R(lst)

# ---------- banks ----------
B_PARAR_Y = ["nao","Não","Não ","sim pq as vezes da preguiça","Sim, epoca de prova","nunca","Nao","sim, quando machuquei o pé","Não pensei"]
B_PARAR = ["Nao","Não ","Sim, falta de tempo","sim , trabalho","Sim, quando me machuquei","Ja pensei por causa da grana","Sim, cansaço do dia a dia","Sim, quando mudei de horario no trabalho","Sim , lesão no ombro","As vezes bate preguiça","Sim, filho pequeno","Sim, contusão no joelho","Só na pandemia","Sim, quando mudei de emprego"]
B_HAB = ["Nenhum","Nao","Não ","duolingo","Duolingo, a ofensiva","Strava","Nike run, ver o historico","Não lembro","Duolingo, nao queria perder a sequencia","nenhum","Não","app da academia de musculação","Smart fit app"]
B_FUNC_Y = ["Ranking","ranking","Sim","Desafios entre a turma","nao sei","Ver quem treina mais","Medalhas","Ver o que falta pra trocar de faixa","Video das posições"]
B_FUNC = ["Não sei","Nao sei","ver minha frequencia","Ver quantos treinos fiz","Nada","Vídeo das posições","Lembrar a data da graduação","Não consigo opinar","Ver o que falta pra trocar de faixa","Desconto pra quem for mais","Agendar aula","Avisar quando a aula for cancelada","Histórico"]
B_DESINST = ["Nada","nada","Muita notificação","Ficar pedindo pra marcar tudo","Inserir muitos dados","Ocupar muito espaço","Se ficasse travando","Propaganda","Parar de treinar","Nenhum","Ser chato de usar","Muitas notificações"]
B_INFO = ["Frequência","Frequencia","Nada","Sim","Quantos treinos fiz","As posições que aprendi","Não sei","Evolução","Quantas aulas faltam pra graduar","Nenhuma","Frequência ","Os treinos que fiz no mês"]
B_COMENT = ["Não","Nao","Não ","","","","Achei bem legal","Boa sorte","Sucesso no tcc","Ideia boa","Achei valido","Parabéns pela iniciativa","nao","Boa sorte no trabalho"]

RELATO = {
 "Falta de tempo ou conflito com a rotina":["Trabalho apertou","A rotina foi complicando","Comecei a trabalhar a noite","Mudei de emprego e não deu mais","Fui faltando e parei","Não conseguia mais conciliar com o trabalho"],
 "Questões financeiras":["Ficou caro","Perdi o emprego","Aumentou a mensalidade","Tive que cortar gastos","Perdi o estágio e não deu pra manter a mensalidade"],
 "Lesão ou problema de saúde":["Machuquei o joelho","Lesão no ombro e não voltei","Fiquei parado por lesão e perdi o ritmo","Machuquei as costas, fiquei umas semanas parado e fui perdendo o ritmo"],
 "Horários das aulas":["Horário não batia com a faculdade","Mudaram o horário da turma","Faculdade a noite bateu com o treino"],
 "Mudança de cidade ou bairro":["Mudei de bairro","Me mudei de cidade","Academia ficou longe","Ficou longe e fui deixando"],
 "Vergonha, insegurança ou intimidação":["Me sentia deslocado na turma","Tinha muita gente mais experiente e eu ficava sem graça","Fiquei com vergonha de treinar com o pessoal mais forte"],
 "Falta de vínculo com a turma":["A turma mudou e perdi a vontade","Meus amigos saíram da academia"],
 "Não perceber evolução técnica":["Sentia que não evoluía","Ficava sempre na mesma, sem evoluir"],
 "Cansaço e desgaste da rotina de treino":["Cansei","Muito cansativo junto com trabalho e faculdade"],
 "Perda de interesse pela modalidade":["Perdi o interesse","Enjoei"],
 "Pouca proximidade com o professor":["Trocou o professor e não gostei","O professor não dava atenção pra turma iniciante"],
 "Ausência de metas claras":["Não sabia pra onde tava indo","Sem objetivo acabei largando"],
}
VOLTAR = {
 "Falta de tempo ou conflito com a rotina":["Tempo","Tempo ","Ter mais tempo","Mudar de emprego"],
 "Questões financeiras":["Dinheiro","Preço","Arrumar emprego","Mensalidade mais barata"],
 "Lesão ou problema de saúde":["Melhorar do joelho","Liberação médica","Melhorar das costas"],
 "Horários das aulas":["Terminar a faculdade","Horário melhor","Turma de manhã"],
 "Mudança de cidade ou bairro":["Academia mais perto","Achar uma academia perto"],
}
B_VOLTAR_DEF = ["Não sei","Nada","Um amigo ir junto","Motivação","Nao sei"]
B_FUNC_VOLTA = ["Nenhuma","Nao sei","Desconto pra quem vai mais","Lembrete","Ver minha evolução","Sou das antigas","Mensagem quando eu sumir","Nada","Ver o que falta pra graduar","Isso não impactaria, mas achei boa a ideia",""]
B_DESINST_AF = ["Nada","Nenhum","Muita notificação","Ficar me comparando com os outros","Propaganda","Cobrança","Muitas notificações","Nada "]

P_GRAD = ["Exame a cada 6 meses, eu vejo quem tá treinando direito","Por tempo e frequência, avalio no olho","Graduação 2x por ano, controlo pela lista de chamada","No boxe não tem graduação formal","Tempo minimo de faixa + avaliação tecnica","Faço de cabeça, conheço cada aluno","Tem exame com banca, a recepção controla o tempo de faixa","Tem tempo minimo e frequência, mas hoje é no olho, cada professor decide"]
P_DIF = ["Saber quem sumiu","Aluno novo desistir rapido","Manter a turma motivada","Controlar presença","Turma muito misturada de nível","Padronizar entre os professores. e o aluno novo que some rapido","Falta de tempo pra acompanhar todo mundo"]
P_RISCO = ["Iniciante desanimar vendo os outros","Aluno se machucar querendo subir no ranking","Briga de ego no tatame","Nenhum","Expor quem vai menos","Rivalidade dentro da turma","Aluno treinar machucado só pra não perder ponto"]
P_SIS_DONO = ["Sim, sistema de mensalidade. não mostra frequência nem evolução","Sim, uso um sistema de gestão mas é só financeiro","Sim, catraca + sistema, falta relatorio de quem sumiu"]
P_SIS = ["Não","Nao, só whatsapp","Planilha","Não uso","Não, controlo no caderno"]
P_FUNC = ["Aviso de aluno sumido","Controle de quem pode graduar","Presença automática","Relatório da turma","Lista de chamada no celular","Alerta de aluno sumido"]
P_DESIST = ["Aluno não usar","Dar muito trabalho","Ficar caro","Ser difícil de mexer","Ter que lançar tudo na mão","Dar mais trabalho pra recepção"]
P_PRAT = ["Aula experimental com acompanhamento","Graduação com festa e foto","Treino especial no sábado","Grupo da turma no whatsapp","Ligar pra quem falta","Não sei","Campeonato interno",""]

rows = []
def base(pid, age, rel):
    return {"id":pid, "0":"Sim, concordo em participar", "2":age, "3":gender(age), "4":rel}

def tail(d, p_sim=0.5, p_coment_blank=0.0):
    d["63"] = R(B_COMENT)
    d["64"] = "Sim" if random.random()<p_sim else "Não"
    d["68"] = "sintetico-" + d["id"]
    return d

# ---------- Ativos (32) ----------
dist_at = [AGES[0]]*8+[AGES[1]]*9+[AGES[2]]*6+[AGES[3]]*6+[AGES[4]]*2+[AGES[5]]
for i, age in enumerate(dist_at, 1):
    young = age in AGES[:2]
    d = base(f"A{i:02d}", age, "Treino atualmente")
    mods = [R(MODW)] if random.random()<0.8 else list(dict.fromkeys([R(MODW), R(MODW)]))
    d["25"] = mods
    if age==AGES[0]: tempo = R(["Menos de 3 meses","De 3 a 6 meses","De 6 meses a 1 ano","De 1 a 3 anos"])
    elif young: tempo = R(["De 3 a 6 meses","De 6 meses a 1 ano","De 1 a 3 anos","Mais de 3 anos"])
    else: tempo = R(["De 6 meses a 1 ano","De 1 a 3 anos","Mais de 3 anos","Mais de 3 anos"])
    d["26"] = tempo
    d["27"] = R(["2 vezes","3 vezes","3 vezes","4 vezes","5 vezes ou mais"] if young else ["1 vez","2 vezes","2 vezes","3 vezes","4 vezes"])
    pool = MOTIVOS_AT[:]
    k = R([2,3,3,3,4,5])
    w = (["Competição","Amizades e convívio com a turma","Evolução técnica e aprendizado","Estética e composição corporal"] if young else ["Saúde física e condicionamento","Saúde mental e alívio do estresse","Disciplina e rotina"])
    sel = list(dict.fromkeys(pick(w, min(2,len(w))) + pick(pool, k)))[:k]
    d["28"] = sel
    d["29"] = R([3,4,4,5,5]) if young else R([3,4,4,4,5])
    d["30"] = R(["Não faço ideia","Tenho uma ideia aproximada","Sim, sei com clareza"] + (["Não faço ideia"] if age==AGES[0] else []))
    if "Boxe" in mods and len(mods)==1 and random.random()<0.6: d["30"]="Minha modalidade ou academia não trabalha com graduação"
    d["31"] = R(B_PARAR_Y if young else B_PARAR)
    d["32"] = "Não" if (young and random.random()<0.7) else R(["Sim","Não","Sim"])
    d["33"] = R(["Só mentalmente, sem registro","Só mentalmente, sem registro","Não acompanho","Sim, em aplicativo","Sim, em anotações próprias ou planilha"])
    a = arche_for(age)
    d["35"] = likert(11, a, social_idx=(9,), notif_idx=(10,), comp_idx=(5,))
    d["36"] = R([1,2,3,4,5]) if a!="privado" else R([4,5])
    if a=="critico": d["36"]=R([1,2,2,3])
    d["37"] = maybe(B_HAB, 0.15)
    d["38"] = R(B_FUNC_Y if young else B_FUNC)
    d["39"] = "Inserir muitos dados" if a=="critico" and random.random()<0.5 else R(B_DESINST)
    d["40"] = R(B_INFO)
    rows.append(tail(d, 0.55))

# ---------- Afastados (23) ----------
dist_af = [AGES[0]]*2+[AGES[1]]*6+[AGES[2]]*6+[AGES[3]]*5+[AGES[4]]*3+[AGES[5]]
mains = (["Falta de tempo ou conflito com a rotina"]*5 + ["Questões financeiras"]*4 + ["Lesão ou problema de saúde"]*3 +
         ["Horários das aulas"]*2 + ["Mudança de cidade ou bairro"]*2 + ["Vergonha, insegurança ou intimidação"]*2 +
         ["Falta de vínculo com a turma","Não perceber evolução técnica","Cansaço e desgaste da rotina de treino","Perda de interesse pela modalidade","Pouca proximidade com o professor"])
random.shuffle(mains)
for i, (age, main) in enumerate(zip(dist_af, mains), 1):
    young = age in AGES[:2]
    if age==AGES[0] and main in ("Questões financeiras",): main = "Vergonha, insegurança ou intimidação"
    d = base(f"E{i:02d}", age, "Já treinei, mas parei")
    d["42"] = R(MODW)
    d["43"] = R(["De 1 a 3 meses","De 3 a 6 meses","De 6 meses a 1 ano","De 1 a 3 anos","Mais de 3 anos"])
    if main in ("Vergonha, insegurança ou intimidação","Perda de interesse pela modalidade"): d["43"]=R(["Menos de 1 mês","De 1 a 3 meses","De 3 a 6 meses"])
    d["44"] = R(["Menos de 6 meses","De 6 meses a 1 ano","De 1 a 3 anos"] + ([] if young else ["Mais de 3 anos"]))
    d["45"] = R(["1 vez","2 vezes","2 vezes","3 vezes","4 vezes"])
    extra = [f for f in FAT if f!=main]
    fs = [main] + pick(extra, R([0,0,1,1,2]))
    d["46"] = fs
    d["47"] = main
    d["48"] = maybe(RELATO.get(main, ["Parei"]), 0.08)
    d["49"] = R([1,2,3]) if main in ("Não perceber evolução técnica","Ausência de metas claras","Perda de interesse pela modalidade") else R([2,3,4,4,5])
    d["50"] = R(["Sim, sabia com clareza","Tinha uma ideia aproximada","Não fazia ideia"])
    if d["42"]=="Boxe" and random.random()<0.6: d["50"]="Minha modalidade ou academia não trabalha com graduação"
    c = R(["Sim, o professor ou instrutor me chamou de volta"]*3 + ["Ninguém entrou em contato"]*3 + ["Sim, a administração ou secretaria entrou em contato","Alguém da academia falou comigo, mas apenas socialmente, sem me chamar para voltar"])
    d["51"] = c
    d["52"] = "Não se aplica, ninguém me chamou de volta" if c=="Ninguém entrou em contato" else R(["Sim, considerei, mas não voltei","Não fez diferença","Não fez diferença","Sim, cheguei a voltar"])
    d["53"] = R(["Sim, pretendo voltar em breve"]*3 + ["Talvez, um dia"]*2 + (["Não pretendo voltar"] if main=="Perda de interesse pela modalidade" or random.random()<0.15 else []))
    d["54"] = R(VOLTAR.get(main, B_VOLTAR_DEF))
    a = arche_for(age)
    d["56"] = likert(12, a, social_idx=(9,), notif_idx=(10,11), comp_idx=(5,))
    externo = main in ("Falta de tempo ou conflito com a rotina","Questões financeiras","Lesão ou problema de saúde","Horários das aulas","Mudança de cidade ou bairro")
    d["57"] = "Não, o motivo pelo qual parei não tem relação com isso" if externo and random.random()<0.85 else R(["Talvez, teria ajudado, mas não sei se seria suficiente","Sim, provavelmente eu teria continuado","Talvez, teria ajudado, mas não sei se seria suficiente"])
    inc = "Nenhum me incomodaria"
    if min(d["56"][10:12])<=2: inc = "Lembretes e notificações"
    elif d["56"][5]<=2 or d["56"][9]<=2: inc = R(["Ranking visível para outros alunos","Mural com conquistas dos colegas"])
    elif random.random()<0.15: inc = "Mensagem do professor cobrando presença"
    d["58"] = inc
    d["59"] = R(B_FUNC_VOLTA)
    d["60"] = "Muita notificação" if inc=="Lembretes e notificações" else R(B_DESINST_AF)
    rows.append(tail(d, 0.35))

# ---------- Professores (10, 4 donos) ----------
prof = [("P01",AGES[2],False),("P02",AGES[2],False),("P03",AGES[2],False),("P04",AGES[3],False),("P05",AGES[3],True),
        ("P06",AGES[3],False),("P07",AGES[4],True),("P08",AGES[4],True),("P09",AGES[4],False),("P10",AGES[5],True)]
for pid, age, dono in prof:
    d = base(pid, age, "Sou professor ou instrutor")
    if random.random()<0.2: d["3"]="Feminino"
    else: d["3"]="Masculino"
    if age==AGES[2]: d["6"]=R(["De 1 a 3 anos","De 3 a 5 anos","De 5 a 10 anos"])
    elif age==AGES[3]: d["6"]=R(["De 5 a 10 anos","Mais de 10 anos"])
    else: d["6"]="Mais de 10 anos"
    m = [R(MODW)]
    if dono or random.random()<0.3: m = list(dict.fromkeys(m+[R(MODW)]))
    d["7"]=m
    d["8"] = R(["De 101 a 200","Mais de 200","De 51 a 100"]) if dono else R(["Até 20","De 21 a 50","De 21 a 50","De 51 a 100"])
    d["9"] = R([3,4,4,5,5,6])
    d["10"] = R(["No primeiro mês","Entre 1 e 3 meses","Entre 1 e 3 meses","Entre 3 e 6 meses","Não há um padrão claro"])
    d["11"] = pick(["Falta de tempo ou conflito com a rotina"]*1+["Questões financeiras","Não perceber evolução técnica","Ausência de metas claras","Lesão ou problema de saúde","Vergonha, insegurança ou intimidação","Falta de vínculo com a turma","Horários das aulas","Cansaço e desgaste da rotina de treino"], 3)
    if "Falta de tempo ou conflito com a rotina" not in d["11"] and random.random()<0.7: d["11"][0]="Falta de tempo ou conflito com a rotina"
    d["12"] = R(["Sistema de gestão da academia","Planilha (Excel, Google Sheets)"]) if dono else R(["Não acompanho de forma sistemática","Caderno ou lista em papel","Aplicativo de mensagens (WhatsApp)","Planilha (Excel, Google Sheets)"])
    d["13"] = R(P_GRAD)
    if "Boxe" in m and len(m)==1: d["13"]="No boxe não tem graduação formal"
    d["14"] = R(["Sim, sempre","Às vezes, quando percebo","Às vezes, quando percebo","Raramente"])
    d["15"] = R(P_DIF)
    g = [R([3,4,5]), 5, R([4,5]), R([2,3,4]), R([2,3,4,5]), R([3,4,5]), R([4,5]), 5, R([4,5])]
    if dono: g[4]=R([1,2,3]); g[8]=5
    d["17"] = g
    d["18"] = R(P_RISCO)
    d["19"] = R(["De 5 a 15 minutos","De 15 a 30 minutos","Mais de 30 minutos"]) if dono else R(["Menos de 5 minutos","De 5 a 15 minutos","De 5 a 15 minutos","De 15 a 30 minutos"])
    d["20"] = R(P_SIS_DONO) if dono else R(P_SIS)
    d["21"] = R(P_FUNC)
    d["22"] = R(P_DESIST)
    d["23"] = R(P_PRAT)
    rows.append(tail(d, 0.7))

# fix uniqueness of checkbox lists
for d in rows:
    for k in ("7","11","25","28","46"):
        if k in d: d[k]=list(dict.fromkeys(d[k]))
print(len(rows))
json.dump(rows, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "respostas.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=0)
