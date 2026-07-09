const socket = io();

let localToken = localStorage.getItem("token");
let localUsername = localStorage.getItem("username");

socket.emit("connection-protocol", localToken)