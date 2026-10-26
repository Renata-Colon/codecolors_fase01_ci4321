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

// base de la torreta
// cilindro fijo en el suelo
// usamos un loop para generar los vértices del círculo
export function crearBaseTorreta() {
  const radios = 1.5, altura = 1.0, segmentos = 16;
  const posiciones: number[] = [];
  const indices: number[] = [];
  
  for (let i = 0; i <= segmentos; i++) {
    const theta = (i / segmentos) * Math.PI * 2;
    const x = Math.cos(theta) * radios;
    const z = Math.sin(theta) * radios;
    posiciones.push(x, 0, z, x, altura, z); // guardamos base y tope
  }
  for (let i = 0; i < segmentos; i++) {
    const a = i * 2, b = a + 1, c = a + 2, d = a + 3;
    indices.push(a, b, c, b, d, c); // caras laterales en ccw
  }
  return { posiciones: new Float32Array(posiciones), indices: new Uint16Array(indices), numIndices: indices.length };
}

// torreta superior
// igual que la base pero más pequeña, es la que gira en horizontal
export function crearTorretaSuperior() {
  const radios = 1.2, altura = 0.8, segmentos = 16;
  const posiciones: number[] = [];
  const indices: number[] = [];
  
  for (let i = 0; i <= segmentos; i++) {
    const theta = (i / segmentos) * Math.PI * 2;
    const x = Math.cos(theta) * radios;
    const z = Math.sin(theta) * radios;
    posiciones.push(x, 0, z, x, altura, z);
  }
  for (let i = 0; i < segmentos; i++) {
    const a = i * 2, b = a + 1, c = a + 2, d = a + 3;
    indices.push(a, b, c, b, d, c);
  }
  return { posiciones: new Float32Array(posiciones), indices: new Uint16Array(indices), numIndices: indices.length };
}

// cañón
// agregamos especie de "tapas" a los extremos para que no se vea feo
// apunta en -z (hacia donde estan los objetivos)
export function crearCanon() {
  const radio = 0.3, largo = 3.0, segmentos = 12;
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

// esfera
// la usamos tanto para la bala como para los objetivos
// se genera con segmentos de latitud y longitud 
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

// barra del indicador de fuerza
export function crearBarraIndicador() {
  const w = 0.4, h = 0.15;
  const posiciones = new Float32Array([
    0, 0, 0,    w, 0, 0,    w, h, 0,
    0, 0, 0,    w, h, 0,    0, h, 0
  ]);
  const indices = new Uint16Array([0, 1, 2, 3, 4, 5]);
  return { posiciones, indices, numIndices: indices.length };
}