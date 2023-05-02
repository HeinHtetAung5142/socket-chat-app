import { useEffect, useRef } from "react";
import EVENTS from "../config/events";
import { useSockets } from "../context/socket.context";
import styles from "../styles/Room.module.css";

function RoomsContainer() {
  const { socket, roomId, rooms } = useSockets();
  const newRoomRef = useRef(null);
  const userList = [];
  const usersData = [
    { userID: "1", username: "u1" },
    { userID: "2", username: "u2" },
    { userID: "3", username: "u3" },
  ];

  socket.on(EVENTS.CLIENT.SHOW_CONNECTED_USERS, (users) => {
    console.log(users);

    users.forEach((user) => {
      user.self = user.userID === socket.id;
      userList.push(user);
    });
  });

  console.log(userList);

  function handleCreateRoom() {
    //get the room name
    const roomName = newRoomRef.current.value || "";

    if (!String(roomName).trim()) return;

    // emit room created event
    socket.emit(EVENTS.CLIENT.CREATE_ROOM, { roomName });

    // set room name input to empty string
    newRoomRef.current.value = "";
  }

  function handleJoinRoom(key) {
    if (key === roomId) return;

    console.log(key);

    socket.emit(EVENTS.CLIENT.JOIN_ROOM, key);
  }

  return (
    <nav className={styles.wrapper}>
      <div className={styles.createRoomWrapper}>
        <input ref={newRoomRef} placeholder="Room name" />
        <button className="cta" onClick={handleCreateRoom}>
          CREATE ROOM
        </button>
      </div>

      <ul className={styles.roomList}>
        {Object.keys(rooms).map((key) => {
          return (
            <div key={key}>
              <button
                disabled={key === roomId}
                title={`Join ${rooms[key].name}`}
                onClick={() => handleJoinRoom(key)}
              >
                {rooms[key].name}
              </button>
            </div>
          );
        })}
      </ul>
      <ul className={styles.roomList}>
        {usersData.map((user) => {
          return (
            <div key={user.userID}>
              <button
                disabled={user.username === roomId}
                title={`Join ${user.username}`}
                onClick={() => handleJoinRoom(user.username)}
              >
                {user.username}
              </button>
            </div>
          );
        })}
      </ul>
    </nav>
  );
}

export default RoomsContainer;
