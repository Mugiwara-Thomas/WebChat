const express = require("express")
const http = require("http")
const app = express()
const server = http.createServer(app)

const io = require("socket.io")(server, {
	cors: {
		origin: "https://webchat-client.onrender.com",
		methods: [ "GET", "POST" ]
	}
})

io.on("connection", (socket) => {
	const randomId = Math.floor(Math.random() * 1000000)
	socket.emit("me", randomId)

	socket.on("disconnect", () => {
		socket.broadcast.emit("callEnded")
	})

	socket.on("callUser", (data) => {
		io.to(data.userToCall).emit("callUser", { signal: data.signalData, from: data.from, name: data.name })
	})

	socket.on("answerCall", (data) => {
		io.to(data.to).emit("callAccepted", data.signal)
	})
})

server.listen(5000, () => console.log("Servidor ouvindo na porta 5000"))