/**
 * Registers all Socket.IO events related to user tokens.
 *
 * This module communicates with clients and delegates
 * token manipulation to tokenHandler.
 */

async function tokenEventsHandler(io, socket, serverTokensHandler){

    socket.on("connection-protocol", (givenToken)=>{

        const foundToken = serverTokensHandler.getToken(givenToken);
        if (!foundToken){
            socket.emit("invalid-token");
            return;
        }

        socket.emit("existing-token", foundToken.username);
        socket.data.token = givenToken;
        socket.data.username = foundToken.username;
        socket.data.roomID = null; //move to room handler later
        serverTokensHandler.setTokenActivity(givenToken, null); //removes it from token deletion process
        serverTokensHandler.addSocketToToken(givenToken, socket.id);

    })

    socket.on("create-user", (username)=>{

        const validUsername = validateUsername(username, serverTokensHandler);
        if(!validUsername.success) {
            socket.emit("invalid-username", validUsername.message);
            return;
        }

        const newTokenID = serverTokensHandler.generateTokenID();
        serverTokensHandler.createToken(username, newTokenID, socket.id);
        
        socket.data.token = newTokenID;
        socket.data.username = username;

        socket.emit("valid-username", validUsername.message, socket.data.token, socket.data.username);

    })

    socket.on("log-user-out", ()=>{

        const foundToken = serverTokensHandler.getToken(socket.data.token);
        if (!foundToken) return;
        const tokenSocketsCopy = serverTokensHandler.getSocketsInToken(socket.data.token); //returns COPY of list of sockets in token
        serverTokensHandler.setTokenLoggedOut(socket.data.token);
        disconnectTokenSockets(io, socket.data.token, tokenSocketsCopy);

    })

    socket.on("disconnect", ()=>{

        const foundToken = serverTokensHandler.getToken(socket.data.token)
        if (!foundToken) return;
        serverTokensHandler.removeSocketFromToken(socket.data.token, socket.id);

    })
}

/**
 * Disconnects every socket associated with a token.
 * Used during manual logout.
 * @param {Object} io 
 * @param {string} givenToken 
 * @param {string[]} tokenSockets 
 */

function disconnectTokenSockets(io, givenToken, tokenSockets){

    for (let i = 0; i < tokenSockets.length; i++){
        const foundSocket = io.sockets.sockets.get(tokenSockets[i]);
        if (!foundSocket) continue;
        foundSocket.disconnect(true);
    }

}

/**
 * 
 * @param {string} username 
 * @param {Object} serverTokensHandler 
 * @returns {Object} Username validation results.
 */
function validateUsername(username, serverTokensHandler) {

    const MAX_LENGTH = 12;

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
    else if (serverTokensHandler.existingUsername(username)) {
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
