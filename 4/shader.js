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

import { EffectComposer } from './modules/DoF/EffectComposer.js';
import { RenderPass } from './modules/DoF/RenderPass.js';
//import { BokehPass } from './modules/DoF/BokehPass.js';

document.addEventListener("DOMContentLoaded", () => {
    const threeDisplay = document.getElementById("threeDisplay");

    // Globals
    var displayDimensions = getElemDimensions(threeDisplay); // Uniform
    var currentTime = 0; // Uniform
    var helix = null; // Mesh
    var innerHelix = null; // Mesh
    var horseshoe = null; // Mesh
    const postprocessing = {}; // DoF

    // Set the scene and camera up
    const scene = new THREE.Scene();
    const camera = initCamera();
    
    // Camera movement via mouse move.
    var cameraX = 0;
    var cameraZ = 0;
    threeDisplay.addEventListener("mousemove", function(e) {
        //console.log(e);
        cameraX = (e.clientX/displayDimensions.width) - 0.5;
        cameraZ = (e.clientY/displayDimensions.height) - 0.5;
    });

    // Setup a directional light
    const light = new THREE.DirectionalLight( 0xffffff, 1.0 );
    light.position.set(-0.2, 1, -0.6);
    scene.add(light);

    // Setup WebGL renderer
    const renderer = initRenderer();
    threeDisplay.appendChild( renderer.domElement );
    
    // Load the gltf model
    new GLTFLoader().load( "./spiral_pillar_hq_horseshoe.glb", function (object) {
        // Create a glass-like material for the helix
        helix = object.scene.children[0]; // store the object's meshes
        new RGBELoader().setPath("./").load("photoStudio.hdr", function(hdrmap) {
            var envmap = new PMREMGenerator(renderer).fromCubemap(hdrmap);
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

        // Turn the inner helix into a colorful, wiggly shader.
        innerHelix = object.scene.children[1];
        var innerHelixGeometry = innerHelix.geometry;
        var innerHelixMaterial = mrDoobWay3(innerHelixGeometry, {
            vertexFunctions: '',
            vertex: `float theta = (sin(time*2.0 + position.x) + cos(time*2.0 + position.y)) / 180.0;
            float c = cos( theta );
            float s = sin( theta );
            mat3 m = mat3( c, 0, s, 
                           0, 1, 0, 
                           -s, 0, c );
            transformed = vec3( position ) * m;
            vNormal = vNormal * m;`,
            fragmentFunctions: `vec3 hsb2rgb( in vec3 c ){
                vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),
                                         6.0)-3.0)-1.0,
                                 0.0,
                                 1.0 );
                rgb = rgb*rgb*(3.0-2.0*rgb);
                return c.z * mix(vec3(1.0), rgb, c.y);
            }`,
            fragment: `gl_FragColor = vec4( hsb2rgb( vec3(sin(time+vUv.x) * cos(time+pos.z) , 1.0, 1.0) * packNormalToRGB(normal) ), opacity );`
        });//shaderMeshMaterial(new THREE.MeshNormalMaterial(), innerHelixGeometry, innerHelixVertexShaderReplacements, innerHelixFragmentShaderReplacements);
        var innerHelixMesh = new THREE.Mesh(innerHelixGeometry, innerHelixMaterial);
        innerHelix = cloneTransform(innerHelix, innerHelixMesh);
        scene.add(innerHelix);
        //console.log(innerHelix);

        // Turn the horseshoe into a shader.
        horseshoe = object.scene.children[2];
        var horseshoeGeometry = horseshoe.geometry;
        var horseshoeMaterial = mrDoobWay3(horseshoeGeometry, {
            vertexFunctions: '',
            vertex: '',
            fragmentFunctions: `float circle(vec2 st, vec2 center, float size, float blur) {
                float circ = 0.0;
                float dist = distance(st, center);
                if (dist < size) {
                    circ += smoothstep(dist, dist+blur, size);
                }
                return circ;
            }`,
            fragment: `vec3 dot = vec3(circle(vUv, vUv, 0.01, 0.001));
            gl_FragColor = vec4(vec3(dot.x, dot.y, dot.z), opacity );`
        });//shaderMeshMaterial(new THREE.MeshNormalMaterial(), horseshoeGeometry, horseshoeVertexShaderReplacements, horseshoeFragmentShaderReplacements);
        var horseshoeMesh = new THREE.Mesh(horseshoeGeometry, horseshoeMaterial);
        horseshoe = cloneTransform(horseshoe, horseshoeMesh);
        horseshoe.rotation.z = deg2rad(180); // Orient the horseshoe to the correct position and rotation.
        horseshoe.position.y = 13;
        scene.add(horseshoe);

        //console.log(horseshoe);

        // Postprocessing effects such as depth of field
        //initPostprocessing();

        animate();
    }, undefined, function (error) {
        console.error(error);
    });



    function animate (timestamp = 0) {
        requestAnimationFrame(animate);
        resizeRendererToDisplaySize(renderer);

        currentTime = timestamp/1000; // Current time in seconds.

        // Update rotation
        helix.rotation.z += 0.002;
        innerHelix.rotation.z -= 0.002; // The inner helix in the gltf file has its rotation reversed. This is why we must subtract instead of add.
        //horseshoe.rotation.x += 0.02;

        // Mouse slightly moves the camera
        camera.position.x = cameraX;
        camera.position.z = cameraZ;

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

        renderer.render( scene, camera );
        //postprocessing.composer.render( 0.1 );
    };

    // For when a new mesh is created and the old mesh's transforms need to be carried over.
    function cloneTransform(meshFromScene, newMesh) {
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

    function deg2rad (deg) {
        return deg * Math.PI / 180;
    }

    // Get the dimensions of a DOM element
    function getElemDimensions(elem) {
        var rect = elem.getBoundingClientRect();
        return {
            width: parseInt(rect.width),
            height: parseInt(rect.height)
        }
    }

    function initCamera() {
        var camera = new THREE.PerspectiveCamera( 
            60, // fov
            displayDimensions.width / displayDimensions.height, // aspect ratio
            0.1, // near plane
            1000 // far plane
        );
        camera.position.x = 0;
        camera.position.y = 18;
        camera.position.z = 0;
        camera.rotation.x = deg2rad(270); //-1.2;
        camera.rotation.y = deg2rad(0); //-0.6;
        camera.rotation.z = deg2rad(0); //0.3;

        return camera;
    }

    function initPostprocessing() {
        const renderPass = new RenderPass( scene, camera );

        const bokehPass = new BokehPass( scene, camera, {
            focus: 3.0,
            aperture: 0.0002,
            maxblur: 0.01,

            width: displayDimensions.width,
            height: displayDimensions.height
        });

        //const renderTargetParams = {
        //    format: THREE.RGBAFormat
        //};
        //const renderTarget = new THREE.WebGLRenderTarget( displayDimensions.width, displayDimensions.height, renderTargetParams ); // Maintain transparency of background
        const composer = new EffectComposer( renderer, renderer.getRenderTarget());

        composer.addPass( renderPass );
        //composer.addPass( bokehPass );

        postprocessing.composer = composer;
        //postprocessing.bokeh = bokehPass;
    }

    function initRenderer() {
        var renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true,
            precision: "mediump"
        });
        renderer.setClearColor( 0x000000, 0);
        /*const renderTargetParams = {
            format: THREE.RGBAFormat
        };
        const renderTarget = new THREE.WebGLRenderTarget( displayDimensions.width, displayDimensions.height, renderTargetParams ); // Maintain transparency of background
        renderer.setRenderTarget(renderTarget);*/
        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.setSize( displayDimensions.width, displayDimensions.height );
        renderer.shadowMap.enabled = true;
        renderer.outputEncoding = THREE.sRGBEncoding;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.25;

        return renderer;
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
    
    // Creates a shader with texel coordinates, resolution and time glsl uniforms for a given mesh material.
    // Globals used: displayDimensions
    function shaderMeshMaterial(materialType, geometry, vertexShaderReplacements, fragmentShaderReplacements) {
        var material = materialType;
        material.onBeforeCompile = function ( shader ) {
            shader.uniforms.time = { value: 0 };
            shader.uniforms.resolution = { value: new THREE.Vector2(displayDimensions.width, displayDimensions.height) };
            shader.uniforms.bboxMin = { value: geometry.boundingBox.min };
            shader.uniforms.bboxMax = { value: geometry.boundingBox.max };

            vertexShaderReplacements.forEach((rep) => {
                shader.vertexShader = shader.vertexShader.replace(rep.from, rep.to);
            });

            fragmentShaderReplacements.forEach((rep) => {
                shader.fragmentShader = shader.fragmentShader.replace(rep.from, rep.to);
            });

            console.log(shader);

            material.userData.shader = shader;
        }

        material.customProgramCacheKey = function () {
            return fragmentShaderReplacements;
        };

        return material;
    }

    function mrDoobWay(redness) {
        var material = new THREE.MeshNormalMaterial();
        material.onBeforeCompile = function ( shader ) {
            shader.uniforms.time = { value: 0 };

            shader.fragmentShader = 'uniform float time;\n' + shader.fragmentShader;
            shader.fragmentShader = shader.fragmentShader.replace(
                `gl_FragColor = vec4( packNormalToRGB( normal ), opacity );`,
                `gl_FragColor = vec4(vec3(${ redness }, 0.0, 0.0), opacity);`,
            );

            console.log(shader);

            material.userData.shader = shader;
        }

        // Make sure WebGLRenderer doesnt reuse a single program
        material.customProgramCacheKey = function () {
            return redness;
        };

        return material;
    }

    function mrDoobWay2(customizeObj) {
        var material = new THREE.MeshNormalMaterial();
        material.onBeforeCompile = function ( shader ) {
            shader.uniforms.time = { value: 0 };

            shader.fragmentShader = 'uniform float time;\n' + shader.fragmentShader;
            shader.fragmentShader = shader.fragmentShader.replace(
                `gl_FragColor = vec4( packNormalToRGB( normal ), opacity );`,
                `gl_FragColor = vec4(vec3(${ customizeObj.red }, ${ customizeObj.green }, ${ customizeObj.blue }), opacity);`,
            );

            console.log(shader);

            material.userData.shader = shader;
        }

        // Make sure WebGLRenderer doesnt reuse a single program
        material.customProgramCacheKey = function () {
            return [
                customizeObj.red,
                customizeObj.green,
                customizeObj.blue
            ];
        };

        return material;
    }

    // shaderCode is an object which looks like this:
    // {
    //     shaderCode.vertexFunctions: '// glsl vertex shader functions',
    //     shaderCode.vertex: '// glsl vertex shader code.',
    //     shaderCode.fragmentFunctions: '// glsl fragment shader functions',
    //     shaderCode.fragment: '// glsl fragment shader code. Must include gl_FragColor definition.'
    // }
    function mrDoobWay3(geometry, shaderCode) {
        var material = new THREE.MeshNormalMaterial();
        material.onBeforeCompile = function ( shader ) {
            shader.uniforms.time = { value: 0 };
            shader.uniforms.resolution = { value: new THREE.Vector2(displayDimensions.width, displayDimensions.height) };
            shader.uniforms.bboxMin = { value: geometry.boundingBox.min };
            shader.uniforms.bboxMax = { value: geometry.boundingBox.max };

            // Uniforms
            shader.vertexShader = 'uniform float time;\nuniform float resolution;\nuniform vec2 bboxMin;\nuniform vec2 bboxMax;\nvarying vec2 vUv;\nvarying vec3 pos;\n' + shader.vertexShader;
            // Vertex Functions
            shader.vertexShader = shader.vertexShader.replace(
                '#include <common>',
                `#include <common>
                ${ shaderCode.vertexFunctions }`
            )
            // Vertex Code
            shader.vertexShader = shader.vertexShader.replace(
                `#include <begin_vertex>`,
                `#include <begin_vertex>
                vUv.x = (position.x - bboxMin.x) / (bboxMax.x - bboxMin.x);
                vUv.y = (position.y - bboxMin.y) / (bboxMax.y - bboxMin.y);
                pos = vec3(position.x, position.y, position.z);
                ${ shaderCode.vertex }`,
            );

            // Uniforms
            shader.fragmentShader = 'uniform float time;\nuniform float resolution;\nvarying vec2 vUv;\nvarying vec3 pos;\n' + shader.fragmentShader;
            // Fragment Functions
            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <packing>',
                `#include <packing>
                ${ shaderCode.fragmentFunctions }`
            )
            // Fragment Code
            shader.fragmentShader = shader.fragmentShader.replace(
                `gl_FragColor = vec4( packNormalToRGB( normal ), opacity );`,
                `${ shaderCode.fragment }`,
            );

            console.log(shader);

            material.userData.shader = shader;
        }

        // Make sure WebGLRenderer doesnt reuse a single program
        material.customProgramCacheKey = function () {
            return [
                shaderCode.vertexFunctions,
                shaderCode.vertex,
                shaderCode.fragmentFunctions,
                shaderCode.fragment
            ];
        };

        return material;
    }

    function mrDoobWay4(geometry, shaderCode) {
        var material = new THREE.MeshNormalMaterial();
        material.onBeforeCompile = function ( shader ) {
            shader.uniforms.time = { value: 0 };
            shader.uniforms.resolution = { value: new THREE.Vector2(displayDimensions.width, displayDimensions.height) };
            shader.uniforms.bboxMin = { value: geometry.boundingBox.min };
            shader.uniforms.bboxMax = { value: geometry.boundingBox.max };

            // Uniforms
            shader.vertexShader = 'uniform float time;\nuniform float resolution;\nuniform vec2 bboxMin;\nuniform vec2 bboxMax;\nvarying vec2 vUv;\nvarying vec3 pos;\n' + shader.vertexShader;
            // Vertex Functions
            shader.vertexShader = shader.vertexShader.replace(
                '#include <common>',
                `#include <common>
                ${ shaderCode.vertexFunctions }`
            )
            // Vertex Uniform Definition Code
            shader.vertexShader = shader.vertexShader.replace(
                `#include <begin_vertex>`,
                `#include <begin_vertex>
                vUv.x = (position.x - bboxMin.x) / (bboxMax.x - bboxMin.x);
                vUv.y = (position.y - bboxMin.y) / (bboxMax.y - bboxMin.y);
                pos = vec3(position.x, position.y, position.z);`,
            );
            if (shaderCode.vertex && shaderCode.vertex != '') {
                // Vertex Code
                // Code must include the definition of gl_Position
                shader.vertexShader = shader.vertexShader.replace(
                    `gl_Position = projectionMatrix * mvPosition;`,
                    `${ shaderCode.vertex }`,
                );
            }

            // Uniforms
            shader.fragmentShader = 'uniform float time;\nuniform float resolution;\nvarying vec2 vUv;\nvarying vec3 pos;\n' + shader.fragmentShader;
            // Fragment Functions
            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <packing>',
                `#include <packing>
                ${ shaderCode.fragmentFunctions }`
            )
            if (shaderCode.fragment && shaderCode.fragment != '') {
                // Fragment Code
                // Code must include the definition of gl_FragColor
                shader.fragmentShader = shader.fragmentShader.replace(
                    `gl_FragColor = vec4( packNormalToRGB( normal ), opacity );`,
                    `${ shaderCode.fragment }`,
                );
            }

            console.log(shader);

            material.userData.shader = shader;
        }

        // Make sure WebGLRenderer doesnt reuse a single program
        material.customProgramCacheKey = function () {
            return [
                shaderCode.vertexFunctions,
                shaderCode.vertex,
                shaderCode.fragmentFunctions,
                shaderCode.fragment
            ];
        };

        return material;
    }
});
