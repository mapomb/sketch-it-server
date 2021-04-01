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

"use strict";

var http = require("http");
const request = require('request');

const express = require('express');

var appPort = normalizePort(process.env.PORT || '4000');
var baseDix = 10;
const app = express();
const mongoClient = require('mongodb').MongoClient;
app.set('port', appPort);
const server = http.createServer(app);
var collection = require('mongodb').Collection;
const { resolve } = require("path");
const { totalmem } = require("os");
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

            socket.on('virtual-draw', function (drawing){
                var difficulty = drawing;
                request(`http://localhost:3000/api/drawing/get/${difficulty}`, { json: true }, (err, res, body) => {
                if (err) { return console.log(err); }
                //socket.broadcast.emit('drawing-title', body.title);
                //socket.broadcast.emit('drawing-hints', body.hints);
                //socket.broadcast.emit('drawing-difficulty', body.hints);
                //console.log(body);
                let j = 0;
                let totalLength = 0;
                let speed;

                if(difficulty == "easy") {
                    speed = settings.EASY.speed;
                }
                else if(difficulty == "medium") {
                    speed = settings.MEDIUM.speed;
                }
                else if(difficulty == "hard") {
                    speed = settings.HARD.speed;
                }

                // strokes = body.strokes.strokes
                //body.strokes.strokes = shuffle(body.strokes.strokes);
                body.strokes.strokes = centerOuter(body.strokes.strokes);
                for (let stroke in body.strokes.strokes){
                        setTimeout( function(){
                            for(let i in body.strokes.strokes[stroke].coordinates){

                                setTimeout( function(){
                                    j++;
                                    var currentPoint = body.strokes.strokes[stroke].coordinates[i];
                                    var pointObject = {_x1:currentPoint.x, _y1:currentPoint.y,_x2:currentPoint.x, _y2:currentPoint.y, linewidth: body.strokes.strokes[stroke].lineWidth, color: body.strokes.strokes[stroke].fillColor };
                                    pointObject = JSON.stringify(pointObject);
                                    //console.log(pointObject);
                                    if(i == 0){
                                        socket.emit('mouseDown', pointObject);
                                    } else if(i == (body.strokes.strokes[stroke].coordinates.length - 1)){
                                        console.log("UPIDIYA")
                                        socket.emit('mouseUp', pointObject);
                                        resolve();
                                    } else{
                                        socket.emit('drawing', pointObject);
                                    }
                                    //console.log(j)
                                },speed*i)
                            }
                            
                        },(speed+5)*totalLength)
                        totalLength+=body.strokes.strokes[stroke].coordinates.length;
                    //}
                
                    
                }
               
                });
                //console.log(virtualDrawing);
                //socket.broadcast.emit('drawing', virtualDrawing);

            });

            socket.on('drawing', function (drawing){
                console.log(drawing);
                socket.broadcast.emit('drawing', drawing);
                
            });

            socket.on('mouseDown', function (drawing){
                console.log(drawing);
                socket.broadcast.emit('mouseDown', drawing);

            });

            socket.on('mouseOut', function (drawing){
                console.log(drawing);
                socket.broadcast.emit('mouseOut', drawing);

            });

            socket.on('mouseUp', function (drawing){
                console.log(drawing);
                socket.broadcast.emit('mouseUp', drawing);

            });

            socket.on('undo', function (undo){
                console.log(undo);
                socket.broadcast.emit('undo', undo);

            });

            socket.on('redo', function (redo){
                console.log(redo);
                socket.broadcast.emit('redo', redo);

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

    async function getDrawing(){
        let drawing;
        request('http://localhost:3000/api/drawing/get', { json: true }, (err, res, body) => {
            if (err) { return console.log(err); }
            //console.log(res);
            let drawing2 = body;
            drawing = drawing2.title;
            return drawing2.strokes
            //console.log(drawing2.strokes);
            // return drawing2;
        });
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
        array.sort(function(a,b){
            return a.coordinates[0].x - b.coordinates[0].x;
        })
        return array;
    }

    function panoramicRtoL(array) {
        array.sort(function(a,b){
            return b.coordinates[0].x - a.coordinates[0].x;
        })
        return array;
    }

    function panoramicTtoB(array) {
        array.sort(function(a,b){
            return a.coordinates[0].y - b.coordinates[0].y;
        })
        return array;
    }

    function panoramicBtoT(array) {
        array.sort(function(a,b){
            return b.coordinates[0].y - a.coordinates[0].y;
        })
        return array;
    }

    function centerInner(array){//605 height 748 width
        array.sort(function(a,b){//norme = sqrt()
            return Math.sqrt(Math.pow(a.coordinates[0].x-374,2)+Math.pow(a.coordinates[0].y-302,2)) - Math.sqrt(Math.pow(b.coordinates[0].x-374,2)+Math.pow(b.coordinates[0].y-302,2));
        })
        return array;
    }

    function centerOuter(array){//605 height 748 width
        array.sort(function(a,b){//norme = sqrt()
            return Math.sqrt(Math.pow(b.coordinates[0].x-374,2)+Math.pow(b.coordinates[0].y-302,2)) - Math.sqrt(Math.pow(a.coordinates[0].x-374,2)+Math.pow(a.coordinates[0].y-302,2));
        })
        return array;
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
