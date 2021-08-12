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
    const lightMapIntensity = 1.25;
    //let canvasDimensions = getElemDimensions(threeDisplay);
    let screenDimensions = {
        width: window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth,
        height: window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight
    }
    console.log(screenDimensions);

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
    // Camera's initial position and where it's pointed
    let startPosX = -8;
    let startPosY = 0.4;
    let startPosZ = lerp(-6, -20, aspect - 1);
    let startLookX = lerp(-3, -0.3, aspect - 1); 
    let startLookY = 0.2;
    let startLookZ = 0;

    console.log("aspect: " + aspect, "startPosZ: " + startPosZ, "startLookX: " + startLookX);

    // Alter where the camera points based on the size of the canvas.
    /*if (canvasDimensions.width < 1000) {
        //startPosZ = -15;
        //startLookX = -0.3;
        startPosZ = aspect * startPosZ;
    }*/
    camera.position.set(startPosX, startPosY, startPosZ);
    camera.lookAt(startLookX, startLookY, startLookZ);

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
    //scene.background = cubeTexture;

    // Add the table top
    let tableGeometry = new THREE.PlaneGeometry(30, 30, 1, 1);
    let tableUVArr = tableGeometry.getAttribute("uv").array; 
    tableGeometry.setAttribute('uv2', new THREE.BufferAttribute( tableUVArr, 2 )); // create another uv map for the lightmap to use.
    let tableDiffuse = new THREE.TextureLoader().load("table_diffuse.jpg");
    let tableLightmap = new THREE.TextureLoader().load("table_lightmap.png");
    let tableMaterial = new THREE.MeshLambertMaterial({
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
    let holderDiffuse = new THREE.TextureLoader().load("holder_diffuse.jpg");
    //let holderNormal = new THREE.TextureLoader().load("holder_normal.png");
    let holderLightmap = new THREE.TextureLoader().load("holder_lightmap.png");
    holderLightmap.flipY = false; // glTF has a different texture transform than the three.js default. If you’re loading the texture separately try setting texture.flipY = false
    new GLTFLoader().load( "./holder.glb", function (object) {
        let bottleHolder = object.scene;
        //console.log(object);
        let bottleHolderGeometry = bottleHolder.children[0].geometry;
        //let holderUVArr = bottleHolderGeometry.getAttribute("uv").array;
        //bottleHolderGeometry.setAttribute('uv2', new THREE.BufferAttribute( holderUVArr, 2 ));
        //bottleHolder.castShadow = true;
        bottleHolder.material = new THREE.MeshLambertMaterial({
            map: holderDiffuse,
            //normalMap: holderNormal,
            lightMap: holderLightmap,
            lightMapIntensity: lightMapIntensity,
        });

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
    let shipLightmap = new THREE.TextureLoader().load("ship_lightmap.png");
    shipLightmap.flipY = false;
    new GLTFLoader().load( "./ship.glb", function (object) {
        let ship = object.scene;
        //console.log(ship);

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
    let backdropGeometry = new THREE.CylinderGeometry(30, 30, 20, 30, 1, true, THREE.Math.degToRad(300), THREE.Math.degToRad(220));
    let backdropMaterial = dotWaves();
    let backdrop = new THREE.Mesh(backdropGeometry, backdropMaterial);
    //backdrop.position.x = -3;
    backdrop.position.y = 0;
    //backdrop.position.z = 4;
    //table.rotation.x = THREE.Math.degToRad(270);
    //table.rotation.z = THREE.Math.degToRad(270);
    objects.push(backdrop);
    scene.add(backdrop);
    //console.log(backdrop);

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
    /*const lightColor = 0xffffff;
    const lightIntensity = 1;
    const light = new THREE.DirectionalLight( lightColor, lightIntensity );
    light.position.set(-0.2, 1, -0.6);
    scene.add(light);*/

    // Setup WebGL renderer
    const renderer = initRenderer();
    threeDisplay.appendChild( renderer.domElement );

    // Orbit controls
    /*const controls = new OrbitControls( camera, renderer.domElement );
    controls.minDistance = 3;
    controls.maxDistance = 10;*/

    console.log("objects", objects);

    animate();

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
        startPosZ = lerp(-6, -20, aspect - 1);
        startLookX = lerp(-3, -0.3, aspect - 1); 
        camera.position.set(startPosX, startPosY, startPosZ);
        camera.lookAt(startLookX, startLookY, startLookZ);
    });
    
    function animate (time) {
        requestAnimationFrame(animate);
        time *= 0.001; // Convert time to seconds.

        // Camera wobbles a bit
        camera.position.x = startPosX + (Math.sin(time)/12);
        camera.position.y = startPosY + (Math.sin(time/2)/14);
        camera.position.z = startPosZ + (Math.cos(time+2)/16);

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
        rockTheBoat(objects[7], time);

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

            console.log(shader);

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
                vec4 fg = vec4(mix(hue2rgb(time/16.0)*cos(uv.x), hue2rgb(time/20.0)*sin(uv.y), noiseValue), 1.0);
                //vec3 fg = vec3(uv.x, uv.y, sin(time));
                //vec3 fg = vec3(0.0, 0.5, 1.0); // sky blue
                vec4 bg = vec4(1.0, 1.0, 1.0, 0.0); // transparent
                gl_FragColor = mix(bg,fg,color);
            }
            `,
            side: THREE.BackSide
        });
    }

    // Get the dimensions of a DOM element
    /*function getElemDimensions(elem) {
        var rect = elem.getBoundingClientRect();
        return {
            width: parseInt(rect.width),
            height: parseInt(rect.height)
        }
    }*/

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

    // Linear interpolation between two values
    // x and y are the two values to interpolate between
    // t is the degree of interpolation between x and y.
    function lerp(x, y, t) {
        // Ensure t is normalized between 0 and 1.
        if (t > 1) {
            t = 1;
        }
        else if (t < 0) {
            t = 0;
        }
        return x*t + y*(1-t);
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
