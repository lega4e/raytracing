uniform vec2 resolution;
uniform vec3 dir; // Направление камеры. Всегда нормированный
uniform vec3 cam; // Положение камеры в пространестве





// global objects
vec4 white = vec4(1., 1., 1., 1.);
vec4 black = vec4(0., 0., 0., 1.);

vec4 red   = vec4(1., 0., 0., 1.);
vec4 green = vec4(0., 1., 0., 1.);
vec4 blue  = vec4(0., 0., 1., 1.);

vec4 yellow  = vec4(1., 1., 0., 1.);
vec4 purple  = vec4(1., 0., 1., 1.);
vec4 magenta = vec4(0., 1., 1., 1.);

float ALPHA = 0.0001;
float PI = 3.14159265358979323846;
float XFOV = PI / 3.;
float YFOV = PI / 3.;





// functions
vec2 sphere_inters(in vec3 ro, in vec3 rd, in vec3 so, float sr)
{
	vec3 oc = ro - so;
	float b = dot(oc, rd);
	float c = dot(oc, oc) - sr * sr;
	float h = b * b - c;

	if(h < 0.)
		return vec2(-1., 0.);
	h = sqrt(h);
	return vec2(-b - h, -b + h);
}

/*
 * vec3 plain_inters(in ray_t r)
 * {
 *     
 * }
 */

vec4 gradient(in vec2 p, in vec4 c1, in vec4 c2)
{
	vec4 vec = c1 * p.x + c2 * p.y;
	vec.a = 1.;
	return vec;
}

vec4 paint(in vec2 p)
{
	float xangle = XFOV * (p.x - 0.5);
	float yangle = YFOV * (p.y - 0.5);
	
	vec3 rd = vec3(dir.x, 0., dir.z);
	rd += vec3(-dir.z, 0., dir.x) * tan(xangle);
	rd = normalize(rd);
	rd = vec3( rd.x * cos(dir.y+yangle), sin(dir.y+yangle), rd.z * cos(dir.y+yangle) );
	
	/*
	 * vec3 rd = normalize(
	 *     vec3(dir.x,  0., dir.z) +
	 *     vec3(-dir.z, 0., dir.x) * tan(xangle)
	 * );
	 * float cs = cos(dir.y+yangle);
	 * rd = vec3(rd.x*cs, sin(dir.y+yangle), rd.z*cs);
	 */

	vec3 so = vec3(5., 0., 0.);
	float sr = 1.;

	vec2 t = sphere_inters( cam, rd, so, sr );

	if(t.x < 0.)
		return black;
	else
	{
		vec3 p = cam + min(t.x, t.y) * rd;
		float a = dot(p - so, -rd);
		vec4 res = red * (0.05 + a * 0.95);
		res.a = 1.;
		return res;
	}
}

/*
 * Чтобы построить вектор, перпендикулярный
 * данному в опроделённой плоскости, нужно
 * поменять местами координаты исходного вектора
 * в данной плоскости и у одной координаты
 * поменят знак. Например, необходимо
 * построить вектор, перпендикулярный данному
 * в плоскости xz:
 * a = (1, 0.5, 0)
 * b = (0, 0.5, -1) b перпенд. a в xz
 */





// main
void main(void)
{
	vec2 p = vec2(
		gl_FragCoord.x / resolution.x,
		gl_FragCoord.y / resolution.y
	);

	gl_FragColor = paint(p);
}





// end
