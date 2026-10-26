import { EscenaJuego } from './main';
import { PuntaCanon } from './tipos';
import * as geo from './geometria';
import { mat4 } from 'gl-matrix';  

export class EscenaGrafica implements EscenaJuego {
  private gl: WebGL2RenderingContext;
  private ff: any; // usamos 'any' para evitar conflictos de tipos con la librería del profe
  
  private vaoSuelo: WebGLVertexArrayObject | null = null;
  private vaoTorreta: WebGLVertexArrayObject | null = null;
  private numIndicesSuelo = 0;
  private numIndicesTorreta = 0;

  constructor(gl: WebGL2RenderingContext, ff: any) {
    this.gl = gl;
    this.ff = ff;
    this.inicializarGeometria();
  }

  // función auxiliar para crear VAOs nativos de WebGL2 
  private crearVAO(posiciones: Float32Array, indices: Uint16Array): WebGLVertexArrayObject {
    const vao = this.gl.createVertexArray()!;
    this.gl.bindVertexArray(vao);

    // buffer de posiciones
    const posBuffer = this.gl.createBuffer()!;
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, posBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, posiciones, this.gl.STATIC_DRAW);
    this.gl.enableVertexAttribArray(0); // ATTRIB.POSITION es 0 en la librería ff
    this.gl.vertexAttribPointer(0, 3, this.gl.FLOAT, false, 0, 0);

    // buffer de índices
    const idxBuffer = this.gl.createBuffer()!;
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, idxBuffer);
    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, indices, this.gl.STATIC_DRAW);

    this.gl.bindVertexArray(null); // desvincular por seguridad
    return vao;
  }

  private inicializarGeometria() {
    const suelo = geo.crearSuelo();
    this.vaoSuelo = this.crearVAO(suelo.posiciones, suelo.indices);
    this.numIndicesSuelo = suelo.numIndices;

    const cubo = geo.crearCuboBase();
    this.vaoTorreta = this.crearVAO(cubo.posiciones, cubo.indices);
    this.numIndicesTorreta = cubo.numIndices;
  }

  public obtenerPuntaCanon(): PuntaCanon {
    // PROVISIONAL: devuelve un valor fijo para que la física no falle mientras tanto
    // apunta hacia el fondo donde estarán los objetivos
    return { posicion: [0, 2, 0], adelante: [0, 0, -1] };
  }

  // por hacer
  public fijarTransformacionTorreta(giro: number, inclinacion: number): void {}
  public fijarIndicadorFuerza(nivel: 1 | 2 | 3): void {}
  public fijarTransformacionProyectil(posicion: [number, number, number], activo: boolean): void {}

  public obtenerPosicionesObjetivos(): { id: number; posicion: [number, number, number]; radio: number }[] {
    // posiciones fijas iniciales de los 3 objetivos (flotando sobre el suelo)
    return [
      { id: 1, posicion: [5, 2, -10], radio: 1.0 },
      { id: 2, posicion: [-5, 3, -12], radio: 1.0 },
      { id: 3, posicion: [0, 1.5, -15], radio: 1.0 }
    ];
  }

  public renderizar(matrizVista: Float32Array, matrizProyeccion: Float32Array): void {
    // limpiar pantalla, azul cielo
    this.gl.clearColor(0.53, 0.81, 0.92, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    this.gl.enable(this.gl.DEPTH_TEST); 
    this.ff.setProjectionMatrix(matrizProyeccion);
    this.ff.setViewMatrix(matrizVista);

    // dibujar Suelo marrón
    this.ff.setModelMatrix(mat4.create()); // matriz 
    this.ff.setColor([0.55, 0.27, 0.07]);  // color marrón
    this.gl.bindVertexArray(this.vaoSuelo);
    this.ff.drawElements(this.gl.TRIANGLES, this.numIndicesSuelo, this.gl.UNSIGNED_SHORT, 0);

    // dibujar Torreta provisional gris
    this.ff.setModelMatrix(mat4.create()); // por ahora sin rotar
    this.ff.setColor([0.3, 0.3, 0.3]);     // color gris oscuro
    this.gl.bindVertexArray(this.vaoTorreta);
    this.ff.drawElements(this.gl.TRIANGLES, this.numIndicesTorreta, this.gl.UNSIGNED_SHORT, 0);
  }
}