include "./base.thrift"

namespace * room
const string a = 'x//12\'\n#xx1""'
const string a2 = "x//12\'\n#xx1
"
const binary typeof= 'keyword\b'
const i32 b = 0x12
const string id = 'id'
const RoomInfo y = {
  id: a
  'expires': 123
  'username': 'user1'
  'password': 'pass'
  'error': {
    'reason': 'error'
  }
}
const map<string, map<string, binary>> mm = {
  "id": {
  "id": typeof,
  'typeof': 'keyword'
  'expires': ''
  'username': 'user1'
  'password': 'pass'
},
  'typeof': {
  "id": typeof,
  'typeof': 'keyword'
  'expires': ''
  'username': 'user1'
  'password': 'pass'
}
}
const list<i32> lc = [1,2,3]
const SList lc2 = ['1','2','3']

const map<string, binary> mc = {
  a: 'typeof'
  "id": typeof,
  'typeof': 'keyword'
  'expires': ''
  'username': 'user1'
  'password': 'pass'
}
const Dic mc2 = {
  "id": a
  'expires': ''
  'username': 'user1'
  'password': 'pass'
}
typedef map<string, binary> null
const null true = {
  "id": typeof,
  'typeof': 'keyword'
  'expires': ''
  'username': 'user1'
  'password': 'pass'
}

const set<i32> sc = [1,2,3]
const SSet sc2 = [1,2]

typedef base.aa aa
/** Unix time in microseconds */
typedef double let
/** Unix time in microseconds */
typedef let Date3
/** Unix time in microseconds */
typedef Date3 Date4
/** typedef map */
typedef map<string,string> Dic 
/** typedef set */
typedef set<E> SSet 
/** typedef array */
typedef list<string> SListtemp
/** typedef array */
typedef SListtemp SList 

const let epoch = 0
/** test enum */
enum E {
  a = 1,
  b = 1;
  c;
}

/**
 rtc room info */
struct RoomInfo {
  /** id of room */
  1: string id =  a
  /** expire time in epoch seconds */
  2: Date4 expires
  /** COTURN username */
  3: required string username
  /** COTURN password */
  4: optional string password 
  5: SList scopes
  6: list<string> scopes2
  7: Dic m
  8: map<string, i32> m2
  9: SSet testSet
  10: set<E> testSet2
  11: RoomNotFoundException error
  12: base.aa aa
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
  map cpp_type "map"<RoomInfo,map<RoomInfo,RoomInfo>> list3()throws ( RoomNotFoundException e2) 
  void remove(1: string id) throws (1: RoomNotFoundException e) 
  oneway void update(1: string id) ;
  bool pppbool(1: bool id)
}
/** rtc room service */
service RoomService2 extends RoomService {
  /** create a new room */
  binary b(binary b)
  Promise c(/** input */Promise c) throws (1: /** why not */ RoomNotFoundException e) 
}