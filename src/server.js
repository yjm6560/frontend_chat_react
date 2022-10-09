import http from 'http';
import SocketIO from "socket.io";
import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();

let uuidInfoMap = { };

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (req, res) => {
    res.render("home", {
        uuid: uuidv4()
    });
});
app.get("/*", (req, res) => res.redirect("/"));

const httpServer = http.createServer(app);
const wsServer = SocketIO(httpServer);

wsServer.on("connection", (socket) => {
    const clientUuid = socket.handshake.query['uuid'];
    uuidInfoMap[clientUuid] = {
        "rooms" : []
    };
    console.log(`client connect to socket. uuid:${clientUuid}`);

    socket.on("join_room", (roomName) => {
        console.log("welcome : ", clientUuid);
        socket.join(roomName);
        socket.to(roomName).emit("welcome");

        uuidInfoMap[clientUuid]["rooms"].push(roomName);
    });
    socket.on("offer", (offer, roomName) => {
        socket.to(roomName).emit("offer", offer);
    });
    socket.on("answer", (answer, roomName) => {
        socket.to(roomName).emit("answer", answer);
    });
    socket.on("ice", (ice, roomName) => {
        socket.to(roomName).emit("ice", ice);
    });
    socket.on("new_message", (message) => {
        if(message["sender"] == clientUuid) {
            message["sent_time"] = new Date();
            socket.in(message["roomName"]).emit("new_message", message);
            socket.emit("new_message", message);
            console.log(message);
        }
    });
    socket.on("disconnect", () => {
        uuidInfoMap[clientUuid]["rooms"].forEach((room) => {
            socket.to(room).emit("disconnected");
        });
        delete uuidInfoMap[clientUuid];

        console.log(`client close connection. uuid:${clientUuid}`);
    });
});

const handleListen = () => console.log("Listening on http://localhost:3000");
httpServer.listen(3000, handleListen);