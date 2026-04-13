import { EditorState } from "https://esm.sh/@codemirror/state";
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from "https://esm.sh/@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "https://esm.sh/@codemirror/commands";
import { python } from "https://esm.sh/@codemirror/lang-python";
import { defaultHighlightStyle } from "https://esm.sh/@codemirror/language";
import { drawSelection } from "https://esm.sh/@codemirror/view";
import { insertTab, indentLess } from "https://esm.sh/@codemirror/commands";
import { indentUnit } from "https://esm.sh/@codemirror/language";
import { syntaxHighlighting, HighlightStyle } from "https://esm.sh/@codemirror/language";
import { tags } from "https://esm.sh/@lezer/highlight";

const myTheme = HighlightStyle.define([
    {
        tag: tags.string,
        color: "#f39422"
    },
    {
        tag: tags.keyword,
        color: "#f30a49"
    },
    {
        tag: tags.number,
        color: "#21e6c1"
    },
    {
        tag: tags.function(tags.variableName),
        color: "#b0e4cc" // ← this will affect print()
    },
    { 
        tag: tags.variableName, 
        color: "#b0e4cc" 
    },
    { tag: tags.paren, color: "#b0e4cc" },
    { tag: tags.operator, color: "#f30a49" },
    { tag: tags.definitionOperator, color: "#ff5555" },
    { tag: tags.punctuation, color: "#b0e4cc" },
]);

const state = EditorState.create({
    doc: `#people in the room can see what you code here
print("hello world")`,
    extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        history(),
        drawSelection(),
        highlightActiveLine(),
        keymap.of([
            ...defaultKeymap,
            ...historyKeymap,
            {
                key: "Tab",
                preventDefault: true,
                run: insertTab
            },
            {
                key: "Shift-Tab",
                preventDefault: true,
                run: indentLess
            }
        ]),
        indentUnit.of("    "),
        python(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        syntaxHighlighting(myTheme)
    ]
});

const state2 = EditorState.create({
    doc: `#woah, another code editor!
print('im feeling so gassy *farts cutely🎀*')`,
    extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        history(),
        drawSelection(),
        highlightActiveLine(),
        keymap.of([
            ...defaultKeymap,
            ...historyKeymap,
            {
                key: "Tab",
                preventDefault: true,
                run: insertTab
            },
            {
                key: "Shift-Tab",
                preventDefault: true,
                run: indentLess
            }
        ]),
        python(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        syntaxHighlighting(myTheme)
    ]
});

const view = new EditorView({
    state,
    parent: document.getElementById("tab1")
});

const view2 = new EditorView({
    state: state2,
    parent: document.getElementById("tab2")
});

if (view){

    document.getElementById("tab1Loading").style.display = "none"

}

if (view2){

    document.getElementById("tab2Loading").style.display = "none"

}

window.editorView1 = view;
window.editorView2 = view2;