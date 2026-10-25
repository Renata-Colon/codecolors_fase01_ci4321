import { EstadoJuego } from './tipos';

export class ManejadorEntrada {
  private teclas: { [key: string]: boolean } = {};
  public disparoSolicitado = false;
  private cambioFuerzaSolicitado = false;
  private referenciaEstado!: EstadoJuego;

  constructor() {
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space') e.preventDefault(); // Evita scroll en la pagina
      
      // Acciones de pulsacion unica (ignoran e.repeat)
      if (!e.repeat) {
        if (e.code === 'Space') this.disparoSolicitado = true;
        if (e.code === 'KeyF') this.cambioFuerzaSolicitado = true;
        if (e.code === 'Digit1' || e.code === 'Numpad1') if (this.referenciaEstado) this.referenciaEstado.nivelFuerza = 1;
        if (e.code === 'Digit2' || e.code === 'Numpad2') if (this.referenciaEstado) this.referenciaEstado.nivelFuerza = 2;
        if (e.code === 'Digit3' || e.code === 'Numpad3') if (this.referenciaEstado) this.referenciaEstado.nivelFuerza = 3;
      }
      
      this.teclas[e.code] = true;
    });

    window.addEventListener('keyup', (e) => {
      this.teclas[e.code] = false;
    });
  }

  public vincularEstado(estado: EstadoJuego): void {
    this.referenciaEstado = estado;
  }

  public procesarEntrada(dt: number): void {
    if (!this.referenciaEstado) return;
    
    const VELOCIDAD_GIRO = 50;   // grados / segundo
    const VELOCIDAD_INCLINACION = 40; // grados / segundo

    // Rotacion Horizontal (A / D o Flechas) dentro de limites (-60 a 60)
    if (this.teclas['KeyA'] || this.teclas['ArrowLeft']) {
      this.referenciaEstado.giroTorreta = Math.min(60, this.referenciaEstado.giroTorreta + VELOCIDAD_GIRO * dt);
    }
    if (this.teclas['KeyD'] || this.teclas['ArrowRight']) {
      this.referenciaEstado.giroTorreta = Math.max(-60, this.referenciaEstado.giroTorreta - VELOCIDAD_GIRO * dt);
    }

    // Elevacion Vertical (W / S o Flechas) dentro de limites (5 a 90)
    if (this.teclas['KeyW'] || this.teclas['ArrowUp']) {
      this.referenciaEstado.inclinacionCanon = Math.min(90, this.referenciaEstado.inclinacionCanon + VELOCIDAD_INCLINACION * dt);
    }
    if (this.teclas['KeyS'] || this.teclas['ArrowDown']) {
      this.referenciaEstado.inclinacionCanon = Math.max(5, this.referenciaEstado.inclinacionCanon - VELOCIDAD_INCLINACION * dt);
    }

    // Alternar fuerza ciclicamente con la tecla F (1 -> 2 -> 3 -> 1)
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