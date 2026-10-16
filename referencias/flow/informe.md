# Informe final: assets visuales del juego de karts (Google Flow / Veo)

Fecha: 15 de octubre de 2026. Proyecto en Flow: **Karts - assets**.
Juego: carreras de karts arcade para navegador (HTML5 + Three.js), en estilo 3D low-poly con colores planos.

## 1. Resumen

Están completas las 4 prioridades del encargo. Las imágenes se guardaron en PNG y los videos en MP4 1080p. Flow genera en 720p y el reescalado a 1080p no cuesta créditos.

- **Prioridad 1:** 32 imágenes de referencia (personajes con kart, hojas de vistas, arte de pistas, mapas y 4 íconos de ítems).
- **Prioridad 2:** 8 videos para menús (4 vistas previas de pista y 4 loops de personaje).
- **Prioridad 3:** 4 festejos de victoria, 4 videos 360°, el fondo del menú en 16:9 y en 9:16, y sus imágenes base.
- **Prioridad 4:** las 4 tomas del tráiler, de 8 s cada una.

Personajes: Chispa (carpincho), Tronco (rinoceronte), Pixel (robot) y Brisa (ajolote).
Pistas: Pradera, Costa, Neón y Cumbre.

## 2. Archivos

Estado: ✅ ok · ⚠️ con un defecto menor.

| Entregable | Archivos | Estado | Comentario |
|---|---|---|---|
| 1A Personaje + kart | `images/characters/char_*_kart.png` (+ `_v2` alternativas) | ✅ | Aprobados por el usuario en el Checkpoint 1 |
| 1B Hoja de vistas | `images/characters/char_*_sheet.png` (+ `_v2`) | ✅ | |
| 1C Arte de pista | `images/tracks/track_*_concept.png` | ✅ | Pradera usa la variante 2 para coincidir con su video (`_v2` = alternativa) |
| 1D Mapa cenital | `images/tracks/track_*_map.png` | ✅ | |
| 1E Íconos | `images/items/item_turbo / proyectil / trampa / escudo.png` | ✅ | |
| 2A Vista previa de pista | `video/tracks/vid_track_*_preview.mp4` | ✅ | Vuelo de dron, sin karts ni texto |
| 2B Loop de personaje | `video/characters/vid_char_*_idle.mp4` | ✅ | Primer y último frame coinciden. En el de Pixel aparece una sonrisa en la pantalla a mitad del loop |
| 3A Festejo | `video/characters/vid_char_*_victory.mp4` | ✅ | Hubo que corregir el prompt porque el podio salía con números. Tronco salió recién en el tercer intento, con un pedestal liso |
| 3B Fondo del menú 16:9 | `video/menu/vid_menu_bg_16x9.mp4` + `images/menu/menu_bg_frame.png` | ✅ | El loop no tiene corte; a mitad del clip la cámara se acerca un poco |
| 3B Fondo del menú 9:16 | `video/menu/vid_menu_bg_9x16.mp4` + `images/menu/menu_bg_frame_9x16.png` | ⚠️ | El último frame queda apenas desplazado respecto del primero; al repetirse puede notarse un saltito |
| 3C Video 360° | `video/characters/vid_char_*_360.mp4` | ✅ | |
| P4 t1 largada | `video/trailer/vid_trailer_t1_largada.mp4` | ⚠️ | Tercer intento, el mejor de los tres: los 4 personajes correctos, semáforo y largada. A los 6,5 s asoma un quinto kart chiquito al fondo |
| P4 t2 derrape | `video/trailer/vid_trailer_t2_derrape.mp4` | ⚠️ | Las chispas van de blanco a verde, pero los colores salieron algo apagados y no se ve la llama del turbo |
| P4 t3 ítems | `video/trailer/vid_trailer_t3_items.mp4` | ✅ | |
| P4 t4 nieve | `video/trailer/vid_trailer_t4_nieve.mp4` | ✅ | |

En total son 55 archivos, incluido `prompts.md` con el prompt exacto, el modo y el modelo de cada uno.

## 3. Créditos

- **Al empezar:** 1.050.
- **Gastados:** 580, que corresponden a 29 videos de 20 créditos cada uno con Veo 3.1 Fast (incluye las regeneraciones). Las imágenes (Nano Banana 2.1) y el reescalado a 1080p no cuestan nada.
- **Al terminar:** 520. Es más de lo esperado, probablemente por los 50 créditos diarios que agrega el plan.
- **Veo 3.1 Quality:** no se usó, porque cuesta 100 por video y no alcanzaban los créditos.

## 4. Problemas encontrados

- **Diferencias con la guía:** Flow ofrece Veo 3.1 (Lite, Fast y Quality) además de Omni, y usa Nano Banana 2.1 para imágenes. Los modos se llaman "Fotogramas" (Frames to Video) e "Ingredientes" (Ingredients to Video). La descarga ofrece 720p original, 1080p reescalado gratis o 4K pago; el 4K no se usó.
- **Prompts que no funcionaron:**
  - Festejos (3A): el prompt de la guía generaba podios con "1", "2" y "3". Se corrigió pidiendo un podio liso sin marcas; para Tronco hubo que pedir un pedestal de piedra liso.
  - Tráiler t1: con los 4 karts como ingredientes, la v1 metió un zorro que no es del juego y la v2 mostró a Brisa sin kart. La versión final usa Frames to Video, con la imagen del menú como frame inicial.
- **Prompts mezclados:** al enviar prompts muy seguidos, algunos se concatenaron. En el proyecto de Flow quedaron unas 10 imágenes mezcladas que no se usan para nada.
- **Video enviado a la papelera:** por un clic que cayó mal, un video fue a parar a la papelera de Flow. Se restauró enseguida y no se borró nada definitivamente.
- **Marca de agua:** no se vieron marcas de agua visibles.
- **Audio:** todos los videos tienen pista de sonido, pero no se pudo escuchar; falta confirmar que no hay voces ni música con letra.

## 5. Ubicación

`C:\Users\nilum\OneDrive\Escritorio\KartJuego\karts-assets\`, con esta estructura:

- `images/`: carpetas `characters`, `tracks`, `items` y `menu`.
- `video/`: carpetas `tracks`, `characters`, `menu` y `trailer`.
- `prompts.md`: el prompt exacto, el modo y el modelo de cada archivo.

## 6. Sugerencias

- Si los defectos ⚠️ molestan, rehacer el loop 9:16 o la toma t1 cuesta 20 créditos cada uno.
- Los créditos que quedan alcanzan para pasar a Veo Quality (100 por video) solo los videos más visibles, por ejemplo el fondo del menú.
- Las imágenes son de 1K (1376×768 y 1024×1024). Si hace falta más detalle para modelar en 3D, Flow ofrece 2K reescalado gratis.
- Conviene escuchar los videos para confirmar que el audio no tiene voces.
