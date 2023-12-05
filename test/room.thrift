
/** Unix time in microseconds */
typedef double Date
/**
 rtc room info */
struct RoomInfo {
  /** id of room */
  1: string id
  /** expire time in epoch seconds */
  2: Date expires
  /** COTURN username */
  3: required string username
  /** COTURN password */
  4: optional string password 
}

exception RoomNotFoundException {
  1: string reason
}
/** rtc room service */
service RoomService {
  /** create a new room */
  RoomInfo create()
  /** find existing room */
  RoomInfo get(1: string id)
  /** find existing room */
  list<RoomInfo> lists()
  bool pppbool(1: bool id)
}