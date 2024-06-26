
let gameGrid;
let chatWindow;
let networkManager;
let camera;


class NetworkManager{
    constructor(p5){
      this.p5 = p5;
      this.socket = io.connect('http://localhost:3000');
      this.client = new Client(p5, this.socket);

      this.socket.on('serverStartUp', (data) => {
        location.reload();
      });

      this.socket.on('ping', (data, callback) => {
        callback('pong');
      });
    }

    Update(){
      this.client.Update();
    }
}




const sketch = function(p5) {
  p5.setup = () => {
    p5.createCanvas(p5.windowWidth, p5.windowHeight);

    camera = new Camera(p5);
    networkManager = new NetworkManager(p5);

    networkManager.client.socket.on('createGameGrid', (data) => {
      gameGrid = new GameGrid(p5, data.width, data.height, data.cellSize);
    });
    

    const windowX = p5.windowWidth - 300;
    const windowY = 30;
    chatWindow = new ChatBox(p5, windowX, windowY, 300, p5.windowHeight - windowY);
    
  }


  p5.draw = () => {
    p5.noStroke();
    p5.background(255);
    camera.Update();
    networkManager.Update();
    
    if (gameGrid) gameGrid.Update();

    
    camera.endCamera();
    chatWindow.Update();
   
    
    
  }

  p5.mouseWheel = (event) => {
    const zoomSpeed = 5 ;
    grid1.zoom -= event.delta / 1000 * zoomSpeed;
  }

}



class GameGrid{
  constructor(p5, width, height, cellSize){
    this.p5 = p5;
    this.width = width;
    this.height = height;
    this.grid = [];

    this.cellSize = cellSize;

    

    for (let i = 0; i < height; i++){
      this.grid.push([]);
      for (let j = 0; j < width; j++){
        this.grid[i].push(new Cell(p5, j * this.cellSize, i * this.cellSize, this.cellSize, this.cellSize));
      }
    }

    this.networkManager.client.socket.on('gameUpdate', (data) => {
      
    });
  }

  GetCell(x, y){
    const i = Math.floor(y / this.cellSize);
    const j = Math.floor(x / this.cellSize);

    return this.grid[i][j];
  }

  Update(){

  }
  
}

class Cell{
  constructor(p5, x, y, w, h){
    this.p5 = p5;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }
}

class WallCell extends Cell{
  constructor(p5, x, y, w, h){
    super(p5, x, y, w, h);
  }
}

class MoverCell extends Cell{
  constructor(p5, x, y, w, h){
    super(p5, x, y, w, h);
  }
}

class RotatorCell extends Cell{
  constructor(p5, x, y, w, h){
    super(p5, x, y, w, h);
  }
}

class DuplicatorCell extends Cell{
  constructor(p5, x, y, w, h){
    super(p5, x, y, w, h);
  }
}

class ExlosionCell extends Cell{
  constructor(p5, x, y, w, h){
    super(p5, x, y, w, h);
  }
}




class Client{
  constructor(p5, socket){
    this.socket = socket;
    this.id = socket.id;
    this.name = '';
    this.p5 = p5;

    this.socket.on('setName', (name) => {
      this.name = name;
      console.log('name set to', `"${name}"`);


      if (this.nameButton){
        this.nameButton.value(this.name);
      }

      else{
        this.nameButton = this.p5.createInput(this.name);
        this.nameButton.value(this.name);

        this.nameButton.style('font-size', '20px');
        this.nameButton.style('position', 'absolute');
        this.nameButton.style('top', '0px');
        this.nameButton.style('right', '0px');
        this.nameButton.style('background', 'transparent');
        this.nameButton.style('border', 'none');
        this.nameButton.style('color', 'black');
        this.nameButton.style('z-index', '100');

        this.nameButton.position(this.p5.windowWidth - 300, 0)

        this.nameButton.changed(() => {
          this.name = this.nameButton.value();
          this.socket.emit('setName', this.name);
        });
      }

      
      
    });

    
  }

