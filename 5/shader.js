import * as THREE from "./three.module.js";
import { OrbitControls } from './examples/jsm/controls/OrbitControls.js';
import { Water } from './examples/jsm/objects/Water2.js';
import { GLTFLoader } from './examples/jsm/loaders/GLTFLoader.js';
import { MarchingCubes } from './examples/jsm/objects/MarchingCubes.js';
//import { RGBELoader } from './examples/jsm/loaders/RGBELoader.js';
//import { PMREMGenerator } from './src/extras/PMREMGenerator.js';

document.addEventListener("DOMContentLoaded", () => {
    const threeDisplay = document.getElementById("threeDisplay");

    // Globals
    const objects = [];
    const balls = [];

    // Set the scene up
    const scene = new THREE.Scene();

    // Set the camera up
    const fov = 45;
    const aspect = 2;  // the canvas default
    const near = 0.1;
    const far = 100;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(0, 1, 4);
    camera.lookAt(scene.position);

    // Add water mesh
    const planeWidth = 4.8;
    const planeHeight = 1.9;  
    const planeSegments = 48;   
    const planeGeometry = new THREE.PlaneGeometry(planeWidth, planeHeight, planeSegments, planeSegments);
    let water = new Water( planeGeometry, {
        color: '#77a6ff',
        scale: 0.4,
        reflectivity: 0.1,
        flowDirection: new THREE.Vector2( 1, 1 ),
        textureWidth: 1024,
        textureHeight: 1024,
        roundOffCenter: new THREE.Vector2(-1.35, 0),
        roundOffRadiusX: 0.96,
        roundOffRadiusZ: 0.96,
    } );
    water.rotation.x = THREE.Math.degToRad(270);
    water.position.x = -0.1;
    water.position.y = -0.3;
    water.renderOrder = 1; // allows the water to be visible through the bottle
    objects.push(water);
    scene.add(water);
    console.log(water);
    
    // Skybox
    const cubeTextureLoader = new THREE.CubeTextureLoader();
    cubeTextureLoader.setPath( './textures/cube/apartment/' );
    const cubeTexture = cubeTextureLoader.load( [
        "px.jpg", "nx.jpg",
        "py.jpg", "ny.jpg",
        "pz.jpg", "nz.jpg"
    ] );
    scene.environment = cubeTexture;
    scene.background = cubeTexture;
    
    // Load the bottle model
    new GLTFLoader().load( "./bottle.glb", function (object) {
        // Create a glass-like material for the bottle
        let bottle = object.scene.children[0];
        bottle.material = new THREE.MeshPhysicalMaterial({
            //color: 0xf42342,
            metalness: .4,
            roughness: .0,
            //envMap: envmap.texture,
            envMapIntensity: 1.0,
            clearcoat: 0.9,
            clearcoatRoughness: 0.1,
            transparent: true,
            //transmission: .95,
            opacity: 0.5,
            //alphaTest: 0.5,
            reflectivity: 0.2,
            refractionRatio: 0.985,
            ior: 0.9,
            side: THREE.FrontSide,
        });
        bottle.position.x = 2.25;
        bottle.position.y = 0.5;
        bottle.renderOrder = 2;
        objects.push(bottle);
        scene.add(bottle);
    });

    // Clouds (Marching Cubes)
    const cloudResolution = 16;
    const cloudMaterial = new THREE.MeshPhongMaterial( { color: 0xffffff, specular: 0x111111, shininess: 1 } );
    const totalBalls = 7;

    initMarchingCubeBallSeeds(totalBalls); // Give each ball a random seed so that each ball's movement pattern differs.

    const clouds = new MarchingCubes( cloudResolution, cloudMaterial, false, false );
    clouds.position.set( 0.2, 1.2, 0 );
    clouds.scale.set( 2.7, 1, 1 );

    scene.add( clouds );

    // Setup a directional light
    const lightColor = 0xffffff;
    const lightIntensity = 1.0;
    const light = new THREE.DirectionalLight( lightColor, lightIntensity );
    light.position.set(-0.2, 1, -0.6);
    scene.add(light);

    // Setup WebGL renderer
    const renderer = initRenderer();
    threeDisplay.appendChild( renderer.domElement );

    // Orbit controls
    const controls = new OrbitControls( camera, renderer.domElement );
    controls.minDistance = 3;
    controls.maxDistance = 50;

    animate();

    // Position and rotation are 3 element arrays which holds x, y, and z respectively.
    // Rotation takes degrees.
    function addObject(object, position, rotation) {
        object.position.x = position[0];
        object.position.y = position[1];
        object.position.z = position[2];

        object.rotation.x = THREE.Math.degToRad(rotation[0]);
        object.rotation.y = THREE.Math.degToRad(rotation[1]);
        object.rotation.z = THREE.Math.degToRad(rotation[2]);

        scene.add(obj);
        objects.push(obj);
    }
    
    function animate (time) {
        requestAnimationFrame(animate);
        time *= 0.001; // Convert time to seconds.

        // if the canvas's css dimensions and renderer resolution differs, resize the renderer to prevent blockiness.
        if (resizeRendererToDisplaySize(renderer)) {
            // Fix distortions when canvas gets resized
            const canvas = renderer.domElement;
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
        }

        updateCubes(clouds, balls, time);

        renderer.render( scene, camera );
    };

    function initMarchingCubeBallSeeds(totalBalls) {
        for (let i = 0; i < totalBalls; i++) {
            balls[i] = {
                x: Math.random(),
                y: Math.random()/10 + 0.5,
                z: Math.random()/2 + 0.25
            }
        }
    }

    function initRenderer() {
        var renderer = new THREE.WebGLRenderer({
            //alpha: true,
            antialias: true,
            precision: "mediump"
        });
        renderer.setClearColor( 0x000000, 0);
        renderer.shadowMap.enabled = true;
        renderer.outputEncoding = THREE.sRGBEncoding;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 0.8;

        return renderer;
    }

    // Fix blockiness by ensuring the size of the canvas's resolution matches with the canvas's css dimensions.
    function resizeRendererToDisplaySize(renderer) {
        const canvas = renderer.domElement;
        //const pixelRatio = window.devicePixelRatio; // For HD-DPI displays
        const width = canvas.clientWidth;// * pixelRatio | 0;
        const height = canvas.clientHeight;// * pixelRatio | 0;
        const needResize = canvas.width !== width || canvas.height !== height;
        if (needResize) {
          renderer.setSize(width, height, false);
        }
        return needResize;
    }

    // this controls content of marching cubes voxel field
    function updateCubes( object, balls, time) {

        object.reset();

        // fill the field with some metaballs
        const subtract = 12;
        const strength = 1.2 / ( ( Math.sqrt( balls.length ) - 1 ) / 4 + 1 );

        for ( let i = 0; i < balls.length; i++ ) {

            const ballx = ((time * 0.1) + balls[i].x - 0.99) % 1;
            const bally = Math.sin(time)*0.02 + balls[i].y;
            const ballz = balls[i].z; 

            object.addBall( ballx, bally, ballz, strength, subtract );

        }

    }
});
