import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.150.1/build/three.module.js';
import { ARButton } from 'https://cdn.jsdelivr.net/npm/three@0.150.1/examples/jsm/webxr/ARButton.js';

let camera, scene, renderer;
let animationFrames = [];
let plane = null;
let frameIndex = 0;
let animationStarted = false;
let framesLoaded = 0;
const TOTAL_FRAMES = 120;

let staticPlane = null; // For static overlay image

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

  // ====== Place your MediaRecorder code here =======
let mediaRecorder;
let recordedChunks = [];

const recordBtn = document.getElementById('record-btn');
const downloadLink = document.getElementById('download-link');
const canvas = renderer.domElement;

recordBtn.addEventListener('click', function() {
  if (mediaRecorder && mediaRecorder.state === "recording") {
    // Stop recording
    mediaRecorder.stop();
    recordBtn.textContent = "Start Recording";
  } else {
    // Start recording
    recordedChunks = [];
    const stream = canvas.captureStream(30); // 30 FPS
    mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    mediaRecorder.ondataavailable = function(e) {
      if (e.data.size > 0) recordedChunks.push(e.data);
    };
    mediaRecorder.onstop = function() {
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      downloadLink.href = URL.createObjectURL(blob);
      downloadLink.download = 'ar-experience.webm';
      downloadLink.style.display = 'block';
      downloadLink.textContent = 'Download Video';
    };
    mediaRecorder.start();
    recordBtn.textContent = "Stop Recording";
    downloadLink.style.display = 'none';
  }
});
// ====== End MediaRecorder code =======

  // Texture loader instance for both animation and static overlay
  const loader = new THREE.TextureLoader();

  // Load all animation frames
  for (let i = 1; i <= TOTAL_FRAMES; i++) {
    const frameNum = String(i).padStart(4, '0');
    loader.load(`assets/sun${frameNum}.png`, texture => {
      animationFrames[i - 1] = texture;
      framesLoaded++;

      // When the first frame loads, create the animated plane
      if (!plane && texture.image && texture.image.width && texture.image.height) {
        const aspect = texture.image.width / texture.image.height;
        const geometry = new THREE.PlaneGeometry(aspect, 1);
        const material = new THREE.MeshBasicMaterial({ transparent: true });
        plane = new THREE.Mesh(geometry, material);
        plane.position.set(0, 0, -3.5); // Farther from camera
        camera.add(plane);
        scene.add(camera);
      }
    });
  }

  // Load the static overlay image ONCE, and put closer to the camera than the animated plane
  loader.load('assets/gate3.png', texture => {
    if (texture.image && texture.image.width && texture.image.height) {
      const aspect = texture.image.width / texture.image.height;
      // Static overlay plane size, adjust as needed
      const geometry = new THREE.PlaneGeometry(aspect * 1.2, 1.2);
      const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
      staticPlane = new THREE.Mesh(geometry, material);
      staticPlane.position.set(0, 0, -3.3); // Closer to camera than the animation plane at -3.5
      camera.add(staticPlane);
      // No need to add to scene; parented to camera
    }
  });

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
      renderer.domElement.style.display !== 'none' &&
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
