var app = require('express')();

var http = require('http').Server(app);
var io = require('socket.io')(http);
var cfenv = require('cfenv');
//ToDo: List löschen bei disconnect und whisper. listen mergen
var sockets = [];
var id = 0;

var usersSarah = [];
var socketsSarah = [];

// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();




//Enable reverse proxy support in Express. This causes the
//the "X-Forwarded-Proto" header field to be trusted so its
//value can be used to determine the protocol. See 
//http://expressjs.com/api#app-settings for more details.
app.enable('trust proxy');

//Add a handler to inspect the req.secure flag (see 
//http://expressjs.com/api#req.secure). This allows us 
//to know whether the request was via http or https.
app.use (function (req, res, next) {
     if (req.secure) {
             // request was via https, so do no special handling
             next();
     } else {
             // request was via http, so redirect to https
             res.redirect('https://' + req.headers.host + req.url);
     }
});










//finds username position in usersSarah Array
var findUserNameinArray = function(username){
	for (var int = 0; int < usersSarah.length; int++) {
		if(usersSarah[int] == username ){
			return int;
		}
	}
	return -1;
}


app.get('/', function(req, res) {
	res.sendFile(__dirname + '/public/index.html');
});
var findUserSocket = function(username) {
	for (var int = 0; int < sockets.length; int++) {
		
		if (sockets[int].username === username) {

			return sockets[int];
		}
	}
	return null;
};
// sends emit to target socket and sender if /w or sends a list of users to sender, 
//default: sends msg to all participants

io.on('connection', function(socket) {
	socket.on('chat message', function(time, username, msg) {
		// message to everyone except for a certain socket
		
		// WHISPER
		if (msg.indexOf('/w') === 0) {
			console.log("test");
			var msgArray = msg.split(' ');
			var targetName = msgArray[1];
			console.log("" + targetName);

			var wMsg = msgArray.splice(2).join(' ');
			var recSocket = findUserSocket(targetName);
			var sendingSocket= findUserSocket(username);
			console.log(recSocket);
			if (!recSocket) {
				sendingSocket.emit('whisper-not-sent',targetName,time);
			} else {
				recSocket.emit('whisper-receive',socket.username, wMsg,time);
				sendingSocket.emit('whisper-sent',targetName,wMsg, time);

			}
			//LIST
		} else if(msg.includes("list")){
			console.log("LIST");
			socket.emit('chat message',time, username, usersSarah);
			console.log('time + username + message: ' + time + ": "+ username + ": " + usersSarah);
			//NORMAL MESSAGE
		}else{
			io.emit('chat message',time, username, msg);
		console.log('time + username + message: ' + time + ": "+ username + ": " + msg);
		} 
		});

});

// saves user sockets in array, increases connection counter
io.on('connection', function(socket) {
	// Manage something with the socket
	io.emit('user connects');
	sockets.push(socket);
	if (id >= 0) {
		id++;
	} else {
		throw "connections smaller than 0";
	}
	// io.emit('followers.new');

	// console.log(sockets[id]);
	socket.on('disconnect', function() {
		io.emit('user disconnects');
//		sockets.indexOf(socket.username);
//		console.log("indexOf: " + socket.username);
//		usersSarah.splice(sockets.indexOf(socket.username), 1);
		console.log("dshh:  " + findUserNameinArray("" +socket.username));
		usersSarah.splice(findUserNameinArray(socket.username), 1);
		if (id >= 0) {
			sockets[id] = "";
			id--;
		} else {
			throw "connections is negative";
		}
	});
});

// disconnect
// io.on('connection', function(socket) {
//	
// console.log('a user connected');
// socket.on('disconnect', function() {
// console.log('user disconnected');
// });
//	
// });

// new User joins room
io.on('connection', function(socket) {
	socket.on('new user', function(userName) {
		//Carsten
		socket.username = userName;
		console.log('new user: ' + socket.username);

		//Sarah
		usersSarah.push(userName);
		socketsSarah.push(socket); 
//		socketsSarah.username=userName; 				
		console.log('users: ' + usersSarah);
		
	
	
		io.emit('signup-complete');
	});
});


http.get('*',function(req,res){  
    res.redirect('https://cloudcomp2pipe.mybluemix.net'+req.url)
})
//http.listen(3000, function() {
//	console.log('listening on *:3000');
//});

// start server on the specified port and binding host
//app.listen(appEnv.port, '0.0.0.0', function() {
//});
http.listen(appEnv.port, '0.0.0.0', function() {
console.log('listening');
});
