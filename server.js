const express = require('express');
const app = express();
const port = 3000;

app.use(express.static('public'));

const server = app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});


const socket = require('socket.io');
const io = socket(server);






class Room{
    constructor(id){
        this.id = id;
        this.clients = {};

        this.game = new Game();
    }

    AddClient(client){
        this.clients[client.id] = client;
    }

    RemoveClient(client){
        delete this.clients[client.id];
    }

    Update(){
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
        }, 1000/20);
    }

    connection(socket){
        console.log('New connection', socket.id);

        if (Object.keys(this.clients).length % 5 === 0){
            const room = new Room('room' + Object.keys(this.rooms).length);
            this.rooms[room.id] = room;
        }

        const backendClient = new BackendClient(socket.id, socket, this.rooms[Object.keys(this.rooms)[Object.keys(this.rooms).length - 1]]);

        this.clients[socket.id] = backendClient;
        
        this.rooms[Object.keys(this.rooms)[Object.keys(this.rooms).length - 1]].AddClient(backendClient);

        console.log(this.rooms)
    } 

    disconnection(socket){
        console.log('Disconnected', socket.id);
        

        const room = this.clients[socket.id].room;
        this.rooms[room.id].RemoveClient(this.clients[socket.id]);

        delete this.clients[socket.id];
    }

    Update(){
        for (let room in this.rooms){
            this.rooms[room].game.Update();
        }
    }
}

class BackendClient{
    constructor(id, socket, room){
        this.id = id;
        this.socket = socket;
        this.room = room;

        this.name = 'player ' + crypto.randomUUID();
        this.socket.emit('setName', this.name);
    }
}

class Game{
    constructor(){

    }

    Update(){
        //console.log('update')
    }
}





const serverNetworkManager = new ServerNetworkManager(io);

io.on('connection', (socket) => {
    serverNetworkManager.connection(socket);

    socket.on('disconnect', () => {
        serverNetworkManager.disconnection(socket);
    });
});