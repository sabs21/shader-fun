import * as THREE from "./three.module.js";
import { OrbitControls } from './examples/jsm/controls/OrbitControls.js';
//import { Water } from './examples/jsm/objects/Water.js';
import { Water2 } from './examples/jsm/objects/Water2.js';
import { Water3 } from './examples/jsm/objects/Water3.js';
import { GLTFLoader } from './examples/jsm/loaders/GLTFLoader.js';
import { MarchingCubes } from './examples/jsm/objects/MarchingCubes.js';
import { Sky } from './examples/jsm/objects/Sky.js';

document.addEventListener("DOMContentLoaded", () => {
    const threeDisplay = document.getElementById("threeDisplay");

    // Globals
    const balls = [];
    const lightMapIntensity = 1;
    const isOrbitCameraOn = true;
    const skySettings = {
        turbidity: 10,
        rayleigh: 3,
        mieCoefficient: 0.005,
        mieDirectionalG: 0.7,
        elevation: 0,
        azimuth: 180
    }
    let screenDimensions = {
        width: window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth,
        height: window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight
    }
    let objects = [];
    let newCameraPosition = null; // For movement CameraDirector
    let newCameraLookAt = null; // For lookAt CameraDirector
    let controls = null;
    let positionDirector = null;
    let lookAtDirector = null;

    threeDisplay.style.height = screenDimensions.height + "px";

    // Set the scene up
    const scene = new THREE.Scene();

    // Set the camera up
    const fov = 40;
    let aspect = screenDimensions.width / screenDimensions.height;  // the canvas default
    const near = 0.1;
    const far = 10000;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(0, 2.2, 1.25);
    camera.lookAt(0, 2.5, -1000);

    // On resize, adjust the camera 
    window.addEventListener("resize", (e) => {
        screenDimensions = {
            width: e.target.innerWidth,
            height: e.target.innerHeight
        }
        // Update the canvas container
        threeDisplay.style.height = screenDimensions.height + "px";
        renderer.domElement.style.width = screenDimensions.width + "px";
        renderer.domElement.style.height = screenDimensions.height + "px";
    });

    // Sky
    let sky = new Sky();
    sky.scale.setScalar( 100000 );
    scene.add( sky );
    updateSky(skySettings);

    // Lighting
    {
        const color = 0xfd5e53;
        const intensity = 0.7;
        const sunlight = new THREE.DirectionalLight(color, intensity);
        sunlight.position.set(0, 4, -10);
        sunlight.target.position.set(0, 0, 0);
        scene.add(sunlight);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.02);
        scene.add(ambientLight);
    }

    {
        // Water in the bottle
        const width = 1.9;
        const height = 4.4;
        const segments = 48;   
        const geometry = new THREE.PlaneGeometry(width, height, segments, segments);
        let bottleWater = new Water2( geometry, {
            color: '#77a6ff',
            scale: 0.4,
            reflectivity: 0.1,
            flowDirection: new THREE.Vector2( 1, 1 ),
            textureWidth: 1024,
            textureHeight: 1024,
            roundness: 0.1,
        } );
        bottleWater.rotation.x = THREE.Math.degToRad(270);
        bottleWater.rotation.z = THREE.Math.degToRad(280);
        bottleWater.position.set(0.44, 2.023, -2.09);
        bottleWater.scale.set(0.1, 0.1, 0.1);
        bottleWater.renderOrder = 1; // allows the water to be visible through the bottle
        objects.push(bottleWater);
        //scene.add(bottleWater);
    }

    {
        // Ocean far
        const width = 10000;
        const height = 10000;  
        const segments = 1;   
        const geometry = new THREE.PlaneGeometry(width, height, segments, segments);
        let ocean = new Water3( geometry, {
            color: '#6d808c',
            scale: 1000,
            reflectivity: 0.1,
            flowDirection: new THREE.Vector2( -1, 1 ),
            textureWidth: 2048,
            textureHeight: 2048,
        } );
        ocean.rotation.x = THREE.Math.degToRad(270);
        ocean.position.set(0, -0.15, -50);
        ocean.renderOrder = 1; // allows the water to be visible through the bottle
        objects.push(ocean);
    }

    // Add geometries to hover over and click on
    let clickables = [];
    let clickableGeometry = new THREE.PlaneGeometry(0.17, 0.17);
    // ALL OF THE SQUARES TURN RED INSTANTLY SINCE IT'S THE SAME MATERIAL THROUGHOUT
    let clickableMaterial = new THREE.MeshBasicMaterial({ 
        transparent: true,
        opacity: 0
    });
    let clickablesData = [
        {
            name: "Contributions",
            position: new THREE.Vector3(0.01, 1.93, -1.75),
            scale: new THREE.Vector2(1, 1)
        },
        {
            name: "Chrome Extensions",
            position: new THREE.Vector3(0.24, 1.93, -1.8),
            scale: new THREE.Vector2(1.2, 1.2)
        },
        {
            name: "Eye Candy",
            position: new THREE.Vector3(0.14, 1.93, -1.52),
            scale: new THREE.Vector2(1, 1)
        },
        {
            name: "Technologies",
            position: new THREE.Vector3(0.47, 1.93, -1.3),
            scale: new THREE.Vector2(2.2, 2.2)
        },
        {
            name: "Duda Widgets",
            position: new THREE.Vector3(-0.28, 1.93, -2),
            scale: new THREE.Vector2(2.2, 2)
        },
        {
            name: "Games",
            position: new THREE.Vector3(-0.575, 1.93, -1.8),
            scale: new THREE.Vector2(1.2, 1.2)
        },
        {
            name: "Websites",
            position: new THREE.Vector3(-0.68, 1.93, -2.16),
            scale: new THREE.Vector2(2.4, 2.5)
        },
    ];

    for (let i = 0; i < 7; i++) {
        clickables[i] = new THREE.Mesh(clickableGeometry, clickableMaterial);
        clickables[i].name = clickablesData[i].name;
        clickables[i].rotation.x = THREE.Math.degToRad(270);
        clickables[i].position.set(clickablesData[i].position.x, clickablesData[i].position.y, clickablesData[i].position.z);
        clickables[i].scale.set(clickablesData[i].scale.x, clickablesData[i].scale.y, clickablesData[i].scale.z);
        scene.add(clickables[i]);
    }

    // Add drawn circle sprite
    let drawnCircleDiffuse = new THREE.TextureLoader().load("circle.png");
    drawnCircleDiffuse.flipY = false;
    let drawnCircleAlpha = new THREE.TextureLoader().load("circle_alpha.png");
    drawnCircleAlpha.flipY = false;
    let drawnCircleGeometry = new THREE.PlaneGeometry(0.1, 0.1, 1, 1);
    let drawnCircleMaterial = new THREE.MeshBasicMaterial({
        alphaMap: drawnCircleAlpha,
        map: drawnCircleDiffuse,
        side: THREE.FrontSide,
        transparent: true
    });
    let drawnCircle = new THREE.Mesh(drawnCircleGeometry, drawnCircleMaterial);
    drawnCircle.rotation.x = THREE.Math.degToRad(270);
    drawnCircle.position.set(-0.575, 1.92, -1.8);
    drawnCircle.name = "Drawn Circle";
    scene.add(drawnCircle);

    // Add Raycast from mouse
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // Add the table top
    /*let tableGeometry = new THREE.PlaneGeometry(30, 30, 1, 1);
    let tableUVArr = tableGeometry.getAttribute("uv").array; 
    tableGeometry.setAttribute('uv2', new THREE.BufferAttribute( tableUVArr, 2 )); // create another uv map for the lightmap to use.
    let tableLightmap = new THREE.TextureLoader().load("table_lightmap.jpg");
    let tableMaterial = new THREE.MeshLambertMaterial({
        color: 0xffffff,
        lightMap: tableLightmap,
        lightMapIntensity: lightMapIntensity,
    });
    let table = new THREE.Mesh(tableGeometry, tableMaterial);
    table.position.y = -1.4;
    table.rotation.x = THREE.Math.degToRad(270);
    table.rotation.z = THREE.Math.degToRad(270);
    objects.push(table);
    scene.add(table);

    // Load the map model
    let mapDiffuse = new THREE.TextureLoader().load("map_diffuse.jpg");
    mapDiffuse.flipY = false;
    let mapLightmap = new THREE.TextureLoader().load("map_lightmap.jpg");
    mapLightmap.flipY = false;
    new GLTFLoader().load( "./map.glb", function (object) {
        let map = object.scene;
        let mapGeometry = map.children[0].geometry;
        let mapUVArr = mapGeometry.getAttribute("uv").array;
        mapGeometry.setAttribute('uv2', new THREE.BufferAttribute( mapUVArr, 2 ));

        map.material = new THREE.MeshLambertMaterial({
            map: mapDiffuse,
            lightMap: mapLightmap,
            lightMapIntensity: lightMapIntensity,
            side: THREE.DoubleSide
        });
        let bakedMap = new THREE.Mesh(mapGeometry, map.material);

        //map.position.x = 2.25;
        bakedMap.position.x = -4;
        bakedMap.position.y = -1.378;
        bakedMap.rotation.y = THREE.Math.degToRad(260);
        bakedMap.scale.set(10, 10, 10);
        objects.push(bakedMap);
        scene.add(bakedMap);
    });

    // Load pin model
    let pinDiffuse = new THREE.TextureLoader().load("pin_diffuse.png");
    pinDiffuse.flipY = false;
    let pinLightmap = new THREE.TextureLoader().load("pin_lightmap.jpg");
    pinLightmap.flipY = false;
    new GLTFLoader().load( "./pin.glb", function (object) {
        let pin = object.scene;
        let pinGeometry = pin.children[0].geometry;
        let pinUVArr = pinGeometry.getAttribute("uv").array;
        pinGeometry.setAttribute('uv2', new THREE.BufferAttribute( pinUVArr, 2 ));
        pin.material = new THREE.MeshLambertMaterial({
            map: pinDiffuse,
            lightMap: pinLightmap,
            lightMapIntensity: lightMapIntensity,
            side: THREE.FrontSide
        });
        let bakedPin = new THREE.Mesh(pinGeometry, pin.material);
        //map.position.x = 2.25;
        bakedPin.position.x = -3.65;
        bakedPin.position.y = -1.05;
        bakedPin.position.z = -0.38;
        bakedPin.rotation.x = THREE.Math.degToRad(165);
       // pin.rotation.z = THREE.Math.degToRad(5);
       bakedPin.scale.set(1.5, 1.5, 1.5);
        objects.push(bakedPin);
        scene.add(bakedPin);
    });
    
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

    // Load the cork model
    let corkLightmap = new THREE.TextureLoader().load("cork_lightmap.png");
    corkLightmap.flipY = false; // glTF has a different texture transform than the three.js default. If you’re loading the texture separately try setting texture.flipY = false
    new GLTFLoader().load( "./cork.glb", function (object) {
        let cork = object.scene;
        let corkGeometry = cork.children[0].geometry;
        cork.material = new THREE.MeshLambertMaterial({
            color: 0xd9a775,
            lightMap: corkLightmap,
            lightMapIntensity: lightMapIntensity,
        });

        let bakedCork = new THREE.Mesh(corkGeometry, cork.material);
        bakedCork.position.x = -3.2;
        bakedCork.position.y = 0.5;
        objects.push(bakedCork);
        scene.add(bakedCork);
    });

    // Load the bottle holder model
    let holderLightmap = new THREE.TextureLoader().load("holder_lightmap.jpg");
    holderLightmap.flipY = false; // glTF has a different texture transform than the three.js default. If you’re loading the texture separately try setting texture.flipY = false
    new GLTFLoader().load( "./holder.glb", function (object) {
        let bottleHolder = object.scene;
        let bottleHolderGeometry = bottleHolder.children[0].geometry;
        bottleHolder.material = holderTexture(holderLightmap, lightMapIntensity);
        let holder = new THREE.Mesh(bottleHolderGeometry, bottleHolder.material);
        holder.position.x = 0.26;
        holder.position.y = -1.42;
        holder.position.z = 0.09;
        objects.push(holder);
        scene.add(holder);
    });*/

    // Clouds (Marching Cubes)
    const cloudResolution = 16;
    let colorTop = new THREE.Vector3(0.980, 0.961, 0.855);
    let colorBottom = new THREE.Vector3(0.376, 0.416, 0.482); //new THREE.Vector3(0.921, 0.486, 0.561);
    const cloudMaterial = cloudShadow(colorTop, colorBottom); // Custom cloud shader to avoid using lighting.
    const totalBalls = 7;
    initMarchingCubeBallSeeds(totalBalls); // Give each ball a random seed so that each ball's movement pattern differs.
    const clouds = new MarchingCubes( cloudResolution, cloudMaterial, false, false );
    clouds.position.set( 0.46, 2.18, -2.10 );
    clouds.rotation.y = THREE.Math.degToRad(10);
    clouds.scale.set( 0.27, 0.1, 0.1 );
    scene.add( clouds );

    // Load the hurricane lantern
    /*let hurricaneLanternLightmap = new THREE.TextureLoader().load("hurricane_lamp_lightmap.jpg");
    hurricaneLanternLightmap.flipY = false;
    new GLTFLoader().load( "./hurricane_lantern.glb", function (object) {
        let hurricaneLantern = object.scene;

        // Import the base
        let lampBaseGeometry = hurricaneLantern.children[0].geometry;
        let lampBaseUVArr = lampBaseGeometry.getAttribute("uv").array;
        lampBaseGeometry.setAttribute('uv2', new THREE.BufferAttribute( lampBaseUVArr, 2 ));
        let lampBaseMaterial = new THREE.MeshLambertMaterial({
            color: 0x1258f0,
            specular: 0x43431e,
            shininess: 1
        });
        let lampBase = new THREE.Mesh(lampBaseGeometry, lampBaseMaterial);
        lampBase.position.y = -1.313;
        lampBase.position.z = -3;
        objects.push(lampBase);
        scene.add(lampBase);

        // Import the glass
        let glassGeometry = hurricaneLantern.children[1].geometry;
        let glassUVArr = glassGeometry.getAttribute("uv").array;
        glassGeometry.setAttribute('uv2', new THREE.BufferAttribute( glassUVArr, 2 ));
        let glassMaterial = new THREE.MeshPhysicalMaterial({
            metalness: .4,
            roughness: .0,
            emissive: 0xffecab,
            emissiveIntensity: 0.2,
            envMapIntensity: 1.0,
            clearcoat: 0.9,
            clearcoatRoughness: 0.1,
            transparent: true,
            opacity: 0.5,
            reflectivity: 0.2,
            refractionRatio: 0.985,
            ior: 0.9,
            side: THREE.DoubleSide,
        });
        let glass = new THREE.Mesh(glassGeometry, glassMaterial);
        glass.position.y = -1.313;
        glass.position.z = -3;
        objects.push(glass);
        scene.add(glass);

        // Import the bands
        let bandsGeometry = hurricaneLantern.children[2].geometry;
        let bandsUVArr = bandsGeometry.getAttribute("uv").array;
        bandsGeometry.setAttribute('uv2', new THREE.BufferAttribute( bandsUVArr, 2 ));
        let bandsMaterial = new THREE.MeshLambertMaterial({
            color: 0xffd700,
        });
        let bands = new THREE.Mesh(bandsGeometry, bandsMaterial);
        //bands.scale.set(0.9, 0.9, 0.9);
        bands.position.y = -1.313;
        bands.position.z = -3;
        objects.push(bands);
        scene.add(bands);
    });*/

    loadScene("./scene4.glb")
    .then((sceneObjects) => {
        // Merge both object arrays into one using the spread operator.
        objects = [...objects, ...sceneObjects];

        console.log(objects);
        // object[0]:  Water in bottle
        // object[1]:  Ocean water
        // object[2]:  Right barrel
        // object[3]:  Left barrel
        // object[4]:  Bands (Hurricane Lantern)
        // object[5]:  Base (Hurricane Lantern)
        // object[6]:  Bottle (Ship in a Bottle)
        // object[7]:  Pin
        // object[8]:  Cork (Ship in a Bottle)
        // object[9]:  Glass (Hurricane Lantern)
        // object[10]: Holder (Ship in a Bottle)
        // object[11]: Map
        // object[12]: Ship (Ship in a Bottle)
        // object[13]: Tabletop
        // object[14]: Dock
        // object[15]: Ladder (Right, Closer)
        // object[16]: Lightpole
        // object[17]: Life Preserver
        // object[18]: Life Preserver String
        // object[19]: Ladder (Right, Further)
        // object[20]: Ladder (Left, Closer)
        // object[21]: Ladder (Left, Further)
        // object[22 - 63]: Dock Supports (1 to 42)

        // Bottle Cube Camera
        // Create cube render target. This holds the environment map texture that the CubeCamera generates.
        const bottleRenderTarget = new THREE.WebGLCubeRenderTarget( 128, { 
            format: THREE.RGBFormat 
        });
        // Create cube camera
        const bottleCubeCamera = new THREE.CubeCamera( 0.05, 100000, bottleRenderTarget );
        bottleCubeCamera.position.set(0.44, 2.023, -2.09);
        scene.add( bottleCubeCamera );

        // Lantern Glass Cube Camera
        // Create cube render target. This holds the environment map texture that the CubeCamera generates.
        const lanternRenderTarget = new THREE.WebGLCubeRenderTarget( 128, { 
            format: THREE.RGBFormat 
        });
        // Create cube camera
        const lanternCubeCamera = new THREE.CubeCamera( 0.05, 100000, lanternRenderTarget );
        lanternCubeCamera.position.set(-1.26, 2.1, -1.77);
        scene.add( lanternCubeCamera );

        // Barrels
        let barrelDiffuse = new THREE.TextureLoader().load("barrel_diffuse.jpg");
        barrelDiffuse.flipY = false;
        let barrelSpecular = new THREE.TextureLoader().load("barrel_specular.png");
        barrelSpecular.flipY = false;
        let barrelMaterial = new THREE.MeshPhongMaterial({
            map: barrelDiffuse,
            specularMap: barrelSpecular,
            shininess: 100,
            reflectivity: 0.2, 
        });
        objects[2].material = barrelMaterial;
        objects[3].material = barrelMaterial;

        // Hurricane Lantern
        // Bands
        objects[4].material = new THREE.MeshPhongMaterial({
            color: 0xffd700,
            shininess: 100
        });
        // Base
        objects[5].material = new THREE.MeshPhongMaterial({
            color: 0x1258f0,
            specular: 0x43431e,
            shininess: 100
        });
        
        // Bottle
        objects[6].material = new THREE.MeshPhongMaterial({ 
            color: 0xffffff, 
            envMap: bottleRenderTarget.texture,
            refractionRatio: 0.985, 
		    reflectivity: 0.9,
            opacity: 0.4,
            shininess: 100,
            specular: 0xffffff,
            transparent: true
        });
        objects[6].renderOrder = 2;

        // Pin
        let pinDiffuse = new THREE.TextureLoader().load("pin_diffuse.png");
        pinDiffuse.flipY = false;
        objects[7].material = new THREE.MeshLambertMaterial({
            map: pinDiffuse,
            side: THREE.FrontSide
        });

        // Hurricane Lantern glass
        objects[9].material = new THREE.MeshPhongMaterial({ 
            color: 0xffffff, 
            envMap: lanternRenderTarget.texture,
            refractionRatio: 0.985, 
		    reflectivity: 0.9,
            opacity: 0.4,
            shininess: 100,
            specular: 0xffffff,
            transparent: true
        });
        objects[9].renderOrder = 2;

        // Holder
        let holderDiffuse = new THREE.TextureLoader().load("wood_texture_2.jpg");
        holderDiffuse.flipY = false;
        objects[10].material = new THREE.MeshLambertMaterial({
            map: holderDiffuse
        });

        // Map
        let mapDiffuse = new THREE.TextureLoader().load("skill_islands.jpg");
        mapDiffuse.flipY = false;
        objects[11].material = new THREE.MeshLambertMaterial({
            map: mapDiffuse,
            side: THREE.DoubleSide
        });

        // Ship (Ship in a Bottle)
        objects[12].position.set(0.44, 2.083, -2.09); // Place ship into correct position.
        let shipDiffuse = new THREE.TextureLoader().load("ship_diffuse.png");
        shipDiffuse.flipY = false;
        let shipLightmap = new THREE.TextureLoader().load("ship_lightmap.jpg");
        shipLightmap.flipY = false;
        generateUV2(objects[12].geometry);
        objects[12].material = new THREE.MeshLambertMaterial({
            map: shipDiffuse,
            lightMap: shipLightmap,
            lightMapIntensity: lightMapIntensity,
        });

        // Table top
        let tableDiffuse = new THREE.TextureLoader().load("wood_texture_2.jpg"); // TODO: Should reuse holderDiffuse, but cloning is not working. Re-loading the texture for now.
        tableDiffuse.flipY = false;
        tableDiffuse.wrapS = THREE.RepeatWrapping;
        tableDiffuse.wrapT = THREE.RepeatWrapping;
        tableDiffuse.repeat.set( 10, 6 );
        objects[13].material = new THREE.MeshLambertMaterial({
            map: tableDiffuse
        });

        // Dock
        let dockDiffuse = new THREE.TextureLoader().load("wood_texture.jpg");
        dockDiffuse.flipY = false;
        dockDiffuse.wrapS = THREE.RepeatWrapping;
        dockDiffuse.wrapT = THREE.RepeatWrapping;
        dockDiffuse.repeat.set( 12, 6 );
        dockDiffuse.anisotropy = renderer.capabilities.getMaxAnisotropy();
        let dockSpecular = new THREE.TextureLoader().load("dock_specular_2.png");
        dockSpecular.flipY = false;
        dockSpecular.wrapS = THREE.RepeatWrapping;
        dockSpecular.wrapT = THREE.RepeatWrapping;
        dockSpecular.repeat.set( 12, 6 );
        objects[14].material = new THREE.MeshPhongMaterial({
            map: dockDiffuse,
            //envMap: bottleRenderTarget.texture,
            specular: 0xff8133,
            specularMap: dockSpecular,
            reflectivity: 0.5,
            shininess: 40
        })

        // Life preserver
        let lifePreserverDiffuse = new THREE.TextureLoader().load("life_preserver_diffuse.png");
        lifePreserverDiffuse.flipY = false;
        objects[17].material = new THREE.MeshLambertMaterial({
            map: lifePreserverDiffuse
        })

        // Dock Supports
        let dockSupportDiffuse = new THREE.TextureLoader().load("dock_support_diffuse_2.jpg");
        dockSupportDiffuse.flipY = false;
        for (let i = 22; i <= 63; i++) {
            objects[i].material = new THREE.MeshLambertMaterial({
                map: dockSupportDiffuse
            })
        }

        // Add all objects to the scene.
        objects.forEach(object => scene.add(object));

        // Generate environment maps from each cube camera.
        objects[6].visible = false; // Hide the bottle
        bottleCubeCamera.update( renderer, scene );
        objects[6].visible = true;

        objects[9].visible = false; // Hide the lamp glass
        objects[4].visible = false; // Hide the bands
        lanternCubeCamera.update( renderer, scene );
        objects[9].visible = true;
        objects[4].visible = true;
    });

    // Setup WebGL renderer
    const renderer = initRenderer();
    threeDisplay.appendChild( renderer.domElement );

    if (isOrbitCameraOn) {
        // Orbit controls
        controls = new OrbitControls( camera, renderer.domElement );
        controls.minDistance = 1;
        controls.maxDistance = 50;
    }
    else {
        // Establish camera positioning plans (camera panning)
        positionDirector = new CameraDirector();
        positionDirector.addPlan(new CameraPlan(new THREE.Vector3(8, 1, 10), new THREE.Vector3(-4, 1, 10), 8, 0, false));
        positionDirector.addPlan(new CameraPlan(new THREE.Vector3(8, 0.4, 6), new THREE.Vector3(10, 0.4, 8), 6, 0, true));
        positionDirector.addPlan(new CameraPlan(new THREE.Vector3(-8, 0.4, -6), new THREE.Vector3(-8, 0.4, -6), 1, 4, false));
        positionDirector.addPlan(new CameraPlan(new THREE.Vector3(-8, 0.4, -6), new THREE.Vector3(-8, 2, -3), 5, 5, true));
        positionDirector.addPlan(new CameraPlan(new THREE.Vector3(-9, 8, -18), new THREE.Vector3(-4, 6, 0), 8, 0, false));

        // Establish camera lookAt plans (camera focal point)
        // For a smooth pan, take the movement and subtract the 'to' movement with the 'from' movement. Add this number to the 'from' lookAt numbers. 
        // I.e.: lookAtTo = new THREE.Vector3((posTo.x - posFrom.x) + lookAtFrom.x, (posTo.y - posFrom.y) + lookAtFrom.y, (posTo.z - posFrom.z) + lookAtFrom.z)
        lookAtDirector = new CameraDirector();
        lookAtDirector.addPlan(new CameraPlan(new THREE.Vector3(5, 0, 0), new THREE.Vector3(-12, 0, 0), 8, 0, false));
        lookAtDirector.addPlan(new CameraPlan(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0), 6, 0, true));
        lookAtDirector.addPlan(new CameraPlan(new THREE.Vector3(-3, 0.2, 0), new THREE.Vector3(-3, 0.2, 0), 1, 4, false));
        lookAtDirector.addPlan(new CameraPlan(new THREE.Vector3(-3, 0.2, 0), new THREE.Vector3(-5, 0, -1.5), 5, 5, true));
        lookAtDirector.addPlan(new CameraPlan(new THREE.Vector3(-2, 0, -9), new THREE.Vector3(3, -2, 9), 8, 0, false));
    }

    window.addEventListener('mousemove', updateMouseRay, false );
    
    animate();

    function addCameraWobble(cameraPosition, time) {
        return new THREE.Vector3(
            cameraPosition.x + (Math.sin(time*3)/30),
            cameraPosition.y + (Math.sin(time*1.4)/50),
            cameraPosition.z + (Math.cos(time*2)/36)
        )
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
        //backdrop.material.uniforms.time.value = time;

        updateCubes(clouds, balls, time);
        rockTheBoat(objects[12], time);

        // display that the user is hovering over a skill island
        let intersections = getMouseRayIntersections();
        //for ( let i = 0; i < intersections.length; i ++ ) {
        if (intersections[0] && intersections[0].object.name) {
            //console.log("intersections[0].object.name == \"Games\"", intersections[0].object.name == "Games");
            //console.log("intersections[0].object.name === \"Games\"", intersections[0].object.name === "Games");
            switch ((intersections[0].object.name).toString()) {
                case "Contributions":
                    console.log("Contributions Hovered");
                    drawnCircle.position.set(0, 1.93, -1.75);
                    drawnCircle.scale.set(2.1, 2.1);
                    break;
                case "Chrome Extensions":
                    console.log("Chrome Extensions Hovered");
                    drawnCircle.position.set(0.23, 1.94, -1.78);
                    drawnCircle.scale.set(2, 2);
                    break;
                case "Eye Candy":
                    console.log("Eye Candy Hovered");
                    drawnCircle.position.set(0.15, 1.94, -1.5);
                    drawnCircle.scale.set(2, 2);
                    break;
                case "Technologies":
                    console.log("Technologies Hovered");
                    drawnCircle.position.set(0.47, 1.94, -1.3);
                    drawnCircle.scale.set(3, 3);
                    break;
                case "Duda Widgets":
                    console.log("Duda Widgets Hovered");
                    drawnCircle.position.set(-0.28, 1.94, -1.95);
                    drawnCircle.scale.set(3, 3);
                    break;
                case "Games":
                    console.log("Games Hovered");
                    drawnCircle.position.set(-0.56, 1.94, -1.8);
                    drawnCircle.scale.set(2, 2);
                    break;
                case "Websites":
                    console.log("Websites Hovered");
                    drawnCircle.position.set(-0.66, 1.94, -2.12);
                    drawnCircle.scale.set(4, 4);
                    break;
                case "Drawn Circle":
                    console.log("Drawn Circle Hovered");
                    break;
                default:
                    drawnCircle.position.set(0, -100, 0);
                    drawnCircle.scale.set(2, 2);
                    break;
                //default:
                    //drawnCircle.position.set(0, 0, 0);
                /*if (intersections[0].object.material.color) {
                    intersections[0].object.material.color.set( 0xff0000 );
                }*/
                
                /*for (let i = 1; i < intersections.length; i++) {
    
                }*/
            }
        }
            
        //}
        
        if (!isOrbitCameraOn) {
            // Use the CameraPlans if the orbit camera isn't going to be used.
            newCameraPosition = positionDirector.update(time);
            if (newCameraPosition) {
                camera.position.x = newCameraPosition.x;
                camera.position.y = newCameraPosition.y;
                camera.position.z = newCameraPosition.z;
            }

            newCameraLookAt = lookAtDirector.update(time);
            if (newCameraLookAt) {
                newCameraLookAt = addCameraWobble(newCameraLookAt, time);
                camera.lookAt(newCameraLookAt.x, newCameraLookAt.y, newCameraLookAt.z);
            }
        }

        renderer.render( scene, camera );
    };

    function cloudShadow(colorTop, colorBottom) {
        var material = new THREE.MeshNormalMaterial();
        material.onBeforeCompile = function ( shader ) {
            shader.uniforms.colorTop = { value: colorTop };
            shader.uniforms.colorBottom = { value: colorBottom };
            //shader.vertexShader.replace(

            //)
            // Fragment Code
            shader.fragmentShader = shader.fragmentShader.replace(
                `#include <clipping_planes_pars_fragment>`,
                `#include <clipping_planes_pars_fragment>
                
                uniform vec3 colorTop;
                uniform vec3 colorBottom;`,
            );
            shader.fragmentShader = shader.fragmentShader.replace(
                `gl_FragColor = vec4( packNormalToRGB( normal ), opacity );`,
                `vec3 cloudGradient = mix(colorBottom, colorTop, normal.y);
                gl_FragColor = vec4( cloudGradient, opacity );`,
            );

            //console.log(shader);

            material.userData.shader = shader;
        }

        // Make sure WebGLRenderer doesnt reuse a single program
        material.customProgramCacheKey = function () {
            return [ colorTop, colorBottom ];
        };

        return material;
    }

    function generateUV2(geometry) {
        let UVArr = geometry.getAttribute("uv").array;
        geometry.setAttribute('uv2', new THREE.BufferAttribute( UVArr, 2 ));
    }

    // Return intersections calculated from raycasted mouse
    function getMouseRayIntersections() {
        // update the picking ray with the camera and mouse position
        raycaster.setFromCamera( mouse, camera );

        // calculate objects intersecting the picking ray
        const intersects = raycaster.intersectObjects( scene.children );

        console.log(intersects);
        return intersects;
    }

    function holderTexture(lightMap, lightMapIntensity) {
        let material = new THREE.MeshLambertMaterial({
            lightMap: lightMap,
            lightMapIntensity: lightMapIntensity,
        });

        material.onBeforeCompile = function ( shader ) {
            shader.uniforms.lightmap = { type: 't', value: lightMap };

            shader.vertexShader = shader.vertexShader.replace(
                `#define LAMBERT`,
                `#define LAMBERT
                #define USE_UV`
            )

            // Fragment Code
            shader.fragmentShader = shader.fragmentShader.replace(
                `uniform vec3 diffuse;`,
                `#define USE_UV
                uniform vec3 diffuse;
                // Noise generator from https://otaviogood.github.io/noisegen/
                // Params: 3D, Seed 25, Waves 120, Octaves 7, Smooth 1
                float NoiseGen(vec3 p) {
                    // This is a bit faster if we use 2 accumulators instead of 1.
                    // Timed on Linux/Chrome/TitanX Pascal
                    float wave0 = 0.0;
                    float wave1 = 0.0;
                    wave0 += sin(dot(p, vec3(1.446, 1.371, -0.399))) * 0.0884159018;
                    wave1 += sin(dot(p, vec3(-0.906, -1.651, -0.812))) * 0.0868349341;
                    wave0 += sin(dot(p, vec3(-1.965, -0.528, -0.439))) * 0.0843750725;
                    wave1 += sin(dot(p, vec3(-2.071, 0.413, 0.236))) * 0.0811438226;
                    wave0 += sin(dot(p, vec3(0.150, -2.188, 0.484))) * 0.0732656236;
                    wave1 += sin(dot(p, vec3(-1.317, -1.771, -0.727))) * 0.0689743129;
                    wave0 += sin(dot(p, vec3(-1.558, 1.037, -1.440))) * 0.0670629849;
                    wave1 += sin(dot(p, vec3(1.364, -1.111, -1.590))) * 0.0665761268;
                    wave0 += sin(dot(p, vec3(0.159, 2.006, -1.276))) * 0.0660317422;
                    wave1 += sin(dot(p, vec3(0.786, 1.210, -1.915))) * 0.0653093260;
                    wave0 += sin(dot(p, vec3(-1.297, 1.466, -1.496))) * 0.0623482862;
                    wave1 += sin(dot(p, vec3(0.654, 1.390, -2.016))) * 0.0594681571;
                    wave0 += sin(dot(p, vec3(-0.204, 2.630, 0.086))) * 0.0556800403;
                    wave1 += sin(dot(p, vec3(-0.315, -2.349, -1.237))) * 0.0545427160;
                    wave0 += sin(dot(p, vec3(2.204, 1.115, -1.027))) * 0.0545019083;
                    wave1 += sin(dot(p, vec3(0.027, 2.220, 1.669))) * 0.0513714813;
                    wave0 += sin(dot(p, vec3(1.556, -0.477, -2.252))) * 0.0513273162;
                    wave1 += sin(dot(p, vec3(2.231, 1.320, -1.046))) * 0.0508487920;
                    wave0 += sin(dot(p, vec3(-1.947, 1.616, 1.216))) * 0.0505081786;
                    wave1 += sin(dot(p, vec3(2.018, -1.345, -1.541))) * 0.0487298873;
                    wave0 += sin(dot(p, vec3(1.192, -0.420, 2.674))) * 0.0466187740;
                    wave1 += sin(dot(p, vec3(1.499, 1.378, -2.184))) * 0.0459567651;
                    wave0 += sin(dot(p, vec3(-0.933, 0.395, -2.965))) * 0.0427880362;
                    wave1 += sin(dot(p, vec3(-3.338, -0.565, -0.459))) * 0.0377766230;
                    wave0 += sin(dot(p, vec3(-0.306, -1.388, 3.213))) * 0.0363205908;
                    wave1 += sin(dot(p, vec3(2.319, -2.407, -1.506))) * 0.0342449408;
                    wave0 += sin(dot(p, vec3(2.535, -2.561, -1.355))) * 0.0320330105;
                    wave1 += sin(dot(p, vec3(0.696, -3.714, 1.001))) * 0.0313822233;
                    wave0 += sin(dot(p, vec3(3.274, -2.180, -0.352))) * 0.0309522060;
                    wave1 += sin(dot(p, vec3(-3.162, 1.815, 1.644))) * 0.0304394801;
                    wave0 += sin(dot(p, vec3(-2.171, -2.667, -2.126))) * 0.0299997105;
                    wave1 += sin(dot(p, vec3(-1.241, 0.496, 3.991))) * 0.0284472912;
                    wave0 += sin(dot(p, vec3(-0.428, 0.717, 4.129))) * 0.0284182481;
                    wave1 += sin(dot(p, vec3(2.957, 2.720, -1.328))) * 0.0282493490;
                    wave0 += sin(dot(p, vec3(3.035, 0.828, 2.859))) * 0.0280771823;
                    wave1 += sin(dot(p, vec3(1.148, 4.256, -0.162))) * 0.0267614587;
                    wave0 += sin(dot(p, vec3(1.388, 3.543, -2.265))) * 0.0266276686;
                    wave1 += sin(dot(p, vec3(-0.167, -4.635, 1.093))) * 0.0242436614;
                    wave0 += sin(dot(p, vec3(1.747, 2.702, -3.667))) * 0.0235357493;
                    wave1 += sin(dot(p, vec3(-3.190, -3.182, 2.566))) * 0.0218111104;
                    wave0 += sin(dot(p, vec3(-3.275, 1.979, -3.514))) * 0.0217588055;
                    wave1 += sin(dot(p, vec3(0.469, 3.790, 3.578))) * 0.0215666985;
                    wave0 += sin(dot(p, vec3(-2.315, -2.718, -3.881))) * 0.0213591453;
                    wave1 += sin(dot(p, vec3(-1.100, -0.661, 5.371))) * 0.0201874712;
                    wave0 += sin(dot(p, vec3(1.329, -5.227, -1.708))) * 0.0196020579;
                    wave1 += sin(dot(p, vec3(-3.006, 0.643, -5.145))) * 0.0182809719;
                    wave0 += sin(dot(p, vec3(-3.861, -4.495, 2.464))) * 0.0168496066;
                    wave1 += sin(dot(p, vec3(2.092, 3.959, 4.950))) * 0.0160858256;
                    wave0 += sin(dot(p, vec3(6.471, -0.323, -3.562))) * 0.0142787216;
                    wave1 += sin(dot(p, vec3(-2.429, 6.661, 2.336))) * 0.0141198843;
                    wave0 += sin(dot(p, vec3(3.942, 4.331, -5.151))) * 0.0134260711;
                    wave1 += sin(dot(p, vec3(-0.901, -6.655, -4.143))) * 0.0132470405;
                    wave0 += sin(dot(p, vec3(-2.990, 7.010, 3.486))) * 0.0123678800;
                    wave1 += sin(dot(p, vec3(-5.998, 3.517, -5.703))) * 0.0114210997;
                    wave0 += sin(dot(p, vec3(-4.313, -1.135, -7.889))) * 0.0113227520;
                    wave1 += sin(dot(p, vec3(-0.047, -8.705, -3.464))) * 0.0109069592;
                    wave0 += sin(dot(p, vec3(-7.084, -3.371, -5.641))) * 0.0105383452;
                    wave1 += sin(dot(p, vec3(-4.371, -7.780, -3.870))) * 0.0104604966;
                    wave0 += sin(dot(p, vec3(-6.770, 4.460, 6.569))) * 0.0096760468;
                    wave1 += sin(dot(p, vec3(4.402, 9.107, -5.063))) * 0.0088530096;
                    wave0 += sin(dot(p, vec3(3.993, -10.560, -0.739))) * 0.0088507312;
                    wave1 += sin(dot(p, vec3(-0.405, -2.925, 10.970))) * 0.0088109821;
                    wave0 += sin(dot(p, vec3(7.619, 6.500, 5.535))) * 0.0087416911;
                    wave1 += sin(dot(p, vec3(4.227, -7.427, -7.779))) * 0.0086477236;
                    wave0 += sin(dot(p, vec3(-7.706, -2.741, 10.420))) * 0.0074540731;
                    wave1 += sin(dot(p, vec3(7.806, 10.623, -1.989))) * 0.0074024844;
                    wave0 += sin(dot(p, vec3(2.930, 9.744, 9.477))) * 0.0070739608;
                    wave1 += sin(dot(p, vec3(1.867, 5.753, -13.059))) * 0.0068165608;
                    wave0 += sin(dot(p, vec3(-4.799, 12.194, -7.223))) * 0.0065377036;
                    wave1 += sin(dot(p, vec3(-2.042, 3.656, 14.427))) * 0.0065099237;
                    wave0 += sin(dot(p, vec3(9.878, -9.202, -9.679))) * 0.0058473981;
                    wave1 += sin(dot(p, vec3(-3.167, -8.340, -16.550))) * 0.0051282107;
                    wave0 += sin(dot(p, vec3(-3.852, 14.430, -13.370))) * 0.0047930310;
                    wave1 += sin(dot(p, vec3(-2.828, 19.850, -4.109))) * 0.0046892470;
                    wave0 += sin(dot(p, vec3(-15.739, 7.593, -12.130))) * 0.0045030354;
                    wave1 += sin(dot(p, vec3(2.868, -7.517, 21.288))) * 0.0041956675;
                    wave0 += sin(dot(p, vec3(-18.022, -14.427, -6.796))) * 0.0039578960;
                    wave1 += sin(dot(p, vec3(16.578, -2.100, -17.632))) * 0.0039191781;
                    wave0 += sin(dot(p, vec3(-4.211, 16.195, 17.943))) * 0.0038787743;
                    wave1 += sin(dot(p, vec3(-23.752, 7.332, 8.923))) * 0.0035924776;
                    wave0 += sin(dot(p, vec3(17.717, 6.789, 20.356))) * 0.0034028154;
                    wave1 += sin(dot(p, vec3(24.257, 10.964, 9.252))) * 0.0033583921;
                    wave0 += sin(dot(p, vec3(13.360, 26.292, -4.599))) * 0.0031644361;
                    wave1 += sin(dot(p, vec3(8.037, -17.033, -23.796))) * 0.0031105611;
                    wave0 += sin(dot(p, vec3(23.753, -6.003, -21.407))) * 0.0028948613;
                    wave1 += sin(dot(p, vec3(15.781, -21.954, 18.150))) * 0.0028920948;
                    wave0 += sin(dot(p, vec3(-2.915, -15.706, 34.085))) * 0.0024912828;
                    wave1 += sin(dot(p, vec3(-5.434, -35.315, 14.828))) * 0.0024223344;
                    wave0 += sin(dot(p, vec3(3.735, 23.596, 32.809))) * 0.0023060962;
                    wave1 += sin(dot(p, vec3(-22.284, -9.770, -33.199))) * 0.0022730264;
                    wave0 += sin(dot(p, vec3(9.946, -35.902, -17.829))) * 0.0022651516;
                    wave1 += sin(dot(p, vec3(-22.484, 25.926, -23.395))) * 0.0022521697;
                    wave0 += sin(dot(p, vec3(-14.707, -27.089, 29.270))) * 0.0021993071;
                    wave1 += sin(dot(p, vec3(-5.863, 4.092, 42.600))) * 0.0021634259;
                    wave0 += sin(dot(p, vec3(35.454, -7.050, 23.697))) * 0.0021620486;
                    wave1 += sin(dot(p, vec3(32.265, -29.911, 12.866))) * 0.0020358712;
                    wave0 += sin(dot(p, vec3(-38.153, -22.440, 13.589))) * 0.0020150974;
                    wave1 += sin(dot(p, vec3(-19.535, -25.359, 36.299))) * 0.0019260079;
                    wave0 += sin(dot(p, vec3(-44.280, -4.332, -19.935))) * 0.0019116541;
                    wave1 += sin(dot(p, vec3(-30.084, -28.659, 25.525))) * 0.0019112196;
                    wave0 += sin(dot(p, vec3(-40.937, 27.164, 14.775))) * 0.0018147318;
                    wave1 += sin(dot(p, vec3(-47.818, 11.688, 29.422))) * 0.0016200605;
                    wave0 += sin(dot(p, vec3(-50.667, -14.589, -29.537))) * 0.0015359016;
                    wave1 += sin(dot(p, vec3(29.831, 19.943, -56.680))) * 0.0013813821;
                    wave0 += sin(dot(p, vec3(-55.728, -34.582, 19.700))) * 0.0013527778;
                    wave1 += sin(dot(p, vec3(12.149, 68.707, 5.772))) * 0.0013227895;
                    wave0 += sin(dot(p, vec3(-18.445, 57.131, 36.955))) * 0.0013135427;
                    wave1 += sin(dot(p, vec3(78.381, -11.794, 34.728))) * 0.0010672169;
                    wave0 += sin(dot(p, vec3(-78.519, -5.959, 36.920))) * 0.0010618459;
                    wave1 += sin(dot(p, vec3(9.761, 77.753, 47.356))) * 0.0010080206;
                    wave0 += sin(dot(p, vec3(27.635, -89.494, -1.676))) * 0.0009849916;
                    wave1 += sin(dot(p, vec3(-91.555, -20.121, -7.860))) * 0.0009808589;
                    wave0 += sin(dot(p, vec3(65.509, 18.984, -69.870))) * 0.0009446050;
                    wave1 += sin(dot(p, vec3(5.117, 47.298, -86.985))) * 0.0009301253;
                    wave0 += sin(dot(p, vec3(3.923, 73.330, 71.426))) * 0.0008998968;
                    wave1 += sin(dot(p, vec3(15.107, -85.845, 57.303))) * 0.0008835936;
                    wave0 += sin(dot(p, vec3(-8.299, 25.839, -101.730))) * 0.0008753331;
                    wave1 += sin(dot(p, vec3(77.163, -80.104, 24.544))) * 0.0008085644;
                    wave0 += sin(dot(p, vec3(76.326, 10.404, -86.162))) * 0.0007967404;
                    wave1 += sin(dot(p, vec3(108.754, 44.685, -5.835))) * 0.0007820979;
                    return wave0+wave1;
                }

                // for making the rings of the wood.
                float repramp(float x) {
                    return pow(sin(x)*0.5+0.5, 8.0) + cos(x)*0.7 + 0.7;
                }`,
            );
            shader.fragmentShader = shader.fragmentShader.replace(
                `vec4 diffuseColor = vec4( diffuse, opacity );`,
                `vec3 newDiffuse = vec3(0.0, 0.0, 0.0);
                vec3 pos = vec3(vUv.x, vUv.y, 0.6324);

                float rings = repramp(length(pos.xy + vec2(NoiseGen(pos), NoiseGen(-pos))*1.6)*64.0) / 1.8;
                rings -= NoiseGen(pos *1.0)*0.75;
                vec3 texColor = mix(vec3(0.3, 0.19, 0.075)*0.95, vec3(1.0, 0.73, 0.326)*0.4, rings)*1.5;
                texColor = max(vec3(0.0), texColor);
                float rough = (NoiseGen(pos*64.0*vec3(1.0, 0.2, 1.0))*0.1+0.9);
                texColor *= rough;
                texColor = saturate(texColor);
                
                newDiffuse = texColor;
                newDiffuse *= 2.0;
                vec4 diffuseColor = vec4( newDiffuse, opacity );`,
            );

            //console.log(shader);

            material.userData.shader = shader;
        }

        // Make sure WebGLRenderer doesnt reuse a single program
        material.customProgramCacheKey = function () {
            return lightMap;
        };

        return material;
    }

    function initMarchingCubeBallSeeds(totalBalls) {
        for (let i = 0; i < totalBalls; i++) {
            balls[i] = {
                x: Math.random(),
                y: Math.random()/10 + 0.5, // 0.5 is the standard y height of where the clouds generally should be.
                z: Math.random()/2 + 0.25 // 0.25 is the standard z left and right locations of where the clouds generally should be.
            }
        }
    }

    function initRenderer() {
        let renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true,
            precision: "mediump"
        });
        renderer.setClearColor( 0x000000, 0);
        //renderer.physicallyCorrectLights = true;
        //renderer.shadowMap.enabled = true;
        //renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.outputEncoding = THREE.sRGBEncoding;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 0.8;

        // Ensure the height of the canvas matches the height of the div.
        let canvas = renderer.domElement;
        canvas.height = screenDimensions.height;
        canvas.style.height = screenDimensions.height + "px";

        return renderer;
    }
    
    // On success: Return an array of all the mesh's in the scene.
    // On fail: Return an error message.
    function loadScene(url) {
        let newObjects = [];
        return new Promise((resolve, reject) => {
            new GLTFLoader().load( url, 
            function (object) {
                // On Load
                console.log(object);
                object.scene.children.forEach((prop, i) => newObjects[i] = prop); // Add all props from the scene into the objects array.
                //scene.add(object.scene);
                resolve(newObjects);
            },
            function (XMLHttpRequest) {
                // On Progress
                console.log("Loading Scene... ", XMLHttpRequest);
            },
            function (err) {
                // On Error
                console.log(err);
                reject(err);
            });
        });
    }

    /*function addAllObjectsToScene(objects) {
        objects.forEach(object => scene.add(object));
    }*/

    // Fix blockiness by ensuring the size of the canvas's resolution matches with the canvas's css dimensions.
    function resizeRendererToDisplaySize(renderer) {
        const canvas = renderer.domElement;
        const pixelRatio = window.devicePixelRatio; // For HD-DPI displays
        const width = canvas.clientWidth * pixelRatio | 0;
        const height = canvas.clientHeight * pixelRatio | 0;
        const needResize = canvas.width !== width || canvas.height !== height;
        if (needResize) {
          renderer.setSize(width, height, false);
        }
        return needResize;
    }

    function rockTheBoat(ship, time) {
        if (ship) {
            ship.rotation.x = Math.sin(time) * 0.06;
            ship.rotation.y = (Math.cos(time) * 0.04);
            ship.position.y = (Math.cos(time) * 0.0025) + 2.083;
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

    function updateMouseRay(e) {
        // calculate mouse position in normalized device coordinates
        // (-1 to +1) for both components
        mouse.x = ( e.clientX / window.innerWidth ) * 2 - 1;
        mouse.y = - ( e.clientY / window.innerHeight ) * 2 + 1;
    }

    function updateSky(settings) {
        const uniforms = sky.material.uniforms;
        uniforms[ 'turbidity' ].value = settings.turbidity;
        uniforms[ 'rayleigh' ].value = settings.rayleigh;
        uniforms[ 'mieCoefficient' ].value = settings.mieCoefficient;
        uniforms[ 'mieDirectionalG' ].value = settings.mieDirectionalG;

        const phi = THREE.MathUtils.degToRad( 90 - settings.elevation );
        const theta = THREE.MathUtils.degToRad( settings.azimuth );

        let sun = new THREE.Vector3();
        sun.setFromSphericalCoords( 1, phi, theta );
        sky.material.uniforms[ 'sunPosition' ].value.copy( sun );
    }
});

