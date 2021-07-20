/*import {
    Scene,
    PerspectiveCamera,
    MeshStandardMaterial,
    WebGLRenderer
} from './three.module.js';*/
import * as THREE from "./three.module.js";
import { GLTFLoader } from './modules/GLTFLoader.js';
import { PMREMGenerator } from './modules/PMREMGenerator.js';
import { RGBELoader } from './modules/RGBELoader.js';

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
        60, // fov
        displayWidth / displayHeight, // aspect ratio
        0.1, // near plane
        1000 // far plane
    );
    /*camera.position.x = -4;
    camera.position.y = 18;
    camera.position.z = 0;
    camera.rotation.x = deg2rad(270); //-1.2;
    camera.rotation.y = deg2rad(300); //-0.6;
    camera.rotation.z = deg2rad(340); //0.3;*/
    camera.position.x = 0;
    camera.position.y = 18;
    camera.position.z = 0;
    camera.rotation.x = deg2rad(270); //-1.2;
    camera.rotation.y = deg2rad(0); //-0.6;
    camera.rotation.z = deg2rad(0); //0.3;

    var cameraX = 0;
    var cameraZ = 0;

    threeDisplay.addEventListener("mousemove", function(e) {
        //console.log(e);
        cameraX = (e.clientX/displayWidth) - 0.5;
        cameraZ = (e.clientY/displayHeight) - 0.5;
    });

    // Setup a point light
    const light = new THREE.DirectionalLight( 0xffffff, 1.0 );
    light.position.set(-0.2, 1, -0.6);
    scene.add(light);

    // Setup WebGL
    const renderer = new THREE.WebGLRenderer( {alpha: true} );
    renderer.setSize( displayWidth, displayHeight );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.shadowMap.enabled = true;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.tomeMappingExposure = 1.25;
    threeDisplay.appendChild( renderer.domElement );

    var currentTime = 0;

    // Setup animate function
    var centralCylinder = null;
    var helix = null;
    var innerHelix = null;
    //var innerHelixMaterial = null;
    //var cameraRot = 0;

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
    //var monkeyMaterial = new THREE.MeshStandardMaterial({color: 0x5590d5});
    const loader = new GLTFLoader();
    loader.load( "./spiral_pillar_hq.glb", function (object) {
        /*object.scene.traverse( function( child ) {
            if ( child instanceof THREE.Mesh ) {
                child.material = monkeyMaterial;
            }
        });*/ 

        const vertexShaderReplacements = [
            {
                from: '#include <common>',
                to: `#include <common>
                uniform vec2 bboxMin;
                uniform vec2 bboxMax;
                varying vec2 vUv;`
            },
            {
                from: '#include <uv_vertex>',
                to: `#include <uv_vertex>
                vUv.x = (position.x - bboxMin.x) / (bboxMax.x - bboxMin.x);
                vUv.y = (position.y - bboxMin.y) / (bboxMax.y - bboxMin.y);`
            },
        ];

        const fragmentShaderReplacements = [
            {
                from: '#include <common>',
                to: `
                #include <common>
                uniform float time;
                uniform float resolution;
                varying vec2 vUv;
                `,
            },
            {
                from: '#include <color_fragment>',
                to: `
                #include <color_fragment>
                {
                    //vec4 indexColor = texture2D(indexTexture, vUv);
                    //float index = indexColor.r * 255.0 + indexColor.g * 255.0 * 256.0;
                    //vec2 paletteUV = vec2((index + 0.5) / paletteTextureWidth, 0.5);
                    //vec4 paletteColor = texture2D(paletteTexture, paletteUV);
                    // diffuseColor.rgb += paletteColor.rgb;   // white outlines

                    //diffuseColor.rgb = vec3(sin(time));// * diffuseColor.rgb;  // black outlines
                    vec3 diffuseCol = vec3(cos(time), cos(cos(time)*0.3), sin(time)/2.0);
                    vec3 color1 = vec3(0.0, 0.7, 1.0);
                    vec3 color2 = vec3(1.0, 0.2, 0.4);
                    diffuseColor.rgb = diffuseCol * mix(color1, color2, vUv.y);
                }
                `,
            }//,
            //{
            //    from: 'vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;',
            //    to: 'vec3 outgoingLight = time * totalDiffuse + totalSpecular + totalEmissiveRadiance;'
            //}
        ];

        centralCylinder = object.scene.children[0]; // store the object's meshes
        helix = object.scene.children[1]; 

        var innerHelixMesh = object.scene.children[2].geometry;
        console.log(object.scene.children[2]);
        innerHelix = new THREE.Mesh(innerHelixMesh, shaderMeshMaterial(new THREE.MeshBasicMaterial(), innerHelixMesh, vertexShaderReplacements, fragmentShaderReplacements));
        innerHelix = applyTransform(object.scene.children[2], innerHelix);
        scene.add(innerHelix);

        // Create an environment map
        var envMapLoader = new PMREMGenerator(renderer);
        new RGBELoader().setPath("./").load("photoStudio.hdr", function(hdrmap) {
            var envmap = envMapLoader.fromCubemap(hdrmap);

            centralCylinder.material = new THREE.MeshStandardMaterial({
                //color: 0xffddff,
                roughness: 0.2,
                metalness: 0.9,
                envMap: envmap.texture,
                envMapIntensity: 0.5
            });
            //scene.add(centralCylinder);

            helix.material = new THREE.MeshPhysicalMaterial({
                //color: 0xf42342,
                metalness: .9,
                roughness: .0,
                envMap: envmap.texture,
                envMapIntensity: 0.9,
                clearcoat: 1,
                clearcoatRoughness: 0.1,
                transparent: true,
                //transmission: .95,
                opacity: 0.7,
                reflectivity: 0.8,
                refractionRatio: 0.985,
                ior: 0.9,
                side: THREE.BackSide,
            });
            scene.add(helix);
        });

        //innerHelix.material.onBeforeCompile = function ( shader ) {
        //    shader.uniforms.time = { value: currentTime };
        //    shader.uniforms.resolution = { value: new THREE.Vector2(displayWidth, displayHeight) };

        //    fragmentShaderReplacements.forEach((rep) => {
        //        shader.fragmentShader = shader.fragmentShader.replace(rep.from, rep.to);
        //    });

        //    innerHelix.material.userData.shader = shader;

            /*shader.fragmentShader = "void main() {\n"
            + "vec2 uv = fragCoord/iResolution.xy;\n"
            + "vec3 col = 0.5 + 0.5*cos(iTime+uv.xyx+vec3(0,2,4));\n"
            + "fragColor = vec4(col,1.0);\n"
            + "}";*/
           
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
        //    console.log(shader);
        //};
        //scene.add(object.scene);

        //var environmentHDR = new THREE.TextureLoader().load( "./photoStudio.hdr" );
        //pmrem.fromEquirectangular(environmentHDR);

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
    // If all the models are loaded, then animate.
    function attemptToAnimate() {
        //if (centralCylinder && helix && innerHelix) {
        if (innerHelix) {
            animate();
        }
    }

    function animate (timestamp) {
        requestAnimationFrame(animate);
        resizeRendererToDisplaySize(renderer);
        //console.log("Timestamp: ", timestamp);
        currentTime = timestamp/1000; // Current time in seconds.

        // Update rotation
        //helix.rotation.x += 0.006;
        helix.rotation.z += 0.006;
        innerHelix.rotation.z -= 0.006; // The inner helix in the gltf file has its rotation reversed. This is why we must subtract instead of add.

        camera.position.x = cameraX;
        camera.position.z = cameraZ;
        //cameraRot += 0.01;
        //camera.rotation.x = Math.sin(cameraRot);
        
        //console.log(monkey);
        //console.log(innerHelix.material);
        //innerHelix.material.userData.shader.uniforms.time.value = currentTime;

        scene.traverse( function ( child ) {
            if ( child.isMesh ) {
                const shader = child.material.userData.shader;
                if ( shader ) {
                    //console.log(child);
                    //console.log("Current time: " + currentTime, "Sin time: " + Math.sin(currentTime), "Cos time: " + Math.cos(currentTime));
                    shader.uniforms.time.value = currentTime;
                    //child.material.needsUpdate = true;
                }
            }
        } );
        //console.log(innerHelix);
        
        //cube.rotation.x += 0.01;
        //cube.rotation.y += 0.01;

        renderer.render( scene, camera );
    };

    // Creates a shader for a mesh material
    function shaderMeshMaterial(materialType, geometry, vertexShaderReplacements, fragmentShaderReplacements) {
        var material = materialType;
        material.onBeforeCompile = function ( shader ) {
            shader.uniforms.time = { value: currentTime };
            shader.uniforms.resolution = { value: new THREE.Vector2(displayWidth, displayHeight) };
            shader.uniforms.bboxMin = { value: geometry.boundingBox.min };
            shader.uniforms.bboxMax = { value: geometry.boundingBox.max };

            vertexShaderReplacements.forEach((rep) => {
                shader.vertexShader = shader.vertexShader.replace(rep.from, rep.to);
            });

            fragmentShaderReplacements.forEach((rep) => {
                shader.fragmentShader = shader.fragmentShader.replace(rep.from, rep.to);
            });

            material.userData.shader = shader;
        }
        return material;
    }

    // For when a new mesh is created and the old mesh's transforms need to be carried over.
    function applyTransform(meshFromScene, newMesh) {
        newMesh.position.x = meshFromScene.position.x;
        newMesh.position.y = meshFromScene.position.y;
        newMesh.position.z = meshFromScene.position.z;

        newMesh.rotation.x = meshFromScene.rotation.x;
        newMesh.rotation.y = meshFromScene.rotation.y;
        newMesh.rotation.z = meshFromScene.rotation.z;

        newMesh.scale.x = meshFromScene.scale.x;
        newMesh.scale.y = meshFromScene.scale.y;
        newMesh.scale.z = meshFromScene.scale.z;

        return newMesh;
    }

    function resizeRendererToDisplaySize(renderer) {
        const canvas = renderer.domElement;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        const needResize = canvas.width !== width || canvas.height !== height;
        if (needResize) {
          renderer.setSize(width, height, false);
        }
        return needResize;
    }

    function deg2rad (deg) {
        return deg * Math.PI / 180;
    }
});
