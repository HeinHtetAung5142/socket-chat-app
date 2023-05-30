import { createContext, useContext, useEffect, useState } from "react";
import io, { Socket } from "socket.io-client";
import { SOCKET_URL } from "../config/default";
import EVENTS from "../config/events";

interface Context {
  socket: Socket;
  username?: string;
  setUsername: Function;
  messages?: {
    message: string;
    files: Array<{ name: string; size: number; type: string; data: string }>;
    time: string;
    username: string;
    recipient?: any;
  }[];
  setMessages: Function;
  roomId?: string;
  rooms: object;
}

const socket = io(SOCKET_URL);

const SocketContext = createContext<Context>({
  socket,
  setUsername: () => false,
  setMessages: () => false,
  rooms: {},
  messages: [],
});

function SocketsProvider(props: any) {
  const [username, setUsername] = useState("");
  const [roomId, setRoomId] = useState("");
  const [rooms, setRooms] = useState({});
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    window.onfocus = function () {
      document.title = "Chat app";
    };
  }, []);

  socket.on(EVENTS.SERVER.ROOMS, (value) => {
    setRooms(value);
  });

  socket.on(EVENTS.SERVER.JOINED_ROOM, (value) => {
    setRoomId(value);
    setMessages([]);
  });

  useEffect(() => {
    socket.on(
      EVENTS.SERVER.ROOM_MESSAGE,
      ({ message, username, time, files, recipient }) => {
        if (!document.hasFocus()) {
          document.title = "New message...";
        }

        setMessages((messages) => [
          ...messages,
          { message, username, time, files, recipient },
        ]);
      }
    );

    socket.on(
      EVENTS.SERVER.PRIVATE_MESSAGE,
      ({ message, username, time, files, sender }) => {
        if (!document.hasFocus()) {
          document.title = "New message...";
        }

        setMessages((messages) => [
          ...messages,
          { message, username, time, files, recipient: sender },
        ]);
      }
    );
  }, [socket]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        username,
        setUsername,
        rooms,
        roomId,
        messages,
        setMessages,
      }}
      {...props}
    />
  );
}

export const useSockets = () => useContext(SocketContext);

export default SocketsProvider;