  Update(){
    // show player list on tab press
    if (this.p5.keyIsDown(71)){
      this.socket.emit('getPlayerList', '', (data) => {
        const playerNames = data.players;
        const pings = data.pings;

        if (this.playerListWindow){
          this.playerListWindow.remove();
        }

        this.playerListWindow = this.p5.createDiv();
        this.playerListWindow.size(600, 400);
        this.playerListWindow.position(this.p5.windowWidth/2 - 300, 30);
        this.playerListWindow.style('border', 'none');
        this.playerListWindow.style('overflow-y', 'hidden');
        this.playerListWindow.style('overflow-x', 'hidden');
        this.playerListWindow.style('z-index', '100');
        this.playerListWindow.style('padding', '10px');
        this.playerListWindow.style('font-size', '20px');
        this.playerListWindow.style('position', 'absolute');
        
        this.playerListWindow.style('background', 'rgba(240, 240, 240, 0.7)');


        for (let i = 0; i < playerNames.length; i++){
          
          const text = playerNames[i] + " - " + pings[i].toFixed(2) + "ms";
          let player = this.p5.createP(text);
          player.style('font-size', '20px');
          player.style('font-family', 'Arial');
          
          player.style('color', playerNames[i] === this.name ? 'blue' : 'black');

          player.style('margin', '10px');
          this.playerListWindow.child(player);
        }
          
      });
    }

    else if (this.playerListWindow){
      this.playerListWindow.remove();
    }
  }

}

class ChatBox{
  constructor(p5, x, y, w, h){
    this.p5 = p5;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.messages = [];

    this.isVisibile = true;

    this.maxMessagesOnScreen = 12;

    this.hideChatButton = this.p5.createButton('Hide Chat');
    this.hideChatButton.size(100, 20);
    this.hideChatButton.position(this.x + 10, this.y + this.h - 60);
    this.hideChatButton.mousePressed(() => {
      this.hidden = !this.hidden;
      this.hideChatButton.html(this.hidden ? 'Hide Chat': 'Show Chat');
    });

    
    this.inputBox = this.p5.createInput();
    this.inputBox.position(this.x + 10, this.y + this.h - 30);
    this.inputBox.size(this.w - 20, 20);
    this.inputBox.style('font-size', '20px');
    this.inputBox.style('position', 'absolute');
    this.inputBox.style('bottom', '0px');
    this.inputBox.style('background', 'transparent');
    this.inputBox.style('border', '1px solid black');
    this.inputBox.style('color', 'black');
    this.inputBox.style('z-index', '100');

    networkManager.client.socket.on('chatMessage', (message) => {
      console.log('new chat', message);

      // add newline characters to the message if it is too long
      for (let j = 0; j < message.message.length; j++){
        if (j === 0){
          message.message = '\n' + message.message;
          continue;
        }

        if (j % 30 === 0){
          if (message.message[j] !== ' '){
            for (let k = j; k > 0; k--){
              if (message.message[k] === ' '){
                message.message = message.message.substring(0, k) + '\n' + message.message.substring(k, message.message.length);
                break;
              }
            }
          }
          else{
            message.message = message.message.substring(0, j) + '\n' + message.message.substring(j, message.message.length);
          }
         
        }
      }

      this.AddMessage(message);
    });

  }

  AddMessage(message){
    this.messages.push(message);
  }

  SetMessages(messages){
    this.messages = messages;
  }

