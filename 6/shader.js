import * as THREE from "./three.module.js";
import { OrbitControls } from './examples/jsm/controls/OrbitControls.js';
//import { Water } from './examples/jsm/objects/Water.js';
import { Water2 } from './examples/jsm/objects/Water2.js';
import { Water3 } from './examples/jsm/objects/Water3.js';
import { LanternFlame } from './examples/jsm/objects/LanternFlame.js';
import { GLTFLoader } from './examples/jsm/loaders/GLTFLoader.js';
import { MarchingCubes } from './examples/jsm/objects/MarchingCubes.js';
import { Sky } from './examples/jsm/objects/Sky.js';

document.addEventListener("DOMContentLoaded", () => {
    const threeDisplay = document.getElementById("threeDisplay");

    // DOM Globals
    const viewMapButton = document.getElementById("viewMap");
    const sunsetUI = document.getElementById("sunsetUI");
    const viewSunsetButton = document.getElementById("viewSunset");
    const mapUI = document.getElementById("mapUI");
    const shipWheelElem = document.getElementById("shipWheel");

    // Three.JS Globals
    const balls = [];
    const isOrbitCameraOn = false;
    const lightMapIntensity = 1;
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

    // Setup the loading manager such that the loading bar can reflect the total progress of the scene.
    // The onLoad event of the default loading manager fires twice, so we can't rely on that event to signify when everything's loaded.
    let loaded = 0;
    let totalToLoad = 43; 
    THREE.DefaultLoadingManager.onProgress = function (url, itemsLoaded, itemsTotal) {
        //console.log( 'Loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' );
        loaded++;
        shipWheelElem.setAttribute("totalLoaded", (loaded/totalToLoad)*100); // Display loading progress
        //drawProgress(draw, loaded/totalToLoad);
    };

    // Stretch to fit height of screen
    threeDisplay.style.height = screenDimensions.height + "px";

    // Set the scene up
    const scene = new THREE.Scene();

    // Set the camera up
    const fov = 40;
    let aspect = screenDimensions.width / screenDimensions.height;  // the canvas default
    let landscape = screenDimensions.width > screenDimensions.height;
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
        aspect = screenDimensions.width / screenDimensions.height;
        landscape = screenDimensions.width > screenDimensions.height;
        updateCameraAngledAtMap(3.5);
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

    // Lamp lighting
    {
        const color = 0xff9a02;
        const intensity = 2;
        const lampLight = new THREE.PointLight( color, intensity, 2 );
        lampLight.position.set( -1.25, 2.13, -1.77 );
        scene.add( lampLight );

        /*const sphereSize = 0.1;
        const pointLightHelper = new THREE.PointLightHelper( lampLight, sphereSize );
        scene.add( pointLightHelper );*/
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
        bottleWater.position.set(0.69, 2.023, -1.71);
        bottleWater.scale.set(0.1, 0.1, 0.1);
        bottleWater.renderOrder = 1; // allows the water to be visible through the bottle
        objects.push(bottleWater);
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

    // Add geometries to hover over and click on for the skill islands map
    let clickables = [];
    let clickableGeometry = new THREE.PlaneGeometry(0.17, 0.17);
    let clickableMaterial = new THREE.MeshBasicMaterial({ 
        transparent: true,
        opacity: 0
    });
    let clickablesData = [
        {
            name: "Web Apps",
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
            name: "Other Skills",
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
        clickables[i].renderOrder = 2;
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
    drawnCircle.position.set(0, -100, 0);
    drawnCircle.name = "Drawn Circle";
    scene.add(drawnCircle);

    // Add Raycast from mouse
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // Clouds (Marching Cubes)
    const cloudResolution = 16;
    let colorTop = new THREE.Vector3(0.980, 0.961, 0.855);
    let colorBottom = new THREE.Vector3(0.376, 0.416, 0.482); //new THREE.Vector3(0.921, 0.486, 0.561);
    const cloudMaterial = cloudShadow(colorTop, colorBottom); // Custom cloud shader to avoid using lighting.
    const totalBalls = 7;
    initMarchingCubeBallSeeds(totalBalls); // Give each ball a random seed so that each ball's movement pattern differs.
    const clouds = new MarchingCubes( cloudResolution, cloudMaterial, false, false );
    clouds.position.set( 0.71, 2.18, -1.72 );
    clouds.rotation.y = THREE.Math.degToRad(10);
    clouds.scale.set( 0.27, 0.1, 0.1 );
    scene.add( clouds );

    // Sky clouds 1
    let skyCloud1Diffuse = new THREE.TextureLoader().load("cloud1_diffuse.png");
    let skyCloud1Material = new THREE.SpriteMaterial( { map: skyCloud1Diffuse } );
    let skyCloud1 = new THREE.Sprite( skyCloud1Material );
    objects.push(skyCloud1);

    // Sky clouds 2
    let skyCloud2Diffuse = new THREE.TextureLoader().load("cloud2_diffuse.png");
    let skyCloud2Material = new THREE.SpriteMaterial( { map: skyCloud2Diffuse } );
    let skyCloud2 = new THREE.Sprite( skyCloud2Material );
    objects.push(skyCloud2);

    // Sky clouds 3
    let skyCloud3Diffuse = new THREE.TextureLoader().load("cloud2_diffuse.png");
    let skyCloud3Material = new THREE.SpriteMaterial( { map: skyCloud3Diffuse } );
    let skyCloud3 = new THREE.Sprite( skyCloud3Material );
    objects.push(skyCloud3);

    // Sky clouds 4
    let skyCloud4Diffuse = new THREE.TextureLoader().load("cloud3_diffuse.png");
    let skyCloud4Material = new THREE.SpriteMaterial( { map: skyCloud4Diffuse } );
    let skyCloud4 = new THREE.Sprite( skyCloud4Material );
    objects.push(skyCloud4);

    // Load the scene and its objects
    loadScene("./scene.glb")
    .then((sceneObjects) => {
        // Merge both object arrays into one using the spread operator.
        objects = [...objects, ...sceneObjects];

        console.log(objects);
        // objects[0]:  Water in bottle
        // objects[1]:  Ocean water
        // objects[2]:  Sky clouds 1
        // objects[3]:  Sky clouds 2
        // objects[4]:  Sky clouds 3
        // objects[5]:  Sky clouds 4
        // objects[6]:  Right barrel
        // objects[7]:  Left barrel
        // objects[8]:  Bands (Hurricane Lantern)
        // objects[9]:  Base (Hurricane Lantern)
        // objects[10]: Bottle (Ship in a Bottle)
        // objects[11]: Pin
        // objects[12]: Cork (Ship in a Bottle)
        // objects[13]: Glass (Hurricane Lantern)
        // objects[14]: Holder (Ship in a Bottle)
        // objects[15]: Ship (Ship in a Bottle)
        // objects[16]: Tabletop
        // objects[17]: Ladder (Right, Closer)
        // objects[18]: Lightpole
        // objects[19]: Life Preserver
        // objects[20]: Life Preserver String
        // objects[21]: Ladder (Right, Further)
        // objects[22]: Ladder (Left, Closer)
        // objects[23]: Ladder (Left, Further)
        // objects[24 - 65]: Dock Supports (1 to 42)
        // objects[66]: Landscape
        // objects[67]: Plants Back
        // objects[68]: Plants Front
        // objects[69]: Tree_1
        // objects[70]: Tree_2
        // objects[71]: Dock
        // objects[72]: Distant Island
        // objects[73]: Distant Trees
        // objects[74]: Lighthouse
        // objects[75]: Map
        // objects[76]: Lantern Flame
        // objects[77]: Inner_Glass (Hurricane Lantern)

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

        // Sky Cloud 1
        objects[2].position.set(-870, 550, -5000);
        //objects[2].scale.set(400, 80);
        objects[2].scale.set(1800, 650);

        // Sky Cloud 2
        objects[3].position.set(2600, 750, -5000);
        objects[3].scale.set(3000, 700);

        // Sky Cloud 3
        objects[4].position.set(-2500, 950, -5000);
        objects[4].scale.set(2200, 1100);

        // Sky Cloud 4
        objects[5].position.set(300, 1100, -5000);
        objects[5].scale.set(3000, 500);

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
        objects[6].material = barrelMaterial;
        objects[7].material = barrelMaterial;

        // Hurricane Lantern
        // Bands
        objects[8].material = new THREE.MeshPhongMaterial({
            color: 0xffd700,
            shininess: 100
        });
        // Base
        objects[9].material = new THREE.MeshPhongMaterial({
            color: 0x1258f0,
            specular: 0x43431e,
            shininess: 100
        });
        
        // Bottle
        objects[10].material = new THREE.MeshPhongMaterial({ 
            color: 0xffffff, 
            envMap: bottleRenderTarget.texture,
            refractionRatio: 0.985, 
		    reflectivity: 0.9,
            opacity: 0.4,
            shininess: 100,
            specular: 0xffffff,
            transparent: true
        });
        objects[10].renderOrder = 2;

        // Pin
        let pinDiffuse = new THREE.TextureLoader().load("pin_diffuse.png");
        pinDiffuse.flipY = false;
        objects[11].material = new THREE.MeshLambertMaterial({
            map: pinDiffuse,
            side: THREE.FrontSide
        });

        // Hurricane Lantern glass
        objects[13].material = new THREE.MeshPhongMaterial({ 
            color: 0xffffff, 
            envMap: lanternRenderTarget.texture,
            refractionRatio: 0.985, 
		    reflectivity: 0.9,
            opacity: 0.4,
            shininess: 100,
            specular: 0xffffff,
            transparent: true
        });
        objects[13].renderOrder = 6;

        // Holder
        let holderDiffuse = new THREE.TextureLoader().load("wood_texture.jpg");
        holderDiffuse.flipY = false;
        objects[14].material = new THREE.MeshLambertMaterial({
            map: holderDiffuse
        });

        // Ship (Ship in a Bottle)
        objects[15].position.set(0.73, 2.083, -1.7); // Place ship into correct position.
        let shipDiffuse = new THREE.TextureLoader().load("ship_diffuse.png");
        shipDiffuse.flipY = false;
        let shipLightmap = new THREE.TextureLoader().load("ship_lightmap.jpg");
        shipLightmap.flipY = false;
        generateUV2(objects[15].geometry);
        objects[15].material = new THREE.MeshLambertMaterial({
            map: shipDiffuse,
            lightMap: shipLightmap,
            lightMapIntensity: lightMapIntensity,
        });
        //objects[11].position.set(0.69, 2.023, -1.71)

        // Table top
        let tableDiffuse = new THREE.TextureLoader().load("wood_texture.jpg"); // TODO: Should reuse holderDiffuse, but cloning is not working. Re-loading the texture for now.
        tableDiffuse.flipY = false;
        tableDiffuse.wrapS = THREE.RepeatWrapping;
        tableDiffuse.wrapT = THREE.RepeatWrapping;
        tableDiffuse.repeat.set( 10, 6 );
        objects[16].material = new THREE.MeshLambertMaterial({
            map: tableDiffuse
        });

        // Life preserver
        let lifePreserverDiffuse = new THREE.TextureLoader().load("life_preserver_diffuse.png");
        lifePreserverDiffuse.flipY = false;
        objects[19].material = new THREE.MeshLambertMaterial({
            map: lifePreserverDiffuse
        })

        // Dock Supports
        let dockSupportDiffuse = new THREE.TextureLoader().load("dock_support_diffuse.jpg");
        dockSupportDiffuse.flipY = false;
        for (let i = 24; i <= 65; i++) {
            objects[i].material = new THREE.MeshLambertMaterial({
                map: dockSupportDiffuse
            })
        }

        // Landscape
        let landscapeDiffuse = new THREE.TextureLoader().load("landscape_diffuse.jpg");
        landscapeDiffuse.flipY = false;
        let landscapeNormal = new THREE.TextureLoader().load("landscape_normal.jpg");
        landscapeNormal.flipY = false;
        objects[66].material = new THREE.MeshPhongMaterial({
            map: landscapeDiffuse,
            normalMap: landscapeNormal,
        })

        // Plants Back
        let backGrassDiffuse = new THREE.TextureLoader().load("grass_diffuse.jpg");
        backGrassDiffuse.flipY = false;
        let backGrassAlpha = new THREE.TextureLoader().load("grass_alpha.jpg");
        backGrassAlpha.flipY = false;
        let backGrassLightmap = new THREE.TextureLoader().load("grass_lightmap.jpg");
        backGrassLightmap.flipY = false;
        let grassUVArr = objects[67].geometry.getAttribute("uv").array;
        objects[67].geometry.setAttribute('uv2', new THREE.BufferAttribute( grassUVArr, 2 ));
        objects[67].material = new THREE.MeshLambertMaterial({
            alphaMap: backGrassAlpha,
            map: backGrassDiffuse,
            lightMap: backGrassLightmap,
            lightMapIntensity: 1,
            transparent: true
        });
        objects[67].renderOrder = 3;

        // Plants Front
        let frontGrassDiffuse = new THREE.TextureLoader().load("grass_diffuse.jpg");
        frontGrassDiffuse.flipY = false;
        let frontGrassAlpha = new THREE.TextureLoader().load("grass_alpha.jpg");
        frontGrassAlpha.flipY = false;
        let frontGrassLightmap = new THREE.TextureLoader().load("grass_lightmap.jpg");
        frontGrassLightmap.flipY = false;
        grassUVArr = objects[68].geometry.getAttribute("uv").array;
        objects[68].geometry.setAttribute('uv2', new THREE.BufferAttribute( grassUVArr, 2 ));
        objects[68].material = new THREE.MeshLambertMaterial({
            alphaMap: frontGrassAlpha,
            map: frontGrassDiffuse,
            lightMap: frontGrassLightmap,
            lightMapIntensity: 1,
            transparent: true
        });
        objects[68].renderOrder = 2;

        // Tree_1
        let frontTreeDiffuse = new THREE.TextureLoader().load("tree_diffuse.jpg");
        frontTreeDiffuse.flipY = false;
        let frontTreeAlpha = new THREE.TextureLoader().load("tree_alpha.jpg");
        frontTreeAlpha.flipY = false;
        let frontTreeLightmap = new THREE.TextureLoader().load("tree_lightmap.jpg");
        frontTreeLightmap.flipY = false;
        let treeUVArr = objects[69].geometry.getAttribute("uv").array;
        objects[69].geometry.setAttribute('uv2', new THREE.BufferAttribute( treeUVArr, 2 ));
        objects[69].material = new THREE.MeshLambertMaterial({
            alphaMap: frontTreeAlpha,
            map: frontTreeDiffuse,
            lightMap: frontTreeLightmap,
            lightMapIntensity: 1,
            transparent: true
        });
        objects[69].renderOrder = 1;

        // Tree_2
        let backTreeDiffuse = new THREE.TextureLoader().load("tree2_diffuse.jpg");
        backTreeDiffuse.flipY = false;
        let backTreeAlpha = new THREE.TextureLoader().load("tree2_alpha.jpg");
        backTreeAlpha.flipY = false;
        let backTreeLightmap = new THREE.TextureLoader().load("tree_lightmap.jpg");
        backTreeLightmap.flipY = false;
        treeUVArr = objects[70].geometry.getAttribute("uv").array;
        objects[70].geometry.setAttribute('uv2', new THREE.BufferAttribute( treeUVArr, 2 ));
        objects[70].material = new THREE.MeshLambertMaterial({
            alphaMap: backTreeAlpha,
            map: backTreeDiffuse,
            lightMap: backTreeLightmap,
            lightMapIntensity: 0.9,
            transparent: true
        });
        objects[70].renderOrder = 0;

        // Dock
        let dockDiffuse = new THREE.TextureLoader().load("dock_diffuse.jpg");
        dockDiffuse.flipY = false;
        dockDiffuse.wrapS = THREE.RepeatWrapping;
        dockDiffuse.wrapT = THREE.RepeatWrapping;
        dockDiffuse.repeat.set( 12, 6);
        dockDiffuse.anisotropy = renderer.capabilities.getMaxAnisotropy();
        let dockSpecular = new THREE.TextureLoader().load("dock_specular.png");
        dockSpecular.flipY = false;
        dockSpecular.wrapS = THREE.RepeatWrapping;
        dockSpecular.wrapT = THREE.RepeatWrapping;
        dockSpecular.repeat.set( 12, 6 );
        objects[71].material = new THREE.MeshPhongMaterial({
            map: dockDiffuse,
            specular: 0xff8133,
            specularMap: dockSpecular,
            reflectivity: 0.5,
            shininess: 40
        });

        // Distant Island
        let distantIslandDiffuse = new THREE.TextureLoader().load("distant_island_diffuse.png");
        distantIslandDiffuse.flipY = false;
        objects[72].material = new THREE.MeshLambertMaterial({
            map: distantIslandDiffuse
        });

        // Distant Trees
        let distantTreesDiffuse = new THREE.TextureLoader().load("distant_trees_diffuse.jpg");
        distantTreesDiffuse.flipY = false;
        let distantTreesAlpha = new THREE.TextureLoader().load("distant_trees_alpha.jpg");
        distantTreesAlpha.flipY = false;
        let distantTreesLightmap = new THREE.TextureLoader().load("distant_tree_lightmap.jpg");
        distantTreesLightmap.flipY = false;
        let distantTreesUVArr = objects[73].geometry.getAttribute("uv").array;
        objects[73].geometry.setAttribute('uv2', new THREE.BufferAttribute( distantTreesUVArr, 2 ));
        objects[73].material = new THREE.MeshLambertMaterial({
            alphaMap: distantTreesAlpha,
            map: distantTreesDiffuse,
            lightMap: distantTreesLightmap,
            lightMapIntensity: 0.9,
            transparent: true
        });
        objects[73].renderOrder = 1;

        // Lighthouse
        let lighthouseDiffuse = new THREE.TextureLoader().load("lighthouse_diffuse.png");
        lighthouseDiffuse.flipY = false;
        objects[74].material = new THREE.MeshLambertMaterial({
            map: lighthouseDiffuse
        });

        // Map
        let mapDiffuse = new THREE.TextureLoader().load("map_diffuse.jpg");
        mapDiffuse.flipY = false;
        objects[75].material = new THREE.MeshLambertMaterial({
            map: mapDiffuse,
            side: THREE.DoubleSide
        });

        // Lantern Flame
        objects[76] = new LanternFlame(objects[76].geometry);
        objects[76].renderOrder = 4;

        // Inner Glass (hurricane lantern)
        let sootDiffuse = new THREE.TextureLoader().load("soot_diffuse.jpg");
        sootDiffuse.flipY = false;
        let sootAlpha = new THREE.TextureLoader().load("soot_alpha.jpg");
        sootAlpha.flipY = false;
        let sootEmissive = new THREE.TextureLoader().load("soot_emissive.jpg");
        sootEmissive.flipY = false;
        objects[77].material = new THREE.MeshLambertMaterial({ 
            map: sootDiffuse,
            alphaMap: sootAlpha,
            emissive: 0xcd2a0a,
            emissiveMap: sootEmissive,
            //lightMap: sootEmissive,
            //lightMapIntensity: 10,
            //emissiveIntensity: 100.25,
            transparent: true
        });
        objects[77].renderOrder = 5;

        // Add all objects to the scene.
        objects.forEach(object => scene.add(object));

        // Generate environment maps from each cube camera.
        objects[9].visible = false; // Hide the bottle
        bottleCubeCamera.update( renderer, scene );
        objects[9].visible = true;

        objects[11].visible = false; // Hide the lamp glass
        objects[7].visible = false; // Hide the bands
        lanternCubeCamera.update( renderer, scene );
        objects[11].visible = true;
        objects[7].visible = true;
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
        // Calculate how to position the camera to accomodate for various aspect ratios.
        let baseHeight = 3.5;
        let cameraHeight = 1/aspect + baseHeight;
        if (!landscape) {
            cameraHeight = 1/aspect + baseHeight*1.25;
        }

        // Establish camera positioning plans (camera panning)
        positionDirector = new CameraDirector();
        positionDirector.addPlan(new CameraPlan(new THREE.Vector3(-0.1, cameraHeight, -0.75), new THREE.Vector3(-0.1, 2.5, 0.5), 2, 998, true));
        positionDirector.addPlan(new CameraPlan(new THREE.Vector3(-0.1, 2.5, 0.5), new THREE.Vector3(-0.1, cameraHeight, -0.75), 2, 998, true));

        // Establish camera lookAt plans (camera focal point)
        // For a smooth pan, take the movement and subtract the 'to' movement with the 'from' movement. Add this number to the 'from' lookAt numbers. 
        // I.e.: lookAtTo = new THREE.Vector3((posTo.x - posFrom.x) + lookAtFrom.x, (posTo.y - posFrom.y) + lookAtFrom.y, (posTo.z - posFrom.z) + lookAtFrom.z)
        lookAtDirector = new CameraDirector();
        lookAtDirector.addPlan(new CameraPlan(new THREE.Vector3(-0.1, 2, -1.5), new THREE.Vector3(-0.1, 2, -5), 2, 998, true));
        lookAtDirector.addPlan(new CameraPlan(new THREE.Vector3(-0.1, 2, -5), new THREE.Vector3(-0.1, 2, -1.5), 1.5, 998.5, true));
    }

    window.addEventListener('mousemove', updateMouseRay, false );
    
    animate();

    // Handle DOM Events (Button presses and such)
    viewMapButton.addEventListener("click", () => {
        viewMap(positionDirector);
        viewMap(lookAtDirector);
        sunsetUI.className = "ui hidden";
        mapUI.className = "ui";
    });

    viewSunsetButton.addEventListener("click", () => {
        viewSunset(positionDirector);
        viewSunset(lookAtDirector);
        sunsetUI.className = "ui";
        mapUI.className = "ui hidden";
    })

    function addCameraWobble(cameraPosition, time) {
        return new THREE.Vector3(
            cameraPosition.x + (Math.sin(time*3)/80),
            cameraPosition.y + (Math.sin(time*1.4)/90),
            cameraPosition.z + (Math.cos(time*2)/70)
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
        rockTheBoat(objects[15], time);

        // display that the user is hovering over a skill island
        let intersections = getMouseRayIntersections();
        if (intersections[0] && intersections[0].object.name) {
            switch ((intersections[0].object.name).toString()) {
                case "Web Apps":
                    //console.log("Contributions Hovered");
                    drawnCircle.position.set(-0.02, 1.932, -1.75);
                    drawnCircle.scale.set(2.1, 2.1);
                    break;
                case "Chrome Extensions":
                    //console.log("Chrome Extensions Hovered");
                    drawnCircle.position.set(0.21, 1.932, -1.79);
                    drawnCircle.scale.set(2, 2);
                    break;
                case "Eye Candy":
                    //console.log("Eye Candy Hovered");
                    drawnCircle.position.set(0.13, 1.932, -1.51);
                    drawnCircle.scale.set(2, 2);
                    break;
                case "Other Skills":
                    //console.log("Technologies Hovered");
                    drawnCircle.position.set(0.47, 1.932, -1.33);
                    drawnCircle.scale.set(3, 3);
                    break;
                case "Duda Widgets":
                    //console.log("Duda Widgets Hovered");
                    drawnCircle.position.set(-0.3, 1.932, -1.94);
                    drawnCircle.scale.set(3, 3);
                    break;
                case "Games":
                    //console.log("Games Hovered");
                    drawnCircle.position.set(-0.575, 1.932, -1.79);
                    drawnCircle.scale.set(2, 2);
                    break;
                case "Websites":
                    //console.log("Websites Hovered");
                    drawnCircle.position.set(-0.66, 1.932, -2.12);
                    drawnCircle.scale.set(4, 4);
                    break;
                case "Drawn Circle":
                    //console.log("Drawn Circle Hovered");
                    break;
                default:
                    drawnCircle.position.set(0, -100, 0);
                    drawnCircle.scale.set(2, 2);
                    break;
            }
        }

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

        //console.log(intersects);
        return intersects;
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
            ship.position.y = (Math.cos(time) * 0.0025) + 2.055;
        }
    }

    function updateCameraAngledAtMap(baseHeight) {
        let planIndex = 1;
        if (positionDirector && positionDirector.getPlan(planIndex)) {
            // Calculate how to position the camera to accomodate for various aspect ratios.
            let cameraHeight = 1/aspect + baseHeight;
            if (!landscape) {
                cameraHeight = 1/aspect + baseHeight*1.25;
            }

            let plan = positionDirector.getPlan(planIndex); // Get the CameraPlan so that we can edit the height of the camera.
            let to = plan.getTo();
            to.y = cameraHeight;
            plan.setTo(to); // Since the plan variable references the same plan from the positionDirector, I don't have to directly update the positionDirector
            return true;
        }
        return false;
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

    function viewMap(director) {
        if (director.getIndex() != 1) {
            director.setActive(1);
        }
    }

    function viewSunset(director) {
        if (director.getIndex(0) != 0) {
            director.setActive(0);
        }
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
    getFrom() {
        return this.from;
    }
    setFrom(vec3) {
        this.from = vec3;
    }

    getTo() {
        return this.to;
    }
    setTo(vec3) {
        this.to = vec3;
    }

    getDuration() {
        return this.duration;
    }
    setDuration(x) {
        this.duration = x;
    }

    getStall() {
        return this.stall;
    }
    setStall(x) {
        this.stall = x;
    }

    getEase() {
        return this.ease;
    }
    setEase(bool) {
        this.ease = bool;
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

    // If the update returns false, the movement has ended.
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
        this.index = this.plans.length - 1; // This isn't simply 0 because the last plan in the list has to be "updated" in order for the 0th index plan to execute first. Not sure why.
    }

    addPlan(plan) {
        this.plans.push(plan);
        this.index++; // This is necessary for ensuring the 0th index plan actually goes first. Not sure why.
    }

    getPlan(index) {
        return this.plans[index];
    }

    setPlan(index, CameraPlan) {
        this.plan[index] = CameraPlan;
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