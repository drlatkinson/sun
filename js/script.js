import * as THREE from 'https://unpkg.com/three@0.150.1/build/three.module.js';
import { ARButton } from 'https://unpkg.com/three@0.150.1/examples/jsm/webxr/ARButton.js';

let camera, scene, renderer;
let animationFrames = [];
let plane;
let frameIndex = 0;
const TOTAL_FRAMES = 28; // Set to your total number of sun frames

init();
animate();

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    document.body.appendChild(renderer.domElement);

    // Load PNG frames from /assets directory
    const loader = new THREE.TextureLoader();
    for (let i = 1; i <= TOTAL_FRAMES; i++) {
        const frameNum = String(i).padStart(4, '0');
        loader.load(`assets/sun${frameNum}.png`, texture => {
            animationFrames[i - 1] = texture;
        });
    }

    // Create plane with placeholder material
    const geometry = new THREE.PlaneGeometry(1, 1);
    const material = new THREE.MeshBasicMaterial({ transparent: true, opacity: 1 });
    plane = new THREE.Mesh(geometry, material);
    plane.position.set(0, 0, -3); // 3 meters in front of camera
    camera.add(plane);
    scene.add(camera);

    document.body.appendChild(ARButton.createButton(renderer, { requiredFeatures: ['hit-test'] }));
}

function animate() {
    renderer.setAnimationLoop(render);
}

function render() {
    if (animationFrames.length > 0 && plane.material) {
        const texture = animationFrames[frameIndex];
        if (texture) {
            plane.material.map = texture;
            plane.material.needsUpdate = true;
            frameIndex = (frameIndex + 1) % TOTAL_FRAMES;
        }
    }
    renderer.render(scene, camera);
}
