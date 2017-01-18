window.onload = function() {
  const canvas = document.querySelector('canvas');
  const paddingEq = 50;
  //app-wide vars
  let CS={strokeS:'', fillS:'', lineW:'4', lOpacity:'1', blendMode:'source-over', brushSize:'10', tool:'',
  contDraw:false, drawRate:'100', lastDrawn:Date.now(), undoState:0, undoArr:[], isDrawing:false, modal:false};
  //rate: 1000 means one draw per second, 100 means 10/second, 10 means 100/second, basically infinite
  //fires per second: can also have option to "override" fires-per-second if e.movementX/e.movementY over threshold

  function randomizeParameters() {
    CS.strokeS=randomRGBA();
    CS.fillS=randomRGBA();
    CS.lineW=Math.floor(Math.random()*9)+1;
    CS.brushSize=Math.floor(Math.random()*99)+1;
    updateControls();
  //  canvas.dispatchEvent(new Event('mousemove')); // trigger updating in place of the brush on the preview layer
    //TODO trigger redraw "in-place" on new random event
  }

  function opacity(change) { //steps of 0.05, min of 0 and max of 1.0
    if (change==='down') { (CS.lOpacity>0.05) ? CS.lOpacity-=0.05 : CS.lOpacity=0.05; }
    if (change==='up') { (CS.lOpacity<0.95) ? CS.lOpacity+=0.05 : CS.lOpacity=1; }
    document.querySelector('input#layerOpacity').value=CS.lOpacity;
  }

  function updateControls() { //calls every input on page and updates to be equal to CS or canvasstate
    document.querySelector('input#fillStyle').value=rgbaToHex(CS.fillS);
    document.querySelector('input#strokeStyle').value=rgbaToHex(CS.strokeS);
    document.querySelector('input#lineWidth').value=CS.lineW;
    document.querySelector('input#layerOpacity').value=CS.lOpacity;
    document.querySelector('input#drawRate').value=CS.drawRate;
    document.querySelector('input#brushSize').value=CS.brushSize;
  }

  canvas.height=window.innerHeight-paddingEq;
  canvas.width=window.innerWidth-paddingEq;
  let ctx = canvas.getContext('2d', {alpha:true});
  ctx.clearRect(0,0,canvas.width,canvas.height);

  ctx.imageSmoothingEnabled=true;
  if(window.INITIAL_STATE.CANVAS!=='')
    {
      //TODO : put in flag that we are editing
      //TODO : give option to "save-as" or "overwrite" previous image
      loadImage(window.INITIAL_STATE.CANVAS);
    }
  console.log(window.INITIAL_STATE);
  window.addEventListener('resize',resizeCanvas);

  //TODO we need the function to remember if the current canvas already exists and thus not save it as a duplicate
  //TODO: share drawings w/ friendz

  function resizeCanvas() { //TODO: better (read: NONDESTRUCTIVE! resize handling)
  let current=canvas.toDataURL(); //save current state
  canvas.height=window.innerHeight-paddingEq; //resize erases
  canvas.width=window.innerWidth-paddingEq;
  mouseLayer.height=canvas.height;
  mouseLayer.width=canvas.width;
  let iObj=new Image();
  iObj.src=current;
  ctx.drawImage(iObj,0,0);//redraw
  updateModalCoords(); // if modal exists update coordinates
}

  function clearCanvas() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    mouseCtx.clearRect(0,0,canvas.width,canvas.height);
  }

  function randomRGBA(trans=1.0) { //Math.random()*(max-min)+min
    return 'rgba('+Math.floor(Math.random()*255)+','+Math.floor(Math.random()*255)+','+Math.floor(Math.random()*255)+','+trans+')';
  }

  function picGen() {return document.querySelector('canvas.drawing').toDataURL("image/png");}

  //Create a picture button
  document.querySelector('#picMe').addEventListener('click',function(){window.open(picGen())});
  //IMGUR button
  document.querySelector('#imGrr').addEventListener('click',function(){uploadToImgur(picGen());});
  //CLEAR button
  document.querySelector('#clear').addEventListener('click',()=>clearCanvas());
  //savefile button
  document.querySelector('#saveFile').addEventListener('click',()=>saveFile());
  //loadimage button
  document.querySelector('#loadImage').addEventListener('click',()=>loadImage());
  //randomize canvas parameters
  document.querySelector('#randomizeParameters').addEventListener('click',()=>randomizeParameters());
  //random background from UNSPLASH.it
  document.querySelector('#randomBackground').addEventListener('click',()=>randomBackground());
  //filter from filters.svg
  document.querySelector('#filterIt').addEventListener('click',filterHandler);
  //undo and redo
  document.querySelectorAll('button.timeframe').forEach((b)=>b.addEventListener('click',undoRedo));
  //upload fileData
  document.querySelector('input#imageUpload').addEventListener('change',fileUploadHandler);

  //LOG OUT
  document.querySelector('button#logOut').addEventListener('click',logOut);

  function logOut() {
    let mContent=`<div class="modalContents"><span id="closeBox"><button id="killModal">X</button></span><h1>WOW AN EXCITING MODAL</h1><p><img src="/assets/images/look.png"></p><p><button id="killModal">KILL THE MODAL</button></p></div>`;
    //req.session=null; //TODO undefined?
    popModal(mContent);
  }

  function fileUploadHandler() { //TODO
    let file=this.files[0]
    let extension=file.type.split("/")[0];
    if (extension==='image') { // validate that user didn't mess with the form file upload
      let img = new Image(); //TODO add max dimesions and scale otherwise or say it's too large
      img.onload = function() { //TODO layer dimension "sync" or other change function, even an onChange listener
        canvas.height=img.height;
        canvas.width=img.width;
        mouseLayer.height=canvas.height;
        mouseLayer.width=canvas.width;
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(img.src); //prevent memory leakage (thanks StackOverflow!)
      };
      img.src = URL.createObjectURL(file);
    }
  }

  function undoRedo(e, data) {
    console.log('undoredo fn e:'+e+' data:'+data);
    if(!e) { //push data, add max size for array here
      CS.undoArr.push(data);
      CS.undoState=CS.undoArr.length-1;
    }
    else if (e.target.id==='undo') {
      if (!CS.undoArr.length) { return false; }
      if (CS.undoState>=0) {
        console.log(CS.undoState);
        console.log(CS.undoArr.length);
        console.log(CS.undoArr[0]);
        (CS.undoState===0) ? 0 : CS.undoState--;
        clearCanvas();
        ctx.putImageData(CS.undoArr[CS.undoState], 0, 0);
      }
    }
    else if (e.target.id==='redo') {
      if (!CS.undoArr.length) { return false; }
      if (CS.undoState<(CS.undoArr.length-1)) {
        ctx.putImageData(CS.undoArr[CS.undoState], 0, 0);
        CS.undoState++;
      }
    }
  }

  function filterHandler() {
    // e.g.: filterIt('grayscale(100%)',1.0, {xI:canvas.width/2-200, xF:canvas.width/2+400, yI:canvas.height/2-200, yF:canvas.height/2+400});
    filterIt(null,1.0,null,mouseCtx);
  }

  function filterIt(filterAction,filterOpacity,area,context) { //region is a xi,yi,xF,yF rect to which we should apply the filter
      let currentAlpha=context.globalAlpha;
      let filteredImage=document.createElement('canvas');
      let filterCtx=filteredImage.getContext('2d');
      filteredImage.width=canvas.width;
      filteredImage.height=canvas.height;
      if (area) {
        filterCtx.save();
        filterCtx.beginPath();
        filterCtx.rect(area.xI,area.yI,(area.xF-area.xI),(area.yF-area.yI)); //x, y, width, height
        filterCtx.clip();
      }
      filterCtx.setTransform(1, 0, 0, -1, 0, 0);
      //filterCtx.filter=filterAction;
      //filterCtx.globalAlpha=filterOpacity;
      filterCtx.drawImage(canvas, 0, 0); // draw existing canvas to canvas copy with filter
      context.globalAlpha=filterOpacity;
      context.drawImage(filteredImage, 0, 0); // copy down filter to current canvas
      filterCtx.filter=""; // reset filter
      context.globalAlpha=currentAlpha; // reset opacity
    }

  //  ctx.filter=`grayscale(50%)`; //url("/assets/filters.svg#Gothamish")`;

  //tool selector
  let tools=document.querySelectorAll('button.tool');
  tools.forEach((t)=>t.addEventListener('click',changeTool));

  function changeTool(e) { CS.tool=e.target.id; console.log(CS.tool); }

  function randomBackground() {
    var imgBack = new Image();
    imgBack.onload = function() {
      ctx.drawImage(imgBack, 0, -imgBack.height);
    };
    imgBack.src = '/assets/images/out.jpeg';
  //TODO implement unsplash.it API maybe to do this.
  //this should be done server-side instead of client-side so the API keys aren't exposed derrr
  }

  /*CONTROLS FOR CANVAS STUFF */
  //colorpicker
  let colorPickers=document.querySelectorAll('input[type=color]');
  colorPickers.forEach((c)=>c.addEventListener('change',changeColor));
  //lineWidth
  let sliders=document.querySelectorAll('input[type=range]');
  sliders.forEach((s)=>s.addEventListener('change',changeSliders))
  //blendMode
  document.querySelector('#blendMode').addEventListener('change',blendMode);
  //filterMode
  document.querySelector('#filterMode').addEventListener('change',filterMode);
  //rotateCanvas
  document.querySelector('#rotateCanvas').addEventListener('change',rotateCanvas);
  //brush size
  document.querySelector('input#brushSize').addEventListener('change',function (e) { console.log(e); CS.brushSize=e.target.value; });

  function changeColor(e) {
    console.log(e);
    if (e.target.id==='fillStyle') { CS.fillS=e.target.value; }
    if (e.target.id==='strokeStyle') { CS.strokeS=e.target.value; }
  }

  function changeSliders(e) {
    console.log(e);
    if (e.target.id==='lineWidth') {
      let v=e.target.valueAsNumber;
      (v>0) ? CS.lineW=v : CS.lineW=0.01;
      mouseCtx.lineWidth=CS.lineWidth;
    }
    if (e.target.id==='layerOpacity') {CS.lOpacity=e.target.valueAsNumber; }
    if (e.target.id==='brushSize') {CS.brushSize=e.target.valueAsNumber;}
    if (e.target.id==='drawRate') {CS.drawRate=(1/e.target.valueAsNumber)*10000;}
  }

  function blendMode(e) {
    CS.blendMode=e.target.value;
    mouseCtx.globalCompositeOperation=CS.blendMode;
  }

  function filterMode(e) {
    console.log(e.target.value);
  }

  function rotateCanvas(e) {
    if (e.target.value==='default') { return false; } //no selection made
    //we have to rotate about the CENTER of the image, not the corner
    //otherwise you just rotate the image off the screen!
    //options look like value="90-cw" for 90 degrees clockwise
    //or like "mirror-horizontal" for mirroring about the Y-axis
    let rotated=document.createElement('canvas');
    let rotCtx=rotated.getContext('2d');
    rotated.width=canvas.width;
    rotated.height=canvas.height;
    //make copy of canvas that we use for either type of transformation
    rotCtx.save(); //save off original
    console.log(e.target.value);
    let mag=e.target.value.split("-")[0];
    let orient=e.target.value.split("-")[1];
    if (mag!=='mirror') { //it's a rotation
      orient=Number(orient.replace(/ccw/,-1).replace(/cw/,1)); //clockwise is positive, ccw negative
      console.log(orient+" "+mag);
      let rotVal = (orient*mag)*Math.PI/180; //orient*mag gives degrees&directions, convert to radians
      rotCtx.translate(canvas.width/2,canvas.height/2); //CRUCIAL!
      rotCtx.rotate(rotVal);
      console.log(rotVal);
      rotCtx.drawImage(canvas, -canvas.width/2, -canvas.height/2, canvas.width, canvas.height); //TODO recalculate width and height
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(rotated, 0, 0);
      }
      //horizontal or vertical mirror
    else { //here we translate the context to either the far right or far top of the screen, then flip back or down to mirror
      console.log(orient);
      if (orient==='horizontal') {
        rotCtx.translate(canvas.width, 0);
        rotCtx.scale(-1, 1);
        rotCtx.drawImage(canvas, 0, 0); //TODO recalculate width and height
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(rotated, 0, 0);
      }
      else { //mirror vertical
        rotCtx.translate(0, canvas.height);
        rotCtx.scale(1, -1);
        rotCtx.drawImage(canvas, 0, 0); //TODO recalculate width and height
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(rotated, 0, 0);
      }
    }
    rotCtx.restore();
  }

  //login status div
  let lastVisit = new Date(window.INITIAL_STATE.LAST_VISITED);
  let hours = lastVisit.getHours();
  let minutes = lastVisit.getMinutes();
  let timeString = `${hours}:`;
  (minutes<10) ? timeString+=`0${minutes}` : timeString+=`${minutes}`;
  let lStatus=document.querySelector('span#loginStatus');
  lStatus.innerHTML=`+${window.INITIAL_STATE.USER}: saw you here last at ${timeString}!<br />check out your <a href="/db">images</a> brah!`;

  function saveFile() {
    let xhr=new XMLHttpRequest(), //can do typeahead in an array for allowed names!
    method="POST",
    url = "/u/imgNames";
    xhr.open(method, url, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send();
    xhr.onload = function () {
      if (xhr.readyState===4&&xhr.status===200) {
        let takenNames=xhr.responseText;
        saveFileModal(takenNames, function(name) {
            if (name===null) { return false; } //user X-ed out of modal.
            let imageName;
            (name) ? imageName=name : imageName=null;
            console.log(imageName);
            //if user-supplied name is not null, otherwise no name
            let xhr=new XMLHttpRequest(), //can do typeahead in an array for allowed names!
            method="POST",
            url = "/save";
            xhr.open(method, url, true);
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.onload = function () {
              console.log(`readyState: ${xhr.readyState}`);
              console.log(`status: ${xhr.status}`);
              console.log('we passed in the data successfully');
            }
        xhr.send(JSON.stringify({data:canvas.toDataURL('image/png'),width:canvas.width,height:canvas.height,imgName:imageName}));
        });
      }
    };
  }

  //TODO: modularize the modals, PLEASE!
  function saveFileModal(names, cb) {
    let modalContent = `
    <div class="modalContents">
    <span id="closeBox"><button id="killModal" class="close">X</button></span>
    <p>FILE NAME: <input type="text" name="filename" id="filename" autofocus />
    <button id="submitModal">SAVE</button></p><span id="warning"></span></div>
    `;
    //let modalEnv = `document.querySelector('input#filename').value`;
    popModal(modalContent, names, cb);
  }


  function loadImage(imageLoc='') { //loads most recent image
    //TODO make more general to load ANY image passed in on query
    //default to most recent
    let xhr=new XMLHttpRequest();
    let method="GET";
    let url;
    (imageLoc==='') ? url = "/load" : url = `/load/${imageLoc}`;
    xhr.open(method,url,true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.responseType='json';
    xhr.onreadystatechange = function (data) {
      console.log(`readyState: ${xhr.readyState}`);
      console.log(`status: ${xhr.status}`);
      console.log('we passed in the data successfully');
      let d=data.target.response;
      //console.log(data);
      canvas.height=d.height;
      canvas.width=d.width;
      ctx.clearRect(0,0,canvas.width,canvas.height);
      var iObj=new Image();
      iObj.src=d.data;
      iObj.onload = function () {
        console.log('loaded');
        ctx.drawImage(iObj,0,0);
      }
    }
    xhr.send();
  }

/* SAMPLE SUCCESSFUL UPLOAD DATA
{"data":{"id":"EGJLNkj","title":null,"description":null,"datetime":1483570254,"type":"image\/png",
"animated":false,"width":899,"height":614,"size":67075,"views":0,"bandwidth":0,"vote":null,"favorite":false,
"nsfw":null,"section":null,"account_url":null,"account_id":0,"is_ad":false,"in_gallery":false,"deletehash":"5WfDva4fpV5m2eD",
"name":"","link":"http:\/\/i.imgur.com\/EGJLNkj.png"},"success":true,"status":200}
*/
function uploadToImgur(picData) {
  var picPrepped = picData.split(",")[1]; //must remove the "data:image/png;base64,[IMAGE DATA HERE]" preceding image data
  var xhr = new XMLHttpRequest(),
  method = "POST",
  url = 'https://api.imgur.com/3/image';
  xhr.open(method, url, true);
  xhr.setRequestHeader('Authorization','Client-ID '+CLIENT_ID); //Authorization: Client-ID YOUR_CLIENT_ID
  xhr.onload = function() {
    //if (xhr.readyState===4 && xhr.status===200) { // all done SHOULD I USE onreadystatechange or not!?!?!?!
      const r = JSON.parse(xhr.responseText);
      console.log(r.data.link+" deleteHash: "+r.data.deletehash);
      window.open(r.data.link);
    //}
  }
  xhr.send(picPrepped);
}

function deleteFromImgur(deleteHash) { //{"data":true,"success":true,"status":200}
  const endpoint='https://api.imgur.com/3/image/'+deleteHash; //https://api.imgur.com/endpoints/image#image-delete
  var xhr = new XMLHttpRequest();
  xhr.open("DELETE",endpoint,true); //async true can use 4 & 5 for Oauth2
  xhr.setRequestHeader('Authorization','Client-ID '+CLIENT_ID); //Authorization: Client-ID YOUR_CLIENT_ID
  xhr.onload = function() {
    const r=JSON.parse(xhr.responseText);
    (r.success&&r.status===200) ? console.log("Successfully deleted") : console.err("Failure! "+r);
    }
  xhr.send();
}

/*DRAWING METHODS
//deleteFromImgur('AiU9UumFcFbHiQY');
//let CS={strokeS:currentStrokeStyle, fillS:currentFillStyle, lineW: currentLineWidth, isDrawing:"false"};

/*THIS FUNCTION IS NICE*/
  function drawLine(m,context) {
    context.lineCap='round';
    context.lineWidth=CS.lineW || Math.min((m.movArr[0]+m.movArr[1]),2);
    context.arc(m.x,m.y,CS.brushSize,0,Math.PI*2*Math.random());
    context.fill();
    context.stroke();
  }

  function drawCircle(m,context) {
    context.arc(m.x,m.y,CS.brushSize,0,Math.PI*2);
    context.fill();
    context.lineWidth=CS.lineW;
    context.stroke();
  }

  function drawSquare(m,context) {
    context.fillRect(m.x-CS.brushSize/2,m.y-CS.brushSize/2,CS.brushSize,CS.brushSize);
    context.stroke();
  }

  let mousePos = []; //we store three mouse positions and then draw a curve.
  function drawBezier(mP,context) {
    console.log(mP);
    mousePos.push([mP.x,mP.y]);
    console.log(mousePos);
    if (mousePos.length===3) {
      console.log('length=3');
      context.moveTo(mousePos[0][0],mousePos[0][1]);
      context.lineWidth=CS.lineW;
      context.bezierCurveTo(mousePos[0][0],mousePos[0][1],mousePos[1][0],mousePos[1][1], mousePos[2][0], mousePos[2][1]);
      context.stroke();
      mousePos=[];
    }
  }

  let brush = {data:[
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
  ]};

  let r=[
    [0, 1, 0, 0],
    [0, 0, 1, 0],
    [1, 0, 0, 0],
    [0, 0, 0, 1]
  ];

  let randomBrush=r.map(row=>
    row.map(col=>
      Math.round((Math.random()*-1)+1)
    ));

//  console.log(randomBrush);

  CS.brush = [
    [0, 1, 1, 1, 0],
    [0, 0, 1, 1, 0],
    [1, 1, 1, 0, 0],
    [0, 1, 1, 1, 1]
  ];

  function drawBrush(mP, context, brush, scale) {
    let sF=scale;
    //convert to center of square
    let xC = mP.x-sF*brush.length/2;
    let yC = mP.y-sF*brush.length/2;
    let bL=brush.length;
    for (var i=0;i<(brush.length)*sF;i++) {
      for (var j=0;j<(brush.length)*sF;j++) { //assumption that matrix is square!
        (brush[i%bL][j%bL]) ? context.fillRect(xC+i,yC+j,1,1) : 0;
      }
    }
  }

  function drawQuadratic(xC,yC,velocityArr) {
    ctx.lineCap='round';
    ctx.lineWidth=1;
    let xR=xC+Math.floor(Math.random()*20)+40;
    let yR=yC+Math.floor(Math.random()*20)+40;
    let rOff=Math.floor(Math.random()*(velocityArr[0]+velocityArr[1])+10);
    ctx.moveTo(xR,yR);
    ctx.quadraticCurveTo(xR+rOff,yR+rOff,xC/10,yC/10);
//    ctx.bezierCurveTo(xR,yR,yR+rOff,xR+rOff, xC, yC);
    ctx.stroke();
  }

  function linGrad(xC,yC,velocityArr,posArr) {
    ctx.lineCap='round';
    ctx.lineWidth=3;
    let rOff=Math.floor(Math.random()*25)+15;
    var grd = ctx.createLinearGradient(xC,yC,yC+rOff,xC+rOff);
    grd.addColorStop(0,"tomato");
    grd.addColorStop("0.3","magenta");
    grd.addColorStop("0.5","blue");
    grd.addColorStop("0.6","green");
    grd.addColorStop("0.8","yellow");
    grd.addColorStop(1,"red");
    ctx.strokeStyle = grd;
    ctx.moveTo(xC,yC);
    ctx.quadraticCurveTo(xC+rOff,yC+rOff,xC,yC);
  //  ctx.strokeStyle=randomRGBA();
  let xR=xC+Math.floor(Math.random()*20)+10;
  let yR=yC+Math.floor(Math.random()*20)+10;
  ctx.bezierCurveTo(posArr[0],posArr[1],xC+rOff,yC+rOff, xR*10, yR/10);
    ctx.stroke();//ctx.fillRect(xC,yC,velocityArr[0],velocityArr[1]);
  }

/*keyboard control of canvas params*/
  window.addEventListener('keydown',handleKeyboard);
  function handleKeyboard(e) {
    //console.log(e);
    if (e.code==='KeyR') { randomizeParameters(); } //keyCode===82
    if (e.code==='Digit1') { opacity('down'); }//keyCode===49
    if (e.code==='Digit2') { opacity('up'); }//keyCode===50
    if (e.code==='ShiftRight') { CS.contDraw=!CS.contDraw; }//keyCode===16
    if (e.code==='KeyB') { CS.tool='tBrush' } //keyCode===66
    if (e.code==='KeyL') { CS.tool='tLine' } //keyCode===76
    if (e.code==='KeyV') { CS.tool='tCurve' } //keyCode===86
    if (e.code==='KeyC') { CS.tool='tCircle' } //keyCode===67
    if (e.code==='KeyS') { CS.tool='tSquare' } //keyCode===83
    if (e.code==='KeyX') { clearCanvas(); } //keyCode===88
    if (e.code==='Backquote') { toggleToolDisplay(); } //keyCode===192
    else { console.log(e); }
  }

  function toggleToolDisplay() {
    let tBar=document.querySelector('div.controls');
    (tBar.style.display==='') ? tBar.style.display='inline-block' : tBar.style.display='';
  }

  let mouseLayer=document.createElement('canvas');
  mouseLayer.classList.add('mouseOverlay');
  document.body.append(mouseLayer);
  let mouseCtx=mouseLayer.getContext('2d', {alpha:true});
  mouseLayer.width=canvas.width;
  mouseLayer.height=canvas.height;

  let canvases=document.querySelectorAll('canvas');
  canvases.forEach((c)=>c.addEventListener('mousemove',mouseTrack));
  canvases.forEach((c)=>c.addEventListener('mousedown',mouseTrack));
  canvases.forEach((c)=>c.addEventListener('mouseup',mouseTrack));
  canvases.forEach((c)=>c.addEventListener('mouseleave',function mouseLeave(){
    mouseCtx.clearRect(0, 0, mouseLayer.width, mouseLayer.height);
  }));

  function mouseTrack(e) {
    if (e.type==='mousedown') {
      CS.isDrawing=true;
      console.log('mousetrack down')
    }
    (e.type==='mouseup') ? CS.isDrawing=false : 0;
    let mouseParams={x:e.layerX,y:e.layerY,movArr:[e.movementX,e.movementY],windowArr:[e.clientX,e.clientY]};
    if (CS.isDrawing===false) {
    mouseCtx.clearRect(0,0,mouseLayer.width,mouseLayer.height);
    mouseCtx.drawImage(canvas,0,0);//copy the current canvas

  //  filterIt('url("/assets/filters.svg#svgBlurBig")',1.0,{xI:mouseParams.x,yI:mouseParams.y,xF:mouseParams.x+CS.brushSize,yF:mouseParams.y+CS.brushSize},mouseCtx);
    mouseCtx.strokeStyle=CS.strokeS || randomRGBA();
    mouseCtx.fillStyle=CS.fillS || randomRGBA();
    mouseCtx.globalAlpha=CS.lOpacity;
    mouseCtx.beginPath(); //draw the thing on the current canvas
        switch(CS.tool) {
          case 'tBrush': drawBrush(mouseParams, mouseCtx, CS.brush, CS.brushSize); break;
          case 'tLine': drawLine(mouseParams, mouseCtx); break;
          case 'tCurve': drawBezier(mouseParams, mouseCtx); break;
          case 'tCircle': drawCircle(mouseParams, mouseCtx); break;
          case 'tSquare': drawSquare(mouseParams, mouseCtx); break;
          }
        }
    else {
      //capture initial undo state
      //(CS.undoState===0) ? undoRedo(null, ctx.getImageData(0, 0, canvas.width, canvas.height)) : 0;
      ctx.drawImage(mouseLayer, 0, 0);
      console.log('undoredo');
      undoRedo(null, ctx.getImageData(0, 0, canvas.width, canvas.height)); //undo and redo handler
    }
  }

  function shake() {
      (CS.brushSize>50) ? CS.brushSize=CS.brushSize-(Math.random()*49+1) : CS.brushSize=CS.brushSize+(Math.random()*49+1);
    }

  function rgbaToHex(RGBA) { //turns rgba(255,255,255,1) into #FFFFFF
    //TODO add bounds checking and console.asserts for invalid input
    //thanks to http://www.javascripter.net/faq/rgbtohex.htm for the (n-n%16)/n bit at first!
    const hexNum = {"0":0,"1":1,"2":2,"3":3,"4":4,"5":5,"6":6,"7":7,"8":8,"9":9,
    "10":"A","11":"B","12":"C","13":"D","14":"E","15":"F"};
    let arr=RGBA.split(",").map((p)=>Number(p.replace(/[a-z]{4}\(|\)/,''))).slice(0,3);
    arr=arr.map((e)=>{return String(hexNum[((e-e%16)/16)])+String(hexNum[Math.floor(e%16)]);});
    console.log(`#${arr.join("")}`);
    return `#${arr.join("")}`;
  }

  window.addEventListener('scroll',updateModalCoords);

  function updateModalCoords(e) {
    console.log(e);
    if(CS.modal) {
      let m=document.querySelector('div.modal');
      let s=document.querySelector('div.modalScreen');
      //modal
      m.style.top=(window.innerHeight-m.clientHeight)/2+window.scrollY; //(window.innerHeight - div.height)/2 puts at center
      m.style.left=(window.innerWidth-m.clientWidth)/2;
      m.style.width=window.innerWidth/2;
      m.style.height=window.innerHeight/2;
      //screen
      s.style.height=window.innerHeight+window.scrollY;
      s.style.width=window.innerWidth;
    }
  }

  function popModal(content,names,cb) { //TODO this is currently NOT modularized modal code because of the NAMES thing. You should wrap that.
    if(CS.modal===false) { //I refuse to support nested modals, for the good of humanity.
      console.log(names);
      let screen=document.createElement('div'); //masking effect
      screen.style.height=window.innerHeight;
      screen.style.width=window.innerWidth;
      screen.classList.add('modalScreen');
      document.body.append(screen);
      let m = document.createElement('div');
      document.body.append(m);
      m.innerHTML = content || '<div class="modalContents">I am empty inside. <p><button id="killModal">KILL THE MODAL</button></p></div>';
      m.classList.add('modal');
      m.style.top=(window.innerHeight-m.clientHeight)/2; //(window.innerHeight - div.height)/2 puts at center
      m.style.left=(window.innerWidth-m.clientWidth)/2;
      let kM=document.querySelector('button#killModal');
      kM.addEventListener('click',()=>{cb(null); killModal();},true);
      let sM=document.querySelector('button#submitModal');
      sM.addEventListener('click',submitModal,true);
      let input=document.querySelector('input#filename');
      input.addEventListener('keyup',typeAhead);
      CS.modal=true;
      function killModal() {
      if(CS.modal===true) {
        screen.remove();
        m.remove();
        CS.modal=false;
        }
      }
      function submitModal() {
        let val=document.querySelector('input#filename').value;
        console.log("modal val: "+val);
        cb(val); //call it baaaaack!
        killModal();
        }
      }
    function typeAhead(e) {
      if (e.key==='Enter') { //keyCode===13
        submitModal();
        return;
      }
      let input=document.querySelector('input#filename');
      let val=document.querySelector('input#filename').value;
      let warn=document.querySelector('span#warning');
      console.log(val);
      console.dir(input);
      console.log(JSON.parse(names));
      let duplicate=Array.from(JSON.parse(names)).filter((n)=>n===val);
      if (duplicate.length) {
        input.style.color='red';
        warn.style.display='inline';
        warn.innerHTML=`${val} already exists. Saving will _overwrite_ the existing file.`;
      }
      else {
        input.style.color='black';
        warn.style.display='none';
        warn.innerHTML='';
      }
    }
  }

  //Canvas dropzone for drag-n'-drop images
  //TODO add resize/move capabilties on the layer
  canvas.addEventListener('ondragover', function(e){
    e.stopPropagation();
    e.preventDefault();
  });
  canvas.addEventListener('ondragenter', function(e){
    e.stopPropagation();
    e.preventDefault();
  });
  canvas.addEventListener('ondrop', function(e){
    e.stopPropagation();
    e.preventDefault();
    console.log(e);
    fileUploadHandler(e.dataTransfer.files);
  });
  mouseLayer.addEventListener('ondragover', function(e){
    e.stopPropagation();
    e.preventDefault();
  });
  mouseLayer.addEventListener('enter', function(e){
    e.stopPropagation();
    e.preventDefault();
  });
  mouseLayer.addEventListener('ondrop', function(e){
    e.stopPropagation();
    e.preventDefault();
    console.log(e);
    fileUploadHandler(e.dataTransfer.files);
  });
}
