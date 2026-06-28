
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

/*
REPLACED:
const tokens = {};
const usernames = [];
*/
const { tokenHandler } = require("./dataScripts/tokens/tokenHandler");
const serverTokensHandler = new tokenHandler(0.1, 0.5);
const tokenEventsHandler = require("./dataScripts/tokens/tokenEventsHandler");

//REPLACED: const rooms = {};

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
    socket.on("connection-protocol", (givenToken)=>{

        if (tokens[givenToken]){
            socket.emit("existing-token", tokens[givenToken].username)
            socket.data.token = givenToken;
            socket.data.username = tokens[givenToken].username;
            socket.data.roomID = null;
            tokens[givenToken].lastLoggedOn = null;
            if (!tokens[givenToken].sockets.includes(socket.id)) {
                tokens[givenToken].sockets.push(socket.id);
            }
        }

        else{

            socket.emit("invalid-token")

        }

    })
    */

    /*
    REPLACED:
    socket.on("create-user", (username)=>{

        let validUsername = validateUsername(username);

        if (!validUsername[0]){

            socket.emit("invalid-username", validUsername[1]);

        }

        else {
            let createdToken = generateToken(username, socket.id)
            socket.data.token = createdToken;
            socket.data.username = username;
            socket.emit("valid-username", validUsername[1], socket.data.token, socket.data.username);
        }
    })
    */

    socket.on("join-room", (givenRoomCode)=>{

        givenRoomCode = givenRoomCode.toLowerCase();
        givenRoomCode = givenRoomCode.replaceAll(" ", "")
        let existingRoom = rooms[givenRoomCode];

        if (!tokens[socket.data.token]) {
            socket.emit("invalid-token");
            return;
        }

        if (!existingRoom){
            socket.emit("invalid-room", "Room does not exist.");
            return;
        }

        if (existingRoom.users[socket.data.token]){

            socket.emit("invalid-room", "You are already in that room.");
            return;

        }

        socket.emit("valid-room", givenRoomCode)

    })

    socket.on("validate-room-entrance", async (givenRoomCode)=>{

        let loweredRoomCode = givenRoomCode.toLowerCase();

        if (!rooms[loweredRoomCode]){
            socket.emit("invalid-room-entrance", "Room does not exist."); 
            return;
        }

        if (!tokens[socket.data.token]) {
            socket.emit("invalid-token");
            return;
        }

        if (tokens[socket.data.token].rooms.includes(loweredRoomCode)) {
            socket.emit("invalid-room-entrance", "You are already in this room"); 
            return;
        }

        tokens[socket.data.token].rooms.push(loweredRoomCode);

        rooms[loweredRoomCode].users[socket.data.token] = {};
        rooms[loweredRoomCode].users[socket.data.token].socketID = socket.id;
        rooms[loweredRoomCode].users[socket.data.token].username = socket.data.username;
        rooms[loweredRoomCode].users[socket.data.token].messagesSent = 0;

        socket.data.roomID = loweredRoomCode;

        socket.join(loweredRoomCode);
        socket.to(loweredRoomCode).emit("other-user-joined", socket.data.username, socket.id);
        socket.emit("server-message", `Welcome ${socket.data.username}, to room ${socket.data.roomID} :D`)

        let usersList = [];

        Object.keys(rooms[loweredRoomCode].users).forEach((roomUser)=>{

            if (roomUser == socket.data.token) return;

            let data = {};
            data.socketID = rooms[loweredRoomCode].users[roomUser].socketID;
            data.username = rooms[loweredRoomCode].users[roomUser].username;

            usersList.push(data);

        });

        socket.emit("get-room-users", usersList);

        if (socket.data.token == rooms[loweredRoomCode].hostToken){

            clearTimeout(rooms[loweredRoomCode].noHostTimer)
            rooms[loweredRoomCode].noHostTimer = null;

        }

        await wait(2000);

        if (!rooms[loweredRoomCode]) return;

        io.to(loweredRoomCode).emit(
            "update-other-user-code",
            rooms[loweredRoomCode].otherUserCode
        );

    })

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

    socket.on("update-user-code", (givenData)=>{

        if (!rooms[socket.data.roomID]) return;
        if (!rooms[socket.data.roomID].users[socket.data.token]) return;
        if (!givenData || typeof givenData.code !== "string") return;
        if (givenData.code.length > 10000) {console.log("tooo big"); return}

        rooms[socket.data.roomID].isDirty = true;
        rooms[socket.data.roomID].otherUserCode[socket.id] = givenData;
        rooms[socket.data.roomID].dirtyUsers[socket.id] = givenData;

    })

    socket.on("create-room", ()=>{

        if (!tokens[socket.data.token]){
            socket.emit("invalid-token");
            return;
        }

        if (tokens[socket.data.token].createdRooms + 1 > 3){

            socket.emit("failed-creating-room")
            return;

        }
        
        let roomCode = generateRoomCode();

        while (rooms[roomCode]) roomCode = generateRoomCode();

        rooms[roomCode] = {

            host: socket.data.username,
            hostToken: socket.data.token,
            users: {},
            isDirty: false,
            otherUserCode: {},
            dirtyUsers: {},
            noHostTimer: setTimeout(()=>{
                clearRoom(roomCode)
            }, 10000),
            updateCodeRequest: setInterval(()=>{
                io.to(roomCode).emit("request-code")
            }, 1000),
            messageLimitingTimer: setInterval(()=>{

                Object.keys(rooms[roomCode].users).forEach((token)=>{

                    if (!rooms[roomCode].users[token]) return;
                    if (rooms[roomCode].users[token].messagesSent === 0) return;
                    rooms[roomCode].users[token].messagesSent --;

                })

            }, 3300)
        
        }

        tokens[socket.data.token].createdRooms ++

        socket.emit("valid-room", roomCode);        

    })

    /*
    REPLACED:
    socket.on("log-user-out", ()=>{

        if (!tokens[socket.data.token]) return;

        let tokenSockets = [...tokens[socket.data.token].sockets];

        tokens[socket.data.token].manualLogOut = true;

        for (let i = 0; i < tokenSockets.length; i++){

            const foundSocket = io.sockets.sockets.get(tokenSockets[i]);

            if (foundSocket) {
                foundSocket.disconnect(true);
            }

        }

    })*/

    socket.on("disconnect", ()=>{

        /*
        REPLACED:
        if (!tokens[socket.data.token]) return;

        const foundSocketIndex = tokens[socket.data.token].sockets.indexOf(socket.id);

        if (foundSocketIndex !== -1) {
            tokens[socket.data.token].sockets.splice(foundSocketIndex, 1);
        }

        if (tokens[socket.data.token].sockets.length === 0){

            tokens[socket.data.token].lastLoggedOn = Date.now();

        }
            */

        if (socket.data.roomID){

            let socketRoomID = socket.data.roomID;

            if (rooms[socketRoomID]) {

                delete rooms[socketRoomID].users[socket.data.token];
                delete rooms[socketRoomID].otherUserCode[socket.id];
                delete rooms[socketRoomID].dirtyUsers[socket.id];

                let foundRoomIndex = tokens[socket.data.token].rooms.indexOf(socketRoomID);

                if (foundRoomIndex !== -1) {
                    tokens[socket.data.token].rooms.splice(foundRoomIndex, 1);
                }

                io.to(socketRoomID).emit("server-message", `${socket.data.username} has left the room :(`)
                io.to(socketRoomID).emit("user-left-room", socket.id, socket.data.username);

                if (rooms[socketRoomID].hostToken === socket.data.token){

                    rooms[socketRoomID].noHostTimer = setTimeout(() => {

                        if (!rooms[socketRoomID]) return;

                        io.to(socketRoomID).emit("host-left");
                        clearRoom(socketRoomID);

                    }, 10000);

                }

            }

        }

        /*
        REPLACED:
        if (tokens[socket.data.token].manualLogOut && tokens[socket.data.token].sockets.length === 0){

            const usernameIndex = usernames.indexOf(tokens[socket.data.token].username);

            if (usernameIndex !== -1) {
                usernames.splice(usernameIndex, 1);
            }

            delete tokens[socket.data.token];

        }
            */

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

    tokenEventsHandler(io, socket, serverTokensHandler);

})

