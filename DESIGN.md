# Mormorsspill — Diseño de la app

> Marcador y compañero de juego (PWA) para *Mormorsspill*, un rummy por contratos noruego.
> Documento de diseño para revisar **antes** de escribir código.

---

## 1. Concepto

Una PWA autoalojada donde un grupo (**Ætt**) lleva el recuento de sus partidas de Mormorsspill, ve quién va ganando en vivo y consulta sus estadísticas históricas.

**Importante:** la app es un **marcador y compañero**, no una implementación digital del juego. Se juega con cartas físicas; la app **no valida** melds. Registra puntuaciones, progreso de rondas, presencia en vivo y estadísticas.

### Vocabulario

| Término (UI) | Código | Qué es |
|---|---|---|
| **Ætt** | `space` | El espacio/familia. Grupo persistente que juega junto. (nórdico: linaje/clan) |
| **Asgard** | `home` | Pantalla principal de una Ætt: estadísticas + acción de **Empezar partida**. |
| **Miembro** | `member` | Persona con cuenta ligera (nombre + avatar + PIN) que pertenece a una Ætt. |
| **Invitado** | `guest` | Jugador ocasional sin cuenta, asociado a una Ætt para poder jugar. |
| **Partida** | `game` | Una partida completa (8 rondas). |
| **Ronda** | `round` | Una de las 8 rondas, cada una con su objetivo/contrato. |

---

## 2. Reglas del juego (fuente para el motor de puntuación)

- 2 barajas de póker · 4 comodines · 10 cartas por jugador · **gana quien menos puntúa**.
- **8 rondas fijas**, en orden:

| # | Objetivo | Nota |
|---|---|---|
| 1 | 2 tríos | |
| 2 | 1 trío + 1 escalera | |
| 3 | 2 escaleras | |
| 4 | 3 tríos | |
| 5 | 2 tríos + 1 escalera | |
| 6 | 1 trío + 2 escaleras | **"La perfecta"**: no se puede pedir. |
| 7 | 4 tríos | |
| 8 | 3 escaleras | Solo se puede **pedir una vez**. |

- **Trío:** 3+ cartas del mismo número. **Escalera:** exactamente 4 cartas consecutivas del mismo palo; el As vale arriba y abajo pero no se puede "dar la vuelta".
- **Comodines:** totalmente libres, sin límite, para jugar y para contar puntos.
- **Robo al inicio del turno** — tres opciones: (a) una carta del mazo nuevo, (b) la carta superior del descarte, o (c) **el mazo de descartes completo**. Si eliges (c), estás **obligado a bajar** tus melds objetivo de la ronda en ese mismo turno (no a ganar, pero sí a bajar).
- **"Pedir":** al descartar alguien, un jugador que **no** sea el siguiente puede pedir esa carta; si el que va a empezar turno no la usa, el que pidió se la lleva **y roba 3 cartas**. No se puede pedir hasta completar la primera vuelta (la primera carta pedible es el **2.º descarte** del primer jugador). **Las 3 cartas extra NO siempre son castigo** — en varias rondas hay que pedir para llegar al número de cartas necesario.
  - **Ronda 6 ("la perfecta"):** no se puede pedir en absoluto → solo un jugador puede cerrar (robando), el resto siempre cuenta todas sus cartas.
  - **Ronda 8:** solo se puede pedir **una vez**.
- **Añadir a series:** solo tras haber bajado (vale en el mismo turno); a series propias y de rivales.
- **Fin de ronda:** quien se queda sin cartas tras descartar gana la ronda (**0 pts**); el resto suma sus cartas.
- **Valor de cartas:** figuras y 10 → 10 · ases → 20 · comodín → 50 · resto → 5. *(Toda puntuación de ronda válida es múltiplo de 5.)*
- **Penalización:** intento de bajada fallido → **+100 pts**; el resto sigue la ronda.
- **Mazo agotado:** se baraja el descarte y se coloca boca abajo como nuevo mazo (la ronda **no** acaba sin ganador).
- **Reparto/rotación:** reparte uno cualquiera y empieza el de su izquierda; cada ronda, reparte y empieza el siguiente por la izquierda.

> **Impacto en el marcador:** solo afectan puntos de cartas sobrantes por jugador/ronda, el 0 del ganador y la penalización de +100. "Pedir", el mazo completo y el reparto se guardan como metadatos/eventos (histórico, feed en vivo, reglas integradas), no como puntos.

---

## 3. Motor de puntuación

