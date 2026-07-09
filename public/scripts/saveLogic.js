let saveLoop = null;

const roomCode = String(window.location.href.split("#")[1]);
const ROOM_DATA_EXPIRY = 1000 * 60 * 3;

let localRoomsData = JSON.parse(localStorage.getItem("localRoomsData") || "{}");

Object.keys(localRoomsData).forEach(loopedRoomCode => {

    if (!localRoomsData[loopedRoomCode].lastSaved) {
        delete localRoomsData[loopedRoomCode];
        return;
    }

    if (Date.now() - localRoomsData[loopedRoomCode].lastSaved >= ROOM_DATA_EXPIRY) {
        delete localRoomsData[loopedRoomCode];
    }
});

localStorage.setItem("localRoomsData", JSON.stringify(localRoomsData));

function saveRoomCode() {
    const editor1 = window.editorView1;
    const editor2 = window.editorView2;

    if (!editor1 || !editor2) return;

    localRoomsData[roomCode] = {
        tab1: {
            content: editor1.state.doc.toString()
        },
        tab2: {
            content: editor2.state.doc.toString()
        },
        lastSaved: Date.now(),
    };

    localStorage.setItem("localRoomsData", JSON.stringify(localRoomsData));
}

function startSaveLoop() {
    if (saveLoop !== null) return;

    saveLoop = setInterval(() => {
        saveRoomCode();
    }, 3000);
}

function stopSaveLoop() {
    clearInterval(saveLoop);
    saveLoop = null;
}

startSaveLoop();