// geometría del juego

// suelo
export function crearSuelo() {
  const posiciones = new Float32Array([
    -15.0, 0.0,  15.0,   15.0, 0.0,  15.0,   15.0, 0.0, -15.0,
    -15.0, 0.0,  15.0,   15.0, 0.0, -15.0,  -15.0, 0.0, -15.0
  ]);
  const indices = new Uint16Array([0, 1, 2, 3, 4, 5]);
  return { posiciones, indices, numIndices: indices.length };
}

// la base de la torreta es un bloque rectangular 
export function crearBaseTorreta() {
  const w = 2.0, h = 1.0, d = 2.0; // ancho, alto, profundo
  const posiciones = new Float32Array([
    // cara frontal (-z, hacia los objetivos)
    -w/2, 0, -d/2,   w/2, 0, -d/2,   w/2, h, -d/2,  -w/2, h, -d/2,
    // cara trasera (+z, hacia la cámara)
     w/2, 0,  d/2,  -w/2, 0,  d/2,  -w/2, h,  d/2,   w/2, h,  d/2,
    // cara superior (+y)
    -w/2, h, -d/2,   w/2, h, -d/2,   w/2, h,  d/2,  -w/2, h,  d/2,
    // cara inferior (-y)
    -w/2, 0,  d/2,   w/2, 0,  d/2,   w/2, 0, -d/2,  -w/2, 0, -d/2,
    // cara derecha (+x)
     w/2, 0, -d/2,   w/2, 0,  d/2,   w/2, h,  d/2,   w/2, h, -d/2,
    // cara izquierda (-x)
    -w/2, 0,  d/2,  -w/2, 0, -d/2,  -w/2, h, -d/2,  -w/2, h,  d/2
  ]);
  const indices = new Uint16Array([
    0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11,
    12, 13, 14, 12, 14, 15, 16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23
  ]);
  return { posiciones, indices, numIndices: indices.length };
}

// la torreta superior es una esfera que creamos con la funcion de más abajo
export function crearTorretaSuperior() {
  return crearEsfera(0.75, 24, 24); 
}

// el cañón es un cilindro con tapas 
export function crearCanon() {
  const radio = 0.2, largo = 2.0, segmentos = 12; 
  const posiciones: number[] = [];
  const indices: number[] = [];
  
  // caras laterales del cilindro
  for (let i = 0; i <= segmentos; i++) {
    const theta = (i / segmentos) * Math.PI * 2;
    const x = Math.cos(theta) * radio;
    const y = Math.sin(theta) * radio;
    posiciones.push(x, y, 0, x, y, -largo);
  }
  for (let i = 0; i < segmentos; i++) {
    const a = i * 2, b = a + 1, c = a + 2, d = a + 3;
    indices.push(a, b, c, b, d, c);
  }
  
  // tapa trasera (la base del cañón, en z=0)
  const baseCenterIdx = posiciones.length / 3;
  posiciones.push(0, 0, 0); 
  for (let i = 0; i <= segmentos; i++) {
    const theta = (i / segmentos) * Math.PI * 2;
    const x = Math.cos(theta) * radio;
    const y = Math.sin(theta) * radio;
    posiciones.push(x, y, 0);
  }
  for (let i = 0; i < segmentos; i++) {
    indices.push(baseCenterIdx, baseCenterIdx + 1 + i, baseCenterIdx + 2 + i);
  }
  
  // tapa frontal (la punta del cañón, en z=-largo)
  const tipCenterIdx = posiciones.length / 3;
  posiciones.push(0, 0, -largo); 
  for (let i = 0; i <= segmentos; i++) {
    const theta = (i / segmentos) * Math.PI * 2;
    const x = Math.cos(theta) * radio;
    const y = Math.sin(theta) * radio;
    posiciones.push(x, y, -largo);
  }
  for (let i = 0; i < segmentos; i++) {
    // orden inverso aquí para que la normal de la tapa apunte hacia afuera 
    indices.push(tipCenterIdx, tipCenterIdx + 2 + i, tipCenterIdx + 1 + i); 
  }
  
  return { posiciones: new Float32Array(posiciones), indices: new Uint16Array(indices), numIndices: indices.length };
}

// esfera, con funcion usada para la torreta superior, la bala y los objetivos
export function crearEsfera(radio: number, segmentosLat: number = 16, segmentosLong: number = 16) {
  const posiciones: number[] = [];
  const indices: number[] = [];
  
  for (let lat = 0; lat <= segmentosLat; lat++) {
    const theta = (lat / segmentosLat) * Math.PI;
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);
    
    for (let lon = 0; lon <= segmentosLong; lon++) {
      const phi = (lon / segmentosLong) * Math.PI * 2;
      const sinPhi = Math.sin(phi);
      const cosPhi = Math.cos(phi);
      
      const x = cosPhi * sinTheta;
      const y = cosTheta;
      const z = sinPhi * sinTheta;
      
      posiciones.push(radio * x, radio * y, radio * z);
    }
  }
  
  for (let lat = 0; lat < segmentosLat; lat++) {
    for (let lon = 0; lon < segmentosLong; lon++) {
      const first = (lat * (segmentosLong + 1)) + lon;
      const second = first + segmentosLong + 1;
      indices.push(first, second, first + 1, second, second + 1, first + 1);
    }
  }
  return { posiciones: new Float32Array(posiciones), indices: new Uint16Array(indices), numIndices: indices.length };
}

// barra del indicador de fuerza hecha con paralelogramos
export function crearBarraIndicador() {
  const w = 0.8, h = 0.15, skew = 0.2; 
  const offset = skew / 2; // compensamos para que el centro visual sea X=0
  
  const posiciones = new Float32Array([
    -w/2 - offset, 0, 0,          w/2 - offset, 0, 0,          w/2 + offset, h, 0,
    -w/2 - offset, 0, 0,          w/2 + offset, h, 0,          -w/2 + offset, h, 0
  ]);
  const indices = new Uint16Array([0, 1, 2, 3, 4, 5]);
  return { posiciones, indices, numIndices: indices.length };
}