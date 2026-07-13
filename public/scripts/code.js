
let currentEditor = null;

// 8 bytes = 2 Int32 values
const controlSAB = new SharedArrayBuffer(8);
const control = new Int32Array(controlSAB);

// buffer for UTF-8 input text
const inputSAB = new SharedArrayBuffer(4096);
const inputBytes = new Uint8Array(inputSAB);

const consoleText = document.getElementById("consoleText");
const runButton = document.getElementById("runCode");
const stopButton = document.getElementById("stopCode");
const inputItems = document.getElementsByClassName('userInput');
const chatInput = document.getElementById("chatInput");

let isRunning = false;
let alreadyStopped = false;
let executionPositive = true;
let worker = null;
let pausedForInput = false;

let currentCode;
let pastCode;

window.addEventListener("load", () => {
    currentEditor = window.editorView1;
    currentCode = currentEditor.state.doc.toString();

    if (!currentCode) return;

    let data = {

        socketID: socket.id,
        code: currentCode,

    }

    socket.emit("update-user-code", data)
});

function createWorker(){

    worker = new Worker("../scripts/pythonWorker.js")

    worker.postMessage({
        type: "init",
        sab: controlSAB,
        inputBuffer: inputSAB
    });

    worker.onmessage = (event) => {
        const data = event.data;
        
        if (data.type === "ready") {
            
            if (alreadyStopped) {
                const line = document.createElement("div");
                line.style.color = "#58d58d";
                line.style.fontWeight = "bold";
                line.textContent = "Python is ready ✅";
                consoleText.appendChild(line);
            }

            else {
                consoleText.textContent = "";
                const line = document.createElement("div");
                line.style.color = "#58d58d";
                line.style.fontWeight = "bold";
                line.textContent = "Python is ready ✅";
                consoleText.appendChild(line);
                alreadyStopped = true;
            }

            runButton.style.pointerEvents = "auto";
            runButton.style.opacity = "1";
        }

        if (data.type === "stdout") {
            consoleText.style.color = "white";
            const line = document.createElement("div");
            line.style.color = "white";
            line.textContent = data.output;
            consoleText.appendChild(line);

        }

        if (data.type === "stderr") {
            consoleText.style.color = "red";
            const line = document.createElement("div");
            line.style.color = "red";
            line.textContent = data.output;
            removeInputs();
            consoleText.appendChild(line);
        }

        if (data.type === "error") {
            const line = document.createElement("div");
            line.style.color = "red";
            line.textContent = String(data.error);
            consoleText.appendChild(line);
            removeInputs();
            executionPositive = false;
        }

        if (data.type === "done") {
            runButton.style.opacity = "1";
            runButton.style.pointerEvents = "auto";

            stopButton.style.pointerEvents = "none"
            stopButton.style.opacity = "0.4";

            if (executionPositive){

                removeInputs()
                const line = document.createElement("div");
                line.style.color = "#58d58d";
                line.style.fontWeight = "bold";
                line.textContent = "/code execution successful/";
                consoleText.appendChild(line);

            }

        }

        if (data.type === "get_input") {

            const line = document.createElement("div");
            line.classList.add("userInput")
            const text = document.createElement("div");
            text.textContent = data.text;
            const userInput = document.createElement("input");
            text.appendChild(userInput)
            line.appendChild(text);
            consoleText.appendChild(line);
            userInput.focus();
            userInput.enterKeyHint = "done";
            userInput.autocomplete = "off";

            pausedForInput = true;

        }

        consoleText.scrollTop = consoleText.scrollHeight;

    };
}

createWorker();

function submitInput(response){

    const encoded = new TextEncoder().encode(response);

    inputBytes.fill(0);
    inputBytes.set(encoded.slice(0, inputBytes.length));

    Atomics.store(control, 1, Math.min(encoded.length,
    inputBytes.length));

    Atomics.store(control, 0, 1);
    Atomics.notify(control, 0, 1);

}

async function runCode() {

    if (!currentEditor) return;

    consoleText.textContent = "";

    const code = currentEditor.state.doc.toString();
    currentCode = code;

    worker.postMessage({
        type: "run",
        code
    });

    isRunning = true;

    runButton.style.pointerEvents = "none";
    runButton.style.opacity = "0.4";

    stopButton.style.pointerEvents = "auto"
    stopButton.style.opacity = "1";

    executionPositive = true;
}

function stopCode(){

    if (!worker) return;

    worker.terminate();
    const line = document.createElement("div");
    line.style.color = "yellow";
    line.style.fontWeight = "bold";
    line.textContent = "/force stopped execution/";
    consoleText.appendChild(line);

    stopButton.style.pointerEvents = "none"
    stopButton.style.opacity = "0.4";

    removeInputs();
    createWorker();

}

function switchTab(givenTabID) {
    const tab1 = document.getElementById("tab1");
    const tab2 = document.getElementById("tab2");

    tab1.classList.remove("active");
    tab2.classList.remove("active");

    let editorToActivate = null;

    if (givenTabID === "tab1") {
        tab1.classList.add("active");
        editorToActivate = window.editorView1;
    } else if (givenTabID === "tab2") {
        tab2.classList.add("active");
        editorToActivate = window.editorView2;
    }

    currentEditor = editorToActivate;

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            editorToActivate?.requestMeasure();
            editorToActivate?.focus();

            document.getElementById("tab1Loading").style.display = "none";
            document.getElementById("tab2Loading").style.display = "none";
        });
    });

}


document.fonts.ready.then(() => {
    window.editorView1?.requestMeasure();
    window.editorView2?.requestMeasure();
});

function refreshEditorMeasurements(editorView) {
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            editorView.requestMeasure();
        });
    });
}

function removeInputs(){

    Array.from(inputItems).forEach((current)=>{

        let foundInput = current.querySelector("input");
        let foundDiv = current.querySelector("div")

        if (!foundInput) return;

        let inputValue = foundInput.value;

        foundInput.blur();
        foundInput.readOnly = true;
        foundInput.remove();

        foundDiv.textContent += inputValue;

        pausedForInput = false;

    })
    
}

function focusInput(){

    let foundInput = inputItems[inputItems.length - 1].querySelector("input");
    if (foundInput) foundInput.focus();

}

function sendMessage(){

    let message = chatInput.value;
    chatInput.value = "";

    if (message.length > 0) socket.emit("send-message", message);

}

document.addEventListener('keydown', (event) => {
    const keyName = event.key;

    if (keyName === 'Enter' && document.activeElement === chatInput){

        sendMessage()

    }

    let container = inputItems[inputItems.length - 1];
    if (!container) return;

    let foundInput = container.querySelector("input");

    if (keyName === 'Enter' && pausedForInput && document.activeElement === foundInput) {

        const value = foundInput.value;
        removeInputs();
        submitInput(value);

    }

});