  Show(){
    if (!this.isVisibile){
      return;
    }
    
    const transparentColor = this.p5.color(240, 240, 240, 200);

    this.p5.fill(transparentColor);
    this.p5.rect(this.x, this.y, this.w, this.h);

    let yCounter = this.y + 20;
    for (let i = this.messages.length - this.maxMessagesOnScreen; i < this.messages.length; i++){
      if (i < 0){
        continue;
      }

      const bottomMargin = 75;
      if (yCounter > this.h - bottomMargin){
        this.messages.shift();
        continue;
      }

      this.p5.textSize(20);
      this.p5.fill(0);

      const maxLength = 25;
      let name = this.messages[i].name.length > maxLength ? this.messages[i].name.substring(0, maxLength) : this.messages[i].name;

      const splitText = this.messages[i].message.split(/\n/g);

      this.p5.push();

      this.p5.textFont('Arial');
      if (this.messages[i].name === "Server"){
        this.p5.textStyle(this.p5.BOLD);
        this.p5.fill("red");
        name = "SERVER"
      }

      else{
        this.p5.fill(this.messages[i].name === networkManager.client.name ? "blue" : "red");
      }

      this.p5.text(`${name}:`, this.x + 5, yCounter);

      this.p5.textStyle(this.p5.NORMAL);
      this.p5.fill(this.messages[i].name === "Server" ? "red": "black");
      for (let j = 0; j < splitText.length; j++){
        this.p5.text(`${splitText[j]}`, this.x + 5, yCounter);
        yCounter += 25;
      }

      this.p5.pop();

  
      yCounter += 10;
    }
  }

  Update(){
    this.Show();
    this.inputBox.changed(() => {
      networkManager.client.socket.emit('chatMessage', this.inputBox.value());
      this.inputBox.value('');
    });
  }

  set hidden(isHidden){
    this.isVisibile = isHidden;
    if (this.isVisibile){
      this.inputBox.show();
    }

    else{
      this.inputBox.hide()
    }
    
  }

  get hidden(){
    return this.isVisibile;
  }
}

class Camera{
  constructor(p5){
    this.p5 = p5;
    this.x = 0;
    this.y = 0;
    this.zoom = 1;

    this.controls = {
      up: false,
      down: false,
      left: false,
      right: false,
      zoomIn: false,
      zoomOut: false
    }

    window.addEventListener('keydown', (event) => {
      switch(event.key){
        case 'w':
          this.controls.up = true;
          break;
        case 's':
          this.controls.down = true;
          break;
        case 'a':
          this.controls.left = true;
          break;
        case 'd':
          this.controls.right = true;
          break;
        case 'q':
          this.controls.zoomOut = true;
          break;
        case 'e':
          this.controls.zoomIn = true;
          break;
      }
    });

    window.addEventListener('keyup', (event) => {
      switch(event.key){
        case 'w':
          this.controls.up = false;
          break;
        case 's':
          this.controls.down = false;
          break;
        case 'a':
          this.controls.left = false;
          break;
        case 'd':
          this.controls.right = false;
          break;
        case 'q':
          this.controls.zoomOut = false;
          break;
        case 'e':
          this.controls.zoomIn = false;
          break;
      }
    });


    window.addEventListener('mousedown', (event) => {
      if (event.button === 2){
        // add pointer lock 
        document.body.requestPointerLock();
        this.dragging = true;
      }

    });

    window.addEventListener('mouseup', (event) => {
      if (event.button === 2){
        // remove pointer lock
        document.exitPointerLock();
        this.dragging = false;
      }
    });

    window.addEventListener('mousemove', (event) => {
      if (this.dragging){
        this.x -= event.movementX;
        this.y -= event.movementY;
      }
    });


    window.addEventListener('wheel', (event) => {
      this.zoom -= event.delta / 1000;
    });
  }

  Update(){
    this.p5.push();
    //Controls for the camera
    if (this.dragging){
      if (this.controls.up){
        this.y += 5;
      }
  
      if (this.controls.down){
        this.y -= 5;
      }
  
      if (this.controls.left){
        this.x += 5;
      }
  
      if (this.controls.right){
        this.x -= 5;
      }

      
      if (this.controls.zoomIn){
        this.zoom += 0.01;
      }

      if (this.controls.zoomOut){
        this.zoom -= 0.01;
      }
    }
   


    this.zoom = this.p5.constrain(this.zoom, 0.1, 10);

    this.p5.translate(this.p5.width/2, this.p5.height/2);
    this.p5.scale(this.zoom);
    this.p5.translate(-this.p5.width/2, -this.p5.height/2);
    
    // orgin is center of screen

    this.offset = this.p5.createVector(0, 0);
    this.p5.translate(this.x + this.p5.width/2 + this.offset.x, this.y + this.p5.height/2 + this.offset.y);
  }

