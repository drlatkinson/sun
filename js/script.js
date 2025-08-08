
  <script type="module">
    import * as THREE from 'https://cdn.skypack.dev/three@0.150.1';
    import { ARButton } from 'https://cdn.skypack.dev/three@0.150.1/examples/jsm/webxr/ARButton.js';

    let camera, scene, renderer;
    let animationFrames = [];
    let plane;
    let frameIndex = 0;

    const intro = document.getElementById('intro');
    const startButton = document.getElementById('start-ar');

    startButton.addEventListener('click', () => {
      intro.classList.add('hidden'); // Hide instructions and button
      init();
      animate();
    });

    function init() {
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.xr.enabled = true;
      document.body.appendChild(renderer.domElement);

      // Load PNG frames (adjust count and names if needed)
      const loader = new THREE.TextureLoader();
      for (let i = 1; i <= 28; i++) {
        const frameNum = String(i).padStart(4, '0');
        loader.load(`assets/sun${frameNum}.png`, texture => {
          animationFrames[i - 1] = texture;
        });
      }

      // Create animated plane
      const geometry = new THREE.PlaneGeometry(1, 1);
      const material = new THREE.MeshBasicMaterial({ transparent: true, opacity: 1 });
      plane = new THREE.Mesh(geometry, material);
      plane.position.set(0, 0, -1.5); // 1.5m in front of camera
      camera.add(plane);
      scene.add(camera);

      // Add AR session button (from Three.js)
      document.body.appendChild(ARButton.createButton(renderer, { requiredFeatures: ['hit-test'] }));
    }

    function animate() {
      renderer.setAnimationLoop(() => {
        if (animationFrames.length > 0 && plane.material) {
          plane.material.map = animationFrames[frameIndex];
          plane.material.needsUpdate = true;
          frameIndex = (frameIndex + 1) % animationFrames.length;
        }
        renderer.render(scene, camera);
      });
    }
  </script>

</body>
</html>