```
puntos_ronda(jugador) = suma_cartas_sobrantes + (100 si intento_fallido else 0)
puntos_ronda(ganador_de_ronda) = 0
total(jugador) = Σ puntos_ronda sobre las 8 rondas
posición: menor total = mejor.
```

**Ayuda para sumar cartas sobrantes (UX):** botones `+5`, `+10`, `+20 As`, `+50 Comodín` que van sumando, o entrada numérica directa.

**Validaciones suaves (no bloqueantes):**
- Toda puntuación debe ser **múltiplo de 5** → aviso si no lo es.
- El ganador de ronda debe tener 0; un único ganador por ronda.
- Aviso si un total parece incoherente. La mesa siempre manda.

---

## 4. Modelo de datos (SQLite)

```sql
space        (id, name, invite_code, theme, created_at)
member       (id, space_id, display_name, avatar, pin_hash, created_at)
guest        (id, space_id, display_name, avatar, created_at)   -- reutilizable entre partidas
game         (id, space_id, status['lobby'|'in_progress'|'finished'],
              current_round, dealer_seat, winner_participant_id, single_scorer[bool],
              created_at, started_at, finished_at)
participant  (id, game_id, member_id NULL, guest_id NULL, seat)  -- uno de member/guest
round        (id, game_id, number[1..8], objective, status['pending'|'active'|'done'],
              round_winner_participant_id NULL)
score        (id, round_id, participant_id, card_points, penalty[0|100],
              entered_by_participant_id, updated_at)
event        (id, game_id, type, payload_json, actor_participant_id, created_at)
              -- 'pedir', 'discard_pile_taken', 'laydown_fail', 'round_closed',
              --   'game_started', 'game_finished', ...
```

**Invitados:** pertenecen a una Ætt y son reutilizables ("el vecino que viene a veces"). Sus resultados se guardan pero **por defecto no aparecen en los rankings**; hay un **toggle** para incluir/excluir invitados en las estadísticas. Un invitado puede **promocionarse a miembro** (migra su historial).

**Estadísticas:** partidas, victorias, % victorias, media de puntos, mejor/peor ronda, racha, "némesis", evolución por ronda.

---

## 5. Anotación de puntos (sin roles)

Decisión: **no hay roles de anotador exclusivos.** Cualquier participante conectado puede editar la puntuación de cualquiera. Esto resuelve el caso de invitados/miembros **sin móvil** (una sola persona puede anotar por todos) y no necesita gestión de "relevo".

Dos modos de uso que salen solos del mismo modelo:
- **Mesa compartida:** un único dispositivo en la mesa; quien lo tenga toca para anotar.
- **Multi-dispositivo:** varios móviles sincronizados; cualquiera edita, todo se ve en vivo.

**Anti-líos por edición cruzada:**
- **Candado suave visual:** "✍️ Cris está anotando aquí" mientras alguien edita una casilla.
- **Última escritura gana** + **trazabilidad**: cada `score` guarda `entered_by_participant_id`.
- **Deshacer** por casilla.

**Toggle opcional `single_scorer`:** para grupos que prefieran que solo una persona edite (bloquea la edición al resto). Por defecto: **abierto**.

---

## 6. Tiempo real (contrato Socket.IO)

Rooms: `space:{id}` (presencia/Asgard) y `game:{id}` (partida).

**Cliente → servidor**
```
game:create        { spaceId, participants[], singleScorer }
game:start         { gameId }
score:set          { roundId, participantId, cardPoints, penalty }
score:editing      { roundId, participantId, on[bool] }   -- candado suave
round:close        { roundId, winnerParticipantId }
event:log          { gameId, type, payload }              -- pedir, mazo completo, etc.
spectate:join      { gameId }
```

**Servidor → cliente (broadcast)**
```
game:state         snapshot completo (para nuevos/espectadores)
score:updated      { roundId, participantId, cardPoints, penalty, totals, enteredBy }
score:editing      { roundId, participantId, by, on }     -- pinta el candado suave
round:closed       { roundNumber, winner, totals }
presence:update    { spaceId, activeGame?, spectators[] }  -- "se está jugando ahora"
game:finished      { winner, finalTable }
event:new          feed en vivo
```

**Presencia:** al pasar una partida a `in_progress`, el servidor emite `presence:update` a `space:{id}`. Quien abra Asgard ve el banner "**Se está jugando ahora**" y puede entrar como espectador (recibe `game:state` y luego deltas).

**Offline-first:** la PWA cachea estado y encola cambios; al reconectar, Socket.IO reenvía y se reconcilia por `updated_at` (última escritura gana por casilla).

