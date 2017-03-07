//array delle palline
var balls=[];

//dimensioni del canvas
var canvasX; 
var canvasY;

var i;

//timer inizio/fine
var start;
var end;
//framerate (numero di refresh al secondo)
var framert = 50;

var started;
var player;
var opponent;
var score1, score2;

var video;
var vScale=16;

//bottone switch camera/puntatore
var SB;
//array dei bottoni
var buttonsArray = [];

var slider;

//dimensioni del video catturato
var cols = 40;
var rows = 30;
//array dei pixel del video
var pixelArray = [];
//colore scelto per l'input video
var player1Color = 3; //1 = rosso, 2 = verde, 3 = blu
var player2Color = 1; //1 = rosso, 2 = verde, 3 = blu

var camMode = true; //uso la camera per l'input

//frame al secondo correnti
var fps;
var fpsText = "";

var DEBUG = false;
var DEBUG = true;
//var spawner = true; //spawna palline al movimento del puntatore
var spawner = false;

var textToPrint=""; //stringa di debug stampata ad ogni ciclo

var filteredPixelsY;
var filteredPixelsX;

var playingMode = 0; //0 = p1 vs cpu, 1 = p1 vs p2, 2 = cpu vs cpu

function setup() {
  score1=0;
  score2=0;
  started=false;
  if(!DEBUG){
    canvasY=windowHeight;
    canvasX=windowWidth;
  }
  else{
    canvasY=windowHeight-40;
    canvasX=windowWidth;
  }

  frameRate(framert);
  slider1 = createSlider(0, 1000, 600);

  createCanvas(canvasX, canvasY);
  player = new Player();
  player.setPosition(height/2);
  opponent = new Opponent();
  opponent.setPosition(height/2);
  
  //potrei voler inserire più sfere (a seconda della difficoltà)
  i=0;
  balls[i++] = new Ball();
  //balls.push(new Ball());
  
  pixelDensity(1);
  video = createCapture(VIDEO);
  video.size(cols, rows);
  slider = createSlider(0, 255, 110);
  video.hide();
  slider.hide();
  if(!DEBUG)
    slider1.hide();
  //SB = new ScreenButton();
}

function ScreenButton(x, y, sizeX, sizeY){
  this.x = x;
  this.y = y;
  this.sizeX = sizeX;
  this.sizeY = sizeY;
  this.function = null;

  this.hit = function(x, y){
    if((x>=this.x)&&(x<=this.x+this.sizeX)&&(y>=this.y)&&(y<=this.y+this.sizeY))
      this.function();
  }
}

function windowResized(){
  canvasY=windowHeight;
  canvasX=windowWidth;
  if(DEBUG)
    canvasY=canvasY-40;
  createCanvas(canvasX, canvasY);
  player.setPosition(height/2);
  opponent.setPosition(height/2);
  player.size=height/8;
  opponent.size=height/8;
  for (j=0;j<balls.length;j++){
    balls[j].x=width/2;
    balls[j].y=height/2;
  }
  redraw();
}

function mousePressed(){
  //fps = frameRate();
  textSize(20);
  //var fpsText = "FPS: " + fps.toFixed(2);
  var fpsTextWidth = textWidth(fpsText);
  //tasto CAM
  if((mouseX>fpsTextWidth+20)&&(mouseX<fpsTextWidth+20+40)&&(mouseY>height-30)&&(mouseY<height-5))
    camMode=!camMode;
  //tasto CPU/Player2
  else if((mouseX>fpsTextWidth+20+40)&&(mouseX<fpsTextWidth+20+40+40)&&(mouseY>height-30)&&(mouseY<height-5))
    playingMode=abs(playingMode-1);
  //click generico
  else if(started==false){
  	if((mouseX<=width)&&(mouseY<=height)){
  	  started=true;
      start = millis();
    }
  }
  else {
    balls[i++] = new Ball();
    opponent.incStrength();
  }

}
function mouseMoved(){
  if(!camMode)
    player.setPosition(mouseY);
  if(spawner){
    balls[i] = new Ball();
    balls[i++].setCoordinates(mouseX, mouseY);
  }
}

