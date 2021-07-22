# Thrift module: room

| Module | Services & Functions                             | Data types                   | Constants |
| ------ | ------------------------------------------------ | ---------------------------- | --------- |
| room   | [RoomService](#service-roomservice)              | [RoomInfo](#struct-roominfo) |           |
|        | [ &bull; create](#function-roomservicecreate)    |                              |           |
|        | [ &bull; get](#function-roomserviceget)          |                              |           |
|        | [ &bull; remove](#function-roomserviceremove)    |                              |           |
|        | [ &bull; update](#function-roomserviceupdate)    |                              |           |
|        | [RoomService2](#service-roomservice2)            |                              |           |
|        | [ &bull; create2](#function-roomservice2create2) |                              |           |

---

## Data structures

### Struct: RoomInfo

rtc room info

| Key | Field    | Type     | Description                  | Requiredness | Default value |
| --- | -------- | -------- | ---------------------------- | ------------ | ------------- |
| 1   | id       | `string` | id of room                   | default      |               |
| 2   | expires  | `double` | expire time in epoch seconds | default      |               |
| 3   | username | `string` | COTURN username              | default      |               |
| 4   | password | `string` | COTURN password              | optional     |               |

---

## Services

### Service: RoomService

rtc room service

#### Function: RoomService.create

create a new room

[`RoomInfo`](#struct-roominfo)
_create_()

#### Function: RoomService.get

find existing room

[`RoomInfo`](#struct-roominfo)
_get_(`string` id)

#### Function: RoomService.remove

`void`
_remove_(`string` id)

#### Function: RoomService.update

`void`
_update_(`string` id)

### Service: RoomService2

**extends ** _[`RoomService`](#service-roomservice)_
rtc room service

#### Function: RoomService2.create2

create a new room

[`RoomInfo`](#struct-roominfo)
_create2_()
