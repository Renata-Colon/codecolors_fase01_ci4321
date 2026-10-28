// escena 
import { EscenaJuego } from './main';
import { PuntaCanon } from './tipos';
import * as geo from './geometria';
import { mat4, vec4 } from 'gl-matrix'; // para calcular la punta del cañón

export class EscenaGrafica implements EscenaJuego {
  private gl: WebGL2RenderingContext;
  private ff: any; // usamos any aquí para que typescript no se queje con la librería del profe
  
  // vaos para cada parte de la escena
  private vaoSuelo: WebGLVertexArrayObject | null = null;
  private vaoBaseTorreta: WebGLVertexArrayObject | null = null;
  private vaoTorretaSuperior: WebGLVertexArrayObject | null = null;
  private vaoCanon: WebGLVertexArrayObject | null = null;
  private vaoProyectil: WebGLVertexArrayObject | null = null;
  private vaoObjetivos: WebGLVertexArrayObject[] = [];
  private vaoIndicador: WebGLVertexArrayObject[] = []; // 3 barras

  // guardamos la cantidad de índices para saber cuánto dibujar
  private numIndicesSuelo = 0;
  private numIndicesBase = 0;
  private numIndicesTorreta = 0;
  private numIndicesCanon = 0;
  private numIndicesProyectil = 0;
  private numIndicesObjetivos: number[] = [];
  private numIndicesIndicador: number[] = [];

  // estado visual actual que se actualiza desde main.ts
  private desplazamientoX = 0; // Cambiado de giroTorretaRad a desplazamiento en X
  private inclinacionCanonRad = 30 * (Math.PI / 180); // arranca en 30 grados
  private nivelFuerzaActual: 1 | 2 | 3 = 1;
  private posicionProyectil: [number, number, number] = [0, 0, 0];
  private proyectilActivo = false;
  private objetivosVivos = [true, true, true];

  constructor(gl: WebGL2RenderingContext, ff: any) {
    this.gl = gl;
    this.ff = ff;
    this.inicializarGeometria();
  }

