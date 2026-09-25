import json, re, sys, importlib.util, os
RAIZ = "/Users/rbm/FINAL MEDIEVAL WAR GAME"
AQUI = os.path.dirname(os.path.abspath(__file__))

def cargar(nombre):
    spec = importlib.util.spec_from_file_location(nombre, os.path.join(AQUI, nombre + ".py"))
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m); return m

IDENT = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")
def js(v):
    if isinstance(v, dict):
        if not v: return "{}"
        return "{ " + ", ".join((k if IDENT.match(k) else json.dumps(k, ensure_ascii=False)) + ": " + js(x) for k, x in v.items()) + " }"
    if isinstance(v, list): return "[" + ", ".join(js(x) for x in v) + "]"
    if isinstance(v, bool): return "true" if v else "false"
    if isinstance(v, str): return json.dumps(v, ensure_ascii=False)
    return json.dumps(v)

ORDEN_DATOS = ["id", "nombre", "mapa", "rivales", "batalla", "ejercito", "equipos", "objetivo", "guion", "enemigos", "capital", "dificultad", "limite", "hucha"]

def bloque_capitulos(s, fac):
    i = s.index("  %s: {" % fac); a = s.index("capitulos: [", i) + len("capitulos: ["); b = s.index("] },", a)
    return a, b

def capitulo_viejo(texto, cid):
    m = re.search(r"\{ id: %d, " % cid, texto)
    if not m: return ""
    n = re.search(r"\{ id: \d+, ", texto[m.end():])
    return texto[m.start(): m.end() + (n.start() if n else len(texto) - m.end())]

def objeto_js(texto, clave):
    i = texto.find(clave + ": {")
    if i < 0: return None
    j = texto.index("{", i); prof = 0
    for k in range(j, len(texto)):
        if texto[k] == "{": prof += 1
        elif texto[k] == "}":
            prof -= 1
            if prof == 0: return texto[j:k + 1]

def generar(fac, caps):
    p = RAIZ + "/datos/base/campana.js"; s = open(p).read()
    a, b = bloque_capitulos(s, fac); viejo = s[a:b]
    lineas = []
    for c in caps:
        v = capitulo_viejo(viejo, c["id"])
        premio = objeto_js(v, "premio") or js(c.get("premio", {"oro": 20}))
        jefe = objeto_js(v, "jefe")
        datos = ", ".join("%s: %s" % (k, js(c[k])) for k in ORDEN_DATOS if k in c and c[k] is not None)
        l = "      { " + datos + ", premio: " + premio + ",\n"
        l += "        voz: %s,\n        meta: %s,\n        contra: %s,\n        consejo: %s,\n" % (js(c["voz"]), js(c["meta"]), js(c["contra"]), js(c["consejo"]))
        if c.get("avisos"): l += "        avisos: %s,\n" % js(c["avisos"])
        if jefe: l += "        jefe: %s,\n" % jefe
        l += "        historia: %s },\n" % js(c["historia"])
        lineas.append(l)
    s = s[:a] + "\n" + "".join(lineas) + "    " + s[b:]
    open(p, "w").write(s)
    # inglés
    p = RAIZ + "/datos/base/traduccion.en.js"; s = open(p).read()
    ini = s.index("  campanas: {")
    i = s.index("    %s: {\n" % fac, ini); j0 = s.index("\n", s.index("      _: {", i))
    fin = re.search(r"\n    [a-z_]+: \{\n|\n  \},", s[j0:]); j = j0 + fin.start()
    en = ""
    for c in caps:
        e = c["en"]
        en += "\n      %d: { nombre: %s, voz: %s,\n        meta: %s,\n        contra: %s,\n        consejo: %s,%s\n        historia: %s }," % (
            c["id"], js(e["nombre"]), js(e["voz"]), js(e["meta"]), js(e["contra"]), js(e["consejo"]),
            ("\n        avisos: %s," % js(e["avisos"])) if e.get("avisos") else "", js(e["historia"]))
    s = s[:j0] + en + "\n    }," + s[j:] if not s[j:].startswith("\n    },") else s[:j0] + en + s[j:]
    open(p, "w").write(s)

def reinos_en(mapa):
    p = RAIZ + "/datos/base/traduccion.en.js"; s = open(p).read()
    i = s.index("  reinos: { ") + len("  reinos: { ")
    # si ya había una traducción de ese nombre, manda la nuestra (si no, la ficha y la partida decían cosas distintas)
    for k, v in mapa.items():
        clave = json.dumps(k, ensure_ascii=False) + ": "; a = s.find(clave, i)
        if a >= 0:
            b = a + len(clave); c = s.index('"', b + 1) + 1; s = s[:b] + json.dumps(v, ensure_ascii=False) + s[c:]
    nuevos = {k: v for k, v in mapa.items() if (json.dumps(k, ensure_ascii=False) + ":") not in s[i:i + 200000]}
    if nuevos:
        s = s[:i] + ", ".join("%s: %s" % (json.dumps(k, ensure_ascii=False), json.dumps(v, ensure_ascii=False)) for k, v in nuevos.items()) + ", " + s[i:]
        open(p, "w").write(s)
    return len(nuevos)

if __name__ == "__main__":
    for modulo, pares in [(a.split(":")[0], a.split(":")[1:]) for a in sys.argv[1:]]:
        m = cargar(modulo)
        for par in pares:
            fac, var = par.split("=")
            generar(fac, getattr(m, var))
            print("generado", fac)
        if hasattr(m, "REINOS_EN"): print("reinos nuevos:", reinos_en(m.REINOS_EN))
