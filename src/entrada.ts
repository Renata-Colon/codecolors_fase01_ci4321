// entrada
import { EstadoJuego } from './tipos';

export class ManejadorEntrada {
  private teclas: { [key: string]: boolean } = {};
  public disparoSolicitado = false;
  private cambioFuerzaSolicitado = false;
  public reinicioSolicitado = false; // bandera para reiniciar 
  private referenciaEstado!: EstadoJuego;

  constructor() {
    window.addEventListener('keydown', (e) => {
      // evita scroll en la pagina tanto con space como con las teclas que tienen flechas
      if (e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault(); 
      
      // acciones de pulsación única
      if (!e.repeat) {
        if (e.code === 'Space') this.disparoSolicitado = true;
        if (e.code === 'KeyF') this.cambioFuerzaSolicitado = true;
        if (e.code === 'KeyR') this.reinicioSolicitado = true; // boton reinicio
        if (e.code === 'Digit1' || e.code === 'Numpad1') if (this.referenciaEstado) this.referenciaEstado.nivelFuerza = 1;
        if (e.code === 'Digit2' || e.code === 'Numpad2') if (this.referenciaEstado) this.referenciaEstado.nivelFuerza = 2;
        if (e.code === 'Digit3' || e.code === 'Numpad3') if (this.referenciaEstado) this.referenciaEstado.nivelFuerza = 3;
      }
      
      this.teclas[e.code] = true;
    });

    window.addEventListener('keyup', (e) => {
      this.teclas[e.code] = false;
    });

    // si el jugador hace clic fuera de la ventana, soltamos todas las teclas
    // para que el tanque no se quede yéndose solo hacia la pared infinitamente
    window.addEventListener('blur', () => {
      this.teclas = {};
    });
  }

  public vincularEstado(estado: EstadoJuego): void {
    this.referenciaEstado = estado;
  }

  public procesarEntrada(dt: number): void {
    if (!this.referenciaEstado) return;
    
    const VELOCIDAD_INCLINACION = 30; 
    const VELOCIDAD_MOVIMIENTO = 8;  

    // desplazamiento horizontal 
    if (this.teclas['KeyA'] || this.teclas['ArrowLeft']) {
       this.referenciaEstado.desplazamientoX -= VELOCIDAD_MOVIMIENTO * dt;
    }
    if (this.teclas['KeyD'] || this.teclas['ArrowRight']) {
       this.referenciaEstado.desplazamientoX += VELOCIDAD_MOVIMIENTO * dt;
    }

    // límite estricto para que no se salga del mapa
    this.referenciaEstado.desplazamientoX = Math.max(-10, Math.min(10, this.referenciaEstado.desplazamientoX));

    // elevación vertical
    if (this.teclas['KeyW'] || this.teclas['ArrowUp']) {
      this.referenciaEstado.inclinacionCanon = Math.min(90, this.referenciaEstado.inclinacionCanon + VELOCIDAD_INCLINACION * dt);
    }
    if (this.teclas['KeyS'] || this.teclas['ArrowDown']) {
      this.referenciaEstado.inclinacionCanon = Math.max(5, this.referenciaEstado.inclinacionCanon - VELOCIDAD_INCLINACION * dt);
    }

    // alternar fuerza con F
    if (this.cambioFuerzaSolicitado) {
      if (this.referenciaEstado.nivelFuerza === 1) {
        this.referenciaEstado.nivelFuerza = 2;
      } else if (this.referenciaEstado.nivelFuerza === 2) {
        this.referenciaEstado.nivelFuerza = 3;
      } else {
        this.referenciaEstado.nivelFuerza = 1; 
      }
      this.cambioFuerzaSolicitado = false;
    }
  }
}