  // función auxiliar porque la librería ff no tiene createVAO y hay que hacerlo a mano con webgl2
  private crearVAO(posiciones: Float32Array, indices: Uint16Array): WebGLVertexArrayObject {
    const vao = this.gl.createVertexArray()!;
    this.gl.bindVertexArray(vao);
    const posBuffer = this.gl.createBuffer()!;
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, posBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, posiciones, this.gl.STATIC_DRAW);
    this.gl.enableVertexAttribArray(0); // el slot 0 es para la posición
    this.gl.vertexAttribPointer(0, 3, this.gl.FLOAT, false, 0, 0);
    const idxBuffer = this.gl.createBuffer()!;
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, idxBuffer);
    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, indices, this.gl.STATIC_DRAW);
    this.gl.bindVertexArray(null); // desvincular al terminar
    return vao;
  }

  private inicializarGeometria() {
    // aquí llamamos a las funciones de geometria.ts y guardamos los vaos
    const suelo = geo.crearSuelo();
    this.vaoSuelo = this.crearVAO(suelo.posiciones, suelo.indices);
    this.numIndicesSuelo = suelo.numIndices;

    const base = geo.crearBaseTorreta();
    this.vaoBaseTorreta = this.crearVAO(base.posiciones, base.indices);
    this.numIndicesBase = base.numIndices;

    const torreta = geo.crearTorretaSuperior();
    this.vaoTorretaSuperior = this.crearVAO(torreta.posiciones, torreta.indices);
    this.numIndicesTorreta = torreta.numIndices;

    const canon = geo.crearCanon();
    this.vaoCanon = this.crearVAO(canon.posiciones, canon.indices);
    this.numIndicesCanon = canon.numIndices;

    const proyectil = geo.crearEsfera(0.25, 12, 12); // esfera chiquita para la bala
    this.vaoProyectil = this.crearVAO(proyectil.posiciones, proyectil.indices);
    this.numIndicesProyectil = proyectil.numIndices;

    for (let i = 0; i < 3; i++) {
      const obj = geo.crearEsfera(0.8, 12, 12); // esferas más grandes para los objetivos
      this.vaoObjetivos.push(this.crearVAO(obj.posiciones, obj.indices));
      this.numIndicesObjetivos.push(obj.numIndices);
    }

    for (let i = 0; i < 3; i++) {
      const barra = geo.crearBarraIndicador();
      this.vaoIndicador.push(this.crearVAO(barra.posiciones, barra.indices));
      this.numIndicesIndicador.push(barra.numIndices);
    }
  }

  public obtenerPuntaCanon(): PuntaCanon {
    const LARGO_CANON = 3.0;
    
    // Cambiamos la rotación en Y por una traslación en X para el nodo principal
    const modelDesplazamientoX = mat4.create();
    mat4.translate(modelDesplazamientoX, modelDesplazamientoX, [this.desplazamientoX, 1.0, 0]);

    const modelElevacion = mat4.clone(modelDesplazamientoX);
    mat4.translate(modelElevacion, modelElevacion, [0, 0.5, 0.5]); // punto de pivote del cañón
    mat4.rotateX(modelElevacion, modelElevacion, this.inclinacionCanonRad);

    // la punta en espacio local del cañón está en (0, 0, -LARGO_CANON)
    const puntaLocal = vec4.fromValues(0, 0, -LARGO_CANON, 1);
    const puntaMundo = vec4.create();
    vec4.transformMat4(puntaMundo, puntaLocal, modelElevacion);

    // la dirección adelante es el vector -Z transformado
    const dirLocal = vec4.fromValues(0, 0, -1, 0);
    const dirMundo = vec4.create();
    vec4.transformMat4(dirMundo, dirLocal, modelElevacion);

    return {
      posicion: [puntaMundo[0], puntaMundo[1], puntaMundo[2]],
      adelante: [dirMundo[0], dirMundo[1], dirMundo[2]]
    };
  }

  // Recibe la posición en X directamente (ya no se convierte a radianes porque se desplaza, no rota)
  public fijarTransformacionTorreta(desplazamiento: number, inclinacion: number): void {
    this.desplazamientoX = desplazamiento;
    this.inclinacionCanonRad = inclinacion * (Math.PI / 180);
  }

  public fijarIndicadorFuerza(nivel: 1 | 2 | 3): void {
    this.nivelFuerzaActual = nivel;
  }

  public fijarTransformacionProyectil(posicion: [number, number, number], activo: boolean): void {
    this.posicionProyectil = posicion;
    this.proyectilActivo = activo;
  }

  public obtenerPosicionesObjetivos(): { id: number; posicion: [number, number, number]; radio: number }[] {
    return [
      { id: 1, posicion: [4, 1.5, -8], radio: 0.8 },
      { id: 2, posicion: [-4, 2.0, -10], radio: 0.8 },
      { id: 3, posicion: [0, 1.0, -12], radio: 0.8 }
    ];
  }

  public renderizar(matrizVista: Float32Array, matrizProyeccion: Float32Array): void {
    // limpiar pantalla (azul cielo)
    this.gl.clearColor(0.53, 0.81, 0.92, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    this.gl.enable(this.gl.DEPTH_TEST);

    this.ff.setProjectionMatrix(matrizProyeccion);
    this.ff.setViewMatrix(matrizVista);

    // suelo
    this.ff.setModelMatrix(mat4.create());
    this.ff.setColor([0.55, 0.27, 0.07]);
    this.gl.bindVertexArray(this.vaoSuelo);
    this.ff.drawElements(this.gl.TRIANGLES, this.numIndicesSuelo, this.gl.UNSIGNED_SHORT, 0);

    // --- 1. Definimos primero el nodo de desplazamiento horizontal (Raíz de la máquina) ---
    const modelDesplazamientoX = mat4.create();
    mat4.translate(modelDesplazamientoX, modelDesplazamientoX, [this.desplazamientoX, 1.0, 0]);

    // --- 2. Base de la torreta (Ahora clona el desplazamiento X para que toda la base se mueva con las teclas A y D) ---
    const modelBase = mat4.clone(modelDesplazamientoX);
    mat4.translate(modelBase, modelBase, [0, -0.5, 0]); 
    this.ff.setModelMatrix(modelBase);
    this.ff.setColor([0.25, 0.25, 0.25]);
    this.gl.bindVertexArray(this.vaoBaseTorreta);
    this.ff.drawElements(this.gl.TRIANGLES, this.numIndicesBase, this.gl.UNSIGNED_SHORT, 0);

    // --- 3. Torreta superior (hereda directamente el desplazamiento X) ---
    this.ff.setModelMatrix(modelDesplazamientoX);
    this.ff.setColor([0.35, 0.35, 0.35]);
    this.gl.bindVertexArray(this.vaoTorretaSuperior);
    this.ff.drawElements(this.gl.TRIANGLES, this.numIndicesTorreta, this.gl.UNSIGNED_SHORT, 0);

    // nodo de elevación (hijo del desplazamiento X)
    const modelElevacion = mat4.clone(modelDesplazamientoX);
    mat4.translate(modelElevacion, modelElevacion, [0, 0.5, 0.5]); // pivote
    mat4.rotateX(modelElevacion, modelElevacion, this.inclinacionCanonRad);

    // cañón
    this.ff.setModelMatrix(modelElevacion);
    this.ff.setColor([0.2, 0.2, 0.2]);
    this.gl.bindVertexArray(this.vaoCanon);
    this.ff.drawElements(this.gl.TRIANGLES, this.numIndicesCanon, this.gl.UNSIGNED_SHORT, 0);

    // indicador de fuerza
    for (let i = 0; i < 3; i++) {
      const modelBarra = mat4.clone(modelElevacion);
      mat4.translate(modelBarra, modelBarra, [0, 0.8 + i * 0.25, 0.2]); 
      this.ff.setModelMatrix(modelBarra);
      
      if (i < this.nivelFuerzaActual) {
        this.ff.setColor([0.5, 1.0, 0.5]); 
      } else {
        this.ff.setColor([0.1, 0.4, 0.1]); 
      }
      
      this.gl.bindVertexArray(this.vaoIndicador[i]);
      this.ff.drawElements(this.gl.TRIANGLES, this.numIndicesIndicador[i], this.gl.UNSIGNED_SHORT, 0);
    }

    // proyectil
    const modelProyectil = mat4.create();
    if (this.proyectilActivo) {
      mat4.translate(modelProyectil, modelProyectil, this.posicionProyectil);
    } else {
      mat4.copy(modelProyectil, modelElevacion);
      mat4.translate(modelProyectil, modelProyectil, [0, 0, -3.0]); 
    }
    this.ff.setModelMatrix(modelProyectil);
    this.ff.setColor([0.0, 0.0, 0.0]); 
    this.gl.bindVertexArray(this.vaoProyectil);
    this.ff.drawElements(this.gl.TRIANGLES, this.numIndicesProyectil, this.gl.UNSIGNED_SHORT, 0);

    // objetivos
    for (let i = 0; i < 3; i++) {
      if (this.objetivosVivos[i]) {
        const pos = this.obtenerPosicionesObjetivos()[i].posicion;
        const modelObj = mat4.create();
        mat4.translate(modelObj, modelObj, pos);
        this.ff.setModelMatrix(modelObj);
        this.ff.setColor([1.0, 0.4, 0.1]); 
        this.gl.bindVertexArray(this.vaoObjetivos[i]);
        this.ff.drawElements(this.gl.TRIANGLES, this.numIndicesObjetivos[i], this.gl.UNSIGNED_SHORT, 0);
      }
    }
  }
}
