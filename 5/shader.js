import * as THREE from "./three.module.js";
import { OrbitControls } from './examples/jsm/controls/OrbitControls.js';
import { Water } from './examples/jsm/objects/Water2.js';
import { GLTFLoader } from './examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from './examples/jsm/loaders/RGBELoader.js';
import { PMREMGenerator } from './src/extras/PMREMGenerator.js';

document.addEventListener("DOMContentLoaded", () => {
    const threeDisplay = document.getElementById("threeDisplay");

    // Globals
    const objects = [];

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

    //camera.rotation.y = THREE.Math.degToRad(30);
    //camera.rotation.z = THREE.Math.degToRad(30);*/
    /*new RGBELoader().setPath("./").load("canada_montreal_thea.hdr", function(hdrmap) {
        // Setup environment map
        var envmap = new PMREMGenerator(renderer).fromCubemap(hdrmap);
        scene.environment = envmap.texture;
        scene.background = envmap.texture;
    });*/
    //scene.rotateY(THREE.Math.degToRad(180));

    // Add water mesh
    const planeWidth = 4.8;
    const planeHeight = 2.2;  
    const planeSegments = 64;   
    const planeGeometry = new THREE.PlaneGeometry(planeWidth, planeHeight, planeSegments, planeSegments);
    let water = new Water( planeGeometry, {
        color: '#77a6ff',
        scale: 0.5,
        reflectivity: 0.1,
        flowDirection: new THREE.Vector2( 1, 1 ),
        textureWidth: 1024,
        textureHeight: 1024,
        roundOffCenter: new THREE.Vector2(-1.35, 0),
        roundOffRadiusX: 1.1,
        roundOffRadiusZ: 1.1,
    } );
    //water.position.y = 1;
    water.rotation.x = THREE.Math.degToRad(270);
    water.position.x = -0.15;
    //water.rotation.y = THREE.Math.degToRad(180);
    //water.scale.x = 0.65;
    //water.scale.z = 0.55;
    //water.renderOrder = 1; // allows the water to be visible through the bottle
    objects.push(water);
    scene.add(water);
    console.log(water);
    // Load the bottle model
    /*new GLTFLoader().load( "./water_plane.glb", function (object) {
        // Create a water shader
        let waterPlane = object.scene.children[0];

        let water = new Water( waterPlane.geometry, {
            color: '#88ccff',
            scale: 1,
            flowDirection: new THREE.Vector2( 1, 1 ),
            textureWidth: 1024,
            textureHeight: 1024
        } );

        //water.position.y = 1;
        //water.rotation.x = THREE.Math.degToRad(90);
        //water.rotation.y = THREE.Math.degToRad(180);
        //water.scale.x = 0.65;
        //water.scale.z = 0.55;
        //water.renderOrder = 1; // allows the water to be visible through the bottle
        objects.push(water);
        scene.add(water);
    });*/

    /*const cubeTextureLoader = new THREE.CubeTextureLoader();
    cubeTextureLoader.setPath( 'textures/cube/Park2/' );
    const cubeTexture = cubeTextureLoader.load( [
        "posx.jpg", "negx.jpg",
        "posy.jpg", "negy.jpg",
        "posz.jpg", "negz.jpg"
    ] );
    scene.background = cubeTexture;*/
    /*new RGBELoader().setPath("./").load("canada_montreal_thea.hdr", function(hdrmap) {
        // Setup environment map
        var envmap = new PMREMGenerator(renderer).fromCubemap(hdrmap);
        scene.environment = envmap.texture;
        scene.background = envmap.texture;
    });*/

    /*const hemisphereRadius = 3;
    const hemisphereWidthDetail = 20;
    const hemisphereHeightDetail = 4;
    const hemisphereGeometry = new THREE.SphereGeometry( hemisphereRadius, hemisphereWidthDetail, hemisphereHeightDetail, 0, Math.PI, 0, Math.PI );*/
    

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
        // canada_montreal_thea.hdr
        //new RGBELoader().setPath("./").load("canada_montreal_thea.hdr", function(hdrmap) {
            //var envmap = new PMREMGenerator(renderer).fromCubemap(hdrmap);
            //scene.environment = envmap.texture;
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
        //});
        bottle.position.x = 2.25;
        bottle.position.y = 0.5;
        //bottle.rotation.y = THREE.Math.degToRad(180);
        bottle.renderOrder = 2;
        objects.push(bottle);
        scene.add(bottle);
    });

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

        renderer.render( scene, camera );
    };

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
});