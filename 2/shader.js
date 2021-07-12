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
        attribute vec3 vertPosition;
        attribute vec3 vertColor;

        varying vec3 fragColor;

        uniform mat4 mWorld;
        uniform mat4 mView;
        uniform mat4 mProj;
        
        void main() {
            fragColor = vertColor;
            gl_Position = mProj * mView * mWorld * vec4(vertPosition, 1.0);
        }
        `;

        // In OpenGL, transformations happen in the reverse order of how they're written out.

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
        var vertices = [ // XYZ Pair, then RGB vector3
            // Top
            -1.0, 1.0, -1.0,     0.5, 0.5, 0.5,
            -1.0, 1.0, 1.0,      0.5, 0.5, 0.5,
            1.0, 1.0, 1.0,       0.5, 0.5, 0.5,
            1.0, 1.0, -1.0,      0.5, 0.5, 0.5,

            // Left
            -1.0, 1.0, 1.0,      0.75, 0.25, 0.5,
            -1.0, -1.0, 1.0,     0.75, 0.25, 0.5,
            -1.0, -1.0, -1.0,    0.75, 0.25, 0.5,
            -1.0, 1.0, -1.0,     0.75, 0.25, 0.5,

            // Right
            1.0, 1.0, 1.0,       0.25, 0.25, 0.75,
            1.0, -1.0, 1.0,      0.25, 0.25, 0.75,
            1.0, -1.0, -1.0,     0.25, 0.25, 0.75,
            1.0, 1.0, -1.0,      0.25, 0.25, 0.75,

            // Front
            1.0, 1.0, 1.0,       1.0, 0.0, 0.15,
            1.0, -1.0, 1.0,      1.0, 0.0, 0.15,
            -1.0, -1.0, 1.0,     1.0, 0.0, 0.15,
            -1.0, 1.0, 1.0,      1.0, 0.0, 0.15,

            // Back
            1.0, 1.0, -1.0,      0.0, 1.0, 0.15,
            1.0, -1.0, -1.0,     0.0, 1.0, 0.15,
            -1.0, -1.0, -1.0,    0.0, 1.0, 0.15,
            -1.0, 1.0, -1.0,     0.0, 1.0, 0.15,

            // Bottom
            -1.0, -1.0, -1.0,    0.5, 0.5, 1.0,
            -1.0, -1.0, 1.0,     0.5, 0.5, 1.0,
            1.0, -1.0, 1.0,      0.5, 0.5, 1.0,
            1.0, -1.0, -1.0,     0.5, 0.5, 1.0
        ];

        // Create an index list. An index list allows us to specify which vertices to connect in order to create a triangle.
        var indices = [
            // Top
            0, 1, 2, // First triangle is formed by vertex 0, 1, and 2
            0, 2, 3, // Second triangle is formed by vertex 0, 2, and 3

            // Left
            5, 4, 6,
            6, 4, 7,

            // Right
            8, 9, 10,
            8, 10, 11,

            // Front
            13, 12, 14,
            15, 14, 12,

            // Back
            16, 17, 18,
            16, 18, 19,

            // Bottom
            21, 20, 22,
            22, 20, 23
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

        // Now we create an index buffer to complement the vertex buffer.
        var boxIndexBufferObject = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, boxIndexBufferObject);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

        // For the positiojn attribute, we need to make sure the GPU knows that the 6 numbers we supplied actually represent 3 XY coordinates instead of 6 seperate vertices.
        var positionAttribLocation = gl.getAttribLocation(program, "vertPosition");
        var colorAttribLocation = gl.getAttribLocation(program, "vertColor");

        // Now we describe the layout of the vertex attribute (3 XY coordinates of vector 2 size).
        gl.vertexAttribPointer(
            positionAttribLocation,             // Attribute location
            3,                                  // Number of elements in each attribute/vertex. We use vec2 here.
            gl.FLOAT,                           // Type of elements within attribute
            gl.FALSE,                           // Is the data normalized?
            6 * Float32Array.BYTES_PER_ELEMENT, // Size (in bytes) of an individual vertex. Since we have a vec3 (position) and a vec3 (color), we multiply the size of the 32 bit float by 6.
            0                                   // Offset from the beginning of a single vertex to this attribute.
        );
        // Now we describe the layout of the vertex attribute (3 XY coordinates of vector 2 size).
        gl.vertexAttribPointer(
            colorAttribLocation,                // Attribute location
            3,                                  // Number of elements in each attribute/vertex. We use vec3 for RGB.
            gl.FLOAT,                           // Type of elements within attribute
            gl.FALSE,                           // Is the data normalized?
            6 * Float32Array.BYTES_PER_ELEMENT, // Size (in bytes) of an individual vertex. Since we have a vec3 (position) and a vec3 (color), we multiply the size of the 32 bit float by 6.
            3 * Float32Array.BYTES_PER_ELEMENT  // Offset from the beginning of a single vertex to this attribute. (skip XY position to get to RGB)
        );

        // Enables us to use the position attribute (vertPosition)
        gl.enableVertexAttribArray(positionAttribLocation);
        // Enables us to use the color attribute (vertPosition)
        gl.enableVertexAttribArray(colorAttribLocation);

        // Now we specify which program we want WebGL to use.
        // This prevents errors when specifying uniform matrices.
        gl.useProgram(program);

        // The location for these uniform spaces are stored in the GPU.
        var matWorldUniformLocation = gl.getUniformLocation(program, "mWorld");
        var matViewUniformLocation = gl.getUniformLocation(program, "mView");
        var matProjUniformLocation = gl.getUniformLocation(program, "mProj");

        // Starts the matrices as all zeros
        var worldMatrix = new Float32Array(16);
        var viewMatrix = new Float32Array(16);
        var projMatrix = new Float32Array(16);

        var canvas = document.getElementById("shaderSurface");

        // We now use the gl-matrix library to make something out of these matrices we just created.
        // These matrices are stored within the CPU. 
        //mat4.identity(worldMatrix); // Identity matrices do not change values. They are like a 1 in mathematics.
        //mat4.identity(viewMatrix);
        //mat4.identity(projMatrix);
        glMatrix.mat4.identity(worldMatrix);
        glMatrix.mat4.lookAt(viewMatrix, [0,0,-6], [0,0,0], [0,1,0]); // Makes a camera using the gl-matrix library. viewMatrix will get its values changed.
        glMatrix.mat4.perspective(projMatrix, glMatrix.glMatrix.toRadian(45), canvas.width / canvas.height, 0.1, 1000.0); // For the scene to display anything with our newly configured camera, we must define a perspective.

        // Send the matrix data from the CPU to the GPU
        gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, worldMatrix);
        gl.uniformMatrix4fv(matViewUniformLocation, gl.FALSE, viewMatrix);
        gl.uniformMatrix4fv(matProjUniformLocation, gl.FALSE, projMatrix);

        // Make sure to tell WebGL to perform depth tests. If this is off, WebGL won't display 3d objects in a way that you'd expect.
        gl.enable(gl.DEPTH_TEST);

        // When vertices are not currently visible on screen, we should save WebGL some work by not rendering what is not visible. This is called culling.
        gl.enable(gl.CULL_FACE);
        gl.frontFace(gl.CCW);
        gl.cullFace(gl.BACK);
        
        // In order to acheive a cube that spins on multiple axis, we will multiply two rotation vectors together.
        var xRotationMatrix = new Float32Array(16);
        var yRotationMatrix = new Float32Array(16);

        // Main render loop
        var identityMatrix = new Float32Array(16);
        glMatrix.mat4.identity(identityMatrix);
        var angle = 0;
        var loop = function() {
            angle = performance.now() / 1000 / 6 * 2 * Math.PI; // Performs one full rotation every 6 seconds.
            
            // Define the rotation matrices
            glMatrix.mat4.rotate(
                yRotationMatrix, // Output
                identityMatrix, // Original Matrix
                angle, // Angle
                [0,1,0] // Axis which you want to be rotating (we're rotating around the Y axis)
            );
            glMatrix.mat4.rotate(
                xRotationMatrix, // Output
                identityMatrix, // Original Matrix
                angle / 3, // Angle
                [1,0,0] // Axis which you want to be rotating (we're rotating around the Y axis)
            );
            // Multiply the two rotation matrices together to form the transformation matrix
            glMatrix.mat4.mul(worldMatrix, yRotationMatrix, xRotationMatrix);
            
            // Called to update the matrix each loop.
            gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, worldMatrix);

            // Clear the previous frame
            gl.clearColor(0.8, 0.83, 0.8, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            
            // Draws the cube using index elements.
            gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
            requestAnimationFrame(loop);
        }
        requestAnimationFrame(loop);
    }
});
