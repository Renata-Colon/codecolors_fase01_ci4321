export function crearSuelo() {
  // plano grande marrón 
  // los vértices están en orden estrictamente antihorario (CCW) vistos desde arriba (+Y)
  // Si no están en CCW, WebGL aplica backface culling y el suelo desaparece.
  const posiciones = new Float32Array([
    -10.0, 0.0,  10.0,  // 0 frente-izquierda (cerca de la cámara)
     10.0, 0.0,  10.0,  // 1 frente-derecha
     10.0, 0.0, -10.0,  // 2 atrás-derecha
    -10.0, 0.0, -10.0   // 3 atrás-izquierda
  ]);
  
  // dos triángulos que forman el cuadrado
  const indices = new Uint16Array([
    0, 1, 2, // triángulo 1
    0, 2, 3  // triángulo 2
  ]);
  
  return { posiciones, indices, numIndices: indices.length };
}

export function crearCuboBase() {
  // base de la torreta provisional: 2x2x2
  const w = 2.0, h = 2.0, d = 2.0;
  const posiciones = new Float32Array([
    // c frontal (+Z) - CCW
    -w/2, 0,  d/2,   w/2, 0,  d/2,   w/2, h,  d/2,  -w/2, h,  d/2,
    // cara trasera (-Z) - CCW
     w/2, 0, -d/2,  -w/2, 0, -d/2,  -w/2, h, -d/2,   w/2, h, -d/2,
    // cara superior (+Y) - CCW
    -w/2, h,  d/2,   w/2, h,  d/2,   w/2, h, -d/2,  -w/2, h, -d/2,
    // cara inferior (-Y) - CCW
    -w/2, 0, -d/2,   w/2, 0, -d/2,   w/2, 0,  d/2,  -w/2, 0,  d/2,
    // cara derecha (+X) - CCW
     w/2, 0,  d/2,   w/2, 0, -d/2,   w/2, h, -d/2,   w/2, h,  d/2,
    // cara izquierda (-X) - CCW
    -w/2, 0, -d/2,  -w/2, 0,  d/2,  -w/2, h,  d/2,  -w/2, h, -d/2
  ]);
  
  const indices = new Uint16Array([
    0, 1, 2, 0, 2, 3,       // frontal
    4, 5, 6, 4, 6, 7,       // trasera
    8, 9, 10, 8, 10, 11,    // superior
    12, 13, 14, 12, 14, 15, // inferior
    16, 17, 18, 16, 18, 19, // derecha
    20, 21, 22, 20, 22, 23  // izquierda
  ]);
  
  return { posiciones, indices, numIndices: indices.length };
}