function draw() {
  background(50, 89, 100);
  //tint(50, 89, 100);
  video.loadPixels();

  var averageX1 = 0;
  var averageY1 = 0;
  var averageX2 = 0;
  var averageY2 = 0;
  var counterColor1 = 0;
  var counterColor2 = 0;

  var p1Ypixels = []; //array dei pixel accesi del giocatore
  var p1Xpixels = []; //array dei pixel accesi del giocatore

  var p2Ypixels = []; //array dei pixel accesi del giocatore
  var p2Xpixels = []; //array dei pixel accesi del giocatore


  //controllo l'array di pixel e assegno i valori nella matrice dei colori
  for (var y = 0; y < video.height; y++) {
    for (var x = 0; x < video.width; x++) {
      var index = (video.width - x -1 + (y * video.width))*4;
      var r = video.pixels[index+0];
      var g = video.pixels[index+1];
      var b = video.pixels[index+2];

      var soglia = slider1.value();
      var massimo = 140;
      
      //calcolo colori del pixel corrente
      var rVal = (r*2.3) + (255-(2*g)) + (255-(2*b));
      var gVal = (g*4.5) + (255-(2*r)) + (255-(2*b));
      var bVal = (b*2) + (255-(2*r)) + (255-(2*g));

      var checkIndex = x + y * cols;

      if((rVal>=soglia)&&(b+g<massimo))
        pixelArray[checkIndex]=1;
      else if((gVal>=soglia)&&(r+b<massimo))
        pixelArray[checkIndex]=2;
      else if((bVal>=soglia)&&(r+g<massimo))
        pixelArray[checkIndex]=3;
      else
        pixelArray[checkIndex]=0;
      
      var currentPixel = pixelArray[checkIndex];      
      if (currentPixel == player1Color){
        averageX1 += x;
        averageY1 += y;
        p1Ypixels[counterColor1] = y;
        p1Xpixels[counterColor1] = x;
        counterColor1++;
      }
      if (currentPixel == player2Color){
        averageX2 += x;
        averageY2 += y;
        p2Ypixels[counterColor2] = y;
        p2Xpixels[counterColor2] = x;
        counterColor2++;
      }

      //DEBUG
      if(DEBUG){
        noStroke();
        if (currentPixel==1)
          fill('red');
        else if(currentPixel==2)
          fill('green');
        else if(currentPixel==3)
          fill('blue');
        else
          fill(51);
        rect(x*10, y*10,10,10);
      }
    }
  }
  
  var ratio=2; //quanti pixel accesi considero per la media?
  
  //calcolo il movimento a seconda di quello che ha rilevato la camera
  if(counterColor1!=0){
    averageY1=(averageY1/counterColor1);
    averageX1=(averageX1/counterColor1);
    //textToPrint=averageX1 + " " + averageY1;

    //FILTRO
    filteredPixelsY = [];
    filteredPixelsX = [];
    var counter=0;
    //prendo i pixel più vicini alla media
    for(var f=0; f<parseInt(counterColor1/ratio); f++){
      console.log("P1 " + parseInt(counterColor1/ratio));
      var closest = 0;
      var dist = Math.abs(p1Ypixels[0]-averageY1)+Math.abs(p1Xpixels[0]-averageX1);
      //textToPrint=dist;
      //prendo il pixel più vicino alla media 
      for(var k=1; k<counterColor1-f; k++){
        var thisDist = Math.abs(p1Ypixels[k]-averageY1)+Math.abs(p1Xpixels[k]-averageX1);
        if(thisDist<dist){
          dist=thisDist;
          closest=k;
        }
      }
      filteredPixelsY[counter]=p1Ypixels[closest];
      filteredPixelsX[counter]=p1Xpixels[closest];
      counter++;
      p1Ypixels.pop(closest);
      p1Xpixels.pop(closest);
    }
    averageY1=0;
    averageX1=0;
    //console.log(filteredPixelsX[1]);
    for(var n=0; n<counter; n++){
      if(DEBUG){
        fill('yellow');
        rect(filteredPixelsX[n]*10, filteredPixelsY[n]*10,10,10);
      }
      averageY1+=filteredPixelsY[n];
      averageX1+=filteredPixelsX[n];
    }
    averageY1=(averageY1/parseInt(counterColor1/ratio))*(height/rows);
    averageX1=(averageX1/parseInt(counterColor1/ratio))*(width/cols);
    textToPrint="AVG X = " + averageX1 + "\nAVG Y = " + averageY1 + "\nRATIO = " + parseInt(counterColor1/ratio);

    end = millis();
    if(counter>0)
      player.Slide(averageY1);
  }

  //stessa cosa per player 2
  if((counterColor2!=0)&&(playingMode==1)){
    averageY2=(averageY2/counterColor2);
    averageX2=(averageX2/counterColor2);

    //FILTRO
    filteredPixelsY = [];
    filteredPixelsX = [];
    var counter=0;
    //prendo i pixel più vicini alla media
    for(var f=0; f<parseInt(counterColor2/ratio); f++){
      console.log(parseInt(counterColor2/ratio));
      var closest = 0;
      var dist = Math.abs(p2Ypixels[0]-averageY2)+Math.abs(p2Xpixels[0]-averageX2);
      //textToPrint=dist;
      //prendo il pixel più vicino alla media
      for(var k=1; k<counterColor2-f; k++){
        var thisDist = Math.abs(p2Ypixels[k]-averageY2)+Math.abs(p2Xpixels[k]-averageX2);
        if(thisDist<dist){
          dist=thisDist;
          closest=k;
        }
      }
      filteredPixelsY[counter]=p2Ypixels[closest];
      filteredPixelsX[counter]=p2Xpixels[closest];
      counter++;
      p2Ypixels.pop(closest);
      p2Xpixels.pop(closest);
    }
    averageY2=0;
    averageX2=0;
    //console.log(filteredPixelsX[1]);
    for(var n=0; n<counter; n++){
      if(DEBUG){
        fill('white');
        rect(filteredPixelsX[n]*10, filteredPixelsY[n]*10,10,10);
      }
      averageY2+=filteredPixelsY[n];
      averageX2+=filteredPixelsX[n];
    }
    averageY2=(averageY2/parseInt(counterColor2/ratio))*(height/rows);
    averageX2=(averageX2/parseInt(counterColor2/ratio))*(width/cols);
    textToPrint="AVG X = " + averageX2 + "\nAVG Y = " + averageY2 + "\nRATIO = " + parseInt(counterColor2/ratio);

    end = millis();
    if(counter>0)
      opponent.Slide(averageY2);
  }
  //calcolo il movimento del player2
  /*if(counterColor1!=0){
  	averageY2=averageY2*2*vScale/counterColor2;
  	//averageX2=averageX2*2*vScale/counterColor2;
  	end = millis();
    player.Slide(averageY1);
  }*/

  //disegno FPS e bottoni
  fps = frameRate();
  fill(255);
  stroke(0);
  textSize(20);
  fpsText = "FPS: " + fps.toFixed(2);
  var fpsTextWidth = textWidth(fpsText);
  text(fpsText, 10, height - 10);
  //tasto player1
  rect(fpsTextWidth+20, height-30, 40, 25, 30, 0, 30, 0);
  fill("red");
  if(camMode){
    textSize(16);
    text("CAM", fpsTextWidth+22, height-10);
  }
  else{
  	textSize(17);
    text("PTR", fpsTextWidth+24, height-10);
  }
  //tasto player2
  fill("white");
  rect(fpsTextWidth+20+40+5, height-30, 40, 25, 0, 30, 0, 30);
  fill("red");
  if(playingMode==1){
    textSize(16);
    text("CAM", fpsTextWidth+20+40+5+2, height-10);
  }
  else{
    textSize(17);
    text("CPU", fpsTextWidth+20+40+5+2, height-10);
  }
  fill("white");

  //disegno pannello punteggio
  textSize(40);
  var textScore=score1 + " - " + score2;
  var textLen=textWidth(textScore);
  text(textScore, width/2-textLen/2, 40);
  rect((width/2-textLen/2)-45, 0, 40, 45, 0, 0, 0, 30);
  rect((width/2+textLen/2)+5, 0, 40, 45, 0, 0, 30, 0);
  line((width/2-textLen/2)-5, 45, (width/2+textLen/2)+5, 45);
  
  //calcolo movimento e disegno sfere
  if(started==true){
	  end = millis();
	  for (var j=0; j<balls.length; j++){
	    var n = balls[j];
	    n.move();
	    n.display();
	  }
  }
  else{
  	for (var j=0; j<i; j++){
	    var n = balls[j];
	    n.display();
	  }
  }
  if(playingMode!=1)
    opponent.move();
  player.display();
  opponent.display();
  start = millis();
  if(DEBUG)
    text(textToPrint, 5, (rows*10)+40);
}

