const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.set("port", port);

http = require("http");
server = http.createServer(app)

let io = require("socket.io")(server);

let runningMessage = 'Sketch-it server started on port ' + port;

app.get('/', (req, res) => {
  console.log('API was successfully requested');
  res.send(runningMessage);
});

io.on('connect', (socket) => {
  socket.emit('messagefromserver', "hello android")
  socket.on('user-connect', (data) => {
    console.log(data);
    socket.broadcast.emit('new-user', data);
  });

  socket.on('message', (data) => {
    console.log(data);
    socket.broadcast.emit('new-message', data);
  });
});

server.listen(port, () => {
  console.log(runningMessage);
});

module.exports = server;