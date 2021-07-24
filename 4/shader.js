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

    // Vertex and fragment shader edits
    // Where to find info on the various imports that three.js does: three.js/src/renderers/shaders/ShaderChunk/
    const innerHelixVertexShaderReplacements = [
        {
            from: '#include <common>',
            to: `#include <common>
            uniform float time;
            uniform float resolution;
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
        {
            from: '#include <begin_vertex>',
            to: `#include <begin_vertex>
                float theta = (sin(time*2.0 + position.x) + cos(time*2.0 + position.y)) / 180.0;
                float c = cos( theta );
                float s = sin( theta );
                mat3 m = mat3( c, 0, s, 
                               0, 1, 0, 
                               -s, 0, c );
                transformed = vec3( position ) * m;
                vNormal = vNormal * m;
            `
        }
    ];
    const innerHelixFragmentShaderReplacements = [
        /*{
            from: '#include <common>',
            to: `
            #include <common>
            uniform float time;
            uniform float resolution;
            varying vec2 vUv;
            `
        },*/
        {
            from: '#include <packing>',
            to: `
            #include <packing>
            uniform float time;
            uniform float resolution;
            varying vec2 vUv;
            vec3 hsb2rgb( in vec3 c ){
                vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),
                                         6.0)-3.0)-1.0,
                                         0.0,
                                         1.0 );
                rgb = rgb*rgb*(3.0-2.0*rgb);
                return c.z * mix(vec3(1.0), rgb, c.y);
            }`
        },
        {
            from: 'gl_FragColor = vec4( packNormalToRGB( normal ), opacity );',
            to: 'gl_FragColor = vec4( hsb2rgb( vec3(sin(time+vUv.x) * cos(time+vUv.y), 1.0, 1.0) * packNormalToRGB(normal) ), opacity );'
        }
        /*{
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
        },
        {
            from: 'vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;',
            to: 'vec3 outgoingLight = time * totalDiffuse + totalSpecular + totalEmissiveRadiance;'
        }*/
    ];

    const horseshoeVertexShaderReplacements = [
        {
            from: '#include <common>',
            to: `#include <common>
            uniform float time;
            uniform float resolution;
            uniform vec2 bboxMin;
            uniform vec2 bboxMax;
            varying vec2 vUv;`
        },
        {
            from: '#include <uv_vertex>',
            to: `#include <uv_vertex>
            vUv.x = (position.x - bboxMin.x) / (bboxMax.x - bboxMin.x);
            vUv.y = (position.y - bboxMin.y) / (bboxMax.y - bboxMin.y);`
        }
        /*,
        {
            from: '#include <begin_vertex>',
            to: `#include <begin_vertex>
                float theta = (sin(time*2.0 + position.x) + cos(time*2.0 + position.y));
                float c = cos( theta );
                float s = sin( theta );
                mat3 m = mat3( c, 0, s, 
                               0, 1, 0, 
                               -s, 0, c );
                transformed = vec3( position ) * m;
                vNormal = vNormal * m;
            `
        }*/
    ];
    const horseshoeFragmentShaderReplacements = [
        {
            from: '#include <packing>',
            to: `
            #include <packing>
            uniform float time;
            uniform float resolution;
            varying vec2 vUv;
            vec3 hsb2rgb( in vec3 c ){
                vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),
                                         6.0)-3.0)-1.0,
                                 0.0,
                                 1.0 );
                rgb = rgb*rgb*(3.0-2.0*rgb);
                return c.z * mix(vec3(1.0), rgb, c.y);
            }
            float circle(vec2 st, vec2 center, float size, float blur) {
                float circ = 0.0;
                float dist = distance(st, center);
                if (dist < size) {
                    circ += smoothstep(dist, dist+blur, size);
                }
                return circ;
            }`
        },
        {
            from: 'gl_FragColor = vec4( packNormalToRGB( normal ), opacity );',
            to: `
            //float dotMap = 0.0;
            //dotMap += circle(vUv, vUv, 0.01, 0.001);

            vec3 dot = vec3(circle(vUv, vUv, 0.01, 0.001));
            gl_FragColor = vec4(vec3(dot.x, dot.y, dot.z), opacity );
            `
        }
    ];

    
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
        var innerHelixMaterial = mrDoobWay2({
            red: 0.9, 
            green: 0.2, 
            blue: 0.5
        });//shaderMeshMaterial(new THREE.MeshNormalMaterial(), innerHelixGeometry, innerHelixVertexShaderReplacements, innerHelixFragmentShaderReplacements);
        var innerHelixMesh = new THREE.Mesh(innerHelixGeometry, innerHelixMaterial);
        innerHelix = cloneTransform(innerHelix, innerHelixMesh);
        scene.add(innerHelix);
        //console.log(innerHelix);

        // Turn the horseshoe into a shader.
        horseshoe = object.scene.children[2];
        var horseshoeGeometry = horseshoe.geometry;
        var horseshoeMaterial = mrDoobWay2({
            red: 0.1, 
            green: 1.0, 
            blue: 0.7
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

    // Doesn't work
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
});
