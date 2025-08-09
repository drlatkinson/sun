import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.150.1/build/three.module.js';
import { ARButton } from 'https://cdn.jsdelivr.net/npm/three@0.150.1/examples/jsm/webxr/ARButton.js';

let camera, scene, renderer;
let animationFrames = [];
let plane = null;
let frameIndex = 0;
let animationStarted = false;
let framesLoaded = 0;
const TOTAL_FRAMES = 120;

const intro = document.getElementById('intro');
const arCanvasContainer = document.getElementById('ar-canvas');

init();

function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  renderer.domElement.style.width = '100vw';
  renderer.domElement.style.height = '100vh';
  renderer.domElement.style.display = 'none';
  arCanvasContainer.appendChild(renderer.domElement);

  // Load all frames, but wait for the first to get aspect
  const loader = new THREE.TextureLoader();

  for (let i = 1; i <= TOTAL_FRAMES; i++) {
    const frameNum = String(i).padStart(4, '0');
    loader.load(`assets/sun${frameNum}.png`, texture => {
      animationFrames[i - 1] = texture;
      framesLoaded++;

      // When the first frame loads, create the plane with correct aspect ratio
      if (!plane && texture.image && texture.image.width && texture.image.height) {
        const aspect = texture.image.width / texture.image.height;
        const geometry = new THREE.PlaneGeometry(aspect, 1);
        const material = new THREE.MeshBasicMaterial({ transparent: true });
        plane = new THREE.Mesh(geometry, material);
        plane.position.set(0, 0, -3.5);
        camera.add(plane);
        scene.add(camera);
      }
    });
  }

  // Create the ARButton and add it inside the intro splash
  const arButton = ARButton.createButton(renderer, { requiredFeatures: ['hit-test'] });
  arButton.textContent = "Start AR Experience";
  intro.appendChild(arButton);

  // Hide intro, show AR and start animation only when AR session starts
  renderer.xr.addEventListener('sessionstart', () => {
    intro.style.display = 'none';
    renderer.domElement.style.display = 'block';
    if (!animationStarted) {
      animationStarted = true;
      animate();
    }
  });

  // Optionally, if AR session ends, bring back the intro and hide animation
  renderer.xr.addEventListener('sessionend', () => {
    intro.style.display = 'flex';
    renderer.domElement.style.display = 'none';
    animationStarted = false;
    renderer.setAnimationLoop(null);
  });

  // Handle window resize
  window.addEventListener('resize', onWindowResize, false);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  renderer.setAnimationLoop(() => {
    if (
      renderer.domElement.style.display !== 'none' && // Only animate if AR is showing
      animationFrames.length === TOTAL_FRAMES &&
      plane &&
      plane.material
    ) {
      plane.material.map = animationFrames[frameIndex];
      plane.material.needsUpdate = true;
      frameIndex = (frameIndex + 1) % animationFrames.length;
    }
    renderer.render(scene, camera);
  });
}
