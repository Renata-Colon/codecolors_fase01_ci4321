export interface PuntaCanon {
  posicion: [number, number, number]; // punto exacto de la punta del cañon
  adelante: [number, number, number]; // vector que indica hacia donde esta apuntando el cañon en ese instante, para saber en qué direccion exacta se impulsa la bala
}

export interface Objetivo {
  id: number;
  posicion: [number, number, number];
  radio: number;
  vivo: boolean;
}

export interface Proyectil {
  activo: boolean;
  posicion: [number, number, number];
  velocidad: [number, number, number];
  radio: number;
}

export interface EstadoJuego {
  desplazamientoX: number; // <-- Cambiado de giroTorreta a desplazamientoX
  inclinacionCanon: number;
  nivelFuerza: 1 | 2 | 3;
  proyectil: Proyectil;
  objetivos: Objetivo[];
}

