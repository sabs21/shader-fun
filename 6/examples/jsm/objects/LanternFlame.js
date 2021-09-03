import {
	Clock,
	Color,
	Mesh,
	ShaderMaterial
} from '../../../three.module.js';
import { DoubleSide } from '../../../src/constants.js';

class LanternFlame extends Mesh {

	constructor( geometry, options = {} ) {

		super( geometry );

		this.type = 'LanternFlame';

		const scope = this;

		const innerColor = options.innerColor ? new Color( options.innerColor ) : new Color( 0xFFD800 ); // Default is a yellow
        const outerColor = options.outerColor ? new Color( options.outerColor ) : new Color( 0xFF5200 ); // Default is an orange
        const shader = options.shader || LanternFlame.FlameShader;

		const clock = new Clock();

		// material
		this.material = new ShaderMaterial( {
			uniforms: shader.uniforms,
			vertexShader: shader.vertexShader,
			fragmentShader: shader.fragmentShader,
			transparent: true,
			side: DoubleSide
		} );

		// uniforms
		this.material.uniforms[ 'time' ].value = clock.getDelta();
		this.material.uniforms[ 'innerColor' ].value = innerColor;
        this.material.uniforms[ 'outerColor' ].value = outerColor;
		
		// functions
		this.onBeforeRender = function ( ) {
			scope.material.uniforms[ 'time' ].value = clock.getElapsedTime();
		};

	}

}

LanternFlame.FlameShader = {

	uniforms: {
		'time': {
			type: 'f',
			value: 0.0
		},
        'innerColor': {
            type: 'c',
            value: null
        },
        'outerColor': {
            type: 'c',
            value: null
        }
	},

	vertexShader: /* glsl */`
        #include <common>
        #include <fog_pars_vertex>
        #include <logdepthbuf_pars_vertex>

        varying vec2 vUv;

        void main()
        {
            vUv = uv;
        
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0 );
            gl_Position = projectionMatrix * mvPosition;
        }
    `,

	fragmentShader: /* glsl */`
        #include <common>
        #include <fog_pars_fragment>
        #include <logdepthbuf_pars_fragment>

        uniform float time;
		uniform vec3 innerColor;
        uniform vec3 outerColor;

        varying vec2 vUv;

        // integer hash copied from Hugo Elias
		float hash( uint n ) {   
            n = (n<<13U)^n; 
            n = n*(n*n*15731U+789221U)+1376312589U;
            return float(n&uvec3(0x0fffffffU))/float(0x0fffffff);
        }

        // Traditional gradient noise
        float gnoise( in float p ) {
            uint  i = uint(floor(p));
            float f = fract(p);
            float u = f*f*(3.0-2.0*f);

            float g0 = hash(i+0u)*2.0-1.0;
            float g1 = hash(i+1u)*2.0-1.0;
            return 2.4*mix( g0*(f-0.0), g1*(f-1.0), u);
        }

        void main()
        {
            // Normalized pixel coordinates (from -0.5 to 0.5 on y axis)
            vec2 uv = -1.0 + 2.0 * vUv;
            //uv /= iResolution.y;
            
            vec3 yellow = vec3(1.0, 0.85, 0.0);
            vec3 orange = vec3(1.0, 0.4, 0.0);
            
            float aspect = 0.310;
            float value = sqrt(0.1 - pow(uv.x*aspect, 2.0)) - 0.25;
            value += gnoise(uv.x/1.5+(time/3.0))/6.0;
            value += gnoise(uv.x/1.5+time)/4.0;
            float distFromValue = distance(uv.y, value);
            vec3 color = mix(orange, yellow, clamp((distFromValue-0.1)*2.0, 0.0, 1.0)); // subtract 0.1 from distance to let a band of constant orange exist.
            
            if (uv.y > value) {
                gl_FragColor = vec4(color, 0.0);
            }
            else {
                //color *= vec3(clamp(distFromValue*32.0, 0.0, 1.0));
                gl_FragColor = vec4(color, clamp(distFromValue*32.0, 0.0, 1.0));
            }
        }
        `
};

LanternFlame.prototype.isFlame = true;

export { LanternFlame };