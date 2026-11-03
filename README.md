# CodeColors - Proyecto, Fase 01: CI4321 (Sep - Dic 2026)

## Integrantes del equipo CodeColors
- Renata Colón
- Alejandra Mármol

## ¿En qué consiste la entrega?
Se trata de las funcionalidades e implementaciones básicas de un juego de artillería en 3D con temática del Mundo de Bowser. En este, el jugador controlará una especie de cañón con el objetivo de destruir esferas flotantes calculando la trayectoria, el ángulo de elevación y la fuerza del disparo. 

El proyecto implementa un **árbol de escena jerárquico** utilizando matrices de transformación, donde los componentes del tanque (base inferior, base superior, cañón y proyectil) heredan las transformaciones de sus nodos padres.

## Instrucciones para correr el proyecto

1. Asegúrese de tener [Node.js](https://nodejs.org/) instalado en su computadora.
2. Clone este repositorio (o descargue el código fuente).
3. Abra una terminal en la carpeta raíz del proyecto.
4. Instale las dependencias ejecutando:
   ```bash
   npm install 
   ```
5. Inicie el servidor con:
   ```bash
   npm run dev
   ```
6. Abra su navegador y vaya a la dirección que indica la terminal (por lo general es http://localhost:5173)
7. Disfrute:)

## Controles del juego
| Tecla | Acción |
| :--- | :--- |
| **`A` / `D`** o **`Flecha Izq.` / `Flecha Der.`** | Desplazan el tanque horizontalmente |
| **`W` / `S`** o **`Flecha Arriba` / `Flecha Abajo`** | Elevar o bajar la inclinación del cañón |
| **`Espacio`** | Disparar el proyectil |
| **`F`** | Cambiar el nivel de fuerza de 1 en 1 |
| **`1`, `2`, `3`** | Seleccionar directamente el nivel de fuerza |

## Arquitectura de esta fase
El código está organizado dentro de la carpeta `src/`, separando claramente las responsabilidades para mantener la lógica del juego desacoplada de los gráficos:

- **`main.ts`**: es el punto de entrada y orquestador principal. Este inicializa el contexto WebGL y sincroniza la física con la escena.
- **`escena.ts`**: responsable exclusivo de los gráficos, es quien maneja los VAOs de WebGL2, el árbol de escena jerárquico y el renderizado de las primitivas.
- **`fisica.ts`**: motor de física independiente; calcula la trayectoria parabólica, la gravedad y la detección de colisiones.
- **`entrada.ts`**: manejador de eventos. Captura el teclado, previene el scroll del navegador y gestiona los controles del jugador.
- **`geometria.ts`**: generador de mallas que contiene las funciones matemáticas para la creación de las primitivas.
- **`camara.ts`**: configuración de la cámara, este genera y actualiza las matrices de Vista y Proyección.
- **`tipos.ts`**: contratos e interfaces donde se definen las estructuras de datos compartidas que comunican la lógica con la vista.
- **`constants.ts`**: son las constantes globales del juego (como colores base, dimensiones del canvas, etc.).
- **`style.css`**: los estilos básicos para el contenedor del canvas y la interfaz.
- **`vendor/ff/`**: librería *FixedFunction* (proporcionada por el profe). 

