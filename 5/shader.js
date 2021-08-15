import * as THREE from "./three.module.js";
import { OrbitControls } from './examples/jsm/controls/OrbitControls.js';
import { Water } from './examples/jsm/objects/Water2.js';
import { GLTFLoader } from './examples/jsm/loaders/GLTFLoader.js';
import { MarchingCubes } from './examples/jsm/objects/MarchingCubes.js';

document.addEventListener("DOMContentLoaded", () => {
    const threeDisplay = document.getElementById("threeDisplay");

    // Globals
    const objects = [];
    const balls = [];
    const lightMapIntensity = 1.25;
    //let canvasDimensions = getElemDimensions(threeDisplay);
    let screenDimensions = {
        width: window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth,
        height: window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight
    }
    let newCameraPosition = null;
    let newCameraLookAt = null;
    //console.log(screenDimensions);

    //threeDisplay.height = screenDimensions.height + "px";
    threeDisplay.style.height = screenDimensions.height + "px";

    // Set the scene up
    const scene = new THREE.Scene();

    // Set the camera up
    const fov = 30;
    let aspect = screenDimensions.width / screenDimensions.height;  // the canvas default
    const near = 0.1;
    const far = 100;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    //camera.up = new THREE.Vector3(0,0,1); // Set the up vector so that the lookAt function works as expected.

    // Establish camera positioning plans (camera panning)
    let positionPlans = [];
    positionPlans[0] = new CameraPlan(new THREE.Vector3(-1, 1, 1), new THREE.Vector3(-1, 3, 1), 5, 5, true);
    positionPlans[1] = new CameraPlan(new THREE.Vector3(8, 1, 10), new THREE.Vector3(-4, 1, 10), 8, 0, false);
    positionPlans[2] = new CameraPlan(new THREE.Vector3(8, 0.4, 6), new THREE.Vector3(10, 0.4, 8), 6, 0, true);
    positionPlans[3] = new CameraPlan(new THREE.Vector3(-8, 0.4, -6), new THREE.Vector3(-8, 0.4, -6), 1, 8, false);
    positionPlans[4] = new CameraPlan(new THREE.Vector3(-8, 0.4, -6), new THREE.Vector3(-8, 2, -3), 5, 5, true);
    positionPlans[5] = new CameraPlan(new THREE.Vector3(-9, 8, -18), new THREE.Vector3(-4, 6, 0), 8, 0, false);
    positionPlans[6] = new CameraPlan(new THREE.Vector3(0, 6, 0), new THREE.Vector3(0, 8, 0), 10, 0, true);
    let positionDirector = new CameraDirector(positionPlans);

    // Establish camera lookAt plans (camera focal point)
    let lookAtPlans = [];
    lookAtPlans[0] = new CameraPlan(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0), 5, 5, true);
    lookAtPlans[1] = new CameraPlan(new THREE.Vector3(5, 0, 0), new THREE.Vector3(-12, 0, 0), 8, 0, false);
    lookAtPlans[2] = new CameraPlan(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0), 6, 0, true);
    lookAtPlans[3] = new CameraPlan(new THREE.Vector3(-3, 0.2, 0), new THREE.Vector3(-3, 0.2, 0), 1, 8, false);
    lookAtPlans[4] = new CameraPlan(new THREE.Vector3(-3, 0.2, 0), new THREE.Vector3(-5, 0, -1.5), 5, 5, true);
    lookAtPlans[5] = new CameraPlan(new THREE.Vector3(-2, 0, -9), new THREE.Vector3(3, -2, 9), 8, 0, false); // For a smooth pan, take the movement and subtract the to movement with the from movement. Add this number to the from lookAt numbers. (I.e., lookAtTo = new THREE.Vector3((posTo.x - posFrom.x) + lookAtFrom.x, (posTo.y - posFrom.y) + lookAtFrom.y, (posTo.z - posFrom.z) + lookAtFrom.z)
    lookAtPlans[6] = new CameraPlan(new THREE.Vector3(99, 7, 0), new THREE.Vector3(0, 7, 99), 10, 0, false);
    let lookAtDirector = new CameraDirector(lookAtPlans);

    // Camera's initial position and where it's pointed
    /*let yPosCalculation = (aspect) => { return lerp(0.6, 1.6, aspect - 1); }
    let zPosCalculation = (aspect) => { return lerp(-6, -15, aspect - 1); }
    let xLookCalculation = (aspect) => { return lerp(-3, -0.3, aspect - 1); }
    let startPosX = -8;
    let startPosY = yPosCalculation(aspect);
    let startPosZ = zPosCalculation(aspect);
    let startLookX = xLookCalculation(aspect); 
    let startLookY = 0.2;
    let startLookZ = 0;
    camera.position.set(startPosX, startPosY, startPosZ);
    camera.lookAt(startLookX, startLookY, startLookZ);*/
    camera.lookAt(0, 0, 0);
    

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
        // Update the aspect ratio in order to recalculate how to place the camera.
        aspect = screenDimensions.width / screenDimensions.height;
        /*startPosY = yPosCalculation(aspect); 
        startPosZ = zPosCalculation(aspect);
        startLookX = xLookCalculation(aspect); */
        camera.position.set(startPosX, startPosY, startPosZ);
        camera.lookAt(startLookX, startLookY, startLookZ);
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
    
    // Skybox
    const cubeTextureLoader = new THREE.CubeTextureLoader();
    cubeTextureLoader.setPath( './textures/cube/apartment/' );
    const cubeTexture = cubeTextureLoader.load( [
        "px.jpg", "nx.jpg",
        "py.jpg", "ny.jpg",
        "pz.jpg", "nz.jpg"
    ] );
    scene.environment = cubeTexture;

    // Add the table top
    let tableGeometry = new THREE.PlaneGeometry(30, 30, 1, 1);
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
    let mapLightmap = new THREE.TextureLoader().load("map_lightmap.png");
    mapLightmap.flipY = false;
    new GLTFLoader().load( "./map.glb", function (object) {
        // Create a glass-like material for the bottle
        let map = object.scene.children[0];
        map.material = new THREE.MeshLambertMaterial({
            map: mapDiffuse,
            lightMap: mapLightmap,
            lightMapIntensity: lightMapIntensity,
            side: THREE.DoubleSide
        });
        //map.position.x = 2.25;
        map.position.x = -4;
        map.position.y = -1.378;
        map.rotation.y = THREE.Math.degToRad(260);
        map.scale.set(10, 10, 10);
        objects.push(map);
        scene.add(map);
    });

    // Load pin model
    let pinDiffuse = new THREE.TextureLoader().load("pin_diffuse.png");
    pinDiffuse.flipY = false;
    let pinLightmap = new THREE.TextureLoader().load("pin_lightmap.png");
    pinLightmap.flipY = false;
    new GLTFLoader().load( "./pin.glb", function (object) {
        // Create a glass-like material for the bottle
        let pin = object.scene.children[0];
        pin.material = new THREE.MeshLambertMaterial({
            map: pinDiffuse,
            lightMap: pinLightmap,
            lightMapIntensity: lightMapIntensity,
            side: THREE.FrontSide
        });
        //map.position.x = 2.25;
        pin.position.x = -3.65;
        pin.position.y = -1.1;
        pin.position.z = -0.38;
        pin.rotation.x = THREE.Math.degToRad(345);
       // pin.rotation.z = THREE.Math.degToRad(5);
        pin.scale.set(1.5, 1.5, 1.5);
        objects.push(pin);
        scene.add(pin);
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
    });

    // Clouds (Marching Cubes)
    const cloudResolution = 16;
    let colorTop = new THREE.Vector3(0.980, 0.961, 0.855);
    let colorBottom = new THREE.Vector3(0.376, 0.416, 0.482); //new THREE.Vector3(0.921, 0.486, 0.561);
    const cloudMaterial = cloudShadow(colorTop, colorBottom); // Custom cloud shader to avoid using lighting.
    const totalBalls = 7;
    initMarchingCubeBallSeeds(totalBalls); // Give each ball a random seed so that each ball's movement pattern differs.
    const clouds = new MarchingCubes( cloudResolution, cloudMaterial, false, false );
    clouds.position.set( 0.2, 1.2, 0 );
    clouds.scale.set( 2.7, 1, 1 );
    scene.add( clouds );

    // Load the lamp model
    let lampDiffuse = new THREE.TextureLoader().load("lamp_diffuse.png");
    lampDiffuse.flipY = false;
    let lampLightmap = new THREE.TextureLoader().load("lamp_lightmap.jpg");
    lampLightmap.flipY = false;
    new GLTFLoader().load( "./lamp.glb", function (object) {
        let lamp = object.scene;

        let lampGeometry = lamp.children[0].geometry;
        let lampUVArr = lampGeometry.getAttribute("uv").array;
        lampGeometry.setAttribute('uv2', new THREE.BufferAttribute( lampUVArr, 2 ));

        lamp.material = new THREE.MeshLambertMaterial({
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
    let shipLightmap = new THREE.TextureLoader().load("ship_lightmap.jpg");
    shipLightmap.flipY = false;
    new GLTFLoader().load( "./ship.glb", function (object) {
        let ship = object.scene;

        let shipGeometry = ship.children[0].geometry;
        let shipUVArr = shipGeometry.getAttribute("uv").array;
        shipGeometry.setAttribute('uv2', new THREE.BufferAttribute( shipUVArr, 2 ));

        ship.material = new THREE.MeshLambertMaterial({
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

    // Setup dot wave backdrop
    let backdropGeometry = new THREE.CylinderGeometry(30, 30, 40, 30, 1, true);
    let backdropMaterial = dotWaves();
    let backdrop = new THREE.Mesh(backdropGeometry, backdropMaterial);
    backdrop.position.y = 4;
    backdrop.rotation.y = THREE.Math.degToRad(180);
    objects.push(backdrop);
    scene.add(backdrop);

    // Setup WebGL renderer
    const renderer = initRenderer();
    threeDisplay.appendChild( renderer.domElement );

    // Orbit controls
    /*const controls = new OrbitControls( camera, renderer.domElement );
    controls.minDistance = 3;
    controls.maxDistance = 50;*/

    //console.log("objects", objects);

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

        // Camera wobbles a bit
        /*camera.position.x = startPosX + (Math.sin(time)/12);
        camera.position.y = startPosY + (Math.sin(time/2)/14);
        camera.position.z = startPosZ + (Math.cos(time+2)/16);*/

        // if the canvas's css dimensions and renderer resolution differs, resize the renderer to prevent blockiness.
        if (resizeRendererToDisplaySize(renderer)) {
            // Fix distortions when canvas gets resized
            const canvas = renderer.domElement;
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
        }
        backdrop.material.uniforms.time.value = time;
        /*scene.traverse( function ( child ) {
            if ( child.isMesh ) {
                const shader = child.material.userData.shader;
                if ( shader ) {
                    shader.uniforms.time.value = time;
                }
            }
        } );*/

        updateCubes(clouds, balls, time);
        rockTheBoat(objects[9], time);
        
        newCameraPosition = positionDirector.update(time);
        //console.log(newCameraPosition);
        if (newCameraPosition) {
            //newCameraPosition = addCameraWobble(newCameraPosition, time);
            camera.position.x = newCameraPosition.x;
            camera.position.y = newCameraPosition.y;
            camera.position.z = newCameraPosition.z;
        }

        newCameraLookAt = lookAtDirector.update(time);
        //console.log(newCameraLookAt);
        console.log(lookAtDirector.getIndex());
        if (newCameraLookAt) {
            /*camera.lookAt.x = newCameraPosition.x;
            camera.lookAt.y = newCameraPosition.y;
            camera.lookAt.z = newCameraPosition.z;*/
            newCameraLookAt = addCameraWobble(newCameraLookAt, time);
            camera.lookAt(newCameraLookAt.x, newCameraLookAt.y, newCameraLookAt.z);
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

    function dotWaves() {
        return new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 1.0 },
            },
            vertexShader: `
            varying vec2 vUv; 
            void main()
            {
                vUv = uv;
            
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0 );
                gl_Position = projectionMatrix * mvPosition;
            }
            `,
            fragmentShader: `
            #define PI 3.14159265359

            // https://www.shadertoy.com/view/wt23Rt
            #define saturate2(v) clamp(v,0.,1.)

            uniform float time;
            varying vec2 vUv;

            vec3 hue2rgb(float hue) {
                hue=fract(hue);
                return saturate2(vec3(
                    abs(hue*6.-3.)-1.,
                    2.-abs(hue*6.-2.),
                    2.-abs(hue*6.-4.)
                ));
            }

            // Simplex 2D noise
            // https://gist.github.com/patriciogonzalezvivo/670c22f3966e662d2f83
            vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

            float snoise(vec2 v) {
            const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                    -0.577350269189626, 0.024390243902439);
            vec2 i  = floor(v + dot(v, C.yy) );
            vec2 x0 = v -   i + dot(i, C.xx);
            vec2 i1;
            i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
            vec4 x12 = x0.xyxy + C.xxzz;
            x12.xy -= i1;
            i = mod(i, 289.0);
            vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
            + i.x + vec3(0.0, i1.x, 1.0 ));
            vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
                dot(x12.zw,x12.zw)), 0.0);
            m = m*m ;
            m = m*m ;
            vec3 x = 2.0 * fract(p * C.www) - 1.0;
            vec3 h = abs(x) - 0.5;
            vec3 ox = floor(x + 0.5);
            vec3 a0 = x - ox;
            m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
            vec3 g;
            g.x  = a0.x  * x0.x  + h.x  * x0.y;
            g.yz = a0.yz * x12.xz + h.yz * x12.yw;
            return 130.0 * dot(m, g);
            }

            // Draw a circle
            float circle(vec2 st, vec2 center, float size, float blur) {
                float dist = distance(st, center);
                return smoothstep(dist, dist+blur, size);
            }

            float doubleEase(float x) {
                return 0.5 - (cos(x*2.0*PI)/2.0);
            }

            void main()
            {
                // Normalized pixel coordinates (from -0.5 to 0.5)
                vec2 uv = -1.0 + 2.0 * vUv;

                int gridCount = 25; // This will be how many circles fit within the grid. How many balls fitting within the viewport width depends on the aspect ratio.
                
                float color = 0.0;
                vec2 circleCenter = vec2(0.5, 0.5);
                float size = 0.1;
                float blur = 0.01;
                
                float adjustedX = uv.x + 0.5;
                float adjustedY = uv.y + 0.5;
                float noiseValue = snoise(vec2(adjustedX + cos(time/3.), adjustedY + time/6.))/2.0;
                float posX = mod(adjustedX*5.0 * float(gridCount), 1.0);
                float posY = mod(adjustedY * float(gridCount), 1.0);
                color = circle(vec2(posX, posY), circleCenter, size+noiseValue, blur);
                
                //vec3 colorA = vec3(1.0, 0.8, 0.2);
                //vec3 colorB = vec3(0.4, 0.75, 1.0);
                vec3 fg = mix(hue2rgb(time/16.0)*cos(uv.x), hue2rgb(time/20.0)*sin(uv.y), noiseValue);
                //vec3 fg = vec3(uv.x, uv.y, sin(time));
                //vec3 fg = vec3(0.0, 0.5, 1.0); // sky blue
                //vec3 bg = vec3(1.0, 1.0, 1.0); // transparent

                //float bgDist = distance(vec2(-0.1, -0.1), vec2(uv.x, uv.y));
                //vec3 bg = vec3(smoothstep(bgDist, bgDist+0.8, 1.0));
                vec3 bg = vec3(clamp(doubleEase(vUv.y), 0.3, 1.0));
                gl_FragColor = vec4(mix(bg,fg,color), 1.0);
            }
            `,
            side: THREE.BackSide
        });
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
        this.plans = plans;
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