const crypto = require("crypto");
const chars = "abcdefghjklmnpqrstuvwxyz23456789"; // avoids I, O, 0, 1, these characters look too similar.

class roomHandler{

    constructor(){
        this.rooms = {};
        this.dirtyRooms = {};
        this.roomsToDelete = {};

        /*
        
        roomsToDelete[ID] = {
        
            room: roomReference
            counter: 0 
            limit: 15 (seconds)
        
        }
        
        */

    }

    validateRoom(givenRoomCode, givenToken){

        if (typeof givenRoomCode !== "string") {
            return {
                success: false,
                message: "Invalid room code.",
                fixedRoomCode: null,
            };
        }

        givenRoomCode = givenRoomCode.toLowerCase();
        givenRoomCode = givenRoomCode.replaceAll(" ", "");
        const room = this.rooms[givenRoomCode];

        if (!room){
            return{
                success: false,
                message: "Room does not exist.",
                fixedRoomCode: givenRoomCode,
            }
        }


        if (room.users[givenToken]){
            return{
                success: false,
                message: "You are already in this room.",
                fixedRoomCode: givenRoomCode,
            }
        }

        return{
            success: true,
            message: "Valid room.",
            fixedRoomCode: givenRoomCode,
        }

    }

    getRoom(givenRoomCode){

        const room = this.rooms[givenRoomCode];
        if (!room) return false;
        return room;

    }

    generateRoomCode(length){

        let newRoomCode;
        do{
            newRoomCode = "";
            for (let i = 0; i < length; i++) newRoomCode += chars[crypto.randomInt(chars.length)]
        }while(this.rooms[newRoomCode])
        return newRoomCode;

    }

    createRoom(data){

        this.rooms[data.roomCode] = {

            host: data.username,
            hostToken: data.token,
            users: {},
            isDirty: false,
            otherUserCode: {},
            dirtyUsers: {},
            roomCode: data.roomCode,
            
        }


    }

    createRoomUser(data){

        const room = this.getRoom(data.roomCode)
        if (!room) return false;

        room.users[data.token] = {

            socketID: data.socketID,
            username: data.username,
            messagesSent: 0,

        }

    }

    deleteRoomUser(givenRoomCode, givenToken, socketID){

        const room = this.getRoom(givenRoomCode)
        if (!room) return false;

        delete room.dirtyUsers[socketID];
        delete room.otherUserCode[socketID];
        delete room.users[givenToken];

    }

    getRoomUsers(givenRoomCode, givenToken){

        const room = this.getRoom(givenRoomCode)
        if (!room) return false;

        const usersList = [];
        Object.keys(room.users).forEach((userTokenID)=>{

            if (userTokenID == givenToken) return;

            let data = {};
            data.socketID = room.users[userTokenID].socketID;
            data.username = room.users[userTokenID].username;

            usersList.push(data);

        });

        return usersList;

    }

    getRoomUser(givenRoomCode, givenToken){

        const room = this.getRoom(givenRoomCode);
        if (!room) return false;
        return room.users[givenToken];

    }

    getOtherUserCode(givenRoomCode){

        const room = this.getRoom(givenRoomCode);
        if (!room) return;
        return room.otherUserCode;

    }

    checkIsHost(givenRoomCode, givenToken){

        const room = this.getRoom(givenRoomCode)
        if (!room) return false;
        return givenToken === room.hostToken;

    }

    addToDeleteRooms(givenRoomCode){

        const room = this.getRoom(givenRoomCode)
        if (!room) return false;
        this.roomsToDelete[room.roomCode] = {

            counter: 0,
            limit: 30 //seconds

        }

    }

    removeFromDeleteRooms(givenRoomCode){

        const room = this.getRoom(givenRoomCode)
        if (!room) return false;

        const deleteRoom = this.getRoomToDelete(givenRoomCode)
        if (!deleteRoom) return false;

        delete this.roomsToDelete[givenRoomCode];

    }


    getRoomToDelete(givenRoomCode){

        const deleteRoom = this.roomsToDelete[givenRoomCode];
        if (!deleteRoom) return false;
        return deleteRoom;

    }

    deleteRoom(givenRoomCode){

        const room = this.getRoom(givenRoomCode)
        if (!room) return false;

        delete this.rooms[givenRoomCode];

    }

    deleteDirtyRoom(givenRoomCode){

        const room = this.getRoom(givenRoomCode);
        if (!room) return false;

        delete this.dirtyRooms[givenRoomCode];

    }

    clearAllDirtyRooms(){
        this.dirtyRooms = {};
        return true;
    }

    deleteDirtyUsers(givenRoomCode){

        const room = this.getRoom(givenRoomCode);
        if (!room) return false;
        room.dirtyUsers = {};

    }

    updateRoom(data){

        const room = this.getRoom(data.givenRoomCode)
        if (!room) return;

        const roomUser = this.getRoomUser(data.givenRoomCode, data.token);
        if (!roomUser) return;

        this.dirtyRooms[data.givenRoomCode] = room;
        room.otherUserCode[data.socketID] = data.givenData;
        room.dirtyUsers[data.socketID] = data.givenData;

    }

}

module.exports = {roomHandler};