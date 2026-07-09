/**
 * Manages token state for connected users.
 *
 * Responsibilities:
 * - Create and delete tokens.
 * - Track sockets associated with each token.
 * - Manage token expiry.
 * - Validate usernames.
 *
 * This class is data-only and does NOT emit Socket.IO events.
 */

const crypto = require("crypto");
const milisecondConvertion = 3600000;

class tokenHandler{

    constructor (tokensLoopInterval, tokenExpiryTime){
        this.tokens = {};
        this.usernames = {};

        this.tokenExpiryTime = tokenExpiryTime; //hours
    }

    /**
     *
     * @param {string} givenToken 
     * @returns {Object|undefined}
     */
    getToken(givenToken) {
        return this.tokens[givenToken];
    }

    /**
     * 
     * @param {string} username 
     * @returns {boolean}
     */
    existingUsername(username){
        return !!this.usernames[username];
    }

    /**
     * 
     * @param {string} givenToken 
     * @param {string} socketID 
     */
    addSocketToToken(givenToken, socketID){

        const token = this.getToken(givenToken);
        if (!token) return;

        if (!token.sockets[socketID]) {
            token.sockets[socketID] = true;
        }
    }

    /**
     * 
     * @param {string} givenToken 
     * @param {null|number} value 
     */
    setTokenActivity(givenToken, value){
        const token = this.getToken(givenToken);
        if (!token) return;
        token.lastLoggedOn = value;
    }

    /**
     * Marks a token as manually logged out.
     * @param {string} givenToken 
     */
    setTokenLoggedOut(givenToken){
        const token = this.getToken(givenToken);
        if (!token) return;
        token.manualLogOut = true;
    }

    /**
     * 
     * @param {string} username 
     * @param {string} newTokenID 
     * @param {string} socketID 
     */
    createToken(username, newTokenID, socketID){

        this.tokens[newTokenID] = {
            username: username,
            sockets: { [socketID]:true },
            createdRooms: 0,
            lastLoggedOn: null,
            manualLogOut: false,
        }
        
        this.usernames[username] = true;

    }

    /**
     * Returns a copy of active socket IDs in a token.
     * @param {string} givenToken 
     * @returns {Object} sockets
     */
    getSocketsInToken(givenToken){
        const token = this.getToken(givenToken);
        if (!token) return {};
        return { ...token.sockets };
    }

    /**
     * Removes specfic socket from token database.
     * The token object and username object is 
     * deleted if detected logout from user input.
     * @param {string} givenToken 
     * @param {string} socketID 
     */
    removeSocketFromToken(givenToken, socketID){
        const token = this.getToken(givenToken);
        if (!token) return;
        const foundSocket = token.sockets[socketID];
        if (!foundSocket) return;
        delete token.sockets[socketID];

        if (token.manualLogOut && Object.keys(token.sockets).length === 0){
            delete this.usernames[token.username];
            delete this.tokens[givenToken];
            return;
        }

        if (Object.keys(token.sockets).length === 0){
            token.lastLoggedOn = Date.now();
        }
    }

    generateTokenID(){
        let newTokenID;
        do{
            newTokenID = crypto.randomBytes(14).toString("base64url");
        }while(this.tokens[newTokenID])
        return newTokenID;
    }

    checkExpiringTokens(){

        const expiryTime = this.tokenExpiryTime * milisecondConvertion; // converting hours to miliseconds
        const currentTime = Date.now();

        Object.keys(this.tokens).forEach(tokenID => {
            const token = this.tokens[tokenID];
            if (!token.lastLoggedOn) return;
            const tokenLifespan = currentTime - token.lastLoggedOn;
            if (tokenLifespan >= expiryTime) {

                delete this.usernames[token.username];
                delete this.tokens[tokenID];
            }
        });

    }

    /*Room related*/
    addCreatedRoomAmountToToken(givenToken){

        const token = this.tokens[givenToken];
        if (!token) return;
        token.createdRooms ++;

    }

    subtractCreatedRoomsFromToken(givenToken){

        const token = this.tokens[givenToken];
        if (!token) return;
        token.createdRooms = Math.max(0, token.createdRooms - 1);        

    }
}

module.exports = {tokenHandler}