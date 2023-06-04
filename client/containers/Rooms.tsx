import { useEffect, useState, useRef } from "react";
import EVENTS from "../config/events";
import { useSockets } from "../context/socket.context";
import styles from "../styles/Room.module.css";

function RoomsContainer({ setSelectedUser }) {
  const { socket, roomId, rooms } = useSockets();
  const newRoomRef = useRef(null);
  const [usersData, setUsersData] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Update usersData state with the list of connected users
    function updateConnectedUsers(usersList) {
      const usersArr = [];
      usersList.forEach((user) => {
        // skip current user, push the rest to usersArr
        if (user.userID !== socket.id) {
          usersArr.push(user);
        } else {
          setCurrentUser(user);
        }
      });
      setUsersData(usersArr);
    }

    // Update usersData state when a new user is connected
    function handleUserConnect(user) {
      if (user.userID !== socket.id) {
        setUsersData((prevUsersData) => [...prevUsersData, user]);
      }
    }

    // Update usersData state when a user is disconnected
    function handleUserDisconnect(userID) {
      setUsersData((prevUsersData) =>
        prevUsersData.filter((user) => user.userID !== userID)
      );
    }

    function handleRoomMessage(data: any) {
      console.log("Room message received", data);
    }

    function handlePrivateMessage(data: any) {
      console.log("Private message received", data);
    }

    socket.on(EVENTS.SERVER.ROOM_MESSAGE, handleRoomMessage);
    socket.on(EVENTS.SERVER.PRIVATE_MESSAGE, handlePrivateMessage);

    // Listen for changes in the socket connection
    socket.on(EVENTS.SERVER.CONNECTED_USERS, updateConnectedUsers);
    socket.on("user connected", handleUserConnect);
    socket.on("user disconnected", handleUserDisconnect);

    // Remove the event listeners when the component unmounts
    return () => {
      socket.off(EVENTS.SERVER.CONNECTED_USERS, updateConnectedUsers);
      socket.off(EVENTS.SERVER.ROOM_MESSAGE, handleRoomMessage);
      socket.off(EVENTS.SERVER.PRIVATE_MESSAGE, handlePrivateMessage);
      socket.off("user connected", handleUserConnect);
      socket.off("user disconnected", handleUserDisconnect);
    };
  }, [socket]);

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

  function handleJoinPrivateRoom(user: any) {
    setSelectedUser(user);
    if (user.userID === roomId || user.userID === socket.id) return;
    const userIDS = [socket.id, user.userID].sort();
    const roomID = `${userIDS[0]}-${userIDS[1]}`;

    // create private room
    rooms[roomID] = { name: user.username };

    // emit join room event for the selected user
    socket.emit(EVENTS.CLIENT.JOIN_ROOM, roomID);
  }

  return (
    <nav className={styles.wrapper}>
      <div className={styles.createRoomWrapper}>
        {currentUser?.username}: {socket.id}
      </div>
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
        {usersData &&
          usersData.map((user) => {
            for (const key in rooms) {
              if (rooms[key].name === user.username) {
                return null;
              }
            }
            return (
              <div key={user.userID}>
                <button
                  disabled={user.userID === roomId}
                  title={`Join ${user.username}`}
                  onClick={() => handleJoinPrivateRoom(user)}
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
