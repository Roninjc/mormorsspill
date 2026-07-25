#!/bin/sh
set -e

# Si hay una réplica de Litestream configurada, restaura (si el volumen está vacío)
# y arranca la app bajo supervisión de Litestream para replicar en continuo.
# Si no, arranca la app directamente.
if [ -n "$LITESTREAM_REPLICA_URL" ]; then
	echo "[entrypoint] Litestream activo → réplica: $LITESTREAM_REPLICA_URL"
	# Restaura solo si la BD local no existe todavía (primer arranque / recuperación)
	if [ ! -f "$DATABASE_PATH" ]; then
		echo "[entrypoint] BD no encontrada, intentando restaurar desde la réplica…"
		litestream restore -if-replica-exists "$DATABASE_PATH" || echo "[entrypoint] sin réplica previa, empezamos de cero"
	fi
	exec litestream replicate -exec "node server.js"
else
	echo "[entrypoint] Litestream desactivado (sin LITESTREAM_REPLICA_URL). Arrancando app…"
	exec node server.js
fi
