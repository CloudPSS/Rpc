namespace * room
const string a = 'x//12#xx1'

const RoomInfo y = {
  "id": a
  'expires': 123
  'username': 'user1'
  'password': 'pass'
}

/** Unix time in microseconds */
typedef double Date2

/** test enum */
enum E {
  a = 1
  b = 2;
  c
}

/**
 rtc room info */
struct RoomInfo {
  /** id of room */
  1: string id =  a
  /** expire time in epoch seconds */
  2: Date2 expires
  /** COTURN username */
  3: required string username
  /** COTURN password */
  4: optional string password 
  5: set<E> scopes
  6: RoomNotFoundException error
}

/** *1
 */
exception RoomNotFoundException {
  1: string reason
}

typedef RoomInfo RoomInfo2
/** TestUnion
 */
union Promise {
  /**r*/
1: string value
  /**e*/
2: RoomNotFoundException error
}

/** rtc room service */
service RoomService {
  /** create a new room */
  RoomInfo create()
  /** find existing room */
  RoomInfo get(1: string id)
  /** find existing room */
  list<RoomInfo> lists()
  /** find existing room */
  set<RoomInfo> list2()
  /** find existing room */
  map cpp_type "map"<RoomInfo,map<RoomInfo,RoomInfo>> list3()
  void remove(1: string id) throws (1: RoomNotFoundException e) 
  oneway void update(1: string id)
  bool pppbool(1: bool id)
}
/** rtc room service */
service RoomService2 extends RoomService {
  /** create a new room */
  binary b(binary b)
}