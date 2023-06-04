const { io } = require("socket.io-client");
const { getRandomMessage } = require("./function.js");

const URL = process.env.URL || "http://localhost:4000";
const MAX_CLIENTS = 25;
const CLIENT_CREATION_INTERVAL_IN_MS = 100;
const EMIT_INTERVAL_IN_MS = 10000;
const ROOM_INTERVAL = [0, 5, 15]

let clientCount = 0;
let disconnectedClient = 0;
let roomIndex = 0;
let messagesSent = 0;
let roomName = '';
let roomsObj;
let currRoom;


const createClient = () => {
    const socket = io(URL);

    socket.auth = { username: `user - ${clientCount + 1}` }
    socket.connect();

    if (clientCount === ROOM_INTERVAL[roomIndex]) {
        roomName = `Room ${roomIndex + 1}`
        socket.emit("CREATE_ROOM", { roomName });
        if (roomIndex < ROOM_INTERVAL.length) {
            roomIndex++;
        }

    } else {
        Object.keys(roomsObj).map((key) => {
            if (roomName === roomsObj[key].name) {
                currRoom = key;
                socket.emit("JOIN_ROOM", key);
            }
        })
    }

    socket.on("ROOMS", (rooms) => {
        roomsObj = rooms
    })

    setInterval(() => {
        socket.emit("SEND_ROOM_MESSAGE", { roomId: currRoom, message: getRandomMessage(), username: `user`, file: null });
        messagesSent++;
    }, EMIT_INTERVAL_IN_MS);

    socket.on("disconnect", (reason) => {
        console.log(`disconnect due to ${reason}`);
    });

    if (++clientCount < MAX_CLIENTS) {
        setTimeout(createClient, CLIENT_CREATION_INTERVAL_IN_MS);
    }
};

createClient();


const printReport = () => {
    console.log(
        `client count: ${clientCount} ; Rooms: ${roomIndex + 1}; disconnected: ${disconnectedClient}; messagesSent: ${messagesSent}`
    );
};

setInterval(printReport, 5000);