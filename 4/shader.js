/*import {
    Scene,
    PerspectiveCamera,
    MeshStandardMaterial,
    WebGLRenderer
} from './three.module.js';*/
import * as THREE from "./three.module.js";
import { GLTFLoader } from './GLTFLoader.js';

document.addEventListener("DOMContentLoaded", () => {
    // Find the dimensions of the viewport for three JS
    const threeDisplay = document.getElementById("threeDisplay");
    const threeDisplayRect = threeDisplay.getBoundingClientRect();
    const displayWidth = parseInt(threeDisplayRect.width);
    const displayHeight = parseInt(threeDisplayRect.height);
    console.log(threeDisplayRect);

    // Set the scene and camera up
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera( 
        75, // fov
        displayWidth / displayHeight, // aspect ratio
        0.1, // near plane
        1000 // far plane
    );
    camera.position.z = 4;

    // Setup WebGL
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize( displayWidth, displayHeight );
    threeDisplay.appendChild( renderer.domElement );

    var currentTime = 0;

    // Setup animate function
    var monkey = null;
    const animate = function (timestamp) {
        requestAnimationFrame(animate);
        //console.log("Timestamp: ", timestamp);
        currentTime = timestamp/1000; // Current time in seconds.

        // Update rotation
        //monkey.rotation.x += 0.001;
        monkey.rotation.y += 0.001;
        
        //console.log(monkey);
        monkey.material.uniforms.time.value = currentTime;
        
        //cube.rotation.x += 0.01;
        //cube.rotation.y += 0.01;

        renderer.render( scene, camera );
    };

    // If all the models are loaded, then animate.
    const attemptToAnimate = function() {
        if (monkey) {
            animate();
        }
    }

    // Create the vertex and fragment shaders
    var _VS = `
    uniform float time;

    varying float shadeLevel;

    float vectorDist(vec3 lightDirection) {
        // euclidean distance formula between light direction and the normal
        return sqrt(pow(lightDirection.x-normal.x,2.0)+pow(lightDirection.y-normal.y,2.0)+pow(lightDirection.z-normal.z,2.0));
    }
    
    void main() {
        vec3 newPos = position;
        vec3 lightDirection = vec3(1, 0, 0);
        //newPos = position + 0.2 * (0.5 + 0.5 * cos(position.x + 4.0 * time)) * normal;
        //newPos = vec3(position.x * cos(position.x*sin(time/2.0)*0.5+0.5), position.y * cos(position.y*sin(time/3.0)*0.5+0.5), position.z * cos(time));
        //newPos = 
        shadeLevel = abs(vectorDist(lightDirection)-1.0);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
    }`;

    var _FS = `
    uniform float time;
    varying float shadeLevel;

    void main() {
        float ndcDepth = gl_FragCoord.z;
        float clipDepth = ndcDepth / gl_FragCoord.w;
        //gl_FragColor = vec4((clipDepth * 0.5) + 0.5);
        //gl_FragColor = vec4(vec3(shadeLevel), 1.0);
        gl_FragColor = vec4(0.6, 0.0, 1.0, 1.0);
    }`;
    
    // Load the gltf loader along with the monkey model
    //var monkeyMaterial = new THREE.MeshBasicMaterial( { color: 0xb76726 } );
    var monkeyMaterial = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: currentTime },
		    resolution: { value: new THREE.Vector2(displayWidth, displayHeight) }
        },
        vertexShader: _VS,
        fragmentShader: _FS,
        //lights: true
    });
    const loader = new GLTFLoader();
    loader.load( "./monkey.glb", function (gltf) {
        gltf.scene.traverse( function( child ) {
            if ( child instanceof THREE.Mesh ) {
                child.material = monkeyMaterial;
            }
        });
        scene.add(gltf.scene);
        monkey = gltf.scene.children[2]; // store the monkey's mesh

        attemptToAnimate();
    }, undefined, function (error) {
        console.error(error);
    });
    //console.log(monkey);

    /*const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
    const cube = new THREE.Mesh( geometry, material );
    scene.add(cube);*/
    

    //animate();
});
