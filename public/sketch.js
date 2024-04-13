
let grid1;
let networkManager;

class NetworkManager{
    constructor(){
      this.socket = io.connect('http://localhost:3000');
    }

    Update(){
      
    }
}




const sketch = function(p5) {
  p5.setup = () => {
    p5.createCanvas(p5.windowWidth, p5.windowHeight);
    networkManager = new NetworkManager();
    grid1 = new Grid(p5, 65, 65);
    p5.background(255);
    p5.noStroke();
  }

  p5.draw = () => {
    p5.noStroke();
    p5.background(255);
    networkManager.Update();
    grid1.Update();
  }

  p5.mouseWheel = (event) => {
    const zoomSpeed = 5 ;
    grid1.zoom -= event.delta / 1000 * zoomSpeed;
  }

}



class Grid{
  constructor(p5, rows, cols){
    this.p5 = p5;
    this.rows = rows;
    this.cols = cols;

    this.defaultSize = 10;


    this.grid = [];
    this.positionType ='middle';
    this.#initGrid();

    this.p5.frameRate(20);
    
  }

  #initGrid(){
    for (let i = 0; i < this.rows; i++){
      this.grid.push([]);
      for (let j = 0; j < this.cols; j++){
        this.grid[i].push(new Cell(this.p5, i, j, this.defaultSize));
        this.grid[i][j].live = Math.random() > 0.5 ? true : false;

      }
    }
    

    // this.grid[9][10].live = true;
    // this.grid[10][10].live = true;
    // this.grid[11][10].live = true;
    // this.grid[9][11].live = true;

    // this.grid[10][12].live = true;  
  }



  #conwayRules(){
    const newGrid = [];
    for (let i = 0; i < this.rows; i++){
      newGrid.push([]);
      for (let j = 0; j < this.cols; j++){
        let liveNeighbors = 0;
        
        for (let x = -1; x < 2; x++){
          for (let y = -1; y < 2; y++){
            if (i + x >= 0 && i + x < this.rows && j + y >= 0 && j + y < this.cols){
              if (this.grid[i + x][j + y].live){
                liveNeighbors++;
              }
            }
          }
        }

        // Subtract the cell itself
        if (this.grid[i][j].live){
          liveNeighbors--;
        }
        
        const cell = new Cell(this.p5, i, j, this.defaultSize);
        cell.live = this.grid[i][j].live;
        if (this.grid[i][j].live){
          if (liveNeighbors < 2 || liveNeighbors > 3){
            cell.live = false;
          }
        } 
        else {
          if (liveNeighbors === 3){
            cell.live = true;
          }

          else{
            cell.live = false;
          }
        }

        newGrid[i].push(cell);
      }
    }
    this.grid = newGrid;
  }

  Update(){
    for (let i = 0; i < this.rows; i++){
      for (let j = 0; j < this.cols; j++){
        this.grid[i][j].Show();
      }
    }

    this.#conwayRules();

  }


}


class Cell{
  constructor(p5, i, j, size){
    this.p5 = p5;
    this.i = i;
    this.j = j;
    this.size = size;
    this.x = this.i * this.size;
    this.y = this.j * this.size;
    this.live = false;
  }

  Show(){

    this.x = Math.floor(this.x);
    this.y = Math.floor(this.y);

    this.p5.fill(this.live ? 0 : 255);
    this.p5.rect(this.x, this.y, this.size, this.size);
  }
}


window.addEventListener('load', () => {
  let gameWindowSketch = new p5(sketch);
});