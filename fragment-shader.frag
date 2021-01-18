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
