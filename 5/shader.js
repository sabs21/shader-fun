import * as THREE from "./three.module.js";
import { OrbitControls } from './examples/jsm/controls/OrbitControls.js';
import { Water } from './examples/jsm/objects/Water2.js';
import { GLTFLoader } from './examples/jsm/loaders/GLTFLoader.js';
import { MarchingCubes } from './examples/jsm/objects/MarchingCubes.js';
import { Reflector } from './examples/jsm/objects/Reflector.js';
//import { RGBELoader } from './examples/jsm/loaders/RGBELoader.js';
//import { PMREMGenerator } from './src/extras/PMREMGenerator.js';

document.addEventListener("DOMContentLoaded", () => {
    const threeDisplay = document.getElementById("threeDisplay");

    // Globals
    const objects = [];
    const balls = [];
    const lightMapIntensity = 4;
    let canvasDimensions = getElemDimensions(threeDisplay);
    let cameraX = 0;
    let cameraY = 0;

    // Set the scene up
    const scene = new THREE.Scene();

    // Set the camera up
    const fov = 30;
    const aspect = 2;  // the canvas default
    const near = 0.1;
    const far = 100;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    const startX = -5;
    const startY = 0.4;
    const startZ = -6;
    camera.position.set(startX, startY, startZ);
    camera.lookAt(scene.position);

    threeDisplay.addEventListener("mousemove", (e) => {
        cameraX = startX + (e.clientX/canvasDimensions.width) - 0.5;
        cameraY = startY + ((e.clientY/canvasDimensions.height)*0.25) - 0.2;
    });

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
        roundOffCenter: new THREE.Vector2(-1.65, 0),
        roundOffRadiusX: 0.96,
        roundOffRadiusZ: 0.6,
    } );
    water.rotation.x = THREE.Math.degToRad(270);
    water.position.x = -0.1;
    water.position.y = -0.3;
    water.renderOrder = 1; // allows the water to be visible through the bottle
    objects.push(water);
    scene.add(water);
    //console.log(water);
    
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

    // Add the table top
    let tableGeometry = new THREE.PlaneGeometry(30, 30, 1, 1);
    let tableUVArr = tableGeometry.getAttribute("uv").array; 
    tableGeometry.setAttribute('uv2', new THREE.BufferAttribute( tableUVArr, 2 )); // create another uv map for the lightmap to use.
    let tableDiffuse = new THREE.TextureLoader().load("table_diffuse.jpg");
    let tableLightmap = new THREE.TextureLoader().load("table_lightmap.png");
    /*tableDiffuse.wrapS = THREE.RepeatWrapping;
    tableDiffuse.wrapT = THREE.RepeatWrapping;
    tableDiffuse.repeat.set( 20, 20 );
    let tableNormal = new THREE.TextureLoader().load("table3_normal.png");
    tableNormal.wrapS = THREE.RepeatWrapping;
    tableNormal.wrapT = THREE.RepeatWrapping;
    tableNormal.repeat.set( 20, 20 );*/
    let tableMaterial = new THREE.MeshPhongMaterial({
        map: tableDiffuse,
        lightMap: tableLightmap,
        lightMapIntensity: lightMapIntensity,
    });
    let table = new THREE.Mesh(tableGeometry, tableMaterial);

    table.position.y = -1.4;
    table.rotation.x = THREE.Math.degToRad(270);
    table.rotation.z = THREE.Math.degToRad(270);
    objects.push(table);
    scene.add(table);
    
    // Load the bottle model
    new GLTFLoader().load( "./bottle.glb", function (object) {
        // Create a glass-like material for the bottle
        let bottle = object.scene.children[0];
        bottle.material = new THREE.MeshPhysicalMaterial({
            //color: 0xf42342,
            metalness: .4,
            roughness: .0,
            emissive: 0xffecab,
            emissiveIntensity: 0.2,
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
            side: THREE.DoubleSide,
        });
        bottle.position.x = 2.25;
        bottle.position.y = 0.5;
        bottle.renderOrder = 2;
        objects.push(bottle);
        scene.add(bottle);
    });

    // Load the bottle holder model
    let holderTexture = new THREE.TextureLoader().load("holder_diffuse.jpg");
    let holderNormal = new THREE.TextureLoader().load("holder_normal.png");
    let bakedHolderTexture = new THREE.TextureLoader().load("holder_lightmap.png");
    bakedHolderTexture.flipY = false; // glTF has a different texture transform than the three.js default. If you’re loading the texture separately try setting texture.flipY = false
    new GLTFLoader().load( "./holder.glb", function (object) {
        let bottleHolder = object.scene;
        //console.log(object);
        let bottleHolderGeometry = bottleHolder.children[0].geometry;
        //let holderUVArr = bottleHolderGeometry.getAttribute("uv").array;
        //bottleHolderGeometry.setAttribute('uv2', new THREE.BufferAttribute( holderUVArr, 2 ));
        //bottleHolder.castShadow = true;
        bottleHolder.material = new THREE.MeshPhongMaterial({
            map: holderTexture,
            normalMap: holderNormal,
            lightMap: bakedHolderTexture,
            lightMapIntensity: lightMapIntensity,
        });

        let holder = new THREE.Mesh(bottleHolderGeometry, bottleHolder.material);
        holder.position.x = 0.27;
        holder.position.y = -1.4;
        holder.position.z = 0.06;
        //bottleHolder.material.lightMap = bakedHolderTexture;
        //bottleHolder.material.lightMapIntensity = lightMapIntensity;
        objects.push(holder);
        scene.add(holder);
    });

    // Clouds (Marching Cubes)
    const cloudResolution = 16;
    const cloudMaterial = new THREE.MeshPhongMaterial( { color: 0xffffff, specular: 0x111111, shininess: 1, emissive: 0xffffff, emissiveIntensity: 0.15 } );
    const totalBalls = 7;
    initMarchingCubeBallSeeds(totalBalls); // Give each ball a random seed so that each ball's movement pattern differs.
    const clouds = new MarchingCubes( cloudResolution, cloudMaterial, false, false );
    clouds.position.set( 0.2, 1.2, 0 );
    clouds.scale.set( 2.7, 1, 1 );
    scene.add( clouds );

    let lampDiffuse = new THREE.TextureLoader().load("lamp_diffuse.png");
    lampDiffuse.flipY = false;
    let lampLightmap = new THREE.TextureLoader().load("lamp_lightmap.png");
    lampLightmap.flipY = false;
    new GLTFLoader().load( "./lamp.glb", function (object) {
        let lamp = object.scene;
        //console.log(lamp);

        let lampGeometry = lamp.children[0].geometry;
        let lampUVArr = lampGeometry.getAttribute("uv").array;
        lampGeometry.setAttribute('uv2', new THREE.BufferAttribute( lampUVArr, 2 ));

        lamp.material = new THREE.MeshPhongMaterial({
            map: lampDiffuse,
            lightMap: lampLightmap,
            lightMapIntensity: lightMapIntensity,
        });
        let bakedLamp = new THREE.Mesh(lampGeometry, lamp.material);
        bakedLamp.scale.x = 2;
        bakedLamp.scale.y = 2;
        bakedLamp.scale.z = 2;
        bakedLamp.position.x = 8.95;
        bakedLamp.position.y = -1.313;
        bakedLamp.position.z = 11;
        bakedLamp.rotation.y = THREE.Math.degToRad(204);
        objects.push(bakedLamp);
        scene.add(bakedLamp);
    });

    // Load the ship model
    let shipDiffuse = new THREE.TextureLoader().load("ship_diffuse.png");
    shipDiffuse.flipY = false;
    let shipLightmap = new THREE.TextureLoader().load("ship_lightmap.png");
    shipLightmap.flipY = false;
    new GLTFLoader().load( "./ship.glb", function (object) {
        let ship = object.scene;
        //console.log(ship);

        let shipGeometry = ship.children[0].geometry;
        let shipUVArr = shipGeometry.getAttribute("uv").array;
        shipGeometry.setAttribute('uv2', new THREE.BufferAttribute( shipUVArr, 2 ));

        ship.material = new THREE.MeshPhongMaterial({
            map: shipDiffuse,
            lightMap: shipLightmap,
            lightMapIntensity: lightMapIntensity,
        });
        let bakedShip = new THREE.Mesh(shipGeometry, ship.material);
        bakedShip.scale.x = 0.06;
        bakedShip.scale.y = 0.06;
        bakedShip.scale.z = 0.06;
        bakedShip.position.y = -0.35;
        bakedShip.rotation.y = THREE.Math.degToRad(270);
        objects.push(bakedShip);
        scene.add(bakedShip);
    });

    // Setup lamp spotlight
    //let lampSpotLight = new THREE.SpotLight( 0xffddaa );
    //let bulbGeometry = new THREE.SphereGeometry( 0.3, 16, 8 );
    //let bulbMaterial = new THREE.MeshBasicMaterial({
    //    emissive: 0xffffff,
    //    emissiveIntensity: 1,
    //    color: 0xffffff
    //});
    //let lampSpotLight = new THREE.Mesh(bulbGeometry, bulbMaterial);
    //lampSpotLight.position.set(5.36, 3.63, 11.84);
    //lampSpotLight.intensity = 80;
    //lampSpotLight.angle = Math.PI / 4;
    //lampSpotLight.penumbra = 0.2;
    //lampSpotLight.decay = 1;
    //lampSpotLight.distance = 40;
    //lampSpotLight.castShadow = true;
    //scene.add(lampSpotLight);

    // Setup lamp point light (make the lamp glow)
    //let lampPointLight = new THREE.SpotLight( 0xffddaa );
    //lampPointLight.position.set(5.5, 3.6, 12);
    //lampPointLight.intensity = 40;
    //lampPointLight.distance = 3;
    //scene.add(lampPointLight);

    // Setup a directional light
    const lightColor = 0xffffff;
    const lightIntensity = 1;
    const light = new THREE.DirectionalLight( lightColor, lightIntensity );
    light.position.set(-0.2, 1, -0.6);
    scene.add(light);

    // Setup WebGL renderer
    const renderer = initRenderer();
    threeDisplay.appendChild( renderer.domElement );

    // Orbit controls
    const controls = new OrbitControls( camera, renderer.domElement );
    controls.minDistance = 3;
    controls.maxDistance = 10;

    console.log("objects", objects);

    animate();
    
    function animate (time) {
        requestAnimationFrame(animate);
        time *= 0.001; // Convert time to seconds.

        // Mouse slightly moves the camera
        //camera.position.x = cameraX;
        //camera.position.y = cameraY;

        // if the canvas's css dimensions and renderer resolution differs, resize the renderer to prevent blockiness.
        if (resizeRendererToDisplaySize(renderer)) {
            // Fix distortions when canvas gets resized
            const canvas = renderer.domElement;
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
        }

        updateCubes(clouds, balls, time);
        rockTheBoat(objects[5], time);

        renderer.render( scene, camera );
    };

    // Get the dimensions of a DOM element
    function getElemDimensions(elem) {
        var rect = elem.getBoundingClientRect();
        return {
            width: parseInt(rect.width),
            height: parseInt(rect.height)
        }
    }

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
        renderer.physicallyCorrectLights = true;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
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

    function rockTheBoat(ship, time) {
        if (ship) {
            ship.rotation.x = Math.sin(time) * 0.15;
            ship.rotation.y = (Math.cos(time) * 0.05) + THREE.Math.degToRad(270);
            ship.position.y = (Math.cos(time) * 0.02) - 0.35;
        }
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
