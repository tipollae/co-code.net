const socket = io();

let currentEditor = null;

window.addEventListener("load", () => {
    currentEditor = window.editorView1;
});

const consoleText = document.getElementById("consoleText");
const runButton = document.getElementById("runCode");
var isRunning = false;

const worker = new Worker("scripts/pythonWorker.js");

worker.postMessage({ type: "init" });

worker.onmessage = (event) => {
    const data = event.data;

    if (data.type === "ready") {
        consoleText.textContent = "Python ready ✅";
        runButton.style.pointerEvents = "auto";
        runButton.style.opacity = "1";
    }

    if (data.type === "stdout") {
        consoleText.style.color = "white";
        consoleText.textContent += data.output + "\n";
    }

    if (data.type === "stderr") {
        consoleText.style.color = "red";
        consoleText.textContent += data.output + "\n";
    }

    if (data.type === "result") {
        if (data.result !== undefined && data.result !== null) {
            consoleText.style.color = "white";
            consoleText.textContent += String(data.result);
        }
    }

    if (data.type === "error") {
        consoleText.style.color = "red";
        consoleText.textContent += String(data.error);
    }
};

function runCode() {

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