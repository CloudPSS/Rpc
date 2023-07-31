
typedef list<aa> xx;
struct aa{
  1: byte a;
}

union bb {
  1: xx a;
  2: i8 b;
}

exception cc{}

const i8 a = 12
const sm x = {a:1}
const bb b = {a: [{a:1}, {a:2}, {a:3}]}

typedef map<i8, string> sm