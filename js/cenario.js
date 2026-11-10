import * as THREE from 'three';
import { aleatorio } from './personagens.js';

const mat = (cor, extra = {}) => new THREE.MeshStandardMaterial({ color: cor, roughness: 1, flatShading: true, ...extra });

const CEU_LIMPO = new THREE.Color('#79b8e8');
const CEU_TEMPESTADE = new THREE.Color('#4a5560');

export class Cenario {
  constructor(cena) {
    this.cena = cena;

    this.hemisferica = new THREE.HemisphereLight('#dff1ff', '#5c7a3a', 1.1);
    cena.add(this.hemisferica);

    this.sol = new THREE.DirectionalLight('#fff3d6', 2.2);
    this.sol.position.set(26, 44, 32);
    this.sol.castShadow = true;
    this.sol.shadow.mapSize.set(2048, 2048);
    const s = this.sol.shadow.camera;
    s.left = -45; s.right = 45; s.top = 45; s.bottom = -45; s.near = 1; s.far = 130;
    this.sol.shadow.bias = -0.0005;
    cena.add(this.sol);

    // Chão: disco grande com leve ondulação (low-poly)
    // Chão em anéis: plano até 72 m (onde dá para caminhar) e com morros depois disso.
    const chaoGeo = new THREE.RingGeometry(0, 140, 64, 36);
    chaoGeo.rotateX(-Math.PI / 2);
    const pos = chaoGeo.attributes.position;
    const r = aleatorio(7);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      const d = Math.hypot(x, z);
      pos.setY(i, d > 72 ? (r() - 0.3) * 0.9 + (d - 72) * 0.22 : 0);
    }
    chaoGeo.computeVertexNormals();
    const chao = new THREE.Mesh(chaoGeo, mat('#7fb24a'));
    chao.receiveShadow = true;
    cena.add(chao);

    // Terra batida em volta da obra
    const terra = new THREE.Mesh(new THREE.CircleGeometry(1, 24).rotateX(-Math.PI / 2), mat('#b89263'));
    terra.scale.set(30, 1, 17);
    terra.position.y = 0.02;
    terra.receiveShadow = true;
    cena.add(terra);

    this.criarArvores(r);
    this.criarMontanhas(r);
    this.criarNuvens(r);
    this.criarTabuasEmPilha();
  }

  criarArvores(r) {
    const tronco = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.2, 0.3, 1.6, 5), mat('#6b4423'), 80);
    const copa = new THREE.InstancedMesh(new THREE.ConeGeometry(1.4, 3.2, 6), mat('#3f7d3a'), 80);
    const aux = new THREE.Object3D();
    this.arvores = [];
    let n = 0;
    while (n < 80) {
      const a = r() * Math.PI * 2;
      const d = 46 + r() * 23; // só na área plana (até 69 m)
      const x = Math.cos(a) * d, z = Math.sin(a) * d;
      const e = 0.7 + r() * 0.9;
      aux.rotation.set(0, r() * 6, 0);
      aux.scale.setScalar(e);
      aux.position.set(x, 0.8 * e, z);
      aux.updateMatrix();
      tronco.setMatrixAt(n, aux.matrix);
      this.arvores.push({ x, z, r: 0.35 * e + 0.1 });
      aux.position.set(x, (1.6 + 1.4) * e, z);
      aux.updateMatrix();
      copa.setMatrixAt(n, aux.matrix);
      n++;
    }
    tronco.castShadow = copa.castShadow = true;
    this.cena.add(tronco, copa);
  }

  criarMontanhas(r) {
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2 + r() * 0.3;
      const h = 14 + r() * 18;
      const m = new THREE.Mesh(new THREE.ConeGeometry(h * 0.9, h, 5), mat(i % 2 ? '#6d8f6a' : '#7b9a74'));
      m.position.set(Math.cos(a) * 100, h / 2 - 2, Math.sin(a) * 100);
      m.rotation.y = r() * 6;
      this.cena.add(m);
    }
  }

  criarNuvens(r) {
    this.nuvens = new THREE.Group();
    this.materialNuvem = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, flatShading: true, transparent: true, opacity: 0.95 });
    for (let i = 0; i < 12; i++) {
      const nuvem = new THREE.Group();
      for (let j = 0; j < 4; j++) {
        const bola = new THREE.Mesh(new THREE.IcosahedronGeometry(2 + r() * 2, 0), this.materialNuvem);
        bola.position.set(j * 2.4 - 3.6, r() * 1.2, r() * 1.5);
        nuvem.add(bola);
      }
      const a = r() * Math.PI * 2;
      nuvem.position.set(Math.cos(a) * (30 + r() * 30), 24 + r() * 10, Math.sin(a) * (30 + r() * 30));
      nuvem.userData.velocidade = 0.3 + r() * 0.4;
      this.nuvens.add(nuvem);
    }
    this.cena.add(this.nuvens);
  }

  // Pilha de toras ao lado do Noé: no dia 1 é tudo que existe.
  criarTabuasEmPilha() {
    const pilha = new THREE.Group();
    const m = mat('#a8682f');
    for (let camada = 0; camada < 3; camada++) {
      for (let i = 0; i < 4 - camada; i++) {
        const tora = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 3.2, 7), m);
        tora.rotation.z = Math.PI / 2;
        tora.position.set(0, 0.22 + camada * 0.4, (i - (3 - camada) / 2) * 0.46);
        tora.castShadow = true;
        pilha.add(tora);
      }
    }
    pilha.position.set(-7.5, 0, 8);
    pilha.rotation.y = 0.3;
    this.cena.add(pilha);
  }

  // progresso de 0 a 1: quanto mais pronta a arca, mais perto a chuva.
  definirClima(progresso) {
    const p = THREE.MathUtils.smoothstep(progresso, 0.35, 1);
    const ceu = CEU_LIMPO.clone().lerp(CEU_TEMPESTADE, p);
    this.cena.background = ceu;
    this.cena.fog = new THREE.Fog(ceu, 60, 160);
    this.materialNuvem.color.set('#ffffff').lerp(new THREE.Color('#5d646b'), p);
    this.sol.intensity = 2.2 - p * 1.2;
    this.hemisferica.intensity = 1.1 - p * 0.35;
    this.nuvens.children.forEach((n) => n.scale.setScalar(1 + p * 1.2));
  }

  atualizar(t) {
    this.nuvens.children.forEach((n, i) => {
      n.rotation.y = 0;
      const ang = t * 0.01 * n.userData.velocidade + i;
      const raio = Math.hypot(n.position.x, n.position.z);
      n.position.x = Math.cos(ang) * raio;
      n.position.z = Math.sin(ang) * raio;
    });
  }
}
