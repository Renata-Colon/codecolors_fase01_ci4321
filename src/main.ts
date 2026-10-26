// aquí importamos los tipos y la escena
import { EstadoJuego, PuntaCanon } from './tipos';
import { configurarCamara, MatricesCamara } from './camara';
import { ManejadorEntrada } from './entrada';
import { MotorFisico } from './fisica';
import { createFixedFunction } from './vendor/ff/ff'; // Librería del profe para el estado de dibujo
import { EscenaGrafica } from './escena';

// contrato escena
export interface EscenaJuego {
  obtenerPuntaCanon: () => PuntaCanon;
  fijarTransformacionTorreta: (giro: number, inclinacion: number) => void;
  fijarIndicadorFuerza: (nivel: 1 | 2 | 3) => void;
  fijarTransformacionProyectil: (posicion: [number, number, number], activo: boolean) => void;
  obtenerPosicionesObjetivos: () => { id: number; posicion: [number, number, number]; radio: number }[];
  renderizar: (matrizVista: Float32Array, matrizProyeccion: Float32Array) => void;
}

// clase orquestadora (Lógica del juego)
export class OrquestadorJuego {
  public estado: EstadoJuego;
  private matrices: MatricesCamara;
  private entrada: ManejadorEntrada;
  private fisica: MotorFisico;
  private escena: EscenaJuego;
  private ultimoTiempo: number | null = null;
  private readonly DT_MAXIMO = 0.1; // evita saltos brutales si la pestaña se pone en segundo plano

  constructor(canvas: HTMLCanvasElement, escena: EscenaJuego) {
    this.escena = escena;
    this.matrices = configurarCamara(canvas.width / canvas.height);
    this.entrada = new ManejadorEntrada();
    this.fisica = new MotorFisico();

    // estado inicial del juego
    this.estado = {
      giroTorreta: 0,
      inclinacionCanon: 30,
      nivelFuerza: 1,
      proyectil: {
        activo: false,
        posicion: [0, 0, 0],
        velocidad: [0, 0, 0],
        radio: 0.4,
      },
      // mapeamos los objetivos que me devuelve la escena para tener su estado vivo
      objetivos: this.escena.obtenerPosicionesObjetivos().map((t) => ({ ...t, vivo: true })),
    };

    this.entrada.vincularEstado(this.estado);
  }

  public iniciar(): void {
    requestAnimationFrame(this.bucle.bind(this));
  }

  private bucle(ahora: number): void {
    if (this.ultimoTiempo === null) this.ultimoTiempo = ahora;
    
    // cálculo del delta time (dt) en segundos para que la física sea independiente del framerate
    const dt = Math.min((ahora - this.ultimoTiempo) / 1000.0, this.DT_MAXIMO);
    this.ultimoTiempo = ahora;

    // FASE 1: procesar entradas
    this.entrada.procesarEntrada(dt);
    if (this.entrada.disparoSolicitado) {
      const punta = this.escena.obtenerPuntaCanon(); 
      this.fisica.lanzar(this.estado, punta.posicion, punta.adelante);
      this.entrada.disparoSolicitado = false;
    }

    // FASE 2: actualizar (física y estados)
    this.fisica.actualizar(this.estado, dt);

    // sincronizar: se pasan a la escena los nuevos valores para que dibuje en la posición correcta
    this.escena.fijarTransformacionTorreta(this.estado.giroTorreta, this.estado.inclinacionCanon);
    this.escena.fijarIndicadorFuerza(this.estado.nivelFuerza);
    this.escena.fijarTransformacionProyectil(this.estado.proyectil.posicion, this.estado.proyectil.activo);

    // FASE 3: renderizar
    this.escena.renderizar(
      this.matrices.vista as Float32Array,
      this.matrices.proyeccion as Float32Array
    );

    requestAnimationFrame(this.bucle.bind(this));
  }
}

// inicializacion del juego  
window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  
  // ajustar canvas al tamaño real de la ventana para que no se vea raro
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // obtener contexto WebGL2 (para usar VAOs nativos)
  const gl = canvas.getContext('webgl2');
  if (!gl) {
    alert('Tu navegador no soporta WebGL2');
    return;
  }

  // crear la instancia de FixedFunction
  const ff = createFixedFunction(gl);

  // pasamos gl y ff a la escena 3
  const escena = new EscenaGrafica(gl, ff);
  const juego = new OrquestadorJuego(canvas, escena);
  
  juego.iniciar();
});