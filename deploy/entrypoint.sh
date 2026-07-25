#!/bin/sh
set -e

# If a Litestream replica is configured, restore (when the volume is empty)
# and run the app under Litestream supervision for continuous replication.
# Otherwise, run the app directly.
if [ -n "$LITESTREAM_REPLICA_URL" ]; then
	echo "[entrypoint] Litestream active → replica: $LITESTREAM_REPLICA_URL"
	# Restore only if the local DB doesn't exist yet (first boot / recovery)
	if [ ! -f "$DATABASE_PATH" ]; then
		echo "[entrypoint] DB not found, trying to restore from the replica…"
		litestream restore -if-replica-exists "$DATABASE_PATH" || echo "[entrypoint] no previous replica, starting fresh"
	fi
	exec litestream replicate -exec "node server.js"
else
	echo "[entrypoint] Litestream disabled (no LITESTREAM_REPLICA_URL). Starting app…"
	exec node server.js
fi
