let pyodide;
let pendingInputResolve = null;

self.onmessage = async (event) => {
    const { type, code, inputValue } = event.data;

    if (type === "init") {
        importScripts("https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js");

        pyodide = await loadPyodide();

        pyodide.setStdout({
            batched: (output) => {
                self.postMessage({ type: "stdout", output });
            }
        });

        pyodide.setStderr({
            batched: (output) => {
                self.postMessage({ type: "stderr", output });
            }
        });

        pyodide.setStdin({
            stdin: async () => {
                self.postMessage({ type: "get_input" });

                return await new Promise((resolve) => {
                    pendingInputResolve = resolve;
                });
            }

        });

        self.postMessage({ type: "ready" });
    }

    if (type === "run") {
        try {

            const result = await pyodide.runPythonAsync(code);
            self.postMessage({ type: "result", result });
            self.postMessage({ type: "done" });
        } catch (err) {
            self.postMessage({ type: "error", error: String(err) });
            self.postMessage({ type: "done" });
        }
    }

};