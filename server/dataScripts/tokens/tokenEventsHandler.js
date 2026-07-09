/**
 * Registers all Socket.IO events related to user tokens.
 *
 * This module communicates with clients and delegates
 * token manipulation to the tokenHandler.
 */

async function tokenEventsHandler(io, socket, serverTokenHandler){

    socket.on("connection-protocol", (givenToken)=>{

        const foundToken = serverTokenHandler.getToken(givenToken);
        if (!foundToken){
            socket.emit("invalid-token");
            return;
        }

        socket.emit("existing-token", foundToken.username);

        //socket variables to acccess from all
        socket.data.token = givenToken;
        socket.data.username = foundToken.username;
        socket.data.roomCode = null;

        serverTokenHandler.setTokenActivity(givenToken, null); //removes it from token deletion process
        serverTokenHandler.addSocketToToken(givenToken, socket.id);

    })

    socket.on("create-user", (username)=>{

        const validUsername = validateUsername(username, serverTokenHandler);
        if(!validUsername.success) {
            socket.emit("invalid-username", validUsername.message);
            return;
        }

        const newTokenID = serverTokenHandler.generateTokenID();
        serverTokenHandler.createToken(username, newTokenID, socket.id);
        
        socket.data.token = newTokenID;
        socket.data.username = username;

        socket.emit("valid-username", validUsername.message, socket.data.token, socket.data.username);

    })

    socket.on("log-user-out", ()=>{

        const foundToken = serverTokenHandler.getToken(socket.data.token);
        if (!foundToken) return;
        const tokenSocketsCopy = serverTokenHandler.getSocketsInToken(socket.data.token); //returns COPY of objects of sockets in token
        serverTokenHandler.setTokenLoggedOut(socket.data.token);
        disconnectTokenSockets(io, tokenSocketsCopy);

    });
}

/**
 * Disconnects every socket associated with a token.
 * Used during manual logout.
 * @param {Object} io 
 * @param {string} givenToken 
 * @param {string[]} tokenSockets 
 */

function disconnectTokenSockets(io, tokenSockets){
    Object.keys(tokenSockets).forEach(socketID=>{
        const foundSocket = io.sockets.sockets.get(socketID);
        if (!foundSocket) return;
        foundSocket.disconnect(true);
    })
}

/**
 * 
 * @param {string} username 
 * @param {Object} serverTokenHandler
 * @returns {Object} Username validation results.
 */
function validateUsername(username, serverTokenHandler) {

    const MAX_LENGTH = 12;

    if (typeof username !== "string") {
        return {
            success: false,
            message: "Invalid username."
        };
    }

    if (username.length > MAX_LENGTH) {
        return {
            success: false,
            message: "Invalid, username too long."
        };
    }
    else if (username.length === 0) {
        return {
            success: false,
            message: "Invalid, username too short."
        };
    }
    else if (username.includes(" ")) {
        return {
            success: false,
            message: "Invalid, username includes spaces."
        };
    }
    else if (serverTokenHandler.existingUsername(username)) {
        return {
            success: false,
            message: "Invalid, username is currently in use."
        };
    }
    else {
        return {
            success: true,
            message: "Valid username."
        };
    }

}

module.exports = tokenEventsHandler;
