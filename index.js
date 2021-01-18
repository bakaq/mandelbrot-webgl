/* == Control handlers == */

// Iterations
let itt = document.querySelector("#iterations");
itt.output = itt.querySelector(".output");
itt.control = itt.querySelector(".control");
itt.control.oninput = function() {
	itt.output.innerHTML = this.value;
	render();
}

/* == Rendering == */

// Get canvas and context
let canvas = document.getElementById("myCanvas");
let gl = canvas.getContext("webgl");

if (!gl) {
	alert("Doesn't support WebGL!");
}

async function setup() {
	let vertexShaderSource = await fetch("vertex-shader.vert").then(x => x.text());
	let fragmentShaderSource = await fetch("fragment-shader.frag").then(x => x.text());

	// Make program
	let program = createProgram(gl, vertexShaderSource, fragmentShaderSource);

	// Attributes and uniforms
	program.a_position = gl.getAttribLocation(program, "a_position");
	program.u_resolution = gl.getUniformLocation(program, "u_resolution");
	program.u_iterations = gl.getUniformLocation(program, "u_iterations");
	program.u_palette = gl.getUniformLocation(program, "u_palette");

	window.positionBuffer = gl.createBuffer();

	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

	let positions = [
		-1, -1,
		1, 1,
		-1, 1,
		-1, -1,
		1, -1,
		1, 1,
	]

	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

	// Set up render
	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

	window.program = program;

	render();
}

function render() {
	// Get controls
	let itts = itt.control.value;

	// Clear canvas
	gl.clearColor(0, 0, 0, 0);
	gl.clear(gl.COLOR_BUFFER_BIT);

	// Set program
	gl.useProgram(program);

	// Set uniforms
	gl.uniform2f(program.u_resolution, canvas.width, canvas.height);
	gl.uniform1i(program.u_iterations, itts);
	
	let palette = [
		0.5, 0.5, 0.5, 1,
		0.8, 0.8, 0.8, 1,
	]
	
	gl.uniform4fv(program.u_palette, palette);

	// Set attributes
	gl.enableVertexAttribArray(program.a_position);
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

	let size = 2; 				// 2 components per iteration
	let type = gl.FLOAT;
	let normalize = false;
	let stride = 0;
	let offset = 0;
	gl.vertexAttribPointer(
		program.a_position,
		size, type, normalize, stride, offset);

	// Execute program
	let primitiveType = gl.TRIANGLES;
	offset = 0;
	let count = 2 * 3;

	gl.drawArrays(primitiveType, offset, count);
}

setup();
