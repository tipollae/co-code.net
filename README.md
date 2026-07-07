# co-code.net

> A real-time multiplayer Python coding platform built for collaborative coding directly in the browser.

---
Check it out! https://co-code.net/
<img width="1920" height="1080" alt="co-code net gif" src="https://github.com/user-attachments/assets/4e112f9d-df27-4f75-83d1-7d41733b0daf" />

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

Rather than emitting socket events on every keystroke,
causing excessive network traffic and server load.

co-code.net instead uses a dirty flag synchronization system.

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

# ✅ Fixed/Done
* Size limiting: There is now a cap on the amount of code you can paste/write. Users may still lie about their code with more knowledge about socket.io, however, users can't bypass server set limit on the amount of code typed/pasted.
* Rate limiting: There are now timers set to calculate whether a user is spamming the chat/code emitting.
* Refactoring: Monolith -> Modular.
* Class encapsulation (Room handler, Token handler)
* Socket.IO middleware
* Single loop scheduler instead of multiple setInterval()'s

# 🔨 Currently in progress
* Persistent coding editors in rooms after abrupt disconnect.
* Patch updating: Optimization problem is that packets current emit the whole string of code once a change in a users codebase has been detected. Patch updating will allow udpates to only include characters that have changed or have been deleted, increasing performance drastically and lowering the size of data in a payload.

# ➕ Potential Features

Things I am thinking of adding later on (not soon):

* JSON file question system: Using existing coding questions from Leetcode that are available on GitHub, a system could be made for the room host to import existing questions or their own.
* Room commands for host.
* Accounts and guest accounts.
* Multiple servers: Depending on how big co-code.net becomes, having it scale horizontally will be a consideration.

# Learning Documentation

## Encapsulation - 26/6/26

I started understanding encapsulation more when I was working on Baklafy. This project made me really think about the systems that was going to be in use and how each function would interact with each other. However this wasn't where it fully clicked, it just gave me a starting framework that I can base my concepts on. This breakthrough thoroughly kicked in while refactoring my code on this project from one large monolithic file into separate handler classes/modules.

Before, a lot of my server logic directly accessed and modified shared objects like rooms, tokens, users, and sockets from different parts of the code. This worked, but it made the system harder to reason about because many parts of the program could change the same data directly. Adding new features was also a headache, as I had to scroll through hundreds of lines of code across a single index.js file. I had an enormouse spagetti of code.

The reason why this concept started making sense was most likely due to the fact that co-code.net already had all the systems lying around. All I had to do was decide which responsibilities belonged to which handler. From there it was just a bunch of puzzle pieces that needed organizing. In comparison, Baklafy was a fresh project. I was already overwhelmed and overthinking the system without even adding the essential parts of the system yet.

Encapsulation helped me realize that each system should own its own data and expose controlled methods for interacting with it. For example, instead of other parts of the code directly changing room data in the rooms object, the room handler can provide methods like createRoom(), getRoom(), updateRoom(), or deleteRoom(). This keeps the logic for managing rooms inside one place.

This makes the code safer and easier to maintain because changes to room logic only need to happen inside the room handler. It also makes the rest of the server cleaner because other modules do not need to know exactly how rooms are stored internally.

I also learned that encapsulation is not just about using classes. It is about controlling access to data and reducing how much the rest of the program depends on internal details. Even if the data is still stored in objects, the important part is that I interact with it through clear methods instead of directly modifying it everywhere.

Overall, encapsulation made me think more about designing systems rather than just writing functions that make things work. It helped me separate responsibilities, reduce messy dependencies, and make my code easier to refactor in the future.

## Middleware - 30/6/26
While refactoring co-code.net from a monolithic architecture into a modular one, I finally understood how Socket.IO middleware: io.use() and next(), are intended to be used.

Previously, almost every Socket.IO event performed its own lookup against the server's token database. Although functional, this meant a malicious or modified client could simply ignore a server request to provide a token and attempt to emit protected events anyway. The server would still have to process those events before rejecting them, creating unnecessary work and increasing the attack surface.

By moving authentication into io.use(), every new socket connection is validated before the connection is established. Once the middleware calls next(), I know that socket.data.token contains a valid, verified token for the lifetime of that connection. As a result, individual event handlers no longer need to repeatedly perform the same authentication checks, making the codebase both cleaner and more secure.

This was one of those concepts that only really clicked once I refactored the project. Seeing the system split into smaller modules made it much easier to identify duplicated logic and recognize where middleware provided the right level of abstraction.
