uniform vec2 resolution; // Разрешение экрана в пикселяx
uniform vec3 dir;        // Направление камеры. Всегда нормированный
uniform vec3 cam;        // Положение камеры в пространестве
uniform mat3 trm;        // Матрица трансформации (поворота)





// global objects
vec4 WHITE        = vec4(1.000, 1.000, 1.000, 1.000);
vec4 BLACK        = vec4(0.000, 0.000, 0.000, 1.000);

vec4 RED          = vec4(0.678, 0.224, 0.224, 1.000);
vec4 LIGHT_RED    = vec4(0.867, 0.325, 0.325, 1.000);
vec4 LLIGHT_RED   = vec4(0.957, 0.412, 0.412, 1.000);
vec4 DARK_RED     = vec4(0.608, 0.106, 0.106, 1.000);
vec4 DDARK_RED    = vec4(0.510, 0.051, 0.051, 1.000);

vec4 GREEN        = vec4(0.259, 0.678, 0.224, 1.000);
vec4 LIGHT_GREEN  = vec4(0.541, 0.867, 0.325, 1.000);
vec4 LLIGHT_GREEN = vec4(0.412, 0.957, 0.486, 1.000);
vec4 DARK_GREEN   = vec4(0.200, 0.608, 0.106, 1.000);
vec4 DDARK_GREEN  = vec4(0.051, 0.510, 0.094, 1.000);

vec4 BLUE         = vec4(0.216, 0.302, 0.702, 1.000);
vec4 LIGHT_BLUE   = vec4(0.325, 0.400, 0.867, 1.000);
vec4 LLIGHT_BLUE  = vec4(0.412, 0.498, 0.957, 1.000);
vec4 DARK_BLUE    = vec4(0.133, 0.106, 0.608, 1.000);
vec4 DDARK_BLUE   = vec4(0.067, 0.051, 0.510, 1.000);

vec4 YELLOW       = vec4(0.745, 0.725, 0.235, 1.000);
vec4 MAGENTA      = vec4(0.224, 0.780, 0.655, 1.000);
vec4 PURPLE       = vec4(0.647, 0.224, 0.780, 1.000);

float ALPHA = 0.0001;
float PI    = 3.14159265358979323846;





/************************* FUNCTIONS ************************/
/*
 * Определяет пересечение луча со сферой.
 * Луч задаётся своим центром ro и направлением rd.
 * Сфера задаётся центром so и радиусом sr.
 *
 * Функция возвращает вектор с параметрами,
 * которые соответствуют уравнению:
 *
 * ro + rd * t = p, где p — точка пересечение
 * луча и поверхности сферы. Если пересечений
 * нет, то возвращается вектор с двумя
 * отрицательными значениями
 */
vec2 sphere_inters(in vec3 ro, in vec3 rd, in vec3 so, float sr)
{
	vec3 oc = ro - so;
	float b = dot(oc, rd);
	float c = dot(oc, oc) - sr * sr;
	float h = b * b - c;

	if(h < 0.)
		return vec2(-1., -1.);
	h = sqrt(h);
	return vec2(-b - h, -b + h);
}

/*
 * Возвращает цвет, полученный смешением цветов
 * c1 и c2 в долях p.x, p.y
 */
vec4 gradient(in vec2 p, in vec4 c1, in vec4 c2)
{
	vec4 vec = c1 * p.x + c2 * p.y;
	vec.a = 1.;
	return vec;
}

/*
 * Вычисляет интенсивность (значение от 0.0 до 1.0)
 * света из точечного источника с центром plso,
 * падающего на точку поверхности p с нормалью n
 *
 * Вектор n должен быть нормализован
 */
float point_light_intensity(
	in vec3 plso, in vec3 p, in vec3 n
)
{
	float i = dot(normalize(plso - p), n);
	return i < 0. ? 0. : i;
}

/*
 * Вычисляет интенсивность (значение от 0.0 до 1.0)
 * направленного света, падающего на поверхность с
 * нормалью n. Направление света задаётся с помощью
 * вектора dlsd
 *
 * Вектора dlsd и n должны быть нормальзованы
 */
float direct_light_intensity(
	in vec3 dlsd, in vec3 n
)
{
	float i = dot(dlsd, n);
	return i < 0. ? 0. : i;
}


/*
 * На вход принимает точку p, содержащую два числа
 * от 0 до 1, которые характеризуют положение
 * обрабатываемой точки на экране
 */
vec4 paint(in vec2 p)
{
	vec3 rd = normalize(vec3( p.x - 0.5, p.y - 0.5, 1. ) * trm);

	// sphere-floor
	vec3 fso  = vec3(0., -1000., 0.);
	float fsr = 999.;

	// sphere-object
	vec3  so = vec3(0., 0., 5.);
	float sr = 0.5;

	// light
	vec3  plso   = vec3(3., 4., 0.); // point light source center
	float plsi   = 0.6;              // point light source intensity
	float amblsi = 0.3;              // ambient light source intensity

	// intersects
	vec2 t     = sphere_inters( cam, rd, so, sr );
	vec2 ft    = sphere_inters( cam, rd, fso, fsr );
	vec4 color = MAGENTA;

	if(ft.x >= 1. && (t.x <= 1. || ft.x <= t.x))
	{
		t = ft;
		color = RED;
	}

	if(t.x <= 1.)
		return BLACK;
	else
	{
		vec3 p   = cam + min(t.x, t.y) * rd;
		vec4 res = color * (
			amblsi +
			point_light_intensity(plso, p, (p - so) / sr) * plsi
		);

		/*
		 * p      — точка пересечения луча и сферы
		 * amblsi — интенсивность безусловного освещения
		 * plso   — положение точечного освещения
		 * plsi   — интенсивность точечного освещения
		 * so     — центр сферы
		 * sr     — радус сферы
		 */

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
 *
 * a = (1, 0.5, 0)
 * b = (0, 0.5, -1) b перпенд. a в xz
 */





/*************************** MAIN ***************************/
void main(void)
{
	vec2 p = vec2(
		gl_FragCoord.x / resolution.x,
		gl_FragCoord.y / resolution.y
	);

	gl_FragColor = paint(p);
}





// end
