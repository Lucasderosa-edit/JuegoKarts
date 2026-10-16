# Proyecto: Juego de karts para navegador

## Descripción
Juego de carreras de karts arcade, jugable en el navegador (PC y celular),
inspirado en el género "kart racer" pero con personajes, pistas y nombres
100% originales. NO usar personajes, nombres, música ni pistas de Nintendo
ni de ninguna otra marca.

## Stack técnico
- HTML5 + JavaScript (ES modules), sin frameworks pesados.
- Three.js para gráficos 3D low-poly.
- Vite como herramienta de desarrollo y build.
- Sin backend: todo corre en el cliente.
- Publicación en GitHub Pages.

## Reglas de trabajo
- Trabajar un objetivo por vez y no pasar al siguiente hasta que el actual funcione.
- Al terminar cada objetivo: probar que el juego corre sin errores en consola,
  hacer commit con un mensaje claro y marcar el objetivo como completado acá.
- Código ordenado en módulos: `kart/`, `track/`, `ai/`, `items/`, `ui/`, `audio/`.
- Todos los valores de jugabilidad (velocidad, aceleración, derrape, etc.)
  en un archivo `config.js` para poder ajustarlos fácilmente.
- Usar gráficos simples (formas geométricas, colores planos) hasta que se
  indique reemplazarlos por assets finales.
- Priorizar que el manejo se sienta bien antes que agregar contenido.

## Objetivos

1. **Base del proyecto**
   Crear el proyecto con Vite + Three.js, una escena con cámara, luz y piso,
   y un loop de juego a 60 FPS.

2. **Kart controlable**
   Kart que acelera, frena, va en reversa y dobla. Controles: flechas o WASD.
   Cámara en tercera persona que sigue al kart de forma suave.

3. **Derrape con turbo**
   Al mantener una tecla (Espacio) mientras se dobla, el kart derrapa.
   Cuanto más dura el derrape, mayor turbo al soltar (2 o 3 niveles,
   indicados con chispas de distinto color).

4. **Primera pista**
   Circuito cerrado con bordes, superficie de pista, pasto que reduce la
   velocidad y línea de largada.

5. **Sistema de vueltas**
   Checkpoints para evitar atajos, contador de 3 vueltas, cronómetro por
   vuelta y tiempo total, cuenta regresiva de largada (3, 2, 1, ¡YA!).

6. **Rivales con IA**
   7 karts rivales que siguen la pista mediante waypoints, con algo de
   variación para que no corran todos igual. Ajustar la dificultad para
   que la carrera sea pareja.

7. **Posiciones en carrera**
   Calcular la posición de cada corredor en tiempo real y mostrarla en
   pantalla (1.º, 2.º, etc.). Pantalla de resultados al terminar.

8. **Colisiones**
   Choques entre karts y contra los bordes, con rebote creíble.

9. **Power-ups**
   Cajas de ítems en la pista que se regeneran. Ítems mínimos:
   turbo, proyectil que va recto, trampa que se deja atrás y escudo.
   Los rivales también deben usar ítems.

10. **Interfaz (HUD) y menús**
    HUD con posición, vuelta, ítem actual y velocímetro. Menú principal,
    selección de personaje, selección de pista y menú de pausa.

11. **Más pistas**
    Sumar 2 pistas más con temáticas distintas (por ejemplo: playa,
    ciudad de noche, montaña nevada) y algún obstáculo propio de cada una.

12. **Personajes originales**
    Al menos 4 personajes con stats distintos (velocidad, aceleración,
    manejo). Integrar los diseños que se provean como imágenes de referencia
    o texturas en la carpeta `assets/`.

13. **Audio**
    Efectos de sonido (motor, derrape, turbo, choques, ítems) y música de
    fondo. Usar solo audio libre de derechos o generado por código.
    Control de volumen en el menú.

14. **Controles táctiles y gamepad**
    Botones en pantalla para celular y soporte para joystick (Gamepad API).

15. **Multijugador local**
    Modo 2 jugadores con pantalla dividida en la misma computadora.

16. **Pulido**
    Partículas (polvo, chispas), efecto de velocidad en la cámara,
    transiciones entre pantallas y guardado de mejores tiempos en
    localStorage.

17. **Optimización**
    Que corra fluido en una notebook común y en celulares de gama media.
    Opción de calidad gráfica baja/media/alta.

18. **Publicación**
    Configurar el build para GitHub Pages y dejar un README con
    instrucciones para jugar y el link al juego.

## Estado
- [x] 1  - [x] 2  - [x] 3  - [x] 4  - [x] 5  - [x] 6
- [x] 7  - [ ] 8  - [ ] 9  - [ ] 10 - [ ] 11 - [ ] 12
- [ ] 13 - [ ] 14 - [ ] 15 - [ ] 16 - [ ] 17 - [ ] 18