//////////////
// CLASSES //
////////////

// make an array of these, then keep moving through the array
class CameraPlan {
    // from: Vector3
    // to: Vector3
    // duration: int or float
    // smooth: boolean (false for linear interpolation, true for smoothstep interpolation)
    constructor(from, to, duration, stall, ease = false) {
        // Points
        this.from = from;
        this.to = to;
        // Time
        this.duration = duration;
        this.stall = stall; // how long to stall far at the end of the movement.
        this.elapsed = 0;
        this.initialTime = null;
        // Boolean governing interpolation function
        this.ease = ease;
    }

    /*duration() {
        return this.duration;
    }

    get elapsed() {
        return this.elapsed;
    }

    get from() {
        return this.from;
    }

    get to() {
        return this.to;
    }*/

    // Linear interpolation between two values
    // x and y are the two values to interpolate between
    // t is the degree of interpolation between x and y.
    lerp (x, y, t) {
        t = Math.max(0, Math.min(1, t)); // Ensure t is normalized between 0 and 1.
        return y*t + x*(1-t);
    }

    easeInOutSine(x) {
        return -(Math.cos(Math.PI * x) - 1) / 2;
    }

    reset() {
        this.initialTime = null;
    }

    // If the update returns false, the pan has ended.
    update(time) {
        // If initialTime is null, we are beginning the animation. Record the initial time.
        if (!this.initialTime) {
            this.initialTime = time;
        }

        this.elapsed = time - this.initialTime;
        let progress = this.elapsed/this.duration;
        // If the total time elapsed isn't greater than the duration, then move the camera.
        // Otherwise, return false and call reset().
        if (progress < 1) {
            if (this.ease) {
                // Easing
                return new THREE.Vector3( this.lerp(this.from.x, this.to.x, this.easeInOutSine(progress)),
                                          this.lerp(this.from.y, this.to.y, this.easeInOutSine(progress)),
                                          this.lerp(this.from.z, this.to.z, this.easeInOutSine(progress)) );
            }
            else {
                // Linear interpolation
                return new THREE.Vector3( this.lerp(this.from.x, this.to.x, progress),
                                          this.lerp(this.from.y, this.to.y, progress),
                                          this.lerp(this.from.z, this.to.z, progress) );
            }
        }
        else if (this.elapsed < this.duration + this.stall) {
            // Wait a little while after the movement completes.
            return new THREE.Vector3( this.to.x, this.to.y, this.to.z );
        }
        else {
            this.reset();
            return false;
        }
    }
}

// A bunch of CameraPlans organized within this class.
class CameraDirector {
    // constructor takes an array of CameraPlans.
    constructor (plans = null) {
        this.plans = plans ? plans : []; // If plans is null, make an empty array.
        this.index = 0;
    }

    addPlan(plan) {
        this.plans.push(plan);
    }

    getIndex() {
        return this.index;
    }

    // Move onto the next CameraPlan in the plans array
    next() {
        if (this.index < this.plans.length - 1) {
            this.index++;
        }
        else {
            this.index = 0;
        }
    }

    // Tell the director to switch to a different CameraPlan
    setActive(index) {
        if (index < this.plans.length && index >= 0) {
            this.plans[this.index].reset();
            this.index = index;
        }
        else {
            console.error("Index " + index + " is out of bounds.");
        }
    }

    update(time) {
        let newPosition = this.plans[this.index].update(time);
        if (newPosition) {
            // Return the camera position as a Vector3.
            return newPosition;
        }
        else {
            // This CameraPlan reached its end. Move onto the next one.
            this.next();
        }
    }

}