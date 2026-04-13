
const socket = io();

let currentEditor = null;

window.addEventListener("load", () => {
    currentEditor = window.editorView1;
});

const consoleText = document.getElementById("consoleText");
const runButton = document.getElementById("runCode");
const stopButton = document.getElementById("stopCode");

var isRunning = false;
var alreadyStopped = false;
var executionPositive = true;
var worker = null;

function createWorker(){

    worker = new Worker("scripts/pythonWorker.js")

    worker.postMessage({ type: "init" });

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
            consoleText.appendChild(line);
        }

        if (data.type === "result") {
            if (data.result !== undefined && data.result !== null) {
                const line = document.createElement("div");
                line.style.color = "white";
                line.textContent = data.result;
                consoleText.appendChild(line);
            }
        }

        if (data.type === "error") {
            const line = document.createElement("div");
            line.style.color = "red";
            line.textContent = String(data.error);
            consoleText.appendChild(line);
            executionPositive = false;
        }

        if (data.type === "done") {
            runButton.style.opacity = "1";
            runButton.style.pointerEvents = "auto";

            stopButton.style.pointerEvents = "none"
            stopButton.style.opacity = "0.4";

            if (executionPositive){

                const line = document.createElement("div");
                line.style.color = "#58d58d";
                line.style.fontWeight = "bold";
                line.textContent = "/----- code execution successful -----/";
                consoleText.appendChild(line);

            }

        }

        if (data.type === "get_input"){

            prompt()

        }

        consoleText.scrollTop = consoleText.scrollHeight;

    };
}

createWorker();

async function runCode() {

    if (!currentEditor) return;

    consoleText.textContent = "";

    const code = currentEditor.state.doc.toString();

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
    line.textContent = "/----- force stopped execution -----/";
    consoleText.appendChild(line);

    stopButton.style.pointerEvents = "none"
    stopButton.style.opacity = "0.4";

    createWorker();

}

function switchTab(givenTabID) {
    const tab1 = document.getElementById("tab1");
    const tab2 = document.getElementById("tab2");

    tab1.classList.remove("active");
    tab2.classList.remove("active");

    currentEditor = null;

    if (givenTabID === "tab1") {
        tab1.classList.add("active");
        currentEditor = window.editorView1;
    } else if (givenTabID === "tab2") {
        tab2.classList.add("active");
        currentEditor = window.editorView2;
    }

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            currentEditor?.requestMeasure();
            currentEditor?.focus();
            document.getElementById("tab1Loading").style.display = "none";
            document.getElementById("tab2Loading").style.display = "none";
        });
    });
}