// Get slider
let output = document.getElementById("sliderValue");
let slider = document.getElementById("slider");
slider.oninput = function() {
	output.innerHTML = this.value;
	render(this.value);
}

// Get canvas and context
let canvas = document.getElementById("myCanvas");
let gl = canvas.getContext("webgl");

if (!gl) {
	alert("Doesn't support WebGL!");
}

// Shaders
let vertexShaderSource = `
attribute vec2 a_position;

void main() {
	gl_Position = vec4(a_position, 0, 1);
}
`;

let fragmentShaderSource = `
precision highp float;

uniform vec2 u_resolution;
uniform int u_iterations;
uniform vec4 u_palette[2];

vec2 complex_sqr(vec2 z) {
	return vec2(z.x*z.x - z.y*z.y, 2.0*z.x*z.y);
}

vec4 mandelbrot(vec2 c) {
	vec2 z = c;
	vec4 color = vec4(0, 0, 0, 1); // Black
	for (int itt = 0; itt < 10000; itt++) {
		if (length(z) > 2.0) {
			if (mod(float(itt), 2.0) == 0.0) {
				color = u_palette[0];
			} else {
				color = u_palette[1];
			}
			break;
		}
		if (itt >= u_iterations) {
			break;
		}
		z = complex_sqr(z) + c;
	}
	return color;
}

vec4 pixel(vec2 coords) {
	ivec2 samples = ivec2(4, 4);
	vec4 color = vec4(0);

	vec2 pixel_size = vec2(1.0, 1.0)/u_resolution;
	vec2 d = pixel_size/vec2(samples);

	for (int i = 0; i < 100; ++i) {
		if (i >= samples[0]) {
			break;
		}
		for (int j = 0; j < 100; ++j) {
			if (j >= samples[1]) {
				break;
			}
			color += mandelbrot(coords + vec2(float(i)*d[0], float(j)*d[1]));
		}
	}
	
	color = color/float(samples[0] * samples[1]);

	return color;
}

void main() {
	vec2 coords = (gl_FragCoord.xy/u_resolution)*3.0 - vec2(2.0, 1.5);
	gl_FragColor = pixel(coords); 
}
`;

function createShader(gl, type, source) {
	let shader = gl.createShader(type);
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	let success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
	if (success) {
		return shader;
	}

	console.log(gl.getShaderInfoLog(shader));
	gl.deleteShader(shader);
}

let vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
let fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

// Create program
function createProgram(gl, vertexShader, fragmentShader) {
	let program = gl.createProgram();
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.linkProgram(program);
	let success = gl.getProgramParameter(program, gl.LINK_STATUS);
	if (success) {
		return program;
	}

	console.log(gl.getProgramInfoLog(program));
	gl.deleteProgram(program);
}

let program = createProgram(gl, vertexShader, fragmentShader);

// Attribute
let positionAttributeLocation = gl.getAttribLocation(program, "a_position");
let resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
let iterationsUniformLocation = gl.getUniformLocation(program, "u_iterations");
let paletteUniformLocation = gl.getUniformLocation(program, "u_palette");

let positionBuffer = gl.createBuffer();

gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

let positions = [
	-1, -1,
	1, 1,
	-1, 1,
	-1, -1,
	1, -1,
	1, 1,
]

let palette = [
	0.5, 0.5, 0.5, 1,
	0.8, 0.8, 0.8, 1,
]

gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

// Set up render
gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

function render(itts) {
	gl.clearColor(0, 0, 0, 0);
	gl.clear(gl.COLOR_BUFFER_BIT);

	gl.useProgram(program);

	gl.uniform2f(resolutionUniformLocation, canvas.width, canvas.height);
	gl.uniform1i(iterationsUniformLocation, itts);
	gl.uniform4fv(paletteUniformLocation, palette);

	gl.enableVertexAttribArray(positionAttributeLocation);

	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

	let size = 2; 				// 2 components per iteration
	let type = gl.FLOAT;
	let normalize = false;
	let stride = 0;
	let offset = 0;
	gl.vertexAttribPointer(
		positionAttributeLocation,
		size, type, normalize, stride, offset);

	// Execute program
	let primitiveType = gl.TRIANGLES;
	offset = 0;
	let count = 2 * 3;

	gl.drawArrays(primitiveType, offset, count);
}

render(10);
