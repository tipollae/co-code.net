
require("dotenv").config();

//importing express
const express = require("express");
const path = require("path");
const { clearInterval } = require("timers");

//new express instance
const app = express();

//serve static files
app.use((req, res, next) => {
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
    next();
});
app.use(express.static("../public"))
//serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public'));
});

//creates an http server using the created express app
const server = require("http").Server(app);
//attaching socket io to http server
const io = require("socket.io")(server);
const port = 3000;

if (!server.listening){

    server.listen(port, "0.0.0.0", ()=>{

        console.log(`Server has been initiated at http://localhost:${port}`)

    })

}

else console.log("Server has already been initiated")

const characters = [
    "a", "b", "c", "d", "e", "f", "g", "h", "i",
    "j", "k", "l", "m", "n", "o", "p", "q", "r",
    "s", "t", "u", "v", "w", "x", "y", "z", "1",
    "2", "3", "4", "5", "6", "7", "8", "9", "0"
];

const { tokenHandler } = require("./dataScripts/tokens/tokenHandler");
const serverTokenHandler = new tokenHandler(0.1, 0.5);
const tokenEventsHandler = require("./dataScripts/tokens/tokenEventsHandler");

const { roomHandler } = require("./dataScripts/rooms/roomHandler");
const serverRoomHandler = new roomHandler();
const roomEventsHandler = require("./dataScripts/rooms/roomEventsHandler")

/*

tokens[ID] = {

    username: username,
    sockets: [socketID],
    rooms: [],
    lastLoggedOn: null,


}

*

rooms["abcd"] = {

    host: null,
    hostToken: null,
    users: {},
    isDirty: false,
    otherUserCode: {},
    dirtyUsers: {},

}

/*
rooms[ID] = {

    host: username
    hostToken: tokenID
    users: {}
    isDirty: false
    otherUserCode: {}

}

rooms[id].users[tokenID] = {

    socketID: socketid,
    username: username,

}
*/ 

//on connection tasks
io.on("connection", (socket)=>{

    /*
    REPLACED:
    socket.on("send-message", (givenMessage)=>{

        givenMessage = String(givenMessage);

        if (!socket.data.roomID) return;
        if (!rooms[socket.data.roomID].users[socket.data.token]) return;
        if (rooms[socket.data.roomID].users[socket.data.token].messagesSent + 1 > 10){

            socket.emit("server-message", `Slow down there! You have been spamming the chat.`)            
            return;

        }
        if (givenMessage.length > 800){

            socket.emit("server-message", `Message is too long. Your message is ${givenMessage.length}/800 too big.`)            
            return;

        }

        io.to(socket.data.roomID).emit("emit-message-to-all", socket.data.username, givenMessage);
        rooms[socket.data.roomID].users[socket.data.token].messagesSent ++

    });
    */

    /*
    socket.on("update-user-code", (givenData)=>{

        if (!rooms[socket.data.roomID]) return;
        if (!rooms[socket.data.roomID].users[socket.data.token]) return;
        if (!givenData || typeof givenData.code !== "string") return;
        if (givenData.code.length > 10000) {console.log("tooo big"); return}

        rooms[socket.data.roomID].isDirty = true;
        rooms[socket.data.roomID].otherUserCode[socket.id] = givenData;
        rooms[socket.data.roomID].dirtyUsers[socket.id] = givenData;

    })
        */

    socket.on("disconnect", ()=>{

        const foundToken = serverTokenHandler.getToken(socket.data.token)
        if (!foundToken) return;
        console.log(socket.data.roomCode)
        if (socket.data.roomCode){

            const foundRoom = serverRoomHandler.getRoom(socket.data.roomCode);
            if (!foundRoom) return;

            serverRoomHandler.deleteRoomUser(socket.data.roomCode, socket.data.token, socket.id);
            serverRoomHandler.addToDeleteRooms(socket.data.roomCode);

            io.to(foundRoom.roomCode).emit("server-message", `${socket.data.username} has left the room :(`)
            io.to(foundRoom.roomCode).emit("user-left-room", socket.id, socket.data.username);

        }

        serverTokenHandler.removeSocketFromToken(socket.data.token, socket.id);

    })

    socket.on("check-admin", (givenPassword)=>{

        console.log(process.env.ADMIN_PASSWORD)

        if (process.env.ADMIN_PASSWORD !== givenPassword){
            socket.emit("invalid-access");
            return;
        }

        else{

            socket.data.admin = true;
            socket.emit("valid-access")
            extractData(socket);

        }

    })

    socket.on("requesting-admin-data", ()=>{

        if (socket.data.admin){

            extractData(socket);

        }

    })

    tokenEventsHandler(io, socket, serverTokenHandler);
    roomEventsHandler.roomEventsHandler(io, socket, serverRoomHandler, serverTokenHandler)

})

function extractData(givenSocket){

    if (!givenSocket.data.admin){

        givenSocket.emit("invalid-access");
        return;

    }

    var fakeRooms = {};

    Object.keys(serverRoomHandler.rooms).forEach((roomCode)=>{

        fakeRooms[roomCode] = {};
        fakeRooms[roomCode].users = Object.values(serverRoomHandler.rooms[roomCode].users).map(user => ({
            username: user.username,
            socketID: user.socketID,
        }));

    });

    givenSocket.emit("confidential-data", fakeRooms, Object.keys(serverTokenHandler.tokens).length);

}

