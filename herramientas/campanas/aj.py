# uso: python3 aj.py 'V[4]["limite"]=14' ...  (edita camp_vik_ing_v2.py)
import importlib.util, sys
P="/Users/rbm/FINAL MEDIEVAL WAR GAME/herramientas/campanas/"+(sys.argv[1])
spec=importlib.util.spec_from_file_location("m",P); m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
nombres=[n for n in dir(m) if n.isupper() and isinstance(getattr(m,n),list)]
G={n[0]:{c["id"]:c for c in getattr(m,n)} for n in nombres}
for orden in sys.argv[2:]: exec(orden, {}, G)
import re
src=open(P).read()
for n in nombres:
    src="\n"+src if not src.startswith("\n") else src
    i=src.index("\n"+n+" = [")+1
    # fin de la lista: la siguiente definición de nivel superior
    mm=re.search(r"\n(?=[A-Z_][A-Z_0-9]* = |def )", src[i+len(n)+4:])
    j=i+len(n)+4+(mm.start()+1 if mm else len(src)-i-len(n)-4)
    src=src[:i]+"%s = %r\n"%(n,getattr(m,n))+src[j:]
open(P,"w").write(src.lstrip("\n"))
