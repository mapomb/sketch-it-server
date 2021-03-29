"use strict";

var http = require("http");
const express = require('express');

var appPort = normalizePort(process.env.PORT || '3000');
var baseDix = 10;
const app = express();
const mongoClient = require('mongodb').MongoClient;
app.set('port', appPort);
const server = http.createServer(app);
var collection = require('mongodb').Collection;
//const { time } = require("console");
main();

function main(){
    mongoClient.connect('mongodb+srv://admin:Equipe208@cluster0.z76qv.mongodb.net/myFirstDatabase?retryWrites=true&w=majority',{
        useNewUrlParser : true,
        useUnifiedTopology : true
    }, function(err, db) {
        if (err) throw err;
        var dbo = db.db("Database");
        collection = dbo.collection("Users");
    });
        // *** added for the new project
        let io = require("socket.io")(server, {
            cors: {
                origin: "http://localhost:4200" ,
                methods: ["GET", "POST"],
                allowedHeathers: ["Access-Control-Allow-Origin"],
                credentials: true,
                transports: ['websocket'] //added
            },
            allowEIO3: true // added
        });
        io.on("connect", function (socket) {

            socket.on('user-connect', async function (data, awk) {
                await isUsernameUnique(data)
                .then( async res => {
                    if(res){ // res==true means username is unique
                        await collection.insertOne({username: data, socketId:socket.id});
                        socket.broadcast.emit('new-user', data);
                        awk(true);
                    }
                    else awk(false);
                })
                .catch(err => console.log(err))
                
            });

            socket.on('message', function (message) {
                //console.log(message);
                //const newMessage = {username: message.username, content: message.content, timestamp: message.timestamp}
                //console.log(newMessage)
                socket.broadcast.emit('new-message', message);
            });
            socket.on('user-disconnect', async function (data) {
                console.log(data);
                socket.broadcast.emit('user-disconnected', data);
                await collection.deleteOne({username: data})
                //console.log(data);
            });
            socket.on('disconnect', async function (data) {
                await collection.deleteOne({socketId: socket.id});
                //console.log(data);
            });
        });
        app.get("/", function (req, res) {
            res.send("hello world");
        });
        // ***
        server.listen(appPort);
        server.on('error', function (error) { return onError(error); });
        server.on('listening', function () { return onListening(); });
    }
    
    async function isUsernameUnique(user) {
        return (await collection.findOne({username: user}) == null)
    
    };

    function normalizePort(val) {
        var port = typeof val === 'string' ? parseInt(val, baseDix) : val;
        if (isNaN(port)) {
            return val;
        }
        else if (port >= 0) {
            return port;
        }
        else {
            return false;
        }
    };
    function onError(error) {
        if (error.syscall !== 'listen') {
            throw error;
        }
        var bind = typeof appPort === 'string' ? 'Pipe ' + appPort : 'Port ' + appPort;
        switch (error.code) {
            case 'EACCES':
                console.error(bind + " requires elevated privileges");
                process.exit(1);
                break;
            case 'EADDRINUSE':
                console.error(bind + " is already in use");
                process.exit(1);
                break;
            default:
                throw error;
        }
    };
    /**
     * Se produit lorsque le serveur se met à écouter sur le port.
     */
    function onListening() {
        var addr = server.address();
        // tslint:disable-next-line:no-non-null-assertion
        var bind = typeof addr === 'string' ? "pipe " + addr : "port " + addr.port;
        // tslint:disable-next-line:no-console
        console.log("Listening on " + bind);
    };
    
module.exports = server;

// "use strict";

// var http = require("http");
// const express = require('express');

// var appPort = normalizePort(process.env.PORT || '3000');
// var baseDix = 10;
// const app = express();
// const mongoClient = require('mongodb').MongoClient;
// app.set('port', appPort);
// const server = http.createServer(app);
// var collection = require('mongodb').Collection;
// //const { time } = require("console");
// main();

