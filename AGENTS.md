# AGENTS.md — minibar-admin

> Instrucciones para agentes de código (Codex, opencode, agy/Gemini) en este repo.
> La fuente de verdad del ecosistema es `MarimbasHome/.claude/CLAUDE.md`.

---

<!-- BEGIN REGLA-ATRIBUCION sha=e3b0958f3589 · generado por Codigo/scripts/sync-regla-atribucion.py · NO editar a mano -->
## 🧾 Bitácora con autor — regla dura de todos los repos

Todo cambio deja rastro, y **el rastro dice quién lo hizo**, distinguiendo una IA de una persona.
Existe para poder auditar hacia atrás: quién tocó qué, cuándo, con permiso de quién y cómo se deshace.
Aplica a Claude, Codex, Gemini/agy, opencode y a cualquier carril que entre después.

### 1. El commit dice quién ESCRIBIÓ, no quién commiteó

El autor de git es **siempre** `enrique.miceli@gmail.com` (si no, Vercel rechaza el despliegue),
así que el autor no identifica a nadie. La atribución real viaja en los trailers del mensaje:

```
Co-Authored-By: <actor que escribió el cambio> <noreply@marimbashome.com>
X-Revisado-Por: <actor que lo revisó>      # obligatorio en identidad de huéspedes y en dinero
X-Sesion: ses-AAAA-MM-DD-<tema>            # el mismo id en TODO lo que escriba esa sesión
```

**El id de sesión se fija al ARRANCAR, no al cerrar.** Cada sesión de cualquier agente elige UN id `ses-AAAA-MM-DD-<tema>` en su
primer minuto y lo estampa en todo lo que escribe: el trailer `X-Sesion` de cada commit; `p_actor => 'ia:<modelo real>'` (nunca
`claude`, `ia:claude` ni `agente` a secas) y `p_source_path => 'Registros/YYYY-WNN/session_YYYY-MM-DD_<tema>.md'` en
`fn_decision_log_write`; y `p_actor` con el modelo real en `fn_tablero_create_task` / `fn_tablero_set_status` /
`fn_tablero_add_comment`. Una tarea programada sin modelo firma `sistema:<script>`; una corrida única, `migracion:<nombre>`; el
worker de encargos, `ses-encargo-<id>`. Al cerrar, `wrapup-derivar.py --sesion <id> --actor ia:<modelo>` separa lo propio de lo ajeno
— sin el id, la bitácora mezcla el trabajo de las otras licencias (medido 2026-09-01: 19 decisiones en la ventana, 2 propias).

Si el cambio lo produjo un carril delegado (opencode, agy/Gemini, Codex, un modelo por token) y
otro lo commiteó, **se nombran los dos**. Atribuir a quien no lo escribió es peor que no atribuir.

### 2. Vocabulario único de actor — cuatro prefijos, y nada más

| Prefijo | Cuándo | Ejemplos |
|---|---|---|
| `humano:` | una persona lo hizo | `humano:enrique@marimbashome.com` |
| `ia:` | un modelo lo produjo | `ia:claude-opus-5` · `ia:gemini-3.7-flash` · `ia:codex` · `ia:opencode/nemotron-3.5-lightning-free` |
| `sistema:` | tarea programada o disparador | `sistema:cron-watchdog` — **nunca `system` a secas** |
| `migracion:` | corrida única de reacomodo | `migracion:reconstruccion-desenlaces-ago16` |

Es el mismo vocabulario en los trailers del commit y en las columnas de actor de la base
(`audit_log.changed_by`, `decision_log.actor`, `cron_change_log.actor`). Sin vocabulario único no
se puede agrupar, y sin agrupar no hay auditoría: se midió «claude» escrito de 10 formas distintas.

🔒 **En la bitácora de decisiones ya es candado, no recomendación (2026-09-01).**
`fn_decision_log_write` **rechaza** la llamada sin `p_actor` y rechaza cualquier valor que no
empiece con uno de los cuatro prefijos; una restricción `CHECK` en `decision_log` cierra las
demás vías. Antes el parámetro existía pero tenía valor por omisión `'claude'`, y 207 decisiones
quedaron sin autor real — **un candado con valor por omisión permisivo no es un candado**, la
misma forma que `Deno.env.get('MH_ADMIN_TOKEN') || ''`.

✅ **Cerrado también en las COLUMNAS (2026-09-01).** Las trece funciones con actor ya rechazan la
llamada sin firma, y las columnas de actor de las tablas vigiladas normalizan en la puerta con
`fn_actor_normalizar` — que traduce en vez de rechazar, para no tumbar la pantalla que escribe ni
la operación que la bitácora venía a registrar. Aun así **pásale el actor a mano siempre**: lo que
la puerta puede normalizar es la forma, no adivinar quién fuiste. Lo que se vigila y desde cuándo
vive en `actor_vigilancia`; el detector `actor-fuera-de-vocabulario` avisa si una columna nueva
nace sin su disparador.

### 3. Qué más lleva cada entrada

- **Quién APROBÓ, separado de quién ejecutó.** Una persona (`humano:…`) o los candados que
  sustituyen su firma (`candado:prebuild+vercel+revision:<modelo>`). En identidad de huéspedes y en
  dinero, nombrar al modelo revisor es la prueba de que la revisión adversarial sí ocurrió.
- **Cómo se deshace:** el PR que revierte, la migración de bajada o el valor anterior.
- **Lo revertido y lo fallido también se asienta** — es el registro que impide repetirlo.

### 4. Lo que NUNCA entra a la bitácora

Contraseñas, códigos de puerta, CLABEs, tokens, cookies, ni datos de identidad de huéspedes.
Lista **blanca** de campos, jamás lista negra: auditar «todo menos X» filtra secretos en cuanto
alguien agrega una columna.

### 5. Un cambio sin rastro es un defecto

Lo vigilan el candado `commit-atribucion-guard` (bloquea el commit sin trailer) y el detector
`commit-sin-atribucion`. Especificación completa: `Vault/Sistemas/Bitacora_De_Cambios.md`.
<!-- END REGLA-ATRIBUCION -->
