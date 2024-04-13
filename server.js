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
    }

    AddClient(client){
        this.clients[client.id] = client;
    }

    RemoveClient(client){
        delete this.clients[client.id];
    }
}

class ServerNetworkManager{
    constructor(io){
        this.io = io;

        this.clients = {};
        this.rooms = {};
        
        setInterval(this.Update, 1000/60);
    }

    connection(socket){
        console.log('New connection', socket.id);
        this.clients[socket.id] = socket;
    }

    disconnection(socket){
        console.log('Disconnected', socket.id);
        delete this.clients[socket.id];
    }

    Update(){
        
    }
}

class Game{
    constructor(){
        
    }
}





const serverNetworkManager = new ServerNetworkManager(io);

io.on('connection', (socket) => {
    serverNetworkManager.connection(socket);

    socket.on('disconnect', () => {
        serverNetworkManager.disconnection(socket);
    });
});