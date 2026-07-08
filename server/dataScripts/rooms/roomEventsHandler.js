
async function roomEventsHandler(io, socket, serverRoomHandler, serverTokenHandler){

    socket.on("create-room", ()=>{
        const foundToken = serverTokenHandler.getToken(socket.data.token);
        if (!foundToken){
            socket.emit("invalid-token");
            return;
        };

        if (foundToken.createdRooms + 1 > 3){
            socket.emit("failed-creating-room");
            return;
        }

        const newRoomCode = serverRoomHandler.generateRoomCode(4);

        serverRoomHandler.createRoom({
            roomCode: newRoomCode,
            username: socket.data.username,
            token: socket.data.token,
        });
        
        socket.emit("valid-room", newRoomCode);
        serverTokenHandler.addCreatedRoomAmountToToken(socket.data.token);// +1 to token.createdRooms in token handler.
    });

    //event when user is checking room code
    socket.on("join-room", (givenRoomCode)=>{
        const foundToken = serverTokenHandler.getToken(socket.data.token);
        if (!foundToken){
            socket.emit("invalid-token");
            return;
        };

        const status = serverRoomHandler.validateRoom(givenRoomCode, socket.data.token);
        if (!status.success){
            socket.emit("invalid-room", status.message);
            return;
        }

        socket.emit("valid-room", status.fixedRoomCode);
    });

    //event when user is knocking on room
    socket.on("validate-room-entrance", async (givenRoomCode)=>{
        const foundToken = serverTokenHandler.getToken(socket.data.token);
        if (!foundToken){
            socket.emit("invalid-token");
            return;
        };

        const status = serverRoomHandler.validateRoom(givenRoomCode, socket.data.token);
        if (!status.success){
            socket.emit("invalid-room-entrance", status.message);
            return;
        }

        socket.data.roomCode = status.fixedRoomCode;

        socket.join(status.fixedRoomCode);

        serverRoomHandler.createRoomUser({
            roomCode: status.fixedRoomCode,
            socketID: socket.id,
            token: socket.data.token,
            username: socket.data.username
        });

        serverTokenHandler.addRoomToToken(socket.data.token, status.fixedRoomCode);

        socket.to(status.fixedRoomCode).emit("other-user-joined", socket.data.username, socket.id);
        socket.emit("server-message", `Welcome ${socket.data.username}, to room ${socket.data.roomCode} :D`);

        const roomUsers = serverRoomHandler.getRoomUsers(status.fixedRoomCode, socket.data.token);
        socket.emit("get-room-users", roomUsers);

        const isHost = serverRoomHandler.checkIsHost(status.fixedRoomCode, socket.data.token);
        if (isHost) {
            serverRoomHandler.removeFromDeleteRooms(status.fixedRoomCode);
        }

        await wait(3000);

        const foundRoom = serverRoomHandler.getRoom(status.fixedRoomCode);
        if (!foundRoom) return;
        const otherUserCode = serverRoomHandler.getOtherUserCode(status.fixedRoomCode);

        io.to(status.fixedRoomCode).emit(
            "update-other-user-code",
            otherUserCode
        );
    });

    socket.on("send-message", (givenMessage)=>{
        const MESSAGE_AMOUNT_LIMIT = 10;
        const MESSAGE_LENGTH_LIMIT = 800;

        givenMessage = String(givenMessage);

        const foundRoom = serverRoomHandler.getRoom(socket.data.roomCode);
        if (!foundRoom) return;
        const foundRoomUser = serverRoomHandler.getRoomUser(foundRoom.roomCode, socket.data.token);
        if (!socket.data.roomCode) return;
        if (!foundRoomUser) return;
        if (foundRoomUser.messagesSent + 1 > MESSAGE_AMOUNT_LIMIT){
            socket.emit("server-message", "Slow down there! You have been spamming the chat.");
            return;
        }
        if (givenMessage.length > MESSAGE_LENGTH_LIMIT){
            socket.emit("server-message", `
            Message is too long. Your message is ${givenMessage.length}/800 characters too big.
            `);
            return;
        }

        io.to(socket.data.roomCode).emit("emit-message-to-all", socket.data.username, givenMessage);
        foundRoomUser.messagesSent ++;
    })

    socket.on("update-user-code", (givenData)=>{
        const foundRoom = serverRoomHandler.getRoom(socket.data.roomCode);
        if (!foundRoom) return;
        const foundRoomUser = serverRoomHandler.getRoomUser(foundRoom.roomCode, socket.data.token);
        if (!foundRoomUser) return;
        const validCode = validateSentCode(givenData);
        if (!validCode) return;

        serverRoomHandler.updateRoom({
            givenRoomCode: socket.data.roomCode, 
            socketID: socket.id,
            token: socket.data.token,
            givenData: givenData
        })
    })

}

function updateRoomCode(io, serverRoomHandler){

    Object.keys(serverRoomHandler.dirtyRooms).forEach(roomCode =>{

        const dirtyRoom = serverRoomHandler.dirtyRooms[roomCode];
        if (!dirtyRoom) return;
        io.to(roomCode).emit("update-other-user-code", dirtyRoom.dirtyUsers);
        serverRoomHandler.deleteDirtyUsers(roomCode);

    })

    serverRoomHandler.clearAllDirtyRooms();

}

function validateSentCode(givenData){

        if (!givenData || typeof givenData.code !== "string") return false;
        if (givenData.code.length > 10000) return false;
        return true;

}

function wait (waitTime){

    return new Promise(resolve => setTimeout(resolve, waitTime))

}

module.exports = {roomEventsHandler, updateRoomCode};
