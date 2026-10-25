import importlib.util, re
def cargar(f):
    spec=importlib.util.spec_from_file_location(f,f+".py"); m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m); return m
def guardar(f, m, nombres):
    src=open(f+".py").read()
    for n in nombres:
        src="\n"+src if not src.startswith("\n") else src
    i=src.index("\n"+n+" = [")+1
        mm=re.search(r"\n(?=[A-Z_][A-Z_0-9]* = |def )", src[i+len(n)+4:])
        j=i+len(n)+4+(mm.start()+1 if mm else len(src)-i-len(n)-4)
        src=src[:i]+"%s = %r\n"%(n,getattr(m,n))+src[j:]
    open(f+".py","w").write(src.lstrip("\n"))
JIN=[("dos jinetes","dos caballeros"),("un jinete","un caballero"),("Llega un jinete con","Llega un caballero con")]
JIN_EN=[("two riders","two knights"),("a rider","a knight"),("A rider arrives with","A knight arrives with")]
def jinetes(c, claves):
    for k in claves:
        for a,b in JIN: c["avisos"][k]=c["avisos"][k].replace(a,b)
        for a,b in JIN_EN: c["en"]["avisos"][k]=c["en"]["avisos"][k].replace(a,b)
ms=cargar("camp_mal_sal"); M={c["id"]:c for c in ms.MAL}; S={c["id"]:c for c in ms.SAL}
jinetes(M[4],["jefes1","jefes2"]); jinetes(M[9],["reyes2"]); jinetes(M[10],["reyes","maquinas"])
jinetes(S[2],["turan"]); jinetes(S[3],["egipto1","egipto2"]); jinetes(S[8],["kerak2"])
M[6]["meta"]=M[6]["meta"].replace("Mata a a los","Mata a los")
# Malí 8: cada llegada de los reyes dice qué trae
g=M[8]["guion"]; g[1]["hacer"]["aviso"]="reyes1"; g[2]["hacer"]["aviso"]="reyes2"
del M[8]["avisos"]["reyes"]; del M[8]["en"]["avisos"]["reyes"]
M[8]["avisos"]["reyes1"]="Llegan guerreros del primero de los doce reyes: un lancero y un arquero."
M[8]["avisos"]["reyes2"]="Llegan más guerreros de los reyes: un espadachín y un caballero."
M[8]["en"]["avisos"]["reyes1"]="Warriors from the first of the twelve kings arrive: a spearman and an archer."
M[8]["en"]["avisos"]["reyes2"]="More warriors from the kings arrive: a swordsman and a knight."
guardar("camp_mal_sal", ms, ["MAL","SAL"])
me=cargar("camp_mon_esl"); O={c["id"]:c for c in me.MON}; E={c["id"]:c for c in me.ESL}
jinetes(O[3],["yamuja2"]); jinetes(O[5],["china","clanes"]); jinetes(O[10],["clanes","maquinas"])
O[8]["meta"]=O[8]["meta"].replace("Mata a a los","Mata a los")
E[3]["historia"]="La tribu del lago no quiere unirse a nosotros. Su jefe, Borislav, dice que una muchacha no manda a nadie. Ha propuesto una pelea: si vences a su campeón, el mejor guerrero de la tribu, todos te seguirán. Demuéstrale que se equivoca."
E[3]["en"]["historia"]="The lake tribe doesn't want to join us. Their chief, Borislav, says a girl can't lead anyone. He has proposed a fight: if you beat his champion, the best warrior of the tribe, they will all follow you. Show him he's wrong."
E[3]["meta"]="Aquí no hay pueblos: solo los ejércitos. Vence al campeón de Borislav (su héroe) y que tu héroe siga vivo. Tienes {t} turnos. Si se acaban antes, gana quien tenga más puntos."
E[3]["en"]["meta"]="There are no villages here: only the armies. Beat Borislav's champion (their hero) and keep your hero alive. You have {t} turns. If they run out first, whoever has more points wins."
E[3]["consejo"]="Cuida a tu héroe: si cae, pierdes. Ataca a su campeón con varios soldados a la vez."
E[3]["en"]["consejo"]="Look after your hero: if yours falls, you lose. Attack their champion with several soldiers at once."
E[3]["contra"]="El campeón de Borislav y la tribu del lago"; E[3]["en"]["contra"]="Borislav's champion and the lake tribe"
E[3]["enemigos"]=[{"bando":"eslavos","reino":"La tribu del lago"}]
E[1]["historia"]="Vesna, niña, los ávaros, unos jinetes que vienen de la llanura, han quemado la aldea. Tú tienes un don: las tormentas te escuchan. Todavía quedan algunos jinetes por aquí. Échalos, y luego llevaremos a la gente que queda al bosque viejo, por sendas que ellos no conocen."
E[1]["en"]["historia"]="Vesna, child, the Avars, riders who come from the plain, have burnt the village. You have a gift: storms listen to you. There are still some riders around here. Drive them away, and then we'll take the people who are left into the old forest, along paths they don't know."
guardar("camp_mon_esl", me, ["MON","ESL"])
me.REINOS_EN["La tribu del lago"]="The lake tribe"
print("hecho")
