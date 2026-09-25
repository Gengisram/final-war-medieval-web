#!/bin/sh
# Lee los avisos de "Informar de un problema o sugerencia" (tabla public.reportes de Supabase).
#   herramientas/reportes.sh            los nuevos (sin la partida)
#   herramientas/reportes.sh todos      todos
#   herramientas/reportes.sh partida 7  guarda la partida del aviso 7 en /tmp/reporte-7.json (para cargarla y verlo)
#   herramientas/reportes.sh visto 7    lo marca como visto (o: arreglado 7)
# Usa la clave de administración de Supabase del Llavero (claude/supabase-token); nunca la escribe en ningún sitio.
TOK=$(security find-generic-password -s "claude/supabase-token" -w) || { echo "Falta la clave claude/supabase-token en el Llavero"; exit 1; }
REF=phhurmglfmmdjzspsmuk
q() { python3 -c 'import json,sys; print(json.dumps({"query": sys.argv[1]}))' "$1" | curl -s -X POST -H "Authorization: Bearer $TOK" -H "Content-Type: application/json" "https://api.supabase.com/v1/projects/$REF/database/query" --data @-; }
case "$1" in
  partida) q "select partida from public.reportes where id = $2" | python3 -c 'import json,sys; d=json.load(sys.stdin); json.dump(d[0]["partida"], open("/tmp/reporte-'"$2"'.json","w")); print("guardada en /tmp/reporte-'"$2"'.json")' ;;
  visto|arreglado) q "update public.reportes set estado = '$1' where id = $2 returning id, estado" ;;
  todos) q "select id, fecha, estado, tipo, texto, version, idioma, contexto - 'registro' as contexto, left(movil, 60) as movil from public.reportes order by id desc" ;;
  *) q "select id, fecha, tipo, texto, version, idioma, contexto - 'registro' as contexto, left(movil, 60) as movil from public.reportes where estado = 'nuevo' order by id" ;;
esac
echo
