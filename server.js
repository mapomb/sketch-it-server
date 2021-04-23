const settings = {
    EASY: {
        speed: 30,
        time: 3,
        tries: 3
    },
    MEDIUM: {
        speed: 50,
        time: 2,
        tries: 2
    },
    HARD: {
        speed: 100,
        time: 1,
        tries: 1
    }
}
var words = ["car"];
"use strict";

var http = require("http");
const request = require('request');

const express = require('express');

var appPort = normalizePort(process.env.PORT || '3000');
var baseDix = 10;
const app = express();
const mongoClient = require('mongodb').MongoClient;
app.set('port', appPort);
const server = http.createServer(app);
var collection = require('mongodb').Collection;
const { resolve } = require("path");
const { totalmem } = require("os");
const { emit } = require("process");
//const { time } = require("console");
main();

function main() {
    var speed
    var timeouts = [];
    var dbo;
    var rightGuess;
    mongoClient.connect('mongodb+srv://admin:Equipe208@cluster0.z76qv.mongodb.net/myFirstDatabase?retryWrites=true&w=majority', {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }, function (err, db) {
        if (err) throw err;
        dbo = db.db("SKETCH-IT");
    });
    // *** added for the new project
    
    let io = require("socket.io")(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
            allowedHeathers: ["Access-Control-Allow-Origin"],
            credentials: true,
            transports: ['websocket'] //added
        },
        allowEIO3: true // added
    });


    io.on("connect", function (socket) {
        var timeOuts = [];
        let gameTurn = 0;
        var firstTime = true;
        var scoreTeamA = 0;
        var scoreTeamB = 0;
        var firstTimeClassic = true;
        var timeOutsClassic = [];
        socket.on('user-connect', function (data) {
            socket.username = data;
            console.log(socket.username);
        });

        //MODE CLASSIQUE--------------------------------------------------------------
        //LOBBY-SIDE------------------------------------------
        socket.on('join-classic', function (roomName) {
            socket.classicRoom = roomName;
            console.log(socket.classicRoom)
            socket.join(roomName);
            io.to(socket.classicRoom).emit('new-user', 'allo');
        })
        socket.on('leave-classic', function (roomName) {
            console.log('leave-classic' + " " + roomName);
            socket.broadcast.to(socket.classicRoom).emit('user-leave', 'oh no');
            socket.leave(socket.classicRoom);
            socket.classicRoom = "";
            // socket.broadcast.emit('leave-classic', roomName);
        })
        socket.on('switch-teams', function (username) {
            // io.to(socket.classicRoom).emit('switch-teams', username);
            socket.broadcast.to(socket.classicRoom).emit('switch-teams', username);
            // socket.broadcast.emit('switch-teams', username);
        })
        socket.on('route-classic', function () {
            io.to(socket.classicRoom).emit('route-classic');
        })
        socket.on('add-virtual-player', function (data) {
            socket.broadcast.to(socket.classicRoom).emit('add-virtual-player', data);
            // socket.broadcast.emit('add-virtual-player', data);
        });

        socket.on('remove-virtual-player', function (team) {
            socket.broadcast.to(socket.classicRoom).emit('remove-virtual-player', team);
            // socket.broadcast.emit('remove-virtual-player', team);
        });

        //DRAWING-SIDE----------------------------------------OWNER SPECIFIC-----------------------------------------------
        socket.on('game-start', async function (difficulty) {//STARTS GAME: OWNER SPECIFIC
            // request(`http://localhost:3050/api/words/get/${difficulty}`, { json: true }, (err, res, body) => {
            //     word=body.word;
            // })
            //TODO: Get le modele de la game
            //TODO: Get les teams[{username: "blabla"}]
            request(`http://sketch-it-app.herokuapp.com/api/words/get/${difficulty}`, { json: true }, (err, res, body) => {
                var temp = [];
                body.forEach((word) => {
                    temp.push(word.word);
                })
                words=temp;
            })
            await sleep(100);
            console.log('game is starting.......................................................................')
            socket.turn = 0;
            //GET HERE GAME INFO
            collection = dbo.collection("Games");
            console.log("96 " + socket.classicRoom);
            var game = await collection.findOne({ id: socket.classicRoom });
            console.log(game.teams.firstTeam[0]);
            let A = [];
            let B = [];
            socket.teamALength = 0
            socket.teamBLength = 0
            game.teams.firstTeam.forEach(function (profile, index, arr) {
                A[index] = `${game.teams.firstTeam[index].username}`;
                socket.teamALength++;

            });
            game.teams.secondTeam.forEach(function (profile, index, arr) {
                B[index] = `${game.teams.secondTeam[index].username}`;
                socket.teamBLength++;

            });
            console.log("B: " + socket.teamBLength);
            console.log("A: " + socket.teamALength);
            socket.teamA = A;
            socket.teamB = B;
            console.log(socket.teamA)
            io.to(socket.classicRoom).emit('game-start');
            if (socket.teamALength == 1) {
                socket.gameGuesser = socket.teamA[0]
                socket.gameDrawer = "virtualA"
                io.to(socket.classicRoom).emit('isTurn', socket.gameDrawer);//afficher "you are now drawing"
                //second of teamA is guessing
                io.to(socket.classicRoom).emit('isGuessing', socket.gameGuesser);//afficher  "you are now guessing"
                socket.emit('virtual-turn')
                //Send word to draw to drawer;
                console.log("drawer: " + socket.gameDrawer);
                console.log("guesser: " + socket.gameGuesser);
            } else {
                socket.gameDrawer = socket.teamA[0]
                socket.gameGuesser = socket.teamA[1]
                io.to(socket.classicRoom).emit('isTurn', socket.gameDrawer);//afficher "you are now drawing"
                //second of teamA is guessing
                io.to(socket.classicRoom).emit('isGuessing', socket.gameGuesser);//afficher  "you are now guessing"
                //Send word to draw to drawer;
                console.log("drawer: " + socket.gameDrawer);
                console.log("guesser: " + socket.gameGuesser);
                let wordToDraw = words[Math.round(Math.random()*(words.length-1))];
                console.log(Math.random() * words.length);
                console.log("To guess: " + wordToDraw);
                socket.emit('wordToDraw', wordToDraw)
                io.to(socket.classicRoom).emit('wordToDraw', wordToDraw)//get random word
            }

            //let drawer = "dharmann"


        })
        socket.on('switch-turn', async function (username) {//SWITCH TURNS: OWNER SPECIFIC
            console.log(socket.turn);
            if (socket.turn == 5) {
                let winner = "";
                if (scoreTeamA > scoreTeamB) {
                    winner = `${socket.teamA[0]}` + ", " + `${socket.teamA[1]}`;
                }
                else if (scoreTeamA < scoreTeamB) {
                    winner = `${socket.teamB[0]}` + ", " + `${socket.teamB[1]}`;
                }
                else {
                    winner = "draw";
                }
                io.to(socket.classicRoom).emit('game-end', winner)//get random word
                return;
            } 
            if(socket.gameDrawer != "virtualA" && socket.gameDrawer != "virtualB" ){
                username = socket.gameDrawer
            }else if(socket.gameDrawer == "virtualA"){
                username = socket.teamA[0]
            }else if(socket.gameDrawer == "virtualB"){
                username = socket.teamB[0]
            }
            console.log("switch turn of "+username)
            var game = await collection.findOne({ id: socket.classicRoom });
            let A = [];
            let B = [];
            socket.teamALength = 0
            socket.teamBLength = 0
            game.teams.firstTeam.forEach(function (profile, index, arr) {
                A[index] = `${game.teams.firstTeam[index].username}`;
                socket.teamALength++;
            });
            game.teams.secondTeam.forEach(function (profile, index, arr) {
                B[index] = `${game.teams.secondTeam[index].username}`;
                socket.teamBLength++;
            });
            socket.teamA = A;
            socket.teamB = B;
            console.log("team A " + socket.teamA)
            console.log("socket id" + socket.id)
            ////////////////////
            /////////////////////////////
            let teamBsize = socket.teamBLength;
            let teamAsize = socket.teamALength;
            if (socket.teamA.includes(username)) {//teamA
                //switch to teamB
                if (teamBsize == 2) {
                    if (socket.turn == 0 || socket.turn == 4) {
                        socket.gameDrawer = socket.teamB[0]

                        io.to(socket.classicRoom).emit('isTurn', socket.gameDrawer);
                        socket.gameGuesser = socket.teamB[1]
                        io.to(socket.classicRoom).emit('isGuessing', socket.gameGuesser);
                    } else if (socket.turn == 2) {
                        socket.gameDrawer = socket.teamB[1]

                        io.to(socket.classicRoom).emit('isTurn', socket.gameDrawer);
                        socket.gameGuesser = socket.teamB[0]
                        io.to(socket.classicRoom).emit('isGuessing', socket.gameGuesser);
                    }
                    let wordToDraw = words[Math.round(Math.random()*(words.length-1))];
                    // console.log(Math.random() * words.length);
                    console.log("To guess: " + wordToDraw);
                    socket.emit('wordToDraw', wordToDraw)
                    io.to(socket.classicRoom).emit('wordToDraw', wordToDraw)//get random word

                    console.log(socket.turn);
                } else {
                    socket.gameGuesser = socket.teamB[0]
                    socket.gameDrawer = "virtualB"
                    io.to(socket.classicRoom).emit('isGuessing', socket.gameGuesser);
                    io.to(socket.classicRoom).emit('isTurn', socket.gameDrawer);
                    socket.emit('virtual-turn');
                }

            } else {//teamB
                //switch to teamA
                if (teamAsize == 2) {
                    if (socket.turn == 1 || socket.turn == 5) {
                        socket.gameDrawer = socket.teamA[1]
                        io.to(socket.classicRoom).emit('isTurn', socket.gameDrawer);

                        socket.gameGuesser = socket.teamA[0]
                        io.to(socket.classicRoom).emit('isGuessing', socket.gameGuesser);
                    } else if (socket.turn == 3) {
                        socket.gameDrawer = socket.teamA[0]
                        io.to(socket.classicRoom).emit('isTurn', socket.gameDrawer);

                        socket.gameGuesser = socket.teamA[1]
                        io.to(socket.classicRoom).emit('isGuessing', socket.gameGuesser);
                    }
                    let wordToDraw = words[Math.round(Math.random()*(words.length-1))];
                    // console.log(Math.random() * words.length);
                    console.log("To guess: " + wordToDraw);
                    socket.emit('wordToDraw', wordToDraw)
                    io.to(socket.classicRoom).emit('wordToDraw', wordToDraw)//get random word

                    console.log(socket.turn);
                } else {
                    socket.gameGuesser = socket.teamA[0]
                    socket.gameDrawer = "virtualA"
                    io.to(socket.classicRoom).emit('isGuessing', socket.gameGuesser);
                    io.to(socket.classicRoom).emit('isTurn', socket.gameDrawer);
                    socket.emit('virtual-turn');
                }
            }
            console.log("drawer: " + socket.gameDrawer);
            console.log("guesser: " + socket.gameGuesser);
            socket.turn++;
            

        })
        socket.on('droit-replique', function (username) {//DROIT REPLIQUE: OWNER SPECIFIC
            console.log("droit replique "+username)
            let teamBsize = socket.teamBLength;
            let teamAsize = socket.teamALength;
            if (socket.teamA.includes(username)) {//teamA
                //switch to teamB
                if (teamBsize == 2) {
                    let teamB = `${socket.teamB[0]}` + ", " + `${socket.teamB[1]}`
                    socket.gameGuesser = teamB
                    io.to(socket.classicRoom).emit('isGuessing', socket.gameGuesser);

                } else {
                    let teamB = socket.teamB[0]
                    socket.gameGuesser = teamB
                    io.to(socket.classicRoom).emit('isGuessing', socket.gameGuesser);
                }

            } else {//teamB
                //switch to teamA
                if (teamAsize == 2) {
                    let teamA = `${socket.teamA[0]}` + ", " + `${socket.teamA[1]}`
                    socket.gameGuesser = teamA
                    io.to(socket.classicRoom).emit('isGuessing', socket.gameGuesser);
                } else {
                    let teamA = socket.teamA[0]
                    socket.gameGuesser = teamA
                    io.to(socket.classicRoom).emit('isGuessing', socket.gameGuesser);
                }
            }
            console.log("drawer: " + socket.gameDrawer);
            console.log("guesser: " + socket.gameGuesser);
        })

        socket.on('skip-word', function () {
            //socket.emit('wordToDraw', "chapeau")
            io.to(socket.classicRoom).emit('wordToDraw', words[Math.round(Math.random()*(words.length-1))]);
            //get random word

            //io.to(socket.classicRoom).emit('wordToGuess', "chapeau")//get new word
        })

        socket.on('right-guess', function (username) {
            console.log("right guess "+username)
            io.to(socket.classicRoom).emit('right-guess', username)

        })

        socket.on('add-score', function (username) {
            if (socket.teamA.includes(username)) {
                scoreTeamA++;
            }
            else if (socket.teamB.includes(username)) {
                scoreTeamB++;
            }
        })

        socket.on('wrong-guess', function (username) {
            io.to(socket.classicRoom).emit('wrong-guess', username)

        })
        socket.on('classic-right-guess', function(){
            firstTimeClassic = false
        })
        socket.on('stop-classic-virtual', function(){
            timeOutsClassic.forEach(function (timeOut) {
                clearTimeout(timeOut);
            })
            timeOutsClassic = [];
        })
        socket.on('virtual-classic-draw', function (difficulty) {
            
            var difficulty = difficulty;
            console.log(difficulty);

            request(`http://sketch-it-app.herokuapp.com/api/drawing/get/${difficulty}`, { json: true }, (err, res, body) => {
                // console.log(body.title);
                // console.log(body);
                if (err) { return console.log(err); }
                socket.emit('drawing-title', body.title);
                io.to(socket.classicRoom).emit('drawing-hints', body.hints);
                socket.emit('drawing-difficulty', body.difficulty);
                //console.log(body);
                let j = 0;
                let totalLength = 0;
                //let speed;
                let pmiMode;

                if (difficulty == "easy") {
                    speed = settings.EASY.speed;
                }
                else if (difficulty == "medium") {
                    speed = settings.MEDIUM.speed;
                }
                else if (difficulty == "hard") {
                    speed = settings.HARD.speed;
                }

                if (body.pmiMode == "random") {
                    body.strokes = shuffle(body.strokes);
                }
                else if (body.pmiMode == "left to right") {
                    body.strokes = panoramicLtoR(body.strokes);
                }
                else if (body.pmiMode == "right to left") {
                    body.strokes = panoramicRtoL(body.strokes);
                }
                else if (body.pmiMode == "top to bottom") {
                    body.strokes = panoramicTtoB(body.strokes);
                }
                else if (body.pmiMode == "bottom to top") {
                    body.strokes = panoramicBtoT(body.strokes);
                }
                else if (body.pmiMode == "inner to outer") {
                    body.strokes = centerInner(body.strokes);
                }
                else if (body.pmiMode == "outer to inner") {
                    body.strokes = centerOuter(body.strokes);
                }
                io.to(socket.classicRoom).emit('wordToDraw', body.title);

                for (let stroke in body.strokes) {
                    timeOutsClassic.push(setTimeout(function () {
                        for (let i in body.strokes[stroke].coordinates) {
                            timeOutsClassic.push(setTimeout(function () {
                                j++;
                                var currentPoint = body.strokes[stroke].coordinates[i];
                                var pointObject = { _x1: currentPoint.x, _y1: currentPoint.y, _x2: currentPoint.x, _y2: currentPoint.y, linewidth: body.strokes[stroke].lineWidth, color: body.strokes[stroke].fillColor };
                                pointObject = JSON.stringify(pointObject);
                                if (i == 0) {
                                    io.to(socket.classicRoom).emit('mouseDown', pointObject);
                                } else if (i == (body.strokes[stroke].coordinates.length - 1)) {
                                    //console.log("UPIDIYA")
                                    io.to(socket.classicRoom).emit('mouseUp', pointObject);
                                    resolve();
                                } else {
                                    io.to(socket.classicRoom).emit('drawing', pointObject);
                                }
                            }, speed * i))
                        }

                    }, (speed + 5) * totalLength))
                    totalLength += body.strokes[stroke].coordinates.length;
                }
            });
        });

        //PMI-------------------------------PMI----------------------------------------
        socket.on('solo-right-guess', function () {
            firstTime = false
        })
        socket.on('stop-virtual', function () {
            timeOuts.forEach(function (timeOut) {
                clearTimeout(timeOut);
            })
        })

        socket.on('virtual-draw', function (drawing) {
            if (!firstTime) {
                timeOuts.forEach(function (timeOut) {
                    clearTimeout(timeOut);
                })
                timeOuts = [];
            }
            console.log('ok');
            var difficulty = drawing;
            request(`http://sketch-it-app.herokuapp.com/api/drawing/get/${difficulty}`, { json: true }, (err, res, body) => {
                if (err) { return console.log(err); }
                socket.emit('drawing-title', body.title);
                socket.emit('drawing-hints', body.hints);
                socket.emit('drawing-difficulty', body.difficulty);
                let j = 0;
                let totalLength = 0;
                
                let pmiMode;
                socket.emit('drawing-title', body.title);
                socket.emit('drawing-hints', body.hints);
                socket.emit('drawing-difficulty', body.difficulty);

                if (difficulty == "easy") {
                    speed = settings.EASY.speed;
                }
                else if (difficulty == "medium") {
                    speed = settings.MEDIUM.speed;
                }
                else if (difficulty == "hard") {
                    speed = settings.HARD.speed;
                }

                if (body.pmiMode == "random") {
                    body.strokes = shuffle(body.strokes);
                }
                else if (body.pmiMode == "left to right") {
                    body.strokes = panoramicLtoR(body.strokes);
                }
                else if (body.pmiMode == "right to left") {
                    body.strokes = panoramicRtoL(body.strokes);
                }
                else if (body.pmiMode == "top to bottom") {
                    body.strokes = panoramicTtoB(body.strokes);
                }
                else if (body.pmiMode == "bottom to top") {
                    body.strokes = panoramicBtoT(body.strokes);
                }
                else if (body.pmiMode == "inner to outer") {
                    body.strokes = centerInner(body.strokes);
                }
                else if (body.pmiMode == "outer to inner") {
                    body.strokes = centerOuter(body.strokes);
                }

                // strokes = body.strokes
                //body.strokes = shuffle(body.strokes);
                rightGuess = false
                for (let stroke in body.strokes) {
                    timeOuts.push(setTimeout(function () {
                        for (let i in body.strokes[stroke].coordinates) {

                            timeOuts.push(setTimeout(function () {
                                j++;
                                var currentPoint = body.strokes[stroke].coordinates[i];
                                var pointObject = { _x1: currentPoint.x, _y1: currentPoint.y, _x2: currentPoint.x, _y2: currentPoint.y, linewidth: body.strokes[stroke].lineWidth, color: body.strokes[stroke].fillColor };
                                pointObject = JSON.stringify(pointObject);
                                //console.log(pointObject);
                                if (i == 0) {
                                    socket.emit('mouseDown', pointObject);
                                } else if (i == (body.strokes[stroke].coordinates.length - 1)) {
                                    //console.log("UPIDIYA")
                                    socket.emit('mouseUp', pointObject);
                                    resolve();
                                } else {
                                    socket.emit('drawing', pointObject);
                                }
                                //console.log(j)
                            }, speed * i))
                        }

                    }, (speed + 5) * totalLength))
                    totalLength += body.strokes[stroke].coordinates.length;
                    //}
                }
            });
            //console.log(virtualDrawing);
            //socket.broadcast.emit('drawing', virtualDrawing);

        });
        //DESSIN-----------------------------------------------------------------------------------
        socket.on('drawing', function (drawing) {
            console.log(drawing);
            socket.broadcast.to(socket.classicRoom).emit('drawing', drawing);

        });

        socket.on('mouseDown', function (drawing) {
            console.log(drawing);
            socket.broadcast.to(socket.classicRoom).emit('mouseDown', drawing);

        });

        socket.on('mouseOut', function (drawing) {
            console.log(drawing);
            socket.broadcast.to(socket.classicRoom).emit('mouseOut', drawing);

        });

        socket.on('mouseUp', function (drawing) {
            console.log(drawing);
            socket.broadcast.to(socket.classicRoom).emit('mouseUp', drawing);

        });

        socket.on('undo', function (undo) {
            console.log(undo);
            socket.broadcast.to(socket.classicRoom).emit('undo', undo);

        });

        socket.on('redo', function (redo) {
            console.log(redo);
            socket.broadcast.to(socket.classicRoom).emit('redo', redo);

        });
        //CHAT-------------------------------------------------------------------------
        socket.on('add-user-to-general', async function (username) {
            collection = dbo.collection("Chats");
            await collection.update({ id: 'general' }, { $push: { users: username } })
        })
        
        socket.on("chat-join", function (username, room) {
            console.log(socket.id + " just joined chat " + room)
            socket.join(room);
            io.to(room).emit('new-chat-user',username, room);
        })
        socket.on("chat-quit", async function(chatId, username) {
            //quit chat
            socket.leave(chatId) 
            collection = dbo.collection("Chats");
            await collection.update(
                { id: chatId }, 
                { $pull: { users: username } },
                false, // Upsert
                true, // Multi
            );
        })
        socket.on("chat-delete", async function (chatId) {
            //delete chat from Mongo
            collection = dbo.collection("Chats");
            console.log(chatId)
            var query = { id: chatId }
            await collection.deleteOne(query, (err, collection) => {
                if (err) throw err;
                console.log(collection.result.n + " Record(s) deleted successfully");
                console.log(collection);
            });
        })
        socket.on('message', async function (message, chatId, awk) {
            //console.log(message);
            //const newMessage = {username: message.username, content: message.content, timestamp: message.timestamp}
            //console.log(newMessage)

            // socket.broadcast.emit('new-message', message);
            var messageParsed = JSON.parse(message);
            var date = new Date();
            var timestamp =
                ((date.getHours() < 10 ? '0' : '') + date.getHours()) + ":"
                + ((date.getMinutes() < 10 ? '0' : '') + date.getMinutes()) + ":"
                + ((date.getSeconds() < 10 ? '0' : '') + date.getSeconds());

            awk(timestamp);
            var msg = { username: messageParsed.username, content: messageParsed.content, timestamp: timestamp };
            collection = dbo.collection("Chats");
            await collection.update({ id: chatId }, { $push: { messages: msg } })
            // socket.broadcast.emit('new-message', JSON.stringify(msg));
            console.log("message: " + message + " chatId: " + chatId);
            io.to(chatId).emit('new-message', JSON.stringify(msg),chatId);
        });

        socket.on('user-disconnect', async function (data) {
            console.log(data);
            socket.broadcast.emit('user-disconnected', data);
            //await collection.deleteOne({ username: data })
            //console.log(data);
        });

        socket.on('disconnect', async function (data) {
            //await collection.deleteOne({ socketId: socket.id });
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



function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

function panoramicLtoR(array) {
    array.sort(function (a, b) {
        return a.coordinates[0].x - b.coordinates[0].x;
    })
    return array;
}

function panoramicRtoL(array) {
    array.sort(function (a, b) {
        return b.coordinates[0].x - a.coordinates[0].x;
    })
    return array;
}

function panoramicTtoB(array) {
    array.sort(function (a, b) {
        return a.coordinates[0].y - b.coordinates[0].y;
    })
    return array;
}

function panoramicBtoT(array) {
    array.sort(function (a, b) {
        return b.coordinates[0].y - a.coordinates[0].y;
    })
    return array;
}

function centerInner(array) {//605 height 748 width
    array.sort(function (a, b) {//norme = sqrt()
        return Math.sqrt(Math.pow(a.coordinates[0].x - 374, 2) + Math.pow(a.coordinates[0].y - 302, 2)) - Math.sqrt(Math.pow(b.coordinates[0].x - 374, 2) + Math.pow(b.coordinates[0].y - 302, 2));
    })
    return array;
}

function centerOuter(array) {//605 height 748 width
    array.sort(function (a, b) {//norme = sqrt()
        return Math.sqrt(Math.pow(b.coordinates[0].x - 374, 2) + Math.pow(b.coordinates[0].y - 302, 2)) - Math.sqrt(Math.pow(a.coordinates[0].x - 374, 2) + Math.pow(a.coordinates[0].y - 302, 2));
    })
    return array;
}

async function isUsernameUnique(user) {
    collection = dbo.collection("Users");
    return (await collection.findOne({ username: user }) == null)

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

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

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
