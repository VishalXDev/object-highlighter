import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.157.0/examples/jsm/controls/OrbitControls.js';

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111122);

// Camera setup
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(5, 5, 5);
camera.lookAt(0, 0, 0);

// Renderer with stencil buffer enabled
const renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    stencil: true // Enable stencil buffer
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040, 1.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 5);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 50;
directionalLight.shadow.camera.left = -10;
directionalLight.shadow.camera.right = 10;
directionalLight.shadow.camera.top = 10;
directionalLight.shadow.camera.bottom = -10;
scene.add(directionalLight);

// Ground plane
const groundGeometry = new THREE.PlaneGeometry(20, 20);
const groundMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x555555, 
    roughness: 0.8,
    metalness: 0.2,
    side: THREE.DoubleSide 
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -1;
ground.receiveShadow = true;
scene.add(ground);

// Helper function to create objects
function createObject(geometry, color, position) {
    const material = new THREE.MeshStandardMaterial({ 
        color: color, 
        roughness: 0.7, 
        metalness: 0.3 
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
}

// Create objects
const objects = [
    createObject(new THREE.BoxGeometry(1, 1, 1), 0xff0000, new THREE.Vector3(-3, 0, -2)),
    createObject(new THREE.SphereGeometry(0.7, 32, 32), 0x00ff00, new THREE.Vector3(-1, 0, -2)),
    createObject(new THREE.ConeGeometry(0.7, 1.5, 32), 0x0000ff, new THREE.Vector3(1, 0, -2)),
    createObject(new THREE.TorusGeometry(0.5, 0.2, 16, 32), 0xffff00, new THREE.Vector3(3, 0, -2)),
    createObject(new THREE.CylinderGeometry(0.5, 0.5, 1.5, 32), 0xff00ff, new THREE.Vector3(-2, 0, 1)),
    createObject(new THREE.DodecahedronGeometry(0.7), 0x00ffff, new THREE.Vector3(2, 0, 1))
];

// Materials for stencil highlighting
const outlineMaterial = new THREE.MeshBasicMaterial({ 
    color: 0x00ff00, 
    side: THREE.BackSide,
    transparent: true,
    opacity: 0.8,
    depthTest: true
});

// For storing the currently selected object
let selectedObject = null;
let outlineMesh = null;

// Mouse position tracking
const mouse = new THREE.Vector2();
const raycaster = new THREE.Raycaster();

// Event listeners
window.addEventListener('resize', onWindowResize);
window.addEventListener('click', onClick);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onClick(event) {
    // Calculate mouse position in normalized device coordinates
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update the picking ray with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);

    // Calculate objects intersecting the picking ray, excluding the ground
    const intersects = raycaster.intersectObjects(objects);

    // Remove previous outline if it exists
    if (outlineMesh) {
        scene.remove(outlineMesh);
        outlineMesh = null;
    }

    // Reset selected object
    selectedObject = null;

    // If we clicked on an object
    if (intersects.length > 0) {
        selectedObject = intersects[0].object;
        
        // Create outline mesh with the same geometry but slightly larger
        const outlineGeometry = selectedObject.geometry.clone();
        outlineMesh = new THREE.Mesh(outlineGeometry, outlineMaterial);
        
        // Make the outline mesh slightly larger
        outlineMesh.position.copy(selectedObject.position);
        outlineMesh.rotation.copy(selectedObject.rotation);
        outlineMesh.scale.copy(selectedObject.scale);
        outlineMesh.scale.multiplyScalar(1.15); // Make outline slightly bigger
        
        // Add to scene but will be managed in the render loop
        scene.add(outlineMesh);
        
        // Update info panel
        document.getElementById('info').innerHTML = `Selected: ${getObjectType(selectedObject)}`;
    } else {
        document.getElementById('info').innerHTML = 'Click on an object to select it';
    }
}

function getObjectType(object) {
    const geometry = object.geometry;
    if (geometry instanceof THREE.BoxGeometry) return 'Cube';
    if (geometry instanceof THREE.SphereGeometry) return 'Sphere';
    if (geometry instanceof THREE.ConeGeometry) return 'Cone';
    if (geometry instanceof THREE.TorusGeometry) return 'Torus';
    if (geometry instanceof THREE.CylinderGeometry) return 'Cylinder';
    if (geometry instanceof THREE.DodecahedronGeometry) return 'Dodecahedron';
    return 'Unknown';
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    controls.update();
    
    // Standard rendering with stencil buffer techniques
    if (selectedObject && outlineMesh) {
        // First, render everything normally
        renderer.render(scene, camera);
        
        // Then use stencil buffer for outline effect
        
        // Step 1: Clear only the stencil buffer
        renderer.clear(false, false, true);
        
        // Step 2: Write to stencil buffer but not to color buffer
        renderer.state.buffers.stencil.setTest(true);
        renderer.state.buffers.stencil.setFunc(THREE.AlwaysStencilFunc, 1, 0xff);
        renderer.state.buffers.stencil.setOp(THREE.ReplaceStencilOp, THREE.ReplaceStencilOp, THREE.ReplaceStencilOp);
        renderer.state.buffers.color.setMask(false);
        
        // Temporarily render selected object to the stencil buffer only
        selectedObject.renderOrder = 1; // Ensure it renders first
        scene.add(selectedObject); // Make sure it's in the scene
        renderer.render(scene, camera);
        
        // Step 3: Re-enable color writing and set up for outline rendering
        renderer.state.buffers.color.setMask(true);
        renderer.state.buffers.stencil.setFunc(THREE.NotEqualStencilFunc, 1, 0xff);
        
        // Step 4: Render outline mesh where stencil test passes
        outlineMesh.renderOrder = 2; // Ensure it renders after
        scene.add(outlineMesh);
        renderer.render(scene, camera);
        
        // Step 5: Cleanup - disable stencil testing
        renderer.state.buffers.stencil.setTest(false);
        
        // Reset render orders
        selectedObject.renderOrder = 0;
        outlineMesh.renderOrder = 0;
    } else {
        // Just render the scene normally if no object is selected
        renderer.render(scene, camera);
    }
}

animate();