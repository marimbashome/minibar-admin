# GEMINI.md — minibar-admin

> Instrucciones para agy / Antigravity (Google) en este repo.
> Mismo contenido que `AGENTS.md`; Antigravity lee cualquiera de los dos.

---

<!-- BEGIN REGLA-ATRIBUCION sha=cf8b29675029 · generado por Codigo/scripts/sync-regla-atribucion.py · NO editar a mano -->
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

Si el cambio lo produjo un carril delegado (opencode, agy/Gemini, Codex, un modelo por token) y
otro lo commiteó, **se nombran los dos**. Atribuir a quien no lo escribió es peor que no atribuir.

### 2. Vocabulario único de actor — cuatro prefijos, y nada más

| Prefijo | Cuándo | Ejemplos |
|---|---|---|
| `humano:` | una persona lo hizo | `humano:enrique@marimbashome.com` |
| `ia:` | un modelo lo produjo | `ia:claude-opus-5` · `ia:gemini-3.5-flash-medium` · `ia:codex` · `ia:opencode/nemotron-3.5-lightning-free` |
| `sistema:` | tarea programada o disparador | `sistema:cron-watchdog` — **nunca `system` a secas** |
| `migracion:` | corrida única de reacomodo | `migracion:reconstruccion-desenlaces-ago16` |

Es el mismo vocabulario en los trailers del commit y en las columnas de actor de la base
(`audit_log.changed_by`, `decision_log.actor`, `cron_change_log.actor`). Sin vocabulario único no
se puede agrupar, y sin agrupar no hay auditoría: se midió «claude» escrito de 10 formas distintas.

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
