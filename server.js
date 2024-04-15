const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

app.use(express.static('public'));

const server = app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});


const socket = require('socket.io');
const io = socket(server);






class Room{
    constructor(id, io){
        this.id = id;
        this.io = io;
        this.clients = {};

        this.chat = new Chat(this);
        this.game = new Game(this);
    }

    AddClient(client){
        this.clients[client.id] = client;
        client.socket.on('getPlayerList', (data, callback) => {
            callback({
                players: Object.values(this.clients).map((client) => client.name),
                playerCount: Object.values(this.clients).length,
                pings: Object.values(this.clients).map((client) => client.ping)
            });
        });
        this.chat.addClient(client);
    }

    RemoveClient(client){
        this.chat.removeClient(client);
        delete this.clients[client.id];
    }

    Update(){
        
        for (let client in this.clients){
            this.clients[client].getPing();
        }

        this.game.Update();
    }
}

class ServerNetworkManager{
    constructor(io){
        this.io = io;

        setTimeout(() => {
            // Reset all already connected clients
            this.io.sockets.emit('serverStartUp', 'reset');
        }, 1000);


        this.clients = {};
        this.rooms = {};

        setInterval(() => {
            this.Update();
        }, 1000/5);
    }

    connection(socket){
        console.log('New connection', socket.id);

        if (Object.keys(this.clients).length % 5 === 0){
            const room = new Room('room' + Object.keys(this.rooms).length, this.io);
            this.rooms[room.id] = room;
        }

        const backendClient = new BackendClient(socket.id, socket, this.rooms[Object.keys(this.rooms)[Object.keys(this.rooms).length - 1]]);

        this.clients[socket.id] = backendClient;
        
        this.rooms[Object.keys(this.rooms)[Object.keys(this.rooms).length - 1]].AddClient(backendClient);
        socket.join(this.rooms[Object.keys(this.rooms)[Object.keys(this.rooms).length - 1]].id);
    } 

    disconnection(socket){
        console.log('Disconnected', socket.id);

        const room = this.clients[socket.id].room;
        this.rooms[room.id].RemoveClient(this.clients[socket.id]);

        delete this.clients[socket.id];
    }

    Update(){
        for (let room in this.rooms){
            this.rooms[room].Update();
        }
    }
}

class BackendClient{
    constructor(id, socket, room){
        this.id = id;
        this.socket = socket;
        this.room = room;

        this.name = 'Player_' + crypto.randomUUID();
        this.socket.emit('setName', this.name);

        this.socket.on('setName', (name) => {
            //check if name matches any other client name
            const names = Object.values(this.room.clients).map((client) => client.name);

            name = name.trim();
            if (name.length > 0 && !names.includes(name) && name !== 'Server'){
                this.name = name;
            }

            else{
                this.socket.emit('setName', this.name);
            }

            const newName = this.name.replaceAll(/\s/g, '_');
            if (newName !== this.name){
                this.name = newName;
                this.socket.emit('setName', this.name);
            }
        });

        this.ping = 0;

    }

    getPing(){
        const start = performance.now();
        this.socket.emit('ping', performance.now(), (err, data) => {
           this.ping = performance.now() - start;
        });
    }
}

class Game{
    constructor(room){
        this.room = room;
        this.grid = [];

        this.rows = 30;
        this.cols = 30;
        this.cellSize = 10;

        for (let i = 0; i < this.rows; i++){
            this.grid.push([]);
            for (let j = 0; j < this.cols; j++){
                this.grid[i].push(new Cell(i, j, this.cellSize));
                this.grid[i][j].live = Math.random() > 0.5;
            }
        }
    }

    Update(){
        this.grid = this.applyGameOfLifeRules();

        this.room.io.to(this.room.id).emit('gameUpdate', this.grid);
    }

    applyGameOfLifeRules(){
        const newGrid = []

        for (let i = 0; i < this.rows; i++){
            newGrid.push([]);
            for (let j = 0; j < this.cols; j++){
                newGrid[i].push(new Cell(i, j, this.cellSize));
                const cell = this.grid[i][j];

                newGrid[i][j].live = cell.live;

                const liveNeighbors = this.getLiveNeighbors(i, j);

                if (cell.live){
                    if (liveNeighbors < 2 || liveNeighbors > 3){
                        newGrid[i][j].live = false;
                    }
                }

                else{
                    if (liveNeighbors === 3){
                        newGrid[i][j].live = true;
                    }
                }
            }
        }

        return newGrid;
    }

