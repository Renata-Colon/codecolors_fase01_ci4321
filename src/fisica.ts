import { EstadoJuego } from './tipos';

const GRAVEDAD = -9.81;
const MAGNITUDES_FUERZA: Record<1 | 2 | 3, number> = {
  1: 15.0,
  2: 25.0,
  3: 35.0
};

export class MotorFisico {
  public lanzar(estado: EstadoJuego, posPunta: [number, number, number], adelante: [number, number, number]): void {
    if (estado.proyectil.activo) return; // Solo un proyectil activo a la vez

    const velocidad = MAGNITUDES_FUERZA[estado.nivelFuerza];
    estado.proyectil.activo = true;
    estado.proyectil.posicion = [...posPunta];
    estado.proyectil.velocidad = [
      adelante[0] * velocidad,
      adelante[1] * velocidad,
      adelante[2] * velocidad
    ];
  }

  public actualizar(estado: EstadoJuego, dt: number): void {
    if (!estado.proyectil.activo) return;

    const proj = estado.proyectil;

    // 1. Integracion de la gravedad sobre la velocidad Y
    proj.velocidad[1] += GRAVEDAD * dt;

    // 2. Integracion de la posicion: pos += vel * dt
    proj.posicion[0] += proj.velocidad[0] * dt;
    proj.posicion[1] += proj.velocidad[1] * dt;
    proj.posicion[2] += proj.velocidad[2] * dt;

    // 3. Colision con el suelo (Y <= 0)
    if (proj.posicion[1] <= 0) {
      proj.posicion[1] = 0;
      proj.activo = false;
      return;
    }

    // 4. Colision con objetivos (Distancia centro a centro)
    for (const objetivo of estado.objetivos) {
      if (!objetivo.vivo) continue; // aun existe la esfera??

      const dx = proj.posicion[0] - objetivo.posicion[0];
      const dy = proj.posicion[1] - objetivo.posicion[1];
      const dz = proj.posicion[2] - objetivo.posicion[2];

      // 1. Calculamos la distancia al cuadrado
      const distanciaCuadrada = dx * dx + dy * dy + dz * dz;

      // 2. Sumamos los radios y los elevamos al cuadrado
      const sumaRadios = objetivo.radio + proj.radio;
      const sumaRadiosCuadrada = sumaRadios * sumaRadios;

      // 3. Comparamos ambos cuadrados
      if (distanciaCuadrada <= sumaRadiosCuadrada) {
        objetivo.vivo = false; // se alcanzo la esfera
        proj.activo = false;
        break;
      }
    }
  }
}