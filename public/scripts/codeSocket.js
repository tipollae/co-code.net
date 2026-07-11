
const leftSide = document.getElementById("leftSide");
const chat = document.getElementById("chat");
let messageTimeout = null;
let isCopying = false;
let localOtherCode = {};

socket.on("existing-token", ()=>{

    const roomCode = String(window.location.href.split("#")[1])
    socket.emit("validate-room-entrance", roomCode)
    
})

socket.on("invalid-token", ()=>{

    alert("invalid token")
    window.location = "../";

})

socket.on("invalid-room-entrance", (givenMessage)=>{

    alert(givenMessage);
    window.location = "../rooms"

})

socket.on('disconnect', ()=>{
    alert("You have been disconnected from the server");
    window.location = "../rooms"
});

socket.on("host-left", ()=>{

    alert("Host has left the room");

})

socket.on("request-code", ()=>{

    if (!currentEditor) return;

    currentCode = currentEditor.state.doc.toString();

    if (!currentEditor || !currentCode) return;
    if (pastCode == currentCode) return;

    let data = {

        socketID: socket.id,
        code: currentCode,

    }

    socket.emit("update-user-code", data)
    pastCode = currentCode;

})

socket.on("update-other-user-code", (givenOtherCode)=>{

    console.log("recieved update")

    Object.keys(givenOtherCode).forEach((socketID)=>{

        localOtherCode[socketID] = givenOtherCode[socketID]
        if (socketID == socket.id) return;

        let panel = document.getElementById(socketID);

        if (!panel) return;

        let panelTab = panel.querySelector(".otherTab");
        let newPanel = document.createElement("div")

        let codeReference = givenOtherCode[socketID].code;
        const lines = codeReference.split("\n");

        lines.forEach(line => {

            let testingLine = line.replace(" ", "");

            if (testingLine.length > 0){
                const div = document.createElement("div");
                div.textContent = line.replace(/ /g, "\u00A0");
                newPanel.appendChild(div);
            }
            else{
                const br = document.createElement("br");
                newPanel.appendChild(br);
            }
        });

        panelTab.innerHTML = "";
        panelTab.appendChild(newPanel);

    })

})

/*
<div class = "otherTabsContainer">

    <div class = "otherTabButtonsContainer">

        <div class = "otherTabButton active">Username1</div>
        <div class = "otherTabButton" style = "margin-left: 20px">Copy 🗋</div>

    </div>

    <div class = "otherTab"></div>
    
</div>
*/

socket.on("other-user-joined", (givenUsername, givenSocketID)=>{

    addOtherUserTab(givenUsername, givenSocketID);
    serverMessage(`${givenUsername} has joined the room :D`)

})

socket.on("server-message", (message)=>{

    serverMessage(message)

})

socket.on("get-room-users", (usersList)=>{

    for (let i = 0; i < usersList.length; i++){
        addOtherUserTab(usersList[i].username, usersList[i].socketID);
    }

})

socket.on("user-left-room", (givenSocketID, givenUsername)=>{

    const element = document.getElementById(givenSocketID);
    element.remove();

})

socket.on("emit-message-to-all", (givenUsername, givenMessage)=>{

    displayChatMessage(givenUsername, givenMessage);

})

function addOtherUserTab(givenUsername, givenSocketID){

    const otherUserTabContainer = document.createElement("div");
    const otherUserTabButtonsContainer = document.createElement("div");
    const usernameTab = document.createElement("div");
    const copyTab = document.createElement("div");
    const otherTab = document.createElement("div");

    otherUserTabContainer.id = givenSocketID;
    usernameTab.textContent = givenUsername;
    copyTab.textContent = "Copy 🗋";
    copyTab.style.marginLeft = "20px";

    otherUserTabContainer.classList.add("otherTabsContainer");
    otherUserTabButtonsContainer.classList.add("otherTabButtonsContainer");
    usernameTab.classList.add("otherTabButton");
    usernameTab.classList.add("active");
    copyTab.classList.add("otherTabButton");
    copyTab.onclick = () => copyThisCode(givenSocketID);
    otherTab.classList.add("otherTab");

    otherUserTabButtonsContainer.appendChild(usernameTab);
    otherUserTabButtonsContainer.appendChild(copyTab);
    otherUserTabContainer.appendChild(otherUserTabButtonsContainer);
    otherUserTabContainer.appendChild(otherTab);
    leftSide.appendChild(otherUserTabContainer);

}

function displayChatMessage(givenUsername, givenMessage){
//#f39422
    
    const messageContainer = document.createElement("div");
    const message = document.createElement("span")
    const username = document.createElement("span");

    username.textContent = `${givenUsername}: `;
    username.style.color = "#f39422";
    message.textContent = givenMessage;

    messageContainer.appendChild(username);
    messageContainer.appendChild(message);

    chat.appendChild(messageContainer);

    const verticalScroll = chat.scrollTop;
    const maxScroll = chat.scrollHeight - chat.clientHeight;

    if (verticalScroll >= maxScroll - 100){

        chat.scrollTop = chat.scrollHeight;

    }


}

function serverMessage(givenMessage){

    const messageContainer = document.createElement("div");
    const message = document.createElement("span")

    message.textContent = `Server: ${givenMessage}`;
    message.style.color = "#1cffd4";

    messageContainer.appendChild(message);

    chat.appendChild(messageContainer);

    const verticalScroll = chat.scrollTop;
    const maxScroll = chat.scrollHeight - chat.clientHeight;

    if (verticalScroll >= maxScroll - 100){

        chat.scrollTop = chat.scrollHeight;

    }

}

async function copyThisCode(givenSocketID){

    if (!localOtherCode[givenSocketID]) return;
    if (isCopying) return

    isCopying = true;

    try {
        await navigator.clipboard.writeText(localOtherCode[givenSocketID].code);
        displayMessage("Code copied", "#00C400")
    } catch (err) {
        displayMessage("Failed to copy code", "red")
    }
    finally {isCopying = false;}

}

function displayMessage(message, color){

    const msgDisplay = document.getElementById("messageDisplay");

    msgDisplay.innerHTML = `<center>${message}</center>`;
    msgDisplay.style.backgroundColor = color;
    msgDisplay.style.display = "block";
    const TIME = 2500;

    if (messageTimeout === null){

        messageTimeout = setTimeout(function(){

            msgDisplay.innerHTML = "";
            msgDisplay.style.display = "none";

        }, TIME)

    }

    else{

        clearTimeout(messageTimeout);
        messageTimeout = null;
        messageTimeout = setTimeout(function(){

            msgDisplay.innerHTML = "";
            msgDisplay.style.display = "none";

        }, TIME);

    }

}
