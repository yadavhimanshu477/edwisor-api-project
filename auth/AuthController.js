var express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const multer = require('multer');
router.use(bodyParser.urlencoded({limit: "50mb", extended: true, parameterLimit:50000}));
router.use(bodyParser.json({limit: '500mb'}));
const User = require('../user/User');
var redis = require('redis');
var client = redis.createClient();

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config');

var Storage = multer.diskStorage({
    destination: function(req, file, callback) {
    	console.log("file")
        callback(null, "./Images");
    },
    filename: function(req, file, callback) {
    	console.log("lkjj")
        callback(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
    }
});

var upload = multer({
     storage: Storage
 }).array("profile_photo", 1);

router.post('/signup', function(req, res) {
  
  const hashedPassword = bcrypt.hashSync(req.body.password, 8);
  
  User.create({
    name : req.body.name,
    email : req.body.email,
    password : hashedPassword
  },
  function (err, user) {

    if (err) return res.status(500).send("There was a problem registering the user.")
    // create a token
    const token = jwt.sign({ id: user._id, email: user.email }, config.secret, {
      expiresIn: 86400 // expires in 24 hours
    });
    res.status(200).send({ auth: true, message: "Register successful", token: token });
  }); 
});

router.get('/login', function(req, res) {
  const token = req.headers['x-access-token'];
  if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });
  
  jwt.verify(token, config.secret, function(err, decoded) {
    if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
    const email = decoded.email
    User.update({ email: email }, {
		$set: { token: token }
	})
	client.hmset(decoded.id, token, (err) => {
		client.expire(decoded.id, decoded.exp)
	});
    res.status(200).send({auth: true, message: "login successful"});
  });
});

router.post('/changePassword', function(req, res) {
  const token = req.headers['x-access-token'];
  const password = req.body.new_password

  if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });
  if (!password) return res.status(401).send({ auth: false, message: 'No new password provided.' });

  const hashedPassword = bcrypt.hashSync(req.body.new_password, 8);

  jwt.verify(token, config.secret, function(err, decoded) {
    if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
    const email = decoded.email
	User.update({ email: email }, {
		$set: { password: hashedPassword }
	},
	function (err, user) {
	    if (err) return res.status(500).send("There was a problem getting info of user.")
	    res.status(200).send({auth: true, message: "password changed successfully"});
	});
  });
});

router.post('/editUseDetails', function(req, res) {
  const token = req.headers['x-access-token'];
  const email = req.body.email;
  const name = req.body.name;
  const updateObject = {}

  if (req.body['email']) updateObject.email = req.body.email
  if (req.body['name']) updateObject.email = req.body.name
  if (req.body['password']) updateObject.email = bcrypt.hashSync(req.body.password, 8)
  if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });
  
  jwt.verify(token, config.secret, function(err, decoded) {
    if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
    
    const email = decoded.email
	User.update({ email: email }, {
		$set: updateObject
	},
	function (err, user) {
	    if (err) return res.status(500).send("There was a problem updating info of user.")
	    res.status(200).send({auth: true, message: "user Data updated successfully"});
	});
  });
});

router.get('/userInfo', function(req, res) {
  const token = req.headers['x-access-token'];
  if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });
  
  jwt.verify(token, config.secret, function(err, decoded) {
    if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
    const email = decoded.email
	User.findOne({
	    email: email
	},
	function (err, user) {
	    if (err) return res.status(500).send("There was a problem getting info of user.")
	    res.status(200).send(user);
	}); 
  });
});

router.post('/profile_image_upload', function(req, res) {
  const token = req.headers['x-access-token'];
  if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });
  
  jwt.verify(token, config.secret, function(err, decoded) {
    if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
    upload(req, res, function(err) {
         if (err) {
             return res.status(500).send("Something went wrong!");
         }
         return res.status(200).send({ auth: true, message: "File uploaded sucessfully!." });
     });
  });
});

router.get('/logout', function(req, res) {
  const token = req.headers['x-access-token'];
  if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });
  
  jwt.verify(token, config.secret, function(err, decoded) {
  	console.log(decoded)
    if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
    const email = decoded.email
    User.update({ email: email }, { 
    	$unset: { token:1 }}, 
	function (err, user) {
	    if (err) return res.status(500).send("There was a problem in logout.")
	    res.status(200).send("logout successful");
	});
	client.sadd("expired", decoded.id, (err) => {
		
	});
  });
});



///////////////// CRON SETUP TO DELETE BLACKLISTED KEYS /////////////////////////



const cron = require('node-cron');

cron.schedule('* * * * *', () => {
  	client.smembers("expired", function (err, reply) {
  		console.log("reply:: "+reply)
  		const arrayOfReplies = reply

  	})

});


module.exports = router;