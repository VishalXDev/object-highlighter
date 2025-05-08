# Three.js Object Highlighter Using Stencil Buffer

This project demonstrates how to implement object selection and highlighting using the stencil buffer technique in Three.js. When a user clicks on a 3D object in the scene, it gets highlighted with a green outline.

## Features

- **Interactive 3D Scene**: Contains 6 different objects (cube, sphere, cone, torus, cylinder, and dodecahedron) on a ground plane
- **Object Selection**: Uses raycasting to detect which object is clicked
- **Stencil Buffer Highlighting**: Implements a proper stencil buffer technique for object outlining
- **OrbitControls**: Allows for intuitive navigation (rotation, pan, zoom)
- **Shadow Rendering**: Objects cast and receive shadows for visual depth

## How The Stencil Buffer Technique Works

The stencil buffer technique is used to create outline effects around selected objects. Here's how it works:

1. **Object Selection**: When a user clicks on an object, it is identified using raycasting
2. **Outline Creation**: A slightly larger copy of the selected object is created with a semi-transparent outline material
3. **Stencil Buffer Rendering Process**:
   - The scene is rendered normally
   - The stencil buffer is cleared
   - The selected object is rendered to the stencil buffer only (not to the color buffer)
   - The outline mesh is rendered with a stencil test that only draws where the stencil value doesn't match
   - This creates a clean outline effect around the selected object

## How to Run

1. Clone this repository
2. Open `index.html` in a web browser
3. Click on any object to select it and see the outline effect
4. Click on another object to change the selection
5. Use the mouse to navigate:
   - Left click + drag: Rotate the camera
   - Right click + drag: Pan the camera
   - Scroll: Zoom in/out

## Technical Implementation Details

- **Renderer Configuration**: WebGL renderer with stencil buffer enabled
- **Stencil Operations**: Uses `THREE.AlwaysStencilFunc` and `THREE.NotEqualStencilFunc` for proper mask creation
- **Material Handling**: Temporarily swaps materials during the stencil buffer writing phase
- **Geometry Cloning**: Creates outline geometries that match the original object but slightly larger

## Browser Compatibility

This application works in modern browsers that support WebGL2. For best results, use the latest versions of Chrome, Firefox, or Edge.

## Dependencies

- Three.js v0.157.0
- OrbitControls module from Three.js examples