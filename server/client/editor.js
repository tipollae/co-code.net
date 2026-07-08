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

def binarySearch(givenList, target):

    left = 0
    right = len(givenList)-1
    loops = 0

    while left <= right:

        middle = (left+right)//2
        loops += 1

        if givenList[middle] == target:
            return {
                "target": target, 
                "middle": middle,
                "foundValue": givenList[middle],
                "loops": loops
            }

        elif givenList[middle] > target:
            right = middle - 1

        elif givenList[middle] < target:
            left = middle + 1
            
    return {
        "target": target, 
        "middle": None,
        "foundValue": None,
        "loops": loops
    }

numsList = [1,2,3,4,5,6,7,10,20]
search = binarySearch(numsList, 6)

print(f"""
target value: {search['target']}
list[{search['middle']}]: {search['foundValue']}
loops: {search['loops']}
""")
`,
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