  screenToWorld(x, y){
    return this.p5.createVector((x - this.x - this.p5.width/2) / this.zoom, (y - this.y - this.p5.height/2) / this.zoom);
  }

  worldToScreen(x, y){
    const vector = this.p5.createVector(x * this.zoom + this.x, y * this.zoom + this.y);

    //clamp the vector to the screen
    vector.x = this.p5.constrain(vector.x, 0, this.p5.width);
    vector.y = this.p5.constrain(vector.y, 0, this.p5.height);

    return vector;
  }


  endCamera(){
    this.p5.pop();
  }

}


class GpuAccelleration{
  constructor(p5){
    this.p5 = p5;
    this.gpu = new GPU.GPU();

  }

  Update(){
    this.p5.push();
    this.p5.pop();
  }
}




window.addEventListener('load', () => {
  let gameWindowSketch = new p5(sketch);
});

































const gpu = new GPU.GPU();

const generateGameGrid = (width, height) => {
  const grid = [];
  for (let i = 0; i < height; i++){
    grid.push([]);
    for (let j = 0; j < width; j++){
      grid[i].push(Math.floor(Math.random() * 2));
    }
  }

  return grid;
}



function newGeneration(grid, width, height){
  const gameOfLife = gpu.createKernel(function(grid, width, height) {
    const x = this.thread.x;
    const y = this.thread.y;
    let numNeighbors = 0;
  
    for (let i = -1; i < 2; i++){
      for (let j = -1; j < 2; j++){

  
        const neighborX = x + i;
        const neighborY = y + j;
        
        if (neighborX >= 0 && neighborX < width && neighborY >= 0 && neighborY < height){
          numNeighbors += grid[neighborY][neighborX];
        }
  
      }
    }
  
  
    if (grid[y][x] === 1){
      numNeighbors -= 1;
      if (numNeighbors < 2 || numNeighbors > 3){
        return 0;
      }
  
      return 1;
    }
  
    else{
      if (numNeighbors === 3){
        return 1;
      }
  
      return 0;
    }


    
  }).setOutput([width, height]);
  

  return gameOfLife(grid, width, height);
}




  let oldGrid = generateGameGrid(1000, 1000);

  let loopProgress = [0, 0]

  let timeout;

  let gpuSketch = function(p5){
    p5.setup = () => {
      p5.createCanvas(p5.windowWidth, p5.windowHeight);
      p5.noStroke();
      
      p5.background(255);
    }

    p5.draw = () => {
      console.log(p5.frameRate());


      const generationsPerFrame = 1;
      let newGrid;

      for (let i = 0; i < generationsPerFrame; i++){
        try{
          newGrid = newGeneration(oldGrid, oldGrid[0].length, oldGrid.length);
          oldGrid = newGrid;
        }

        catch(e){
          newGrid = oldGrid;
          console.log(e);
        }
        
      }
       
      


    
      const start = performance.now();

      

      

      for (let i = loopProgress[0]; i < newGrid.length; i++){
        for (let j = loopProgress[1]; j < newGrid[i].length; j++){
          const size = 1;
          

          if (performance.now() - start > 1000/60){
            loopProgress = [i, j];
            return;
          }

          p5.fill(newGrid[i][j] === 1 ? 0 : 255);
          p5.rect(i * size, j * size, size, size);
          

          
        }

        loopProgress[1] = 0;
    
      }

      loopProgress = [0, 0];

      

     
      
      
      
    }
  }

  // let gpuSketchInstance = new p5(gpuSketch);
  