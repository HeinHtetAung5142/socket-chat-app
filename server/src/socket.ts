import { nanoid } from "nanoid";
import { Server, Socket } from "socket.io";
import logger from "./utils/logger";

interface CustomSocket extends Socket {
  username?: string;
}

const EVENTS = {
  connection: "connection",
  CLIENT: {
    CREATE_ROOM: "CREATE_ROOM",
    SEND_ROOM_MESSAGE: "SEND_ROOM_MESSAGE",
    JOIN_ROOM: "JOIN_ROOM",
    SEND_PRIVATE_MESSAGE: "SEND_PRIVATE_MESSAGE",
  },
  SERVER: {
    ROOMS: "ROOMS",
    JOINED_ROOM: "JOINED_ROOM",
    ROOM_MESSAGE: "ROOM_MESSAGE",
    PRIVATE_MESSAGE: "PRIVATE_MESSAGE",
    CONNECTED_USERS: "CONNECTED_USERS",
  },
};

const rooms: Record<string, { name: string }> = {};

function socket({ io }: { io: Server }) {
  logger.info(`Sockets enabled`);

  io.use((socket: CustomSocket, next) => {
    const username = socket.handshake.auth.username;

    if (!username) {
      return next(new Error("invalid username"));
    }
    socket.username = username;
    next();
  });

  io.on(EVENTS.connection, (socket: CustomSocket) => {
    logger.info(`User connected ${socket.id}`);
    logger.info(`User connected ${socket.username}`);

    const usersList = [];
    for (let [id, socket] of io.of("/").sockets) {
      usersList.push({
        userID: id,
        username: (socket as CustomSocket).username,
      });
    }

    socket.emit(EVENTS.SERVER.CONNECTED_USERS, usersList);
    socket.emit(EVENTS.SERVER.ROOMS, rooms);
    socket.broadcast.emit("user connected", {
      userID: socket.id,
      username: socket.username,
    });

    /*
     * When a user creates a new room
     */
    socket.on(EVENTS.CLIENT.CREATE_ROOM, ({ roomName }) => {
      // create a roomId
      const roomId = nanoid();
      // add a new room to the rooms object
      rooms[roomId] = {
        name: roomName,
      };

      console.log(roomId);
      socket.join(roomId);

      // broadcast an event saying there is a new room
      socket.broadcast.emit(EVENTS.SERVER.ROOMS, rooms);

      // emit back to the room creator with all the rooms
      socket.emit(EVENTS.SERVER.ROOMS, rooms);
      // emit event back the room creator saying they have joined a room
      socket.emit(EVENTS.SERVER.JOINED_ROOM, roomId);
    });

    /*
     * When a user sends a room message
     */

    socket.on(
      EVENTS.CLIENT.SEND_ROOM_MESSAGE,
      ({ roomId, message, username, files }) => {
        const date = new Date();

        socket.to(roomId).emit(EVENTS.SERVER.ROOM_MESSAGE, {
          message,
          username,
          time: `${date.getHours()}:${date.getMinutes()}`,
          files,
        });
      }
    );

    /*
     * When a user sends a private message
     */
    socket.on(
      EVENTS.CLIENT.SEND_PRIVATE_MESSAGE,
      ({ message, to, files, username }) => {
        const date = new Date();
        console.log({ message, to, files, username });
        socket.to(to).emit(EVENTS.SERVER.PRIVATE_MESSAGE, {
          message,
          from: socket.id,
          time: `${date.getHours()}:${date.getMinutes()}`,
          files,
        });
      }
    );

    /*
     * When a user joins a room
     */
    socket.on(EVENTS.CLIENT.JOIN_ROOM, (roomId) => {
      socket.join(roomId);

      socket.emit(EVENTS.SERVER.JOINED_ROOM, roomId);
    });

    socket.on("client to server event", () => {
      socket.emit("server to client event");
    });
  });
}

export default socket;
