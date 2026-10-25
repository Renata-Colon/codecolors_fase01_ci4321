import { EstadoJuego, PuntaCanon } from './tipos';
import { CamaraJuego } from './camara';
import { ManejadorEntrada } from './entrada';
import { MotorFisico } from './fisica';

export interface EscenaJuego {
  obtenerPuntaCanon: () => PuntaCanon;
  fijarTransformacionTorreta: (giro: number, inclinacion: number) => void;
  fijarIndicadorFuerza: (nivel: 1 | 2 | 3) => void;
  fijarTransformacionProyectil: (posicion: [number, number, number], activo: boolean) => void;
  obtenerPosicionesObjetivos: () => { id: number; posicion: [number, number, number]; radio: number }[];
  renderizar: (matrizVista: Float32Array, matrizProyeccion: Float32Array) => void;
}

export class OrquestadorJuego {
  public estado: EstadoJuego;
  public camara: CamaraJuego;
  private entrada: ManejadorEntrada;
  private fisica: MotorFisico;
  private escena: EscenaJuego;
  private ultimoTiempo: number | null = null;
  private readonly DT_MAXIMO = 0.1;

  constructor(canvas: HTMLCanvasElement, escena: EscenaJuego) {
    this.escena = escena;
    this.camara = new CamaraJuego(canvas.width / canvas.height);
    this.entrada = new ManejadorEntrada();
    this.fisica = new MotorFisico();

    // Inicializar estado del juego
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
      objetivos: this.escena.obtenerPosicionesObjetivos().map((t) => ({ ...t, vivo: true })),
    };

    this.entrada.vincularEstado(this.estado);
  }

  public iniciar(): void {
    requestAnimationFrame(this.bucle.bind(this));
  }

  private bucle(ahora: number): void {
    if (this.ultimoTiempo === null) this.ultimoTiempo = ahora;
    
    // Calculo de dt con proteccion de pestaña oculta (DT_MAXIMO = 0.1) para prevenir saltos bruscos
    const dt = Math.min((ahora - this.ultimoTiempo) / 1000.0, this.DT_MAXIMO);
    this.ultimoTiempo = ahora;

    // --- FASE 1: PROCESAR ENTRADAS ---
    this.entrada.procesarEntrada(dt);
    if (this.entrada.disparoSolicitado) {
      const punta = this.escena.obtenerPuntaCanon(); 
      this.fisica.lanzar(this.estado, punta.posicion, punta.adelante);
      this.entrada.disparoSolicitado = false;
    }

    // --- FASE 2: ACTUALIZAR (FISICA Y ESTADO) ---
    this.fisica.actualizar(this.estado, dt);

    // Sincronizar transformaciones con la escena gráfica
    this.escena.fijarTransformacionTorreta(this.estado.giroTorreta, this.estado.inclinacionCanon);
    this.escena.fijarIndicadorFuerza(this.estado.nivelFuerza);
    this.escena.fijarTransformacionProyectil(this.estado.proyectil.posicion, this.estado.proyectil.activo);

    // --- FASE 3: RENDERIZAR ---
    this.escena.renderizar(
      this.camara.matrizVista as Float32Array,
      this.camara.matrizProyeccion as Float32Array
    );

    requestAnimationFrame(this.bucle.bind(this));
  }
}