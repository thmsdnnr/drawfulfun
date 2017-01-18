var MongoClient = require('mongodb').MongoClient;
let dbCon;
let dbUrl='mongodb://localhost:27017/ndlrn';

//TODO: save Imgur URL, Imgur Delete Hash in the db
//TODO: make sure Imgur upload also works if you're a logged in Imgur user and not just posting anonymously
//TODO: modularize the client connection open and close code somehow using promises
//TODO: be able to pass an array of functions or chain dot functions like in jQUERY for prettierness and easier testing.

/*IMAGES*/
//CRUD:
exports.saveImage = function(data,cb) {
  MongoClient.connect(dbUrl, function(err, db) {
    if (!err) {
      db.collection("images").insert({srnm:data.username, imgSrc:data.imagePath, width:data.width, height:data.height, imgName:data.imgName});
      cb();
    }
    db.close();
  });
}

exports.updateImage = function(data,cb) {
  MongoClient.connect(dbUrl, function(err, db) {
    if (!err) {
      db.collection("images").update(
        { id:data._id },
        {
          srnm:data.username,
          imgSrc:data.imagePath,
          width:data.width,
          height:data.height,
          imgName:data.imgName
        },
        { upsert: true }
      );
      cb();
    }
    db.close();
  });
}

exports.deleteImage = function(data,cb) {
  MongoClient.connect(dbUrl, function(err, db) {
    if (!err) {
      cb(db.collection("images").deleteOne({imgSrc:data}));
    }
  db.close();
  });
}

//delete all user images e.g., leaving the site
exports.deleteAllImagesForUser = function(data,cb) {
  MongoClient.connect(dbUrl, function(err, db) {
    if (!err) {
      if (srnm!=='') { //don't want to drop everything on accident hahaha
        cb(db.collection("images").delete({srnm:data}));
      }
    }
    db.close();
  });
}

//RETRIEVAL
exports.getUserImages = function(query,cb) { //retrieve list of all user images
  MongoClient.connect(dbUrl, function(err, db){
    if (!err) {
      db.collection("images").find({srnm:query.username}).toArray(function(err, docs) {
      if (!err) {
        (docs.length) ? cb(docs) : cb(null);
      }
    });
  }
  db.close();
});
}

exports.getUserImageFileNames = function(query,cb) { //retrieve list of all user images
  MongoClient.connect(dbUrl, function(err, db){
    if (!err) {
      db.collection("images").find({srnm:query.username, imgName:{$exists:true, $ne:'null'}}).toArray(function(err,docs) {
          if (!err) {
            (docs.length) ? cb(docs) : cb(null);
          }
      });
    }
    db.close();
  });
}

exports.getLatestUserImage = function(query,cb) { //get latest user image sorting by Mongo db ID, descending
  MongoClient.connect(dbUrl, function(err, db){
    if (!err) {
      db.collection("images").find({srnm:query.username}).sort({'_id':-1}).toArray(function(err, docs) {
        if (!err) {
          (docs.length) ? cb(docs) : cb(null);
        }
      });
    }
    db.close();
  });
}

exports.getAllImages = function(cb) {
  MongoClient.connect(dbUrl, function(err, db){
    if (!err) {
      db.collection("images").find().toArray(function(err,docs) {
        if (!err) {
          (docs.length) ? cb(docs) : cb(null);
        }
      });
    }
    db.close();
  });
}

exports.findImage = function(imageSrc,cb) { //find an image in the db given an imgSrc
  MongoClient.connect(dbUrl, function(err, db) {
    if (!err) {
      db.collection("images").find({imgSrc:imageSrc}).toArray(function(err, docs) {
        if (!err) {
          (docs.length) ? cb(docs) : cb(null);
        }
      });
    }
    db.close();
  });
}

/*USERS*/
//CRUD
exports.deleteUser = function(query,cb) {
  MongoClient.connect(dbUrl,function(err,db) {
    cb(db.collection("srs").delete({srnm:query.username}));
    db.close();
  });
}

//RETRIEVAL
exports.loginUser = function(query,cb) { //find a user in the DB given a username, return row
  MongoClient.connect(dbUrl, function(err, db){
    db.collection("srs").find({srnm:query.username}).toArray(function(err, docs) {
      if (!err) {
        db.collection("srs").updateOne({srnm:query.username}, {$set:{lastIn:new Date()}});
        (docs.length>0) ? cb(docs) : cb(false);
      }
    });
//TODO i get an "unhandled data pool killed hting if i call db.close here!   db.close();
//http://stackoverflow.com/questions/39029893/why-is-the-mongodb-node-driver-generating-instance-pool-destroyed-errors
  });
}

exports.findUser = function(query,cb) { //find a user in the DB given a username, return row
  MongoClient.connect(dbUrl, function(err, db){
    db.collection("srs").find({srnm:query.username}).toArray(function(err, docs) {
      if (!err) {
        (docs.length>0) ? cb(docs) : cb(false);
      }
    });
    db.close();
  });
}

exports.saveUser = function(data,cb) { //save a new user in the DB
  MongoClient.connect(dbUrl, function(err, db){
    if (!err) {
      db.collection("srs").insert({srnm:data.username,psswd:data.password,lastIn:new Date()});
      cb();
    }
  db.close();
  });
}

//TODO could modularize into an function: change other parameters for instance, if they exist.
exports.changeUserPassword = function(query,cb) {
  if (!err) {
    MongoClient.connect(dbUrl, function(err,db) {
      cb(db.collection("srs").updateOne({srnm:query.username}, {$set:{psswd:query.password}}));
      db.close();
    });
  }
}