function Player(){
  //this.position = mouseY;
  this.size=height/8;
  this.speed=height/0.5;

  this.setPosition = function(y){
    if(y-(this.size/2)>0){
      if(y+(this.size/2)<height)
        this.y=y;
      else
        this.y=height-(this.size/2);
    }
    else
      this.y=this.size/2;
  }

  this.Slide = function(y){
  	//filtro
  	if(camMode)
  	  if((y>this.y-20)&&(y<this.y+20));
      else{
        var delta = (this.speed*(end-start)/1000);
        if(y<this.y-delta){
          this.setPosition(this.y-delta);
          if(!started)
            start = millis();
        }
    	  else if(y>this.y+delta){
          this.setPosition(this.y+delta);
    	  }
    	  else{
  	    this.setPosition(y);
    	  }
    	}
  }

  this.display = function() {
    stroke(0, 255, 0);
    strokeWeight(2);
    //ellipse(this.x, this.y, this.diameter, this.diameter);
    //rect(10, this.y-(this.size/2), 20, this.size, 5);
    rect(10, this.y-(this.size/2), 20, this.size, 2, 20, 20, 2);
  }
};

function Opponent(){
  this.position = mouseY;
  this.size=height/8;
  this.sizeX=20;
  this.speed=height/5;
  this.strength=0;

  this.setPosition = function(y){
    if(y-(this.size/2)>0){
      if(y+(this.size/2)<height)
        this.y=y;
      else
        this.y=height-(this.size/2);
    }
    else
      this.y=this.size/2;
  }
  this.incStrength = function(){
    this.strength += 10;
  }
  
  this.move = function(){
  	if(balls.length>0){
      var b = balls[0];

  	for(var i=1; i<balls.length; i++)
      if(balls[i].x>b.x)
        b = balls[i];
    if(playingMode == 0)
      var delta = (this.speed+this.strength)*(end-start)/1000;
    else
      var delta = (height/0.5)*(end-start)/1000;
  	if(!started)
      end = millis();
  	if(b.x>1+width/2){
      //se gioca la CPU mi muovo a seconda della sua "forza" 
      if(playingMode == 0){
        if(b.y<this.y-delta){
          this.setPosition(this.y-delta);
    	  }
    	  else if(b.y>this.y+delta){
          this.setPosition(this.y+delta);
    	  }
    	  else{
  	    this.setPosition(b.y);
    	  }
      }
      //altrimenti mi muovo a seconda della posizione rilevata dalla camera
    }
    else
      this.Slide(height/2);}
  }

  this.Slide = function(y){
    if(playingMode == 0)
  	  var delta = ((this.speed+this.strength)*(end-start)/1000);
    else
      var delta = (height/0.5)*(end-start)/1000;
    if(y<this.y-delta){
      this.setPosition(this.y-delta);
      //start = millis();
    }
  	else if(y>this.y+delta){
      this.setPosition(this.y+delta);
  	}
  	else{
	  this.setPosition(y);
  	}
  }

  this.display = function() {
    stroke(255, 0, 0);
    strokeWeight(2);
    //ellipse(this.x, this.y, this.diameter, this.diameter);
    //rect(width-this.sizeX-10, this.y-(this.size/text("COORD " + this.x + " " + this.y, 300, 300)2), this.sizeX, this.size, 5);
    rect(width-this.sizeX-10, this.y-(this.size/2), this.sizeX, this.size, 20, 2, 2, 20);

  }
};

