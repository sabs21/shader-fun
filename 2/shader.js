document.addEventListener("DOMContentLoaded", () => {
    var gl = initializeWebGL();

    initializeShaders(gl);

    function initializeWebGL() {
        console.log("initializing WebGL...");

        var canvas = document.getElementById("shaderSurface");
        var gl = canvas.getContext("webgl");

        if (!gl) {
            canvas.getContext("experimental-webgl");
        }
        if (!gl) {
            var errorText = document.getElementById("errorText");
            errorText.innerHTML = "This browser does not support WebGL.";
            return false;
        }

        console.log("WebGL initialized.");

        return gl;
    }

    function initializeShaders(gl) {
        console.log("Initializing shaders...");
        gl.clearColor(0.8, 0.83, 0.8, 1.0); // Sets the color that we're going to use. Does not paint anything when called.
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // Clears a buffer. This paints the canvas the color specified in clearColor(). This buffer could be something like a color buffer or a depth buffer (z-axis).

        // For vertex shaders, attributes are like parameters to a javascript function, and varying are like outputs of a javascript function.
        // Below is a demonstration of what the vertex shader function in GLSL would look like in JavaScript.
        // function vertexShader(vertPosition, vertColor) {
        //     return {
        //         fragColor: vertColor,
        //         gl_Position: [vertPosition.x, vertPosition.y, 0.0, 1.0];
        //     };
        // }

        // We write the GLSL code as a string below.
        var vertexShaderCode = `precision mediump float;
        attribute vec2 vertPosition;
        attribute vec3 vertColor;

        varying vec3 fragColor;
        
        void main() {
            fragColor = vertColor;
            gl_Position = vec4(vertPosition, 0.0, 1.0);
        }
        `;

        var fragmentShaderCode = `precision mediump float;
        varying vec3 fragColor;
        
        void main() {
            gl_FragColor = vec4(fragColor, 1.0);
        }`;

        // We need WebGL to create new shader objects before anything else.
        var vertexShader = gl.createShader(gl.VERTEX_SHADER);
        var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

        // Now we want to compile the shaders using their respective codes.
        gl.shaderSource(vertexShader, vertexShaderCode);
        gl.shaderSource(fragmentShader, fragmentShaderCode);

        // Compile the vertex shader
        gl.compileShader(vertexShader);
        // Check for errors in shader compilation.
        if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
            console.error("WebGL: Vertex Shader ERROR", gl.getShaderInfoLog(vertexShader));
            return;
        }
        // Compile the fragment shader
        gl.compileShader(fragmentShader);
        // Check for errors in shader compilation.
        if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
            console.error("WebGL: Fragment Shader ERROR", gl.getShaderInfoLog(fragmentShader));
            return;
        }

        console.log("Shaders compiled.");

        // Now we need to create a program using these shaders.
        // A program tells WebGL that these two shaders are what we want to use together.
        var program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        
        // Finally, we now have to link our program (much like linking in C).
        // Rule of thumb: Compile, then link.
        gl.linkProgram(program);
        // Catch any errors that may occur during the link process.
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error("WebGL Linking ERROR", gl.getProgramInfoLog(program));
            return;
        }

        // Catch any additional errors. Only do this in testing the program as it can be expensive.
        gl.validateProgram(program);
        if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
            console.error("WebGL Validating ERROR", gl.getProgramInfoLog(program));
            return;
        }

        console.log("Program linked.");

        // Now we must give the shaders some data.
        // We will give it the position of vertices.
        var vertices = [ // XY Pair, then RGB vector3
            0.0, 0.5,     1.0, 0.0, 0.0,
            -0.5, -0.5,   0.0, 1.0, 0.0,
            0.5, -0.5,    0.0, 0.0, 1.0
        ];

        // Create the buffer that will hold this data.
        var vertexBuffer = gl.createBuffer();

        // Bind the data that we specified to this buffer.
        // An ARRAY_BUFFER is a type of buffer that contains attributes. We are attaching the vertex data that we just specified to ARRAY_BUFFER.
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        // We don't need to specify vertexBuffer in the bufferData call because bufferData uses whatever buffer was last bound (which is the vertexBuffer).
        // Since Javascript's floats are 64 bit and WebGL expects 32, we convert the Javascript floats to WebGL floats.
        // STATIC_DRAW means that we're sending the data from CPU registers to the GPU memory only once. 
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

        // For the positiojn attribute, we need to make sure the GPU knows that the 6 numbers we supplied actually represent 3 XY coordinates instead of 6 seperate vertices.
        var positionAttribLocation = gl.getAttribLocation(program, "vertPosition");
        var colorAttribLocation = gl.getAttribLocation(program, "vertColor");

        // Now we describe the layout of the vertex attribute (3 XY coordinates of vector 2 size).
        gl.vertexAttribPointer(
            positionAttribLocation,             // Attribute location
            2,                                  // Number of elements in each attribute/vertex. We use vec2 here.
            gl.FLOAT,                           // Type of elements within attribute
            gl.FALSE,                           // Is the data normalized?
            5 * Float32Array.BYTES_PER_ELEMENT, // Size (in bytes) of an individual vertex. Since we have a vec2 (position) and a vec3 (color), we multiply the size of the 32 bit float by 5.
            0                                   // Offset from the beginning of a single vertex to this attribute.
        );
        // Now we describe the layout of the vertex attribute (3 XY coordinates of vector 2 size).
        gl.vertexAttribPointer(
            colorAttribLocation,                // Attribute location
            3,                                  // Number of elements in each attribute/vertex. We use vec3 for RGB.
            gl.FLOAT,                           // Type of elements within attribute
            gl.FALSE,                           // Is the data normalized?
            5 * Float32Array.BYTES_PER_ELEMENT, // Size (in bytes) of an individual vertex. Since we have a vec2 (position) and a vec3 (color), we multiply the size of the 32 bit float by 5.
            2 * Float32Array.BYTES_PER_ELEMENT  // Offset from the beginning of a single vertex to this attribute. (skip XY position to get to RGB)
        );

        // Enables us to use the position attribute (vertPosition)
        gl.enableVertexAttribArray(positionAttribLocation);
        // Enables us to use the color attribute (vertPosition)
        gl.enableVertexAttribArray(colorAttribLocation);

        // Main render loop
        // Now we specify which program we want WebGL to use
        gl.useProgram(program);
        // Uses which ever buffer was last bound and the specified program to display to the screen.
        gl.drawArrays(
            gl.TRIANGLES, // We're going to draw triangles.
            0,            // How many vertices we wish to skip.
            3             // How many vertices to draw.
        );
    }
});
