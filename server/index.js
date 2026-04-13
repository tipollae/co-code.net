
//importing express
const express = require("express");
const path = require("path");

//new express instance
const app = express();

//serve static files
app.use(express.static("../public"))

//serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

//creates an http server using the created express app
const server = require("http").Server(app);
//attaching socket io to http server
const io = require("socket.io")(server);
const port = 3000;

if (!server.listening){

    server.listen(port, "0.0.0.0", ()=>{

        console.log(`Server has been initiated at http://localhost:${port}`)

    })

}

else console.log("Server has already been initiated")

//on connection tasks
io.on("connection", (socket)=>{

    console.log("a user has connected!")

    socket.on("disconnect", ()=>{

        console.log("a user has disconnected!")

    })

})