function Ball() {
  this.x = width/2;
  this.y = height/2;
  this.diameter = 20;

  this.assignSpeed = function(){
    this.speedX = random(-250, 250);
    	while ((this.speedX>=-80)&&(this.speedX<=80))
        this.speedX = random(-250, 250);
    this.speedY = random(-200, 200);
  }
  this.assignSpeed();

  this.move = function() {
  	if(start){
  		var k=0;
	    this.x += this.speedX*(end-start)/1000;
	    this.y += this.speedY*(end-start)/1000;
	    //controllo collisione con giocatore
	    if((this.x-(this.diameter/2)<=30)&&(this.x-(this.diameter/2)>0)){
	      if((this.y>(player.y-player.size/2)) && (this.y<(player.y+player.size/2))){
	      	if(this.speedX<0){
	      	  this.speedX=-this.speedX;
	      	  if(this.y-player.y>0)
	      	    k=1;
	      	  else if(this.y-player.y<0)
	      	    k=-1;
	      	  //textToPrint="y= " + this.y + "\nk= " + k + "\ny-oppy= " + (this.y-player.y) + "\ndelta= " + (k * pow((this.y-player.y),2) + "\n speed= " + this.speedY + "\nnewspeed= " + (this.speedY + (k * pow((this.y-player.y),2))));
	      	  this.speedY = this.speedY + (k * pow((this.y-player.y),2));
	      	  if(this.speedY > this.speedX*2.5)
	      	    this.speedY = this.speedX*2.5;
	      	  else if(this.speedY < -this.speedX*2.5)
	      	    this.speedY = -this.speedX*2.5;
	        }
	      }
	    }
	    //controllo collisione con computer
	    else if((this.x+(this.diameter/2)>=width-30)&&(this.x+(this.diameter/2)<width)){
	      if((this.y>(opponent.y-opponent.size/2)) && (this.y<(opponent.y+opponent.size/2))){
	      	if(this.speedX>0){
	      	  this.speedX=-this.speedX;
	      	  if(this.y-opponent.y>0)
	      	    k=1;
	      	  else if(this.y-opponent.y<0)
	      	    k=-1;
	      	  this.speedY = this.speedY + (k * pow((this.y-opponent.y),2));
	      	  if(this.speedY < this.speedX*2.5){
	      	    this.speedY = this.speedX*2.5;
	      	}
	      	  else if(this.speedY > -this.speedX*2.5)
	      	    this.speedY = -this.speedX*2.5;
	        }
	      }
	    }
	    //controllo collisione con le pareti
	    if(this.y-(this.diameter/2)<=0){
	      if(this.speedY<0)
	        this.speedY=-this.speedY;
	    }
        else if(this.y+(this.diameter/2)>=canvasY){
	      if(this.speedY>0)
	        this.speedY=-this.speedY;
	    }
        //controllo goal
	    if(this.x-(this.diameter/2)<=-this.diameter-5){
          score2++;
          /*this.x=width/2;
          this.y=height/2;
          this.assignSpeed();*/
          //rimuovo la palla, se era l'ultima fermo il timer
          i--;
          balls.splice(balls.indexOf(this),1);
          if(balls==[]){
            balls[0]=new Ball();
            started=false;
          }
          //started=false;
	    }
	    else if(this.x+(this.diameter/2)>=canvasX+this.diameter+5){
          score1++;
          /*this.x=width/2;
          this.y=height/2;
          this.assignSpeed();*/
          //rimuovo la palla, se era l'ultima fermo il timer
          i--;
          balls.splice(balls.indexOf(this),1);
          if(balls==[]){
            balls[0]=new Ball();
            started=false;
          }

          //started=false;
	    }
	}
  };
  
  this.setCoordinates = function(x, y){
    this.x = x;
    this.y = y;
    this.hit = 2;
  }

  this.display = function() {
    stroke(255, 204, 0);
    strokeWeight(2);
    ellipse(this.x, this.y, this.diameter, this.diameter);
  }
};

function Bars(){
	this.setCoordinates = function(x,y){
    this.x = x;
    this.y = y;
    this.hitsLeft = 3;
	}

  this.setHeight = function(){
    this.heigth = heigth/12;
  }

  this.hit = function(){
    this.hitsLeft--;
  }

  this.display = function(){
    noStroke();
    if(this.hitsLeft>2){
      fill('blue');
      rect(x, y, 20, this.height, 5);
    }
    else if(this.hitsLeft>1){
      fill('orange');
      rect(x, y, 20, this.height, 5);
    }
    else{
      fill('red');
      rect(x, y, 20, this.height, 5);
    }
  }
};