---

## 7. Asgard (pantalla principal)

**Jugar es lo primero**, las estadísticas acompañan.

- **Barra de acción inferior fija** con el botón grande de **"Empezar partida"** (zona del pulgar, fácil de alcanzar).
- Banner **"Se está jugando ahora"** cuando hay partida en curso → "Ver en vivo".
- En scroll: ranking de la Ætt, últimas partidas, estadísticas destacadas, gráfica de evolución.
- Acceso a **reglas integradas** (con las notas por ronda: "la perfecta", "pedir una vez"…) y a gestión de miembros/invitados.

---

## 8. Cuentas, PIN e invitaciones

- **Cuenta ligera:** nombre + avatar + **PIN simple** (evitar entrar en el perfil equivocado por error; no es seguridad fuerte, hay confianza).
- **Unirse a una Ætt: solo por invitación.** Cualquier miembro puede **crear invitados** e **invitar nuevos miembros**.
- **Invitación por QR:** el que invita muestra un **QR en su pantalla**; el invitado lo escanea con la cámara/PWA y entra en la Ætt (el QR lleva un token de invitación de un solo uso / caducidad corta).

---

## 9. Estética y dirección visual

- **Moderna con detalles de vikingo noruego.**
- **Tipografía** al estilo de la equipación de la selección de fútbol de Noruega en el Mundial 2026 (sans deportiva, bold/condensada, mayúsculas para titulares). *A confirmar la fuente exacta o buscar una alternativa libre equivalente.*
- **Avatares:** logos simples de vikingos (cascos, barbas, coletas…), estilo icono/plano, varias variantes para elegir.
- Paleta y detalles rúnicos/nórdicos con moderación (que no reste legibilidad al marcador en la mesa).

---

## 10. Despliegue

- **SvelteKit** (`adapter-node`) envuelto en un **servidor Node** que engancha **Socket.IO** al mismo puerto → un solo proceso/contenedor.
- **Docker Compose** junto a tus apps pequeñas (no hace falta LXC aparte; un contenedor Node es más simple y comparte tu Compose).
- **nginx** → subdominio **`mormorsspill.tudominio`**, `proxy_pass` al contenedor con cabeceras de **WebSocket upgrade** (`Upgrade`/`Connection`) para Socket.IO.
- **Datos:** volumen para el fichero SQLite.
- **Backup:** sidecar **Litestream** replicando el SQLite en continuo a R2/B2/S3; restauración a cualquier punto. Complementa (no sustituye) tus backups de VM.

```
[nginx] --(mormorsspill.dominio, WS upgrade)--> [contenedor: node+sveltekit+socket.io]
                                                         |
                                                    [/data/app.db] <--stream-- [litestream] --> [R2/B2]
```

---

## 11. Plan por fases

- **F1 — MVP marcador jugable:** Ætt + miembros/invitados con PIN · crear partida · las 8 rondas con ayuda de suma de cartas, validación múltiplo de 5 y penalización · edición abierta con candado suave · cierre de ronda · ganador · persistencia SQLite. Asgard con botón inferior de Empezar partida. *(offline-first básico)*
- **F2 — Tiempo real:** Socket.IO, espectadores, presencia "se está jugando ahora", edición sincronizada + candado suave + deshacer, feed de eventos ("pedir", mazo completo…).
- **F3 — Asgard / estadísticas:** histórico, ranking (con toggle de invitados), stats por jugador, gráfica de evolución por ronda.
- **F4 — Pulido:** reglas integradas por ronda, dirección visual vikinga + tipografía + avatares, invitación por QR, Litestream, instalación PWA, animaciones/sonido al cerrar ronda/ganar.

---

## 12. Preguntas abiertas

1. **Tipografía exacta** de la selección noruega 2026 (confirmar o elegir alternativa libre) — se resuelve en la fase visual (F4).
2. **Empate en rondas ganadas:** si dos jugadores empatan a total y a rondas ganadas, criterio pendiente (a decidir más adelante).

### Resueltas
- Espacio = **Ætt**, home = **Asgard**. · PIN simple por usuario. · Invitación solo por invitación + QR. · Invitados fuera de rankings por defecto (con toggle). · Sin roles de anotador: edición abierta con candado suave. · Botón Empezar partida **abajo**. · Validación múltiplo de 5. · Reglas de "pedir"/mazo/reshuffle aclaradas (§2). · **Desempate**: menor total gana; si empatan, más rondas ganadas; si siguen empatados, TBD. · **Promoción de invitado a miembro**: incluida en F1.
