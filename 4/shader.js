/*import {
    Scene,
    PerspectiveCamera,
    MeshStandardMaterial,
    WebGLRenderer
} from './three.module.js';*/
import * as THREE from "./three.module.js";
import { GLTFLoader } from './GLTFLoader.js';

document.addEventListener("DOMContentLoaded", () => {
    const deg2rad = function (deg) {
        return deg * Math.PI / 180;
    }
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
    camera.position.x = -4;
    camera.position.y = 18;
    camera.position.z = 0;
    camera.rotation.x = deg2rad(270); //-1.2;
    camera.rotation.y = deg2rad(300); //-0.6;
    camera.rotation.z = deg2rad(340); //0.3;

    // Setup a point light
    const light = new THREE.DirectionalLight( 0xffffff, 1.0 );
    light.position.set(-0.3, 1, 0.6);
    scene.add(light);

    // Setup WebGL
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize( displayWidth, displayHeight );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.shadowMap.enabled = true;
    threeDisplay.appendChild( renderer.domElement );

    var currentTime = 0;

    // Setup animate function
    var helix = null;
    var cameraRot = 0;
    const animate = function (timestamp) {
        requestAnimationFrame(animate);
        //console.log("Timestamp: ", timestamp);
        currentTime = timestamp/1000; // Current time in seconds.

        // Update rotation
        //helix.rotation.x += 0.006;
        helix.rotation.z += 0.006;
        //cameraRot += 0.01;
        //camera.rotation.x = Math.sin(cameraRot);
        
        //console.log(monkey);
        //monkey.material.uniforms.time.value = currentTime;
        
        //cube.rotation.x += 0.01;
        //cube.rotation.y += 0.01;

        renderer.render( scene, camera );
    };

    // If all the models are loaded, then animate.
    const attemptToAnimate = function() {
        if (helix) {
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
    /*var monkeyMaterial = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: currentTime },
		    resolution: { value: new THREE.Vector2(displayWidth, displayHeight) }
        },
        vertexShader: _VS,
        fragmentShader: _FS,
        lights: {value: true}
    });*/
    var monkeyMaterial = new THREE.MeshStandardMaterial({color: 0x5590d5});
    const loader = new GLTFLoader();
    loader.load( "./spiral_pillar.glb", function (object) {
        /*object.scene.traverse( function( child ) {
            if ( child instanceof THREE.Mesh ) {
                child.material = monkeyMaterial;
            }
        });*/ 

        helix = object.scene.children[1]; // store the object's mesh
        scene.add(object.scene);

        // Edge split modifier
        /*edgeSplitModifier = new EdgeSplitModifier();
        console.log(edgeSplitModifier);
        baseGeometry = BufferGeometryUtils.mergeVertices(helix.geometry);
        var cutOffAngle = 30;
        edgeSplitModifier.modify(
            baseGeometry,
            cutOffAngle * Math.PI / 180
        );*/
        //helix.geometry = edgeSplitModifier;

        //console.log("baseGeometry", baseGeometry);
        //console.log("edgeSplitModifier", edgeSplitModifier);
        

        //mesh = new THREE.Mesh( baseGeometry, new THREE.MeshStandardMaterial() );
        //mesh.geometry = helix.geometry;
        //scene.add(mesh);
        
        object.scene.children[0].material = new THREE.MeshStandardMaterial({
            color: 0xffddff,
            roughness: 0.0
        });
        object.scene.children[1].material = new THREE.MeshStandardMaterial({
            color: 0xffddff,
            roughness: 0.0,
            side: THREE.DoubleSide
        });
        object.scene.children[1].material.onBeforeCompile = function ( shader ) {
            shader.uniforms.time = { value: currentTime };
            shader.uniforms.resolution = { value: new THREE.Vector2(displayWidth, displayHeight) };
           
            //shader.uniform.emissive = { value: new THREE.Color(0.9, 0.1, 0.2) };
            
            /*shader.vertexShader = 'varying vec4 vWorldPosition;\n' + shader.vertexShader;
            shader.vertexShader = shader.vertexShader.replace(
              '#include <worldpos_vertex>',
              `#include <worldpos_vertex>
              vWorldPosition = modelMatrix * vec4( transformed, 1.0 );`
            );
            shader.fragmentShader = 'uniform float time;\nuniform vec3 size;\nuniform vec3 color1;\nuniform vec3 color2;\nvarying vec4 vWorldPosition;\n' + shader.fragmentShader;
            shader.fragmentShader = shader.fragmentShader.replace(
              '#include <dithering_fragment>',
              [
                '#include <dithering_fragment>',
                'float gridRatio = sin( time ) * 0.1875 + 0.3125;', // 0.125 .. 0.5
                'vec3 m = abs( sin( vWorldPosition.xyz * gridRatio ) );',
                'vec3 gridColor = mix(color1, color2, vWorldPosition.y / size.y);',
                'gl_FragColor = vec4( mix( gridColor, gl_FragColor.rgb, m.x * m.y * m.z ), diffuseColor.a );'
              ].join( '\n' )
            );
            materialShader = shader;*/
            console.log(shader);
          };

        attemptToAnimate();
    }, undefined, function (error) {
        console.error(error);
    });
    //console.log(helix);

    /*const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
    const cube = new THREE.Mesh( geometry, material );
    scene.add(cube);*/
    

    //animate();
});
