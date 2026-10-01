const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
    },
});

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join-room", (room) => {
        socket.join(room);

        const clients = io.sockets.adapter.rooms.get(room);
        const numberOfUsers = clients ? clients.size : 0;

        console.log(`User ${socket.id} joined room: ${room}`);

        // If another user is already in the room,
        // tell that user to create the offer.
        if (numberOfUsers === 2) {
            const otherUser = [...clients].find(
                (id) => id !== socket.id
            );

            io.to(otherUser).emit("ready");
        }
    });

    socket.on("offer", ({ room, offer }) => {
        socket.to(room).emit("offer", offer);
    });

    socket.on("answer", ({ room, answer }) => {
        socket.to(room).emit("answer", answer);
    });

    socket.on("ice-candidate", ({ room, candidate }) => {
        socket.to(room).emit("ice-candidate", candidate);
    });

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
        socket.broadcast.emit("peer-left");
    });
});

const PORT = 5001;

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});