# co-code.net

> A real-time multiplayer Python coding platform built for collaborative coding directly in the browser.

---
Check it out! https://co-code.net/
<img width="1917" height="975" alt="co-code net photo" src="https://github.com/user-attachments/assets/80f38606-66f2-410b-a6ef-d9c607b5fca9" />

## 🚀 Features

### 👥 Multiplayer Coding Rooms

* Join coding rooms with other users
* Watch code update live in real time
* Lightweight synchronization system

### 🐍 Browser Based Python Execution

* Python runs entirely in the browser using Pyodide
* No server side code execution required
* Safer and more scalable architecture

### 💬 Real Time Chat

* Built in room chat
* Socket based communication

### 🧠 Developer Focused Features

* Multiple editor tabs
* Copy other users' code instantly
* Persistent token/session system
* Responsive layout
* Fast startup and low overhead

---

# 🛠️ Tech Stack

## Frontend

* HTML
* CSS
* JavaScript
* CodeMirror 6
* Pyodide
* Socket.IO Client

## Backend

* Node.js
* Express.js
* Socket.IO

## Hosting

* Render

---

# ⚙️ How It Works

Users join a shared room where they can:

* Write Python code
* Run code locally in their browser
* See other users' code update live
* Chat with everyone in the room

Unlike traditional online compilers, co-code.net does **not** execute Python on the server.

Instead, Python runs client side using Pyodide.

This allows:

* Lower hosting costs
* Better scalability
* Reduced security risks
* Faster execution startup

The server mainly handles:

* Room management
* User synchronization
* Messaging
* Session/token handling

---

# ⚡ Performance Design

A naive implementation would emit socket events on every keystroke,
causing excessive network traffic and server load.

Instead, co-code.net uses a dirty flag synchronization system.

When a user edits code:
1. The user is marked as dirty
2. The room is marked as active
3. A periodic synchronization loop broadcasts only modified code
4. Inactive rooms are skipped entirely

This significantly reduces unnecessary socket events while keeping
the experience responsive for users.
This helps reduce:

* Network spam
* Socket event overload
* Server usage
* Unnecessary updates

---

# 🔒 Security

Current protections include:

* HTTPS deployment
* Content Security Policy (CSP)
* Input validation
* Token based session
* No XSS vulnerabilities

---

# ✅ Fixed and working
* Size limiting: There is now a cap on the amount of code you can paste/write. Users may still lie about their code with more knowledge about socket.io, however, users can't bypass server set limit on the amount of code typed/pasted.
* Rate limiting: There are now timers set to calculate whether a user is spamming the chat/code emitting.

# 🔨 Currently in progress
* Refactoring: Currently a good percentage of the server code isn't encapsulated and are in a single index.js file, and after working on a different project and learning a lot, I would like to add a lot more clean architecture and professional practices on this project for both scalability and cleanliness. This could include class encapsulation, a separate database handler, separate rooms handler, better token generation using crypto, and many more.

# ➕ Potential features

Things I am thinking of adding later on (not soon):

* Patch updating: Optimization problem is that code is currently updated via whole strings instead of only the part of code that actually changed. Patch updating will allow udpates to only include characters that have changed or have beenn deleted, increasing performance durastically and lowering the size of data being held by the server and emitted into sockets.
* JSON file question system: Using existing coding questions from Leetcode that are available on GitHub, a system could be made for the room host to import existing questions or their own.
* Room commands for host.
* Accounts and guest accounts.
* Multiple servers: Depending on how big co-code.net becomes, having a multi-server system will definetely be considered for both faster connection in differing regions and scalability.