/*
REPLACED:
function clearRoom(givenRoomID){

    if (!rooms[givenRoomID]) return;

    clearTimeout(rooms[givenRoomID].noHostTimer)
    clearInterval(rooms[givenRoomID].updateCodeRequest);
    clearInterval(rooms[givenRoomID].messageLimitingTimer)
    rooms[givenRoomID].noHostTimer = null;
    rooms[givenRoomID].updateCodeRequest = null;
    rooms[givenRoomID].messageLimitingTimer = null;
    
    const hostToken = rooms[givenRoomID].hostToken;
    if (tokens[hostToken]){

        tokens[hostToken].createdRooms = Math.max(0, tokens[hostToken].createdRooms - 1);

    }

    io.in(givenRoomID).disconnectSockets(true);
    delete rooms[givenRoomID];

}
    */

function roomCleanUp(){

    Object.keys(serverRoomHandler.roomsToDelete).forEach(roomCode=>{

        const foundRoom = serverRoomHandler.getRoom(roomCode);
        if (!foundRoom) return;

        serverRoomHandler.roomsToDelete[roomCode].counter ++;
        if (serverRoomHandler.roomsToDelete[roomCode].counter >= serverRoomHandler.roomsToDelete[roomCode].limit){

            io.in(roomCode).disconnectSockets(true);
            serverRoomHandler.deleteDirtyUsers(roomCode);
            serverRoomHandler.deleteDirtyRoom(roomCode);
            serverRoomHandler.removeFromDeleteRooms(roomCode)
            serverRoomHandler.deleteRoom(roomCode);

            const foundToken = serverTokenHandler.getToken(foundRoom.hostToken);
            if (!foundToken) return;
            serverTokenHandler.subtractCreatedRoomsFromToken(foundRoom.hostToken);

        }

    })

}

function roomMessageRate(){

    Object.keys(serverRoomHandler.rooms).forEach(roomCode=>{
        const foundRoom = serverRoomHandler.getRoom(roomCode);
        if (!foundRoom) return;

        Object.keys(foundRoom.users).forEach(token=>{

            foundRoom.users[token].messagesSent = Math.max(0, foundRoom.users[token].messagesSent - 1);        

        })

    })

}

function emitRoomUserCode(){

    Object.keys(serverRoomHandler.rooms).forEach(roomCode=>{
        const foundRoom = serverRoomHandler.getRoom(roomCode);
        if (!foundRoom) return;
        io.to(roomCode).emit("request-code");
        console.log('update code loop')

    })

}

/*

REPLACED:
function generateToken(username, socketID){

    let createdToken = Math.random().toString(36).substring(2);
    while (tokens[createdToken]) {
        createdToken = Math.random().toString(36).substring(2);
    }

    tokens[createdToken] = {

        username: username,
        sockets: [socketID],
        rooms: [],
        createdRooms: 0,
        lastLoggedOn: null,
        manualLogOut: false,

    }

    usernames.push(username);
    return createdToken;

}
*/
/*
REPLACED:
function validateUsername(username){

    const MAX_LENGTH = 12;

    if (username.length > MAX_LENGTH) return [false, "Invalid, username too long."];
    else if (username.length === 0) return [false, "Invalid, username too short."];
    else if (username.includes(" ")) return [false, "Invalid, username includes spaces."];
    else if (usernames.includes(username)) return [false, "Invalid, username is currently in use"];
    else return [true, "Valid username."];

}
*/

/*
REPLACED:
async function tokensLoop(){

    const hours = 0.5;
    const milisecondConvertion = 3600000;
    const expiryTime = hours * milisecondConvertion; // converting hours to miliseconds
    const currentTime = Date.now();

    const waitTimeHours = 0.13;
    const waitTime = waitTimeHours * milisecondConvertion;

    console.log('loop')

    Object.keys(tokens).forEach(code => {
        if (!tokens[code].lastLoggedOn) return;
        if ((currentTime - tokens[code].lastLoggedOn) >= expiryTime) {
            
            let usernameIndex = usernames.indexOf(tokens[code].username);
            if (usernameIndex !== -1) {
                usernames.splice(usernameIndex, 1);
            }
            delete tokens[code];

            console.log('delete token');

        }
    });

    await wait(waitTime);
    tokensLoop();
    
}
    */

function wait (waitTime){

    return new Promise(resolve => setTimeout(resolve, waitTime))

}

const loopedFunctions = [
{
    task: ()=> roomCleanUp(),
    counter: 0,
    limit: 1
},
{
    task: ()=> serverTokenHandler.checkExpiringTokens(),
    counter: 0,
    limit: 60*10
},
{
    task: ()=> roomEventsHandler.updateRoomCode(io, serverRoomHandler),
    counter: 0,
    limit: 2
},
{
    task: ()=> roomMessageRate(),
    counter: 0,
    limit: 1.5
},
{
    task: ()=> emitRoomUserCode(),
    counter: 0,
    limit: 1
}
]

function loopThroughTasks(){
    for (let i = 0; i < loopedFunctions.length; i++){
        const loopedFunction = loopedFunctions[i];

        loopedFunction.counter+= 0.5;

        if (loopedFunction.counter>=loopedFunction.limit){
            loopedFunction.counter = 0;
            loopedFunction.task();
        }

    }
}

setInterval(()=>{
    loopThroughTasks();
}, 500);

/*
setInterval(() => {
    const memory = process.memoryUsage();

    console.log({
        rss: `${(memory.rss / 1024 / 1024).toFixed(2)} MB`,
        heapTotal: `${(memory.heapTotal / 1024 / 1024).toFixed(2)} MB`,
        heapUsed: `${(memory.heapUsed / 1024 / 1024).toFixed(2)} MB`,
        external: `${(memory.external / 1024 / 1024).toFixed(2)} MB`
    });

}, 5000);*/