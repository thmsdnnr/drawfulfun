//NPM module requires
var express=require('express');
var bodyParser=require('body-parser');
let fs = require('fs');
var path=require("path");
var concat=require("concat-stream");
var async = require('async');
var assert = require('assert');
var await = require('await');

//Project modules
var Db = require('./imgDb.js');

  var app=express();
  app.locals.CANVAS = '';
  app.locals.LOGGED_IN_USER = '';

  app.use(express.static(__dirname+'/static'));
  app.use(['/save','/load'],bodyParser.json({limit: '5mb', extended: true}));
  app.use(['/login','/register','/mod'],bodyParser.urlencoded({ extended: true }));
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname+'/views'));

  app.get('/', function(req,res) {
    let state={'USER':app.locals.LOGGED_IN_USER, 'CANVAS':app.locals.CANVAS, 'LAST_VISITED':app.locals.LAST_VISITED};
    (app.locals.LOGGED_IN_USER!=='') ? res.render('app', {data:state}) : res.render('index');
  });

  app.post('/mod', function(req,res) {
    /*we get something like this:
    //{ DELETE: 'U2F0IEphbiAxNCAyMDE3IDEyOjQzOjQ5IEdNVC0wNjAwIChDU1QpbXlyb24=' }*/
    if (Object.keys(req.body)[0]==='DELETE') {
      Db.deleteImage(req.body.DELETE,function(success){
        if (success) {
          fs.unlink(path.join(__dirname+'/data/'+req.body.DELETE), (err) => {
            if (err) throw err;
            console.log('successfully deleted')
            res.redirect('/db') //TODO: make this path the path of the current username
          });
        }
      });
      }
    else if (Object.keys(req.body)[0]==='EDIT') {
      app.locals.CANVAS=req.body.EDIT;
      res.redirect('/');
    }
    else { res.send('UNKNOWN REQUEST');}
  });

  //DB route for testing db stuff
  app.get('/db', function(req,res) {
    let currentUser=app.locals.LOGGED_IN_USER;
    if (!currentUser) { res.redirect('/login'); return false; }
    Db.getUserImages({username:currentUser},function(data){
      if(!data) { res.send(`no images for you yet, ${currentUser}`); return false; }
      let sources=data.map(function(d) {
      return {source:d.imgSrc,width:d.width,height:d.height};
    });
    //  console.log(sources);
      let imgs=sources.map(function(img){
        return new Promise(function(resolve,reject){
          dataToImageTag(img.source, function(i){
            resolve({imgRaw:i,imgSrc:img.source,width:img.width,height:img.height});
          });
        });
      });
      Promise.all(imgs).then(function(result){
        console.log(result.length+ ' images available.');
        res.render('userimages', {data:result});
        //res.end();
      });
    });
  });

  app.get('/all', function(req,res) {
    let currentUser=app.locals.LOGGED_IN_USER;
    if (!currentUser) { res.redirect('/login'); return false; }
    Db.getAllImages(function(data){
      let sources=data.map(function(d) {
      return {source:d.imgSrc,width:d.width,height:d.height};
    });
      let imgs=sources.map(function(img){
        return new Promise(function(resolve,reject){
          dataToImageTag(img.source, function(i){
            resolve({imgRaw:i,imgSrc:img.source,width:img.width,height:img.height});
          });
        });
      });
      Promise.all(imgs).then(function(result){
        console.log(result.length+ ' images available.');
        res.render('allimgs', {data:result});
        //res.end();
      });
    });
  });

//async function to handle FS reading and img HTML tag appending height/width
  function dataToImageTag (data, callback) {
    fs.readFile(path.join(__dirname+'/data/'+data), 'utf8', (err, fileData) => {
      if (err) throw err;
      callback(fileData);
    });
  }

  app.post('/save', function(req,res) {
    let currentUser=app.locals.LOGGED_IN_USER;
    if (!currentUser) { return false; }
    let t = new Date(Date.now());
    let imageName = new Buffer(t+app.locals.LOGGED_IN_USER).toString('base64'); //kind of randomish
    //save the image to the filesystem then, if successful, the database
    fs.appendFile(path.join(__dirname+'/data/'+imageName), req.body.data, (err) => {
      if (err) throw err;
      console.log(`THE DATA WAS SUCCESSFULLY SAVED TO ${imageName} in the filesystem`);
      Db.saveImage({username: `${currentUser}`, imagePath: `${imageName}`, width: `${req.body.width}`, height: `${req.body.height}`}, ()=>{
        console.log('success saving image to DB');});
      });
    });

    app.get('/load/:id', function(req,res) {
      let currentUser=app.locals.LOGGED_IN_USER;
      let dbInfo;
      let packing;
      if (!currentUser) { return false; }
      if (!req.params.id) { // if no ID passed in default to latest IMAGE
        Db.getLatestUserImage({username:`${currentUser}`}, (data) => {
          dbInfo=data[0]; //data[0] is most recent query, data[data.length-1] is oldest query
          fs.readFile(path.join(__dirname+'/data/'+data[0].imgSrc), 'utf8', (err, fileData) => {
            if (err) throw err;
            packing={data:fileData,width:dbInfo.width,height:dbInfo.height};
            res.send(JSON.stringify(packing));
          });
        });
      }
      else {
        Db.findImage(req.params.id, (imgData) => {
          //TODO userID validation check like app.CurrentUser matches
          //TODO maybe have a private/public shared flag for this
          let dbInfo=imgData[0];
          if (app.locals.LOGGED_IN_USER!==dbInfo.srnm) { res.send('You are not authorized to edit this photo!'); return false; }
          fs.readFile(path.join(__dirname+'/data/'+req.params.id), 'utf8', (err, fileData) => {
            if (err) throw err;
            //console.dir(data);
            packing={data:fileData,width:dbInfo.width,height:dbInfo.height};
            res.send(JSON.stringify(packing));
          });
        });
      }
  });

app.get('/login', function(req,res) {
  res.render('login');
});

app.post('/login', function(req,res) {
  let inputUser=req.body.username;
  let inputPwd=req.body.password; //TODO Cannot read property srnm of undefined if MYRON
  Db.loginUser({'username':inputUser},function(data){
    if ((data[0].srnm===inputUser)&&(data[0].psswd===inputPwd))
    {
      app.locals.LOGGED_IN_USER=inputUser;
      app.locals.LAST_VISITED=data[0].lastIn;
      res.redirect('/');
      console.log(app.locals.LOGGED_IN_USER);
      console.log((new Date()-app.locals.LAST_VISITED)/1000);
      /*res.writeHead(200);
      res.write(`welcome back, ${inputUser}! login successful`);
      res.end();*/
    }
    else
    {
      app.locals.LOGGED_IN_USER='';
      res.status(401);
      res.write(`INVALID USERNAME OR PASSWORD TRY AGAIN OR GO AWAY`);
      res.end();
    }
  });
});

  app.get('/register', (req,res) => res.render('register'));

app.post('/register', function(req,res) {
  let inputUser=req.body.username;
  let inputPwd=req.body.password;
  Db.findUser({'username':inputUser},function(data){
    if (!data[0]) {
      if (inputPwd!=="") {
        Db.saveUser({'username':inputUser,'password':inputPwd},function(){console.log('callback');});
        res.writeHead(200);
        res.write(`Welcome to the site, ${inputUser}! Click here: <a href="./login">here</a> to login`);
        res.end();
      }
      else {
        res.writeHead(200);
        res.write(`surry but the password cannot be blank`);
        res.end();
        return false;
      }
    }
    else {
      res.writeHead(200);
      res.write(`sorry but ${inputUser} is already taken`);
      res.end();
    }
  });
});

app.listen(3000);
console.log('running on port 3000');