// function main(){
//     mongoClient.connect('mongodb+srv://admin:Equipe208@cluster0.z76qv.mongodb.net/myFirstDatabase?retryWrites=true&w=majority',{
//         useNewUrlParser : true,
//         useUnifiedTopology : true
//     }, function(err, db) {
//         if (err) throw err;
//         var dbo = db.db("Database");
//         collection = dbo.collection("Users");
//     });
//         // *** added for the new project
//         let io = require("socket.io")(server, {
//             cors: {
//                 origin: "http://localhost:4200",
//                 methods: ["GET", "POST"],
//                 allowedHeathers: ["Access-Control-Allow-Origin"],
//                 credentials: true,
//                 transports: ['websocket'] //added
//             },
//             allowEIO3: true // added
//         });
//         io.on("connect", function (socket) {

//             socket.on('user-connect', async function (data, awk) {
//                 await isUsernameUnique(data)
//                 .then( async res => {
//                     if(res){ // res==true means username is unique
//                         await collection.insertOne({username: data, socketId:socket.id});
//                         socket.broadcast.emit('new-user', data);
//                         awk(true);
//                     }
//                     else awk(false);
//                 })
//                 .catch(err => console.log(err))
                
//             });

//             socket.on('message', function (message) {
//                 //console.log(message);
//                 //const newMessage = {username: message.username, content: message.content, timestamp: message.timestamp}
//                 //console.log(newMessage)
//                 socket.broadcast.emit('new-message', message);
//             });
//             socket.on('user-disconnect', async function (data) {
//                 console.log(data);
//                 socket.broadcast.emit('user-disconnected', data);
//                 await collection.deleteOne({username: data})
//                 //console.log(data);
//             });
//             socket.on('disconnect', async function (data) {
//                 await collection.deleteOne({socketId: socket.id});
//                 //console.log(data);
//             });
//         });
//         app.get("/", function (req, res) {
//             res.send("hello world");
//         });
//         // ***
//         server.listen(appPort);
//         server.on('error', function (error) { return onError(error); });
//         server.on('listening', function () { return onListening(); });
//     }
    
//     async function isUsernameUnique(user) {
//         return (await collection.findOne({username: user}) == null)
    
//     };

//     function normalizePort(val) {
//         var port = typeof val === 'string' ? parseInt(val, baseDix) : val;
//         if (isNaN(port)) {
//             return val;
//         }
//         else if (port >= 0) {
//             return port;
//         }
//         else {
//             return false;
//         }
//     };
//     function onError(error) {
//         if (error.syscall !== 'listen') {
//             throw error;
//         }
//         var bind = typeof appPort === 'string' ? 'Pipe ' + appPort : 'Port ' + appPort;
//         switch (error.code) {
//             case 'EACCES':
//                 console.error(bind + " requires elevated privileges");
//                 process.exit(1);
//                 break;
//             case 'EADDRINUSE':
//                 console.error(bind + " is already in use");
//                 process.exit(1);
//                 break;
//             default:
//                 throw error;
//         }
//     };
//     /**
//      * Se produit lorsque le serveur se met à écouter sur le port.
//      */
//     function onListening() {
//         var addr = server.address();
//         // tslint:disable-next-line:no-non-null-assertion
//         var bind = typeof addr === 'string' ? "pipe " + addr : "port " + addr.port;
//         // tslint:disable-next-line:no-console
//         console.log("Listening on " + bind);
//     };
    
// module.exports = server;




// "use strict";

// var http = require("http");
// const express = require('express');

// var appPort = normalizePort(process.env.PORT || '3000');
// var baseDix = 10;
// const app = express();
// const mongoClient = require('mongodb').MongoClient;
// app.set('port', appPort);
// const server = http.createServer(app);
// var collection = require('mongodb').Collection;
// const { time } = require("console");
// main();

