namespace * room

/** rtc room info */
struct RoomInfo {
  /** id of room */
  1: string id
  /** expire time in epoch seconds */
  2: double expires
  /** COTURN username */
  3: string username
  /** COTURN password */
  4: optional string password
}

/** rtc room service */
service RoomService {
  /** create a new room */
  RoomInfo create()
  /** find existing room */
  RoomInfo get(1: string id)
  void remove(1: string id)
  oneway void update(1: string id)
  bool pppbool(1: bool id)
}
/** rtc room service */
service RoomService2 extends RoomService {
  /** create a new room */
  binary b(binary b)
}