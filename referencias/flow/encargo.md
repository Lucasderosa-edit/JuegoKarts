# Encargo: generar assets visuales con Google Flow (Veo 3) para un juego de karts

> **Para el agente que recibe este documento:** tenés acceso a un navegador. Tu tarea es usar
> **Google Flow** (https://labs.google/fx/tools/flow) con **Veo 3** para generar las imágenes y
> los videos que se listan abajo, descargarlos con los nombres indicados y entregar un informe al final.
> Leé todo el documento antes de empezar.

---

## 1. Contexto del proyecto

Estamos haciendo un **juego de carreras de karts arcade para navegador** (PC y celular), hecho con
HTML5 + JavaScript + Three.js. Los gráficos del juego son **3D low-poly con colores planos**.

Los assets de este encargo sirven para:

- **Referencias de personajes y pistas**: el desarrollador las usa para modelar en 3D (objetivos 11 y 12 del plan).
- **Videos para los menús**: fondo del menú principal, selección de personaje, selección de pista y pantalla de resultados.
- **Íconos de ítems** para el HUD.
- **Un tráiler corto** para el README y para redes.

---

## 2. Reglas obligatorias

1. **Todo tiene que ser 100 % original.** No uses ni nombres en los prompts personajes, pistas, ítems,
   logos ni estilos de Nintendo (Mario Kart, etc.), Sonic, Crash Team Racing ni de ninguna otra marca o
   franquicia. Nunca escribas cosas como "estilo Mario Kart" en un prompt.
2. **Nada de texto en las imágenes ni en los videos** (ni títulos, ni letras, ni números, ni logos). Los textos los agrega el juego.
3. **Audio de los videos:** sin voces, sin diálogos y sin canciones con letra. Se permiten sonidos ambientales y efectos (motor, viento, olas, festejos).
4. **El usuario inicia sesión.** Si Flow pide login, verificación en dos pasos o un captcha, frená y pedile al usuario que lo haga.
5. **No gastes plata.** Nunca aceptes upgrades, planes pagos ni compras de créditos. Si se acaban los créditos, frená y avisá.
6. **Cuidá los créditos** (ver sección 5): antes de generar, mirá cuántos créditos hay y cuánto cuesta cada generación.
7. **Hay checkpoints** (sección 6) en los que tenés que mostrarle los resultados al usuario y esperar su OK antes de seguir.
8. No cambies la configuración de la cuenta ni compartas proyectos públicamente.

---

## 3. Guía visual (usar en todos los prompts)

Agregá este bloque **al final de cada prompt**. Abajo lo llamamos `[STYLE]`:

```
Stylized low-poly 3D render, flat solid colors, minimal textures, soft global lighting, bright cheerful saturated palette, clean simple geometric shapes, family-friendly indie video game look. No text, no letters, no numbers, no logos, no watermarks.
```

Al final de cada prompt de video agregá también este bloque. Abajo lo llamamos `[AUDIO]`:

```
Audio: only ambient sounds and sound effects. No music with lyrics, no voices, no dialogue.
```

---

## 4. Los personajes y las pistas (biblia del juego)

### Personajes

| ID | Nombre | Descripción para el prompt (en inglés) | Kart | Stats |
|----|--------|----------------------------------------|------|-------|
| `chispa` | Chispa | a small chubby capybara with a cheerful smile, wearing yellow mechanic overalls and red round goggles on top of her head | tiny compact yellow go-kart with red stripes and big round wheels | Liviana: mucha aceleración, poca velocidad máxima |
| `tronco` | Tronco | a big strong friendly gray rhinoceros wearing an orange construction helmet and a dark blue work vest | heavy wide gray-and-orange go-kart with chunky bumpers | Pesado: mucha velocidad máxima, poca aceleración |
| `pixel` | Pixel | a small round teal robot with a dark screen for a face showing two simple white glowing eyes, short antenna on top | sleek teal-and-white go-kart with glowing cyan details | Equilibrado |
| `brisa` | Brisa | a cute pink axolotl with frilly gills, wearing a long purple scarf that flutters in the wind | light pink-and-purple go-kart with rounded shapes | Manejo: muy buen manejo y derrape |

> Los cuatro tienen que verse como parte del **mismo juego**: mismo estilo low-poly, mismas proporciones caricaturescas (cabeza grande, cuerpo chico) y la misma iluminación.

### Pistas

| ID | Nombre | Descripción para el prompt (en inglés) | Obstáculo propio |
|----|--------|----------------------------------------|------------------|
| `pradera` | Circuito Pradera | rolling green grassy hills, a gray asphalt race track with red-and-white curbs, small round trees, a checkered start/finish line, blue sky with puffy white clouds | — (es la pista inicial) |
| `costa` | Costa Coral | a sunny tropical beach, sand-colored race track running along a turquoise sea, palm trees, a wooden pier section over the water | small red crabs crossing the track, waves splashing onto the road |
| `neon` | Neón Nocturno | a stylized city at night, dark wet reflective asphalt race track between buildings with glowing neon lights in pink, cyan and purple | orange traffic cones, a slow city bus crossing an intersection |
| `cumbre` | Cumbre Helada | a snowy mountain, race track of packed white snow and pale blue ice, pine trees covered in snow, wooden fences | giant snowballs rolling down a slope, shiny slippery ice patches |

---

## 5. Cómo usar Google Flow

> La interfaz de Flow puede cambiar. Si algo no coincide con lo que dice acá, adaptate a lo que veas
> y anotalo en el informe final.

1. Abrí https://labs.google/fx/tools/flow. Si pide iniciar sesión, pedíselo al usuario.
2. Creá un proyecto nuevo llamado **`Karts - assets`**.
3. **Créditos:** antes de generar nada, anotá cuántos créditos hay y cuánto cuesta cada tipo de generación
   (lo muestra la interfaz al elegir el modelo). Calculá el costo total de la **Prioridad 1 y 2**.
   Si supera el **50 % de los créditos disponibles**, frená y preguntale al usuario.
4. **Configuración recomendada:**
   - Cantidad de resultados por prompt: **1** (o 2 si los créditos sobran).
   - Modelo: usá **Veo 3 Fast** para probar y **Veo 3 (Quality)** solo para la versión final de los videos
     de Prioridad 2 en adelante, si los créditos alcanzan.
   - Relación de aspecto: **16:9** salvo que se indique otra.
5. **Modos que vas a usar:**
   - **Generación de imágenes**: para las referencias de personajes, pistas e íconos. Si Flow no deja generar
     imágenes sueltas, avisá y seguí con los videos.
   - **Text to Video**: video a partir de un prompt.
   - **Frames to Video**: video a partir de una imagen inicial (y opcionalmente una final). **Para hacer loops**
     (videos que se repiten sin corte), usá **la misma imagen como frame inicial y final**.
   - **Ingredients to Video**: video que usa imágenes de referencia de personajes u objetos. Sirve para que
     los personajes se vean igual en todos los videos.
6. **Descarga:** descargá cada resultado elegido en la **máxima resolución disponible** (1080p si existe)
   en MP4 y las imágenes en PNG. Renombralos según la sección 8.
7. Si un resultado sale mal (personaje deformado, texto en pantalla, parecido a una marca conocida,
   cortes raros), **regeneralo como mucho 2 veces** ajustando el prompt. Si sigue saliendo mal, anotalo y seguí.

---

## 6. Lista de entregables (en orden de prioridad)

### PRIORIDAD 1: imágenes de referencia (necesarias para el desarrollo)

**1A. Personaje + kart** (×4, una por personaje). Imagen 16:9 o 1:1.

```
[DESCRIPCIÓN DEL PERSONAJE], sitting in a [DESCRIPCIÓN DEL KART]. Three-quarter front view, full body, centered, plain light gray background. [STYLE]
```

**1B. Hoja de vistas del personaje sin kart** (×4). Imagen 16:9.

```
Character turnaround sheet of [DESCRIPCIÓN DEL PERSONAJE], standing in a relaxed neutral pose, without kart. Front view, side view, back view and three-quarter view side by side, all at the same scale, plain white background. [STYLE]
```

**1C. Arte conceptual de la pista** (×4). Imagen 16:9.

```
Wide scenic view of a go-kart race track: [DESCRIPCIÓN DE LA PISTA]. [OBSTÁCULO, si tiene]. Empty track, no karts, no people. [STYLE]
```

**1D. Mapa del circuito visto desde arriba** (×4). Imagen 1:1.

```
Top-down orthographic overview map of a closed-loop go-kart race circuit: [DESCRIPCIÓN DE LA PISTA]. The whole track layout is visible, with several curves of different sharpness, one long straight with the start/finish line, and clear track borders. [STYLE]
```

**1E. Íconos de ítems** (×4). Imagen 1:1.

```
Video game item icon of [ÍTEM], centered, single object, thick dark outline, plain pure white background. [STYLE]
```

| ID | Ítem | [ÍTEM] |
|----|------|--------|
| `turbo` | Turbo | a red chili pepper on fire with a small flame trail |
| `proyectil` | Proyectil recto | a round glowing blue energy ball with a motion streak |
| `trampa` | Trampa | a purple sticky goo puddle with bubbles |
| `escudo` | Escudo | a translucent golden bubble shield with a soft shine |

> 🛑 **CHECKPOINT 1:** mostrale al usuario las imágenes de **1A y 1B** (personajes) y esperá su OK.
> Esas imágenes se usan como referencia en todos los videos que siguen, así que tienen que estar aprobadas.

### PRIORIDAD 2: videos para los menús

**2A. Vista previa de cada pista para la pantalla de selección** (×4). Text to Video o Frames to Video
usando la imagen 1C como inicio. 16:9.

```
Smooth aerial drone flyover following a winding go-kart race track: [DESCRIPCIÓN DE LA PISTA]. [OBSTÁCULO, si tiene]. The camera glides along the track at low altitude with constant speed. Empty track, no karts. [STYLE] [AUDIO]
```

**2B. Loop de cada personaje para la selección de personaje** (×4). **Frames to Video con la imagen 1A
como frame inicial Y final** (para que el loop no tenga corte). 16:9.

```
[DESCRIPCIÓN DEL PERSONAJE] sitting in its kart, idling happily: looks around, waves at the camera, revs the engine making the kart bounce slightly, then returns to the exact starting pose. Static camera, plain light gray background. [STYLE] [AUDIO]
```

> 🛑 **CHECKPOINT 2:** mostrale al usuario un video de 2A y uno de 2B antes de hacer el resto,
> para confirmar que el estilo y la calidad van bien.

### PRIORIDAD 3: videos complementarios

**3A. Festejo de victoria para la pantalla de resultados** (×4). Ingredients to Video con la imagen 1A. 16:9.

```
[DESCRIPCIÓN DEL PERSONAJE] stands up on the seat of its kart on a winner's podium and celebrates, jumping and raising a golden trophy while colorful confetti falls. Static medium shot, softly blurred race track background. [STYLE] [AUDIO]
```

**3B. Fondo del menú principal (loop)** (×1). Primero generá una **imagen** con este prompt y después
usala como frame inicial y final en Frames to Video. 16:9. Si sobran créditos, hacé también una versión **9:16** para celular.

```
The four go-karts of these characters parked side by side at a checkered starting line on a sunny grassy hill race track: [DESCRIPCIONES DE LOS 4 PERSONAJES CON SUS KARTS]. Gentle breeze, clouds slowly moving, small flags waving, the characters breathing and blinking. Static wide camera. [STYLE] [AUDIO]
```

**3C. Video 360° del personaje (referencia para modelar)** (×4). Ingredients o Frames to Video con la imagen 1A. 16:9.

```
The camera slowly orbits a full 360 degrees around [DESCRIPCIÓN DEL PERSONAJE] sitting in its kart. The character and kart stay perfectly still in the center. Plain light gray background, even studio lighting, smooth constant orbit, no other objects. [STYLE] [AUDIO]
```

### PRIORIDAD 4: tráiler (4 tomas de 8 s cada una, para editar después)

Usá **Ingredients to Video** con las imágenes aprobadas de los personajes. 16:9.

| ID | Prompt (agregar `[STYLE] [AUDIO]` al final) |
|----|------------------------------------------|
| `t1_largada` | Close-up of a race start traffic light: three red lights turn on one by one, then all turn green, and four colorful go-karts launch off the starting line on a sunny grassy track, camera low to the ground. |
| `t2_derrape` | A small yellow go-kart driven by a chubby capybara with red goggles drifts around a tight corner on a grassy hill track, sparks shooting from the rear wheels and changing color from white to yellow to green, then it shoots forward with a bright boost flame. |
| `t3_items` | On a sunny tropical beach race track, a teal kart driven by a round robot fires a glowing blue energy ball forward, while a pink kart driven by an axolotl with a purple scarf is protected by a translucent golden bubble shield. Camera tracking alongside. |
| `t4_nieve` | A heavy gray-and-orange kart driven by a big rhinoceros wearing an orange helmet bursts through a giant snowball on a snowy mountain race track, snow exploding everywhere, camera following from behind. |

> Nota: los colores de las chispas del derrape (blanco → amarillo → verde) tienen que coincidir con los del juego.
> Si el usuario indica otros colores, usá esos.

---

## 7. Control de calidad (revisar cada resultado)

- [ ] No hay texto, letras, números ni logos visibles.
- [ ] No se parece a ningún personaje, kart o pista de una marca conocida.
- [ ] El personaje coincide con su descripción y con la imagen aprobada en el Checkpoint 1.
- [ ] El estilo es low-poly, con colores planos y alegre, y es consistente con los otros assets.
- [ ] En los loops (2B y 3B), el primer y el último frame coinciden y no se nota el corte.
- [ ] El audio no tiene voces ni canciones con letra.
- [ ] Si Flow agrega una marca de agua visible, anotalo en el informe.

---

## 8. Nombres de archivo y carpetas

Guardá todo en una carpeta **`karts-assets/`** con esta estructura (es la misma que va a tener la carpeta
`assets/` del juego). Si hay varias versiones buenas, usá `_v1`, `_v2`, etc.

```
karts-assets/
├── images/
│   ├── characters/   char_chispa_kart.png, char_chispa_sheet.png, ... (1A, 1B)
│   ├── tracks/       track_pradera_concept.png, track_pradera_map.png, ... (1C, 1D)
│   ├── items/        item_turbo.png, item_proyectil.png, item_trampa.png, item_escudo.png (1E)
│   └── menu/         menu_bg_frame.png (imagen base de 3B)
└── video/
    ├── tracks/       vid_track_pradera_preview.mp4, ... (2A)
    ├── characters/   vid_char_chispa_idle.mp4, vid_char_chispa_victory.mp4, vid_char_chispa_360.mp4, ... (2B, 3A, 3C)
    ├── menu/         vid_menu_bg_16x9.mp4, vid_menu_bg_9x16.mp4 (3B)
    └── trailer/      vid_trailer_t1_largada.mp4, ..., vid_trailer_t4_nieve.mp4 (P4)
```

Además guardá un archivo **`karts-assets/prompts.md`** con el prompt **exacto** que usaste para cada archivo
final, el modo de Flow (imagen / Text to Video / Frames to Video / Ingredients) y el modelo. Sirve para
poder regenerar o hacer variantes después.

---

## 9. Informe final (entregar al usuario)

Al terminar (o si tenés que frenar), respondé con:

1. **Resumen:** qué prioridades se completaron.
2. **Tabla de archivos:** nombre, entregable (1A, 2B…), estado (✅ ok / ⚠️ con defectos / ❌ no generado) y comentario.
3. **Créditos:** cuántos había al empezar, cuántos se gastaron y cuántos quedan.
4. **Problemas encontrados:** diferencias con la interfaz descrita, marcas de agua, prompts que no funcionaron.
5. **Ubicación** de la carpeta `karts-assets/` en la computadora.
6. **Sugerencias:** qué convendría regenerar o agregar.