// function main(){
//   mongoClient.connect('mongodb+srv://admin:Equipe208@cluster0.z76qv.mongodb.net/myFirstDatabase?retryWrites=true&w=majority',{
//       useNewUrlParser : true,
//       useUnifiedTopology : true
//   }, function(err, db) {
//       if (err) throw err;
//       var dbo = db.db("Database");
//       collection = dbo.collection("Users");
//   });
//       // *** added for the new project
//       let io = require("socket.io")(server, {
//           cors: {
//               origin: "http://localhost:4200",
//               methods: ["GET", "POST"],
//               allowedHeathers: ["Access-Control-Allow-Origin"],
//               credentials: true,
//               transports: ['websocket'] //added
//           },
//           allowEIO3: true // added
//       });
//       io.on("connect", function (socket) {
//           socket.emit('messagefromserver', "hello android");
//           socket.on('user-connect', function (data) {
//               console.log("le user " + data);
//               //response = findUserInDB(data);
//               socket.emit('accept-connect', data);
              
//               //socket.emit('accept-connect', data);
//               socket.broadcast.emit('new-user', data);
//           });
//           socket.on('bye', function (data) {
//               socket.broadcast.emit('user-disconnected', data);
//           });
//           socket.on('message', function (message) {
//               console.log(message);
//               const newMessage = {username: message.username, message: message.message, timestamp: message.timestamp}
//               socket.broadcast.emit('new-message', newMessage);
//           });
//           socket.on('disconnect', function (data) {
//               //socket.broadcast.emit('user-disconnected', data);
//               console.log(data);
//           });
//       });
//       app.get("/", function (req, res) {
//           res.send("hello world");
//       });
//       // ***
//       server.listen(appPort);
//       server.on('error', function (error) { return onError(error); });
//       server.on('listening', function () { return onListening(); });
//   }
//   function findUserInDB(user){
//       return collection.find({username: user}).toArray()
//               .then(() => {
//                   return true;
//               })
//               .catch(() => {
//                   return false;
//               });
//   }

//   function normalizePort(val) {
//       var port = typeof val === 'string' ? parseInt(val, baseDix) : val;
//       if (isNaN(port)) {
//           return val;
//       }
//       else if (port >= 0) {
//           return port;
//       }
//       else {
//           return false;
//       }
//   };
//   function onError(error) {
//       if (error.syscall !== 'listen') {
//           throw error;
//       }
//       var bind = typeof appPort === 'string' ? 'Pipe ' + appPort : 'Port ' + appPort;
//       switch (error.code) {
//           case 'EACCES':
//               console.error(bind + " requires elevated privileges");
//               process.exit(1);
//               break;
//           case 'EADDRINUSE':
//               console.error(bind + " is already in use");
//               process.exit(1);
//               break;
//           default:
//               throw error;
//       }
//   };
//   /**
//    * Se produit lorsque le serveur se met à écouter sur le port.
//    */
//   function onListening() {
//       var addr = server.address();
//       // tslint:disable-next-line:no-non-null-assertion
//       var bind = typeof addr === 'string' ? "pipe " + addr : "port " + addr.port;
//       // tslint:disable-next-line:no-console
//       console.log("Listening on " + bind);
//   };
    
// module.exports = server;


// const express = require('express');
// const app = express();
// const port = process.env.PORT || 3000;

// app.set("port", port);

// http = require("http");
// server = http.createServer(app)

// let io = require("socket.io")(server);

// let runningMessage = 'Sketch-it server started on port ' + port;

// app.get('/', (req, res) => {
//   console.log('API was successfully requested');
//   res.send(runningMessage);
// });

// io.on('connect', (socket) => {
//   socket.emit('messagefromserver', "hello android")
//   socket.on('user-connect', (data) => {
//     console.log(data);
//     socket.broadcast.emit('new-user', data);
//   });

//   socket.on('message', (data) => {
//     console.log(data);
//     socket.broadcast.emit('new-message', data);
//   });
// });

// server.listen(port, () => {
//   console.log(runningMessage);
// });

// module.exports = server;