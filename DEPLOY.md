# Despliegue de Mormorsspill

Despliegue **automático por GitHub Actions** (mismo método que `worldwide`): cada push a `main`
construye la imagen, la publica en GHCR, y actualiza el servicio en el `compose.yml` de tu VM
vía Tailscale + SSH.

A diferencia de `worldwide` (estático servido por nginx), Mormorsspill lleva **servidor Node**
(Socket.IO + SQLite), así que la imagen ejecuta `server.js` y necesita un **volumen** para los datos.

## Flujo (qué hace `.github/workflows/deploy.yml`)

1. **Build & push** de la imagen a `ghcr.io/roninjc/mormorsspill:latest` (con `APP_VERSION=<sha>`).
2. **Tailscale** para entrar en la red privada del servidor.
3. **SSH** a la VM y, sobre el `compose.yml` central:
   ```
   docker compose -f /home/jake/compose.yml pull mormorsspill
   docker compose -f /home/jake/compose.yml up -d mormorsspill
   ```

## Puesta a punto (una sola vez)

### 1. Repo en GitHub
Sube este proyecto a `github.com/Roninjc/mormorsspill` (rama `main`).

### 2. Secrets del repo
En *Settings → Secrets and variables → Actions*, los mismos que en `worldwide`:
- `TAILSCALE_OAUTH_CLIENT_ID`
- `TAILSCALE_OAUTH_SECRET`
- `SSH_HOST` (host/IP del servidor por Tailscale)
- `SSH_USER`
- `SSH_PRIVATE_KEY`

(`GITHUB_TOKEN` es automático y basta para publicar en GHCR.)

### 3. Servicio en el compose central de la VM
Añade el bloque de [`deploy/compose.snippet.yml`](deploy/compose.snippet.yml) dentro de `services:`
en `/home/jake/compose.yml`, y el volumen `mormorsspill-data` en la sección `volumes:`.
**Edita `ORIGIN`** con tu URL pública real (necesario para el CSRF de los formularios).

> **GHCR privado:** la imagen se publica privada por defecto. Asegúrate de que la VM puede
> descargarla: o bien haces el paquete público en GitHub, o la VM ya tiene `docker login ghcr.io`
> con un token con permiso `read:packages` (como ya haces con `worldwide`).

### 4. Reverse proxy (subdominio + WebSocket)
Enruta `mormorsspill.tu-dominio.com` → `127.0.0.1:3000` con **upgrade de WebSocket** para Socket.IO.
Tienes un ejemplo listo en [`deploy/nginx.mormorsspill.conf`](deploy/nginx.mormorsspill.conf).
Certificado con `certbot --nginx -d mormorsspill.tu-dominio.com`.

## Desplegar

```bash
git push origin main
```
Actions construye, publica y actualiza el contenedor. Los datos persisten en el volumen
`mormorsspill-data` entre despliegues. La versión desplegada se ve abajo en Asgard (`v <sha>`).

## Copias de seguridad

- **Infra (VM):** incluye el volumen `mormorsspill-data` en tus backups de VM.
- **Litestream → nube (opcional):** descomenta las variables `LITESTREAM_*` en el servicio del
  compose. La imagen trae el binario y, si hay réplica, replica en continuo y **restaura sola**
  en un arranque con el volumen vacío. Restaurar a mano:
  `litestream restore -o ruta.db s3://mi-bucket/mormorsspill`.

## Alternativa: local / manual (sin CI)

Para probar en local o desplegar a mano sin Actions, el repo trae un `docker-compose.yml` que
**construye** la imagen desde el código:
```bash
docker compose up -d --build      # construye y arranca en 127.0.0.1:3000
```
(En producción no se usa este archivo; la VM arranca la imagen ya publicada en GHCR.)

## Notas
- El contenedor escucha en `127.0.0.1:3000`; todo el tráfico externo pasa por tu reverse proxy (TLS + WS).
- Toda la configuración es por `process.env`; no hay secretos en el código. El secreto de sesión
  se genera solo la primera vez en `/data/.session_secret` (dentro del volumen).