function extractData(givenSocket){

    if (!givenSocket.data.admin){

        givenSocket.emit("invalid-access");
        return;

    }

    var fakeRooms = {};

    Object.keys(rooms).forEach((roomID)=>{

        fakeRooms[roomID] = {};
        fakeRooms[roomID].users = Object.values(rooms[roomID].users).map(user => ({
            username: user.username,
            socketID: user.socketID,
        }));

    });

    givenSocket.emit("confidential-data", fakeRooms, Object.keys(tokens).length);

}

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

function generateRoomCode(){

    let roomCode = "";

    for (let i = 0; i < 4; i++){

        let chosenCharacter = Math.floor(Math.random()*characters.length);
        roomCode += characters[chosenCharacter];

    }
    return roomCode

}

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


tokensLoop();

async function dirtyRoomsLoop(){

    Object.keys(rooms).forEach((roomID)=>{

        if (!rooms[roomID]) return;
        if (!rooms[roomID].isDirty) return;
        io.to(roomID).emit("update-other-user-code", rooms[roomID].dirtyUsers);

        rooms[roomID].dirtyUsers = {}; //delete all dirtyUsers
        rooms[roomID].isDirty = false;

    })
    
    await wait(1500);
    dirtyRoomsLoop();

}
dirtyRoomsLoop();

function wait (waitTime){

    return new Promise(resolve => setTimeout(resolve, waitTime))

}


setInterval(() => {
    const memory = process.memoryUsage();

    console.log({
        rss: `${(memory.rss / 1024 / 1024).toFixed(2)} MB`,
        heapTotal: `${(memory.heapTotal / 1024 / 1024).toFixed(2)} MB`,
        heapUsed: `${(memory.heapUsed / 1024 / 1024).toFixed(2)} MB`,
        external: `${(memory.external / 1024 / 1024).toFixed(2)} MB`
    });

}, 5000);