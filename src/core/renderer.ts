import * as THREE from 'three';

export type RenderContext = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  dispose: () => void;
};

export function createRenderContext(container: HTMLElement): RenderContext {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0e0e10);

  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
  camera.position.set(4.5, 4.5, 6.5);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  const resize = () => {
    const { clientWidth: w, clientHeight: h } = container;
    camera.aspect = w / Math.max(1, h);
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  };
  window.addEventListener('resize', resize);
  resize();

  // Basic lighting
  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  const directional = new THREE.DirectionalLight(0xffffff, 0.7);
  directional.position.set(5, 10, 7);
  scene.add(ambient, directional);

  return {
    scene,
    camera,
    renderer,
    dispose: () => {
      window.removeEventListener('resize', resize);
      renderer.dispose();
      renderer.domElement.remove();
    }
  };
}