    getLiveNeighbors(i, j){
        let liveNeighbors = 0;

        for (let x = -1; x <= 1; x++){
            for (let y = -1; y <= 1; y++){
                const neighborI = i + x;
                const neighborJ = j + y;

                if (neighborI >= 0 && neighborI < this.rows && neighborJ >= 0 && neighborJ < this.cols){
                    if (this.grid[neighborI][neighborJ].live){
                        liveNeighbors++;
                    }
                }
            }
        }


        if (this.grid[i][j].live){
           liveNeighbors--;
        }


        return liveNeighbors;
    }

}

class Cell{
    constructor(i, j, size){
        this.i = i;
        this.j = j;
        this.size = size;
        this.x = this.i * this.size;
        this.y = this.j * this.size;
        
        this.live = false;
    }
}


class ChatTracker{
    constructor(id, room, name){
        this.id = id;
        this.room = room;
        this.name = name;

        this.lastChatTime = null;
        this.chats = {}

        this.chatHistory = [];
        
        this.maxMessageFrequency = 15; // messages per minute
        this.maxMessageLength = 150;
        this.timeoutDuration = 1000 * 15; // 15 seconds (in milliseconds)
        
        this.isTimedOut = false;
    }

    newChat(message){
        return new Promise((resolve, reject) => {
            if (this.isTimedOut){
                return;
            }
    
            this.chatHistory.push({message, time: performance.now()});
    
            
    
            this.lastChatTime = performance.now();
            this.chats[this.lastChatTime] = message;
    
            let shouldTimeout = false;
    
    
            // Check if the user has typed too many messages in the last minute
            let messageCount = 0;
            for (let chat in this.chats){
                const MINUTE = 60000; // milliseconds
                if (this.lastChatTime - chat < MINUTE){
                    messageCount++;
                }
            }
    
            if (messageCount > this.maxMessageFrequency){
                shouldTimeout = true;
            }
    
    
            // Check if the message is too long
            if (message.length > this.maxMessageLength){
                shouldTimeout = true;
            }
    
    
    
            if (shouldTimeout){
                this.timeout();
                resolve(true);
            }

            else{
                // content moderation
                fs.readFile(path.join(__dirname, 'contentModeration/youtubeBannedWords.txt'), 'utf8', (err, data) => {
                    if (err){
                        console.error(err);
                        return;
                    }
        
                    const badWords = new Set(data.split(','));
                    const messageWords = message.split(' ');
        
                    for (let word of messageWords){
                        if (badWords.has(word)){
                            this.timeout();
                            resolve(true);
                            return;
                        }
                    }
                    
                    resolve(false);
                });
            }
            
        });
    }

    timeout(){
        this.room.io.to(this.room.id).emit('chatMessage', {
            name: 'Server',
            id: 'server',
            message: `${this.name} has been timed out for ${this.timeoutDuration / 1000} seconds`
        });

        this.isTimedOut = true;

        setTimeout(() => {
            this.lastChatTime = null;
            this.chats = {};
            this.isTimedOut = false;
        }, this.timeoutDuration);

       
    }

}

class Chat{
    constructor(room){
        this.room = room;
        this.messages = []


        this.messageTrackers = {};

        Object.values(this.room.clients).forEach((client) => {
            this.addClient(client);
        });
    }

    addClient(client){
        this.messageTrackers[client.id] = new ChatTracker(client.id, this.room, client.name);
        
        client.socket.on('chatMessage', (message) => {
            this.messageTrackers[client.id].name = client.name;
                
            
            this.messageTrackers[client.id].newChat(message).then((timedOut) => {
                if (timedOut){
                    return;
                }
                
                this.messages.push({
                    name: client.name,
                    id: client.id,
                    message: message
                });

                

                this.room.io.to(this.room.id).emit('chatMessage', {
                    name: client.name,
                    id: client.id,
                    message: message
                });
            });


 

            
        });
    }

    removeClient(client){
        client.socket.removeAllListeners('chatMessage');
        delete this.messageTrackers[client.id];
    }

}







const serverNetworkManager = new ServerNetworkManager(io);

io.on('connection', (socket) => {
    serverNetworkManager.connection(socket);

    socket.on('disconnect', () => {
        serverNetworkManager.disconnection(socket);
    });
});