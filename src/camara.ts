import { mat4 } from 'gl-matrix';

// Definimos una estructura o tipo para retornar ambas matrices juntas
export interface MatricesCamara {
  vista: mat4;
  proyeccion: mat4;
}

/**
- Configuracion de la camara para que este arriba del lado de la torreta apuntando un 
- poco mas al centro para tener mejor vision de todo el ambiente
 */
export function configurarCamara(relacionAspecto: number): MatricesCamara {
  // 1. Matriz de Vista (LookAt): Colocada atras y arriba, mirando hacia la torreta y objetivos
  const vista = mat4.lookAt(
    mat4.create(),
    [0, 8, 18],   // Posicion de la camara 
    [0, 2, -10],  // Punto al que mira 
    [0, 1, 0]     // Vector hacia arriba 
  );

  // 2. Matriz de Proyeccion (Perspectiva): FOV de 45 (Math.PI / 4), relacion de aspecto dinamica y planos cerca/lejos
  const proyeccion = mat4.perspective(
    mat4.create(),
    Math.PI / 4,
    relacionAspecto,  // proporcion entre el ancho y el alto de la pantalla (canvas.width / canvas.height)
    0.1,
    100.0
  );

  return { vista, proyeccion };
}