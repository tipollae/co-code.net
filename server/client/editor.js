import { EditorState } from "@codemirror/state";
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
  highlightActiveLineGutter,
  drawSelection
} from "@codemirror/view";

import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab
} from "@codemirror/commands";

import { python } from "@codemirror/lang-python";

import {
  defaultHighlightStyle,
  syntaxHighlighting,
  HighlightStyle,
  indentUnit
} from "@codemirror/language";

import { tags } from "@lezer/highlight";

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
        color: "#1cffd4"
    },
    {
        tag: tags.function(tags.variableName),
        color: "#58d58d"
    },
    { 
        tag: tags.variableName, 
        color: "#f7b538" 
    },
    { tag: tags.paren, color: "#58d58d" },
    { tag: tags.operator, color: "#f30a49" },
    { tag: tags.definitionOperator, color: "#ff5555" },
    { tag: tags.punctuation, color: "#58d58d" },
]);

const MAX_CODE_LENGTH = 10000;

const limitCodeLength = EditorView.updateListener.of((update) => {
    if (!update.docChanged) return;

    const code = update.state.doc.toString();

    if (code.length > MAX_CODE_LENGTH) {
        update.view.dispatch({
            changes: {
                from: MAX_CODE_LENGTH,
                to: update.state.doc.length,
                insert: ""
            }
        });

        alert("Code has exceeded character limit")
        
    }
});

const roomCode = String(window.location.href.split("#")[1])

const state = EditorState.create({
    doc: `#people in the room can see what you code here

#room code: ${roomCode}
print("hello world")`,
  extensions: [
    lineNumbers(),
    highlightActiveLineGutter(),
    history(),
    drawSelection(),
    highlightActiveLine(),
    
    limitCodeLength,

    keymap.of([
      indentWithTab,
      ...defaultKeymap,
      ...historyKeymap
    ]),

    indentUnit.of("    "),
    python(),

    syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
    syntaxHighlighting(myTheme)
  ]
});


const state2 = EditorState.create({
    doc: `#woah, another code editor!
print('im feeling so gassy *farts cutely*')`,
    extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        history(),
        drawSelection(),
        highlightActiveLine(),

        limitCodeLength,

        keymap.of([
            indentWithTab,
            ...defaultKeymap,
            ...historyKeymap
        ]),

        indentUnit.of("    "),
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