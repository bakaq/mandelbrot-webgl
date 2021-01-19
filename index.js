// Get canvas
let canvas = document.getElementById("myCanvas");

let renderTime = document.getElementById("render-time");

/* == Control handlers == */

// Resolution
let res = document.querySelector("#resolution");
res.output = res.querySelector(".output");
res.control = res.querySelector(".control");
res.sendButton =  res.querySelector(".send");
res.sendButton.onclick = function() {
	res.output.innerHTML = res.control.value + "x" + res.control.value;
	canvas.height = res.control.value;
	canvas.width = res.control.value;
	if (!rendering){
		render();
	} else {
		needsLastPass = true;
	}
}

// Initial resolution
let initRes = Math.min(canvas.clientHeight, canvas.clientWidth);
canvas.width = initRes;
canvas.height = initRes;
res.control.value = initRes;
res.output.innerHTML = initRes + "x" + initRes;


// Iterations
let itt = document.querySelector("#iterations");
itt.output = itt.querySelector(".output");
itt.control = itt.querySelector(".control");
itt.control.oninput = function() {
	itt.output.innerHTML = itt.control.value;
	if (!rendering){
		render();
	} else {
		needsLastPass = true;
	}
}

// Center
let cent = document.querySelector("#center");
cent.output = cent.querySelector(".output");
cent.real = cent.querySelector(".control.real");
cent.imag = cent.querySelector(".control.imag");
cent.sendButton = cent.querySelector(".send");
cent.sendButton.onclick = function() {
	let sign = cent.imag.value >= 0 ? "+" : "-";
	
	cent.output.innerHTML = cent.real.value + " " + sign + " " + Math.abs(cent.imag.value) + "i";
	if (!rendering){
		render();
	} else {
		needsLastPass = true;
	}
}

// Zoom
let zoom = document.querySelector("#zoom");
zoom.output = zoom.querySelector(".output");
zoom.control = zoom.querySelector(".control");
zoom.control.oninput = function () {
	zoom.output.innerHTML = zoom.control.value;
	if (!rendering){
		render();
	} else {
		needsLastPass = true;
	}
}


// Panning
let fix_x;
let fix_y;
let mouse_x;
let mouse_y;
let panning = false
canvas.onpointerdown = function(e) {
	console.log("Pointer down");
	fix_x = e.offsetX;
	fix_y = e.offsetY;
	panning = true;
}
canvas.onpointermove = function(e) {
	if (panning) {
		if (e.buttons != 1) {
			console.log("Pointer up");
			panning = false;
			return;
		}
		
		mouse_x = e.offsetX;
		mouse_y = e.offsetY;

		let canv_dim = Math.min(canvas.clientHeight, canvas.clientWidth);

		// Update center value
		zoomm = Math.pow(1.2, zoom.control.value - 6);
		
		cent.real.value = Number(cent.real.value) -
			(mouse_x - fix_x)/canv_dim/zoomm;
		cent.imag.value = Number(cent.imag.value) +
			(mouse_y - fix_y)/canv_dim/zoomm;

		// Render and update label
		cent.sendButton.onclick();

		// New pivot
		fix_x = mouse_x;
		fix_y = mouse_y;
	}
}

/* == Rendering == */

let rendering = false;
let needsLastPass = false;


// Get contex
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

	program.u_center = gl.getUniformLocation(program, "u_center");
	program.u_zoom = gl.getUniformLocation(program, "u_zoom");
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


	window.program = program;

	render();
}



function render(lastPass = false) {
	window.rendering = true;

	let t1 = new Date();

	// Get controls
	let center = [cent.real.value, cent.imag.value];
	let zoomm = Math.pow(1.2, zoom.control.value - 6);
	let itts = itt.control.value;

	// TODO: Customizable palettes
	let palette = [
		0.5, 0.5, 0.5, 1,
		0.8, 0.8, 0.8, 1,
	]
	
	// Set up viewport
	gl.viewport(0, 0, canvas.width, canvas.height);

	// Clear canvas
	gl.clearColor(0, 0, 0, 0);
	gl.clear(gl.COLOR_BUFFER_BIT);

	// Set program
	gl.useProgram(program);

	// Set uniforms
	gl.uniform2fv(program.u_center, center);
	gl.uniform1f(program.u_zoom, zoomm);
	gl.uniform2f(program.u_resolution, canvas.width, canvas.height);
	gl.uniform1i(program.u_iterations, itts);
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

	// So that the benchmark works
	
	let pixels = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4);
	gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

	let t2 = new Date();

	let dt = t2.getTime() - t1.getTime();

	renderTime.innerHTML = "Last frame rendered in " + dt + "ms";
	window.rendering = false;

	if (needsLastPass) {
		window.needsLastPass = false;
		render(lastPass = true);
	}
}

setup();
