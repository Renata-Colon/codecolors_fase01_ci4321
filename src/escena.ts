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
  private vaoMontanas: WebGLVertexArrayObject | null = null;

  // Matrices reutilizables para evitar asignaciones en el bucle de renderizado 
  private modelDesplazamientoX = mat4.create();
  private modelBase = mat4.create();
  private modelEsfera = mat4.create();
  private modelElevacion = mat4.create();
  private modelIndicador = mat4.create();
  private modelBarra = mat4.create();

  // guardamos la cantidad de índices para saber cuánto dibujar
  private numIndicesSuelo = 0;
  private numIndicesBase = 0;
  private numIndicesTorreta = 0;
  private numIndicesCanon = 0;
  private numIndicesProyectil = 0;
  private numIndicesObjetivos: number[] = [];
  private numIndicesIndicador: number[] = [];
  private numIndicesMontanas = 0;

  // estado visual actual que se actualiza desde main.ts
  private desplazamientoX = 0; 
  private inclinacionCanonRad = 45 * (Math.PI / 180); // arranca en 45 grados
  private nivelFuerzaActual: 1 | 2 | 3 = 1;
  private posicionProyectil: [number, number, number] = [0, 0, 0];
  private proyectilActivo = false;
  private objetivosVivos = [true, true, true];

  // colores unificados para el tanque gris oscuro
  private readonly colorTanque: [number, number, number] = [0.3, 0.3, 0.3];
  private readonly colorDomo: [number, number, number] = [0.45, 0.45, 0.45];

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

    // montañas de fondo
    const montana = geo.crearMontana();
    this.vaoMontanas = this.crearVAO(montana.posiciones, montana.indices);
    this.numIndicesMontanas = montana.numIndices;

    const base = geo.crearBaseTorreta();
    this.vaoBaseTorreta = this.crearVAO(base.posiciones, base.indices);
    this.numIndicesBase = base.numIndices;

    const torreta = geo.crearTorretaSuperior();
    this.vaoTorretaSuperior = this.crearVAO(torreta.posiciones, torreta.indices);
    this.numIndicesTorreta = torreta.numIndices;

    const canon = geo.crearCanon();
    this.vaoCanon = this.crearVAO(canon.posiciones, canon.indices);
    this.numIndicesCanon = canon.numIndices;

    const proyectil = geo.crearEsfera(0.25, 20, 20); 
    this.vaoProyectil = this.crearVAO(proyectil.posiciones, proyectil.indices);
    this.numIndicesProyectil = proyectil.numIndices;

    for (let i = 0; i < 3; i++) {
      const obj = geo.crearEsfera(0.8, 24, 24); // esferas suaves para los objetivos
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
    const LARGO_CANON = 2.0; 
    
    // lógica de desplazamiento en X reutilizando la matriz
    mat4.identity(this.modelDesplazamientoX);
    mat4.translate(this.modelDesplazamientoX, this.modelDesplazamientoX, [this.desplazamientoX, 1.0, 0]);

    // el pivote del cañón está en el frente del domo (Y=0.5, Z=-0.75) 
    mat4.copy(this.modelElevacion, this.modelDesplazamientoX);
    mat4.translate(this.modelElevacion, this.modelElevacion, [0, 0.5, -0.75]); 
    mat4.rotateX(this.modelElevacion, this.modelElevacion, this.inclinacionCanonRad);

    // la punta en espacio local del cañón está en (0, 0, -LARGO_CANON)
    const puntaLocal = vec4.fromValues(0, 0, -LARGO_CANON, 1);
    const puntaMundo = vec4.create();
    vec4.transformMat4(puntaMundo, puntaLocal, this.modelElevacion);

    // la dirección adelante es el vector -Z transformado
    const dirLocal = vec4.fromValues(0, 0, -1, 0);
    const dirMundo = vec4.create();
    vec4.transformMat4(dirMundo, dirLocal, this.modelElevacion);

    return {
      posicion: [puntaMundo[0], puntaMundo[1], puntaMundo[2]],
      adelante: [dirMundo[0], dirMundo[1], dirMundo[2]]
    };
  }

  // recibe la posición en X directamente
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

  // ponemos los objetivos a diferentes alturas para usar diferentes angulos de disparo
  public obtenerPosicionesObjetivos(): { id: number; posicion: [number, number, number]; radio: number }[] {
    return [
      { id: 1, posicion: [-5, 1.0, -10], radio: 0.8 },  
      { id: 2, posicion: [5, 4.5, -12], radio: 0.8 },   
      { id: 3, posicion: [0, 7.5, -14], radio: 0.8 }    
    ];
  }

  public actualizarObjetivos(objetivos: any[]): void {
    // sincronizamos nuestro arreglo local con lo que decidió la física
    for (let i = 0; i < 3; i++) {
      this.objetivosVivos[i] = objetivos[i].vivo;
    }
  }

  public renderizar(matrizVista: Float32Array, matrizProyeccion: Float32Array): void {

    // limpiar pantalla con tono que recuerde a la lava 
    this.gl.clearColor(0.85, 0.3, 0.05, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    this.gl.enable(this.gl.DEPTH_TEST);

    this.ff.setProjectionMatrix(matrizProyeccion);
    this.ff.setViewMatrix(matrizVista);

    // suelo 
    this.ff.setModelMatrix(mat4.create());
    this.ff.setColor([0.35, 0.25, 0.2]);
    this.gl.bindVertexArray(this.vaoSuelo);
    this.ff.drawElements(this.gl.TRIANGLES, this.numIndicesSuelo, this.gl.UNSIGNED_SHORT, 0);

    // montañas de fondo 
    this.ff.setColor([0.2, 0.12, 0.1]);
    this.gl.bindVertexArray(this.vaoMontanas);
    
    // montaña izquierda, más pequeña y lejana
    const modelMontana1 = mat4.create();
    mat4.translate(modelMontana1, modelMontana1, [-8, 0, -25]);
    mat4.scale(modelMontana1, modelMontana1, [0.8, 0.7, 1]);
    this.ff.setModelMatrix(modelMontana1);
    this.ff.drawElements(this.gl.TRIANGLES, this.numIndicesMontanas, this.gl.UNSIGNED_SHORT, 0);

    // montaña central, la más grande y cercana
    const modelMontana2 = mat4.create();
    mat4.translate(modelMontana2, modelMontana2, [0, 0, -20]);
    mat4.scale(modelMontana2, modelMontana2, [1.2, 1.0, 1]);
    this.ff.setModelMatrix(modelMontana2);
    this.ff.drawElements(this.gl.TRIANGLES, this.numIndicesMontanas, this.gl.UNSIGNED_SHORT, 0);

    // montaña derecha, mediana
    const modelMontana3 = mat4.create();
    mat4.translate(modelMontana3, modelMontana3, [9, 0, -23]);
    mat4.scale(modelMontana3, modelMontana3, [0.9, 0.8, 1]);
    this.ff.setModelMatrix(modelMontana3);
    this.ff.drawElements(this.gl.TRIANGLES, this.numIndicesMontanas, this.gl.UNSIGNED_SHORT, 0);

    // nodo de desplazamiento horizontal, base del tanque
    mat4.identity(this.modelDesplazamientoX);
    mat4.translate(this.modelDesplazamientoX, this.modelDesplazamientoX, [this.desplazamientoX, 1.0, 0]);

    // base de la torreta
    mat4.copy(this.modelBase, this.modelDesplazamientoX);
    mat4.translate(this.modelBase, this.modelBase, [0, -0.5, 0]); 
    this.ff.setModelMatrix(this.modelBase);
    this.ff.setColor(this.colorTanque); 
    this.gl.bindVertexArray(this.vaoBaseTorreta);
    this.ff.drawElements(this.gl.TRIANGLES, this.numIndicesBase, this.gl.UNSIGNED_SHORT, 0);

    // torreta superior 
    mat4.copy(this.modelEsfera, this.modelDesplazamientoX);
    mat4.translate(this.modelEsfera, this.modelEsfera, [0, 0.5, 0]); 
    this.ff.setModelMatrix(this.modelEsfera);
    this.ff.setColor(this.colorDomo); 
    this.gl.bindVertexArray(this.vaoTorretaSuperior);
    this.ff.drawElements(this.gl.TRIANGLES, this.numIndicesTorreta, this.gl.UNSIGNED_SHORT, 0);

    // nodo de elevación
    mat4.copy(this.modelElevacion, this.modelDesplazamientoX);
    mat4.translate(this.modelElevacion, this.modelElevacion, [0, 0.5, -0.75]); 
    mat4.rotateX(this.modelElevacion, this.modelElevacion, this.inclinacionCanonRad);

    // cañón
    this.ff.setModelMatrix(this.modelElevacion);
    this.ff.setColor(this.colorTanque); 
    this.gl.bindVertexArray(this.vaoCanon);
    this.ff.drawElements(this.gl.TRIANGLES, this.numIndicesCanon, this.gl.UNSIGNED_SHORT, 0);

    // indicador de fuerza
    mat4.copy(this.modelIndicador, this.modelBase);
    mat4.translate(this.modelIndicador, this.modelIndicador, [0, 0.2, 1.02]); 

    for (let i = 0; i < 3; i++) {
      mat4.copy(this.modelBarra, this.modelIndicador);
      mat4.translate(this.modelBarra, this.modelBarra, [0, i * 0.2, 0]); 
      
      this.ff.setModelMatrix(this.modelBarra);
      if (i < this.nivelFuerzaActual) {
        this.ff.setColor([0.2, 0.6, 1.0]); // azul eléctrico para encendido
      } else {
        this.ff.setColor([0.05, 0.1, 0.3]); // azul oscuro para apagado
      }
      
      this.gl.bindVertexArray(this.vaoIndicador[i]);
      this.ff.drawElements(this.gl.TRIANGLES, this.numIndicesIndicador[i], this.gl.UNSIGNED_SHORT, 0);
    }

    // proyectil azul y su trayectoria predicha
    const modelProyectil = mat4.create();
    if (this.proyectilActivo) {
      mat4.translate(modelProyectil, modelProyectil, this.posicionProyectil);
      this.ff.setModelMatrix(modelProyectil);
      this.ff.setColor([0.3, 0.7, 1.0]); 
      this.gl.bindVertexArray(this.vaoProyectil);
      this.ff.drawElements(this.gl.TRIANGLES, this.numIndicesProyectil, this.gl.UNSIGNED_SHORT, 0);
    } else {
      mat4.copy(modelProyectil, this.modelElevacion);
      mat4.translate(modelProyectil, modelProyectil, [0, 0, -2.15]); 
      this.ff.setModelMatrix(modelProyectil);
      this.ff.setColor([0.3, 0.7, 1.0]); 
      this.gl.bindVertexArray(this.vaoProyectil);
      this.ff.drawElements(this.gl.TRIANGLES, this.numIndicesProyectil, this.gl.UNSIGNED_SHORT, 0);

      // --- TRAYECTORIA PREDICHA INTEGRADA ---
      const punta = this.obtenerPuntaCanon();
      
      const magnitudesFuerza: Record<1 | 2 | 3, number> = { 1: 15.0, 2: 25.0, 3: 35.0 };
      const velocidadMag = magnitudesFuerza[this.nivelFuerzaActual];
      
      let p: [number, number, number] = [...punta.posicion];
      let vel: [number, number, number] = [
        punta.adelante[0] * velocidadMag,
        punta.adelante[1] * velocidadMag,
        punta.adelante[2] * velocidadMag
      ];
      
      const dtSim = 0.05; 
      const GRAVEDAD = -9.81; 

      for (let i = 0; i < 30; i++) {
        p[0] += vel[0] * dtSim;
        p[1] += vel[1] * dtSim;
        p[2] += vel[2] * dtSim;
        vel[1] += GRAVEDAD * dtSim;

        if (p[1] <= 0) break; 

        const modelPunto = mat4.create();
        mat4.translate(modelPunto, modelPunto, p);
        mat4.scale(modelPunto, modelPunto, [0.3, 0.3, 0.3]); // Reutilizamos la esfera al 30% del tamaño

        this.ff.setModelMatrix(modelPunto);
        this.ff.setColor([0.3, 0.7, 1.0]); // Puntos azules como el proyectil
        this.gl.bindVertexArray(this.vaoProyectil);
        this.ff.drawElements(this.gl.TRIANGLES, this.numIndicesProyectil, this.gl.UNSIGNED_SHORT, 0);
      }
    }

    // objetivos 
    for (let i = 0; i < 3; i++) {
      if (this.objetivosVivos[i]) {
        const pos = this.obtenerPosicionesObjetivos()[i].posicion;
        const modelObj = mat4.create();
        mat4.translate(modelObj, modelObj, pos);
        this.ff.setModelMatrix(modelObj);
        
        if (i < 2) {
          this.ff.setColor([0.5, 0.1, 0.6]); // Morados
        } else {
          this.ff.setColor([0.1, 0.8, 0.2]); // Verde
        }

        this.gl.bindVertexArray(this.vaoObjetivos[i]);
        this.ff.drawElements(this.gl.TRIANGLES, this.numIndicesObjetivos[i], this.gl.UNSIGNED_SHORT, 0);
      }
    }
  }
}
