var _ = require("lodash");
var express = require("express");
var bodyParser = require("body-parser");
var jwt = require('jsonwebtoken');
var multer = require('multer');
var passport = require("passport");
var passportJWT = require("passport-jwt");
var passwordHash = require('password-hash');
var ExtractJwt = passportJWT.ExtractJwt;
var JwtStrategy = passportJWT.Strategy;
var cors = require('cors');

//Mysql Connection
var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'root',
  database : 'property',
  multipleStatements: true
});
connection.connect(function(err){
if(!err) {
    console.log("Database is connected ... nn");
} else {
    console.log("Error connecting database ... nn");
}
});


var users = [
  {
    id: 1,
    name: 'jonathanmh',
    password: '%2yx4'
  },
  {
    id: 2,
    name: 'test',
    password: 'test'
  }
];

var Storage = multer.diskStorage({
  destination: function(req, file, callback) {
      callback(null, "/home/kindle/Downloads/ang-cli/src/assets");
  },
  filename: function(req, file, callback) {
      callback(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
  }
});

var upload = multer({
  storage: Storage
}).array("imgUploader", 1);



var jwtOptions = {}
jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
jwtOptions.secretOrKey = 'tasmanianDevil';

var strategy = new JwtStrategy(jwtOptions, function(jwt_payload, next) {
  console.log('payload received', jwt_payload);
  // usually this would be a database call:
  connection.query('SELECT * FROM users WHERE email = ?',[name], function (error, results, fields) {
    if(results.length >0){
      next(null, results[0]);
    }else{
      next(null, false);
    } 
  });
});

passport.use(strategy);

var app = express();
app.use(cors());
app.use(passport.initialize());
// parse application/x-www-form-urlencoded
// for easier testing with Postman or plain HTML forms
app.use(bodyParser.urlencoded({
  extended: true
}));
// parse application/json
app.use(bodyParser.json())
// app.get("/", function(req, res) {
//   res.json({message: "Express is up!"});
// });

app.post("/upload", function(req, res) {
  upload(req, res, function(err) {
      if (err) {
          return res.end("Something went wrong!");
      }
      return res.end("File uploaded sucessfully!.");
  });
});


app.post("/login", function(req, res) {
  
  
  if(req.body.username && req.body.password){
    var name = req.body.username;
    var password = req.body.password;
  }
  // usually this would be a database call:
  connection.query('SELECT users.id,users.username,users.email , users.first_name,users.hyperledger , users.last_name , users.password, users_group.group_id FROM `users` join users_group on users.id=users_group.user_id where users.username =  ?',[name], function (error, results, fields) {
    if (error) {
      res.send({
        "code":400,
        "failed":"error ocurred"
      })
    }else{
      if(results.length >0){
        var hashedPassword = results[0].password;
        var validate = passwordHash.verify(password, hashedPassword);
        console.log(validate);
        if(validate){
          var payload = {id: results[0].id,username:results[0].name};
          var token = jwt.sign(payload, jwtOptions.secretOrKey);
          var msg = {code:'200',message: "ok", token: token , id: results[0].id , username : results[0].username , first_name : results[0].first_name , last_name : results[0].last_name , email : results[0].email , password : results[0].password , num : results[0].group_id , hyperledger : results[0].hyperledger};
          connection.query('INSERT INTO user_authentication SET ?',{user_id : results[0].id , token : token}, function (error, results, fields) {
            if(error){
              console.log(error);
              res.send({
                "code":204,
                "failed":"error ocurred"
              })
            }else{
              res.json(msg);
            }
          
          });
          
        }
        else{
          res.send({
            "code":204,
            "success":"Email and password does not match"
              });
        }
      }
      else{
        res.send({
          "code":204,
          "success":"User does not exits"
            });
      }
    }
    });
});


app.post("/register", function(req, res){
  // console.log(req.body);
  var hshpassword = passwordHash.generate(req.body.password);

  var users={
    "username":req.body.username,
    "first_name":req.body.first_name,
    "last_name":req.body.last_name,
    "email":req.body.email,
    "password":hshpassword,
    "is_authenticated" : 0,
    "hyperledger" : 0
  }

  console.log(users);
  connection.query('SELECT * FROM users WHERE email = ?;SELECT * FROM users WHERE username = ?', [req.body.email, req.body.username], function(error, results, fields) {
    if (error) {
        throw error;
    }else{
      if(results[0].length > 0){
        res.send({
          "resp":'duplicate',
          "msg":'Email "' + req.body.email + '" is already taken'
            });
        return;
      }
      if(results[1].length > 0){
        res.send({
          "resp":'duplicate',
          "msg":'Username "' + req.body.username + '" is already taken'
            });
        return;
      }
      connection.query('INSERT INTO users SET ?',users, function (error, results, fields) {
        if (error) {
          res.send({
            "code":204,
            "failed":"error ocurred insert"
          })
        }else{
        console.log('Else Register');
      connection.query('INSERT INTO users_group SET ?',[{user_id : results.insertId, group_id : req.body.buyer_id }], function (error, results, fields) {
          if(error){
            res.send({
              "code":204,
              "failed":"error ocurred"
            })
          }else{
            console.log('Else group');
            res.send({
              "code":200,
              "success":"user registered sucessfully"
            });
          }
        });
        }
      });
    }
    
  });

});

app.get("/secret", passport.authenticate('jwt', { session: false }), function(req, res){
  res.json({message: "Success! You can not see this without a token"});
});

app.put("/update",function(req, res){

  connection.query('update users set hyperledger=1 where id='+req.body.id , function (error, results) {
    if (error) {
      res.send({
        "code":400,
        "failed":"error ocurred"
      })
    }else{
        res.send({message: "Success"});
    }
  });
});

app.get("/secretDebug",
  function(req, res, next){
    //console.log(req.get('Authorization'));
    next();
  }, function(req, res){
    res.json("debugging");
});

app.get("/allusers", function(req, res) {
  connection.query('SELECT users.id,users.username ,users.password, users.email , users.is_authenticated , users.first_name , users.last_name , users.password, users_group.group_id FROM `users` join users_group on users.id=users_group.user_id where users_group.user_id != 1 and users.hyperledger = 0', function (error, results, fields) {
    if (error) {
      res.send({
        "code":400,
        "failed":"error ocurred"
      })
    }else{
      if(results.length >0){
        res.json({message: "Success" , users : results});
      }
    }
  });
});

app.get("/byid/:id", function(req, res) {
  connection.query('SELECT *, users_group.group_id FROM `users` join users_group on users.id=users_group.user_id where users.id ='+req.params.id, function (error, results, fields) {
    if (error) {
      res.send({
        "code":400,
        "failed":"error ocurred"
      })
    }else{
      if(results.length >0){
        res.json({message: "Success" , users : results});
      }
    }
  });
});



app.get("/", function(req, res) {
  res.sendFile(__dirname + "/index.html");
});

app.listen(7800, function() {
  
  console.log("Express running");
});
