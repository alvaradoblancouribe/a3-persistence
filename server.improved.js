const express = require("express");
const app = express();
const passport = require("passport");
const bodyParser = require("body-parser");
const cors = require("cors");

var LocalStrategy = require("passport-local").Strategy;

//setting up mongodb
var MongoClient = require("mongodb").MongoClient;
var connectionString =
  "mongodb://appUser:thesecretpass@a3-cluster-shard-00-00.jthwa.azure.mongodb.net:27017,a3-cluster-shard-00-01.jthwa.azure.mongodb.net:27017,a3-cluster-shard-00-02.jthwa.azure.mongodb.net:27017/<a3-cluster>?ssl=true&replicaSet=atlas-n0lor0-shard-0&authSource=admin&retryWrites=true&w=majority";
//

//const uri =
  //"mongodb+srv://tester:<password>@cluster0.f9zkh.mongodb.net/<dbname>?retryWrites=true&w=majority";

MongoClient.connect(
  connectionString,
  { useUnifiedTopology: true },
  (err, client) => {
    if (err) return console.error(err);

    const db = client.db("to-do-list");
    const users = db.collection("users");

    //passport stuff
    passport.use(
      new LocalStrategy(function(username, password, done) {
        users.findOne({ username: username }, function(err, user) {
          if (err) {
            return done(err);
          }
          console.log("new!");
          console.log(user, username, password);
          if (user == null) {
            const user = { username: username, password: password };
            users.insertOne(user).then(result => {
              user._id = result.insertedId;
              return done(null, user);
            });
          } else if (username != user.username) {
            console.log("creating user");
            users.insertOne({ username: username, password: password });
            return done(null, user);
          } else if (user.password !== password) {
            console.log(user.password, password);
            console.log("wrong password");
            return done(null, false, { message: "Incorrect password." });
          } else {
            console.log("end");
            return done(null, user);
          }
        });
      })
    );
  }
);
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});
//allows body-parser to extract data from the form element
app.use(
  bodyParser.urlencoded({
    extended: true
  })
);
app.use(bodyParser.json());
app.use(cors());
//serving the files
const expressSession = require("express-session")({
  secret: "secret",
  resave: false,
  saveUninitialized: false
});
app.use(expressSession);
app.use(express.static("public"));
app.use(passport.initialize());
app.use(passport.session());
app.use('/', express.static('app', {index: "logIn.html"}));
const connectEnsureLogin = require("connect-ensure-login");

var username;
var password;

//setting up mongodb
MongoClient = require("mongodb").MongoClient;
connectionString =
  "mongodb://appUser:thesecretpass@a3-cluster-shard-00-00.jthwa.azure.mongodb.net:27017,a3-cluster-shard-00-01.jthwa.azure.mongodb.net:27017,a3-cluster-shard-00-02.jthwa.azure.mongodb.net:27017/<a3-cluster>?ssl=true&replicaSet=atlas-n0lor0-shard-0&authSource=admin&retryWrites=true&w=majority";
MongoClient.connect(
  connectionString,
  { useUnifiedTopology: true },
  (err, client) => {
    if (err) return console.error(err);
    console.log("Connected to the Database");
    const db = client.db("to-do-list");
    const tasksCollection = db.collection("tasks");
    //post methods
    app.post("/submit", connectEnsureLogin.ensureLoggedIn(), (req, res) => {
      console.log("submit")
      res.end(updateData(tasksCollection, req, res));
    });

    app.post("/replace", connectEnsureLogin.ensureLoggedIn(),(req, res) => {
      res.end(replaceData(tasksCollection, req, res));
    });

    app.get("/login", function(req, res) {
      console.log("at login route");
      res.send("logIn.html");
    });

    app.post(
      "/login",
      passport.authenticate("local", { failureRedirect: "/login" }),
      function(req, res) {
        console.log("maybe there is hope");
        res.end(JSON.stringify({ url: "/index.html" }));
      }
    );

    //get methods
    app.get("/", function(req, res) {
      console.log("this does print ")
      res.send('logIn.html');
    });

    app.get("/showData", connectEnsureLogin.ensureLoggedIn(),function(req, res) {
      tasksCollection.find({ username: { $eq: req.user.username } }).toArray(function(err, result) {
        if (err) throw err;
        res.send({ tasks: result });
      });
    });

    //delete methods
    app.delete("/delete", connectEnsureLogin.ensureLoggedIn(),function(req, res) {
      res.send(deleteData(tasksCollection, req, res));
    });
  }
);

//helper functions
const calculatePriority = function(expected) {
  var expected = Number(expected);
  let priority = "no priority";
  if (expected > 5) {
    priority = "high";
  } else if (expected > 2) {
    priority = "medium";
  } else {
    priority = "low";
  }
  return priority;
};

//handles deleting the last entry
function deleteData(collection, request, response) {
  collection.deleteOne(request.body);
  response.writeHead(200, "OK", { "Content-Type": "text/plain" });
  response.end();
}

//handles updating new data
function updateData(collection, request, response) {
  console.log("hello there!!!!");
  console.log(request.user);
  //response.locals.currentUser = request.user;
  const jsonData = request.body;
  const today = new Date();
  const date =
    today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate();
  jsonData["date"] = date;
  let priority = calculatePriority(jsonData.expected);
  jsonData["priority"] = priority;
  jsonData["username"] = request.user.username;
  response.writeHead(200, "OK", { "Content-Type": "text/plain" });
  collection.insertOne(jsonData);
  response.end(JSON.stringify(jsonData));
}

//replaces a given task
function replaceData(collection, req, res) {
  collection.findOneAndUpdate(
    { task: req.body.task },
    {
      $set: {
        task: req.body.task,
        expected: req.body.expected
      }
    },
    {
      upsert: true
    }
  );
  console.log("it was replaced");
  res.end();
}
//initializing the server
var server = app.listen(3000, function() {
  var host = server.address().address;
  var port = server.address().port;

  console.log("listening at http://%s:%s", host, port);
});
