let saveLoop = null;

const roomCode = String(window.location.href.split("#")[1]);
const ROOM_DATA_EXPIRY = 1000 * 60 * 3;

let localRoomsData = JSON.parse(localStorage.getItem(`room_${roomCode}`) || "{}");
localStorage.setItem(`room_${roomCode}`, JSON.stringify(localRoomsData));

Object.keys(localStorage).forEach(key => {
    if (!key.startsWith("room_")) return;

    const room = JSON.parse(localStorage.getItem(key) || "null");

    if (!room ||
        !room.lastSaved ||
        Date.now() - room.lastSaved >= ROOM_DATA_EXPIRY) {
        localStorage.removeItem(key);
    }
});

function saveRoomCode() {
    const editor1 = window.editorView1;
    const editor2 = window.editorView2;

    if (!editor1 || !editor2) return;

    localRoomsData = {
        tab1: {
            content: editor1.state.doc.toString()
        },
        tab2: {
            content: editor2.state.doc.toString()
        },
        lastSaved: Date.now(),
    };

    localStorage.setItem(`room_${roomCode}`, JSON.stringify(localRoomsData));
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