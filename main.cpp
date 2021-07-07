#include <cmath>
#include <math.h>
#include <iostream>

#include <SFML/Graphics.hpp>

#include <nvx/Stopwatch.hpp>


using namespace nvx;
using namespace sf;
using namespace sf::Glsl;
using namespace std;





// types
enum class Plane
{
	xy, xz, yz
};





// global objects
RenderWindow window;
VideoMode vmode = VideoMode(960, 960);
char const *TITLE = "Application";
unsigned int FRAMERATE_LIMIT = 60u;
Shader shader;
RenderTexture rtexture;

constexpr float const XANGLE_SPEED =  M_PI / 1000.f;
constexpr float const YANGLE_SPEED = -M_PI / 1000.f;
constexpr float const CAM_SPEED    = 2.5f;
constexpr float const ALPHA        = 0.00001;





// functions & procedures
template<class Ostream>
inline Ostream &operator<<( Ostream &os, Vec3 const &v )
{
	os << "(" << v.x << ", " << v.y << ", " << v.z << ")";
	return os;
}

Vec3 perp(Vec3 const &v, Plane pl)
{
	switch(pl)
	{
	case Plane::xy:
		return Vec3(-v.y, v.x, v.z);
	case Plane::xz:
		return Vec3(-v.z, v.y, v.x);
	case Plane::yz:
		return Vec3(v.x, -v.z, v.y);
	default:
		throw "perp: unknown Plane";
	}
}

inline Vec3 turn(Vec3 &v, float angle, Plane pl)
{
	return v + perp(v, pl) * tan(angle);
}

Vec3 normalize(Vec3 const &v)
{
	return v / sqrt(v.x*v.x + v.y*v.y + v.z*v.z);
}





// init
void init_window()
{
	window.create(vmode, TITLE, Style::None);
	window.setPosition({0u, 0u});
	window.setFramerateLimit(FRAMERATE_LIMIT);
	window.setMouseCursorVisible(false);
	return;
}

void init_shader()
{
	shader.loadFromFile("shader.frag", Shader::Fragment);
	shader.setUniform("resolution", Glsl::Vec2 {
		(float)vmode.width, (float)vmode.height
	});

	shader.setUniform("cam", Glsl::Vec3{ 0.f, 0.f,  0.f });
	shader.setUniform("dir", Glsl::Vec3{ 1.f, 0.2f, 0.f });
}





// main
int main( int argc, char *argv[] )
{
	float *trmp = new float[9];
	for (float *b = trmp, *e = trmp+9; b != e; ++b)
		*b = 0.f;

	Vec3 cam(0.f, 0.f, 0.f);
	Vec3 dir(0.f, 0.f, 1.f);

	/*
	 * Матрица трансформации
	 */
	priv::Matrix<3, 3> trm(trmp);

	float ydir = 0.f, cx = 0.f;
	bool camchanged = true;
	bool dirchanged = true;

	float dirangle[2]; // x, y
	float camstep[3]; // forward, side

	init_window();
	init_shader();

	RenderStates rstates(&shader);
	RectangleShape rect;
	rect.setSize({(float)vmode.width, (float)vmode.height});

	Event event;
	stopwatch_t watch;
	watch.start();
	double time;
	Mouse::setPosition({(int)vmode.width/2, (int)vmode.height/2});
	Vector2i mp = Mouse::getPosition();
	Vector2i md;
	while(window.isOpen())
	{
		while(window.pollEvent(event))
		{
			switch(event.type)
			{
			case Event::KeyPressed:

				switch(event.key.code)
				{
				case Keyboard::C:
					window.close();
					break;
				default:
					break;
				}
				break;

			default:
				break;
			}

		}



		// key press events
		time = watch.seconds();
		watch.reset().start();
		md = Mouse::getPosition() - mp;
		Mouse::setPosition(mp);

		dirangle[0] = (float)md.y * YANGLE_SPEED;
		dirangle[1] = - (float)md.x * XANGLE_SPEED;
		camstep[0]  = 0.f;
		camstep[1]  = 0.f;
		camstep[2]  = 0.f;

		if(Keyboard::isKeyPressed(Keyboard::W))
			camstep[0] += time * CAM_SPEED;
		if(Keyboard::isKeyPressed(Keyboard::S))
			camstep[0] -= time * CAM_SPEED;
		if(Keyboard::isKeyPressed(Keyboard::A))
			camstep[1] += time * CAM_SPEED;
		if(Keyboard::isKeyPressed(Keyboard::D))
			camstep[1] -= time * CAM_SPEED;
		if(Keyboard::isKeyPressed(Keyboard::Space))
			camstep[2] += time * CAM_SPEED;
		if(Keyboard::isKeyPressed(Keyboard::LShift))
			camstep[2] -= time * CAM_SPEED;

		if(fabs(dirangle[0]) > ALPHA)
			// dir.y = normalize(dir + Vec3(0.f, 1.f, 0.f) * dirangle[0]),
			ydir += dirangle[0],
			ydir = min((float)M_PI/2.f, max(-(float)M_PI/2.f, ydir)),
			dirchanged = true;
		if(fabs(dirangle[1]) > ALPHA)
			dir = normalize(turn(dir, dirangle[1], Plane::xz)),
			dirchanged = true;

		if(fabs(camstep[0]) > ALPHA)
			cam += dir * camstep[0],
			camchanged = true;
		if(fabs(camstep[1]) > ALPHA)
			cam += perp(dir, Plane::xz) * camstep[1],
			camchanged = true;
		if(fabs(camstep[2]) > ALPHA)
			cam += Vec3(0.f, 1.f, 0.f) * camstep[2],
			camchanged = true;





		// set uniform 
		if(camchanged)
			camchanged = false,
			shader.setUniform("cam", cam),
			cout << "cam: " << cam << endl;

		if(dirchanged)
		{
			dirchanged = false;
			dir.y = ydir;

			// z
			trm.array[2] = dir.x;
			trm.array[5] = dir.y;
			trm.array[8] = dir.z;

			// x
			cx = - dir.x / dir.z;
			trm.array[0] = hypot(dir.x, dir.z) / (dir.z - cx*dir.x);
			trm.array[3] = 0.f;
			trm.array[6] = trm.array[0] * cx;

			// y
			trm.array[1] = - (trm.array[3] * trm.array[8] - trm.array[6] * trm.array[3]);
			trm.array[4] = - (trm.array[6] * trm.array[2] - trm.array[0] * trm.array[8]);
			trm.array[7] = - (trm.array[0] * trm.array[5] - trm.array[3] * trm.array[2]);

			shader.setUniform("dir", dir);
			shader.setUniform("trm", trm);
			cout << "dir: " << dir << endl;
			dir.y = 0.f;
		}



		// draw
		window.clear(Color::White);
		window.draw(rect, rstates);
		window.display();
	}

	return 0;
}





// end
