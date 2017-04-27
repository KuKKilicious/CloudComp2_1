var app = require('express')();

var http = require('http').Server(app);
var io = require('socket.io')(http);
var cfenv = require('cfenv');

var ObjectStorage = require('bluemix-objectstorage').ObjectStorage;
var OVHStorage = require('node-ovh-objectstorage');

//ToDo: List löschen bei disconnect und whisper. listen mergen
var sockets = [];
var id = 0;

var usersSarah = [];
var socketsSarah = [];

// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();


var config = null;
var credentials = null;
var storage = null;

//get credentials
if (process.env.VCAP_SERVICES) {
	config = JSON.parse(process.env.VCAP_SERVICES);
	
	storage = config['Object-Storage'];
	for(var index in storage){
		if (storage[index].name === 'Object Storage-pw') {
			credentials = storage[index].credentials;
			console.log("storage.. : " + credentials);
			//storage.. : [object Object]
			//no JSON-object :/ -->var objectData = JSON.parse(credentials);
			//console.log("storage objet: " + objectData);
			//var username = config.Object-Storage[0].credentials.username;
			var username = credentials.username;
			console.log("username out of credentials: " + username);
		}
		
		//storage[]
	}
}

var store = new OVHStorage(config);
store.connection(
    function() {
      // connected 
      store.container().create('usercontainer', function() {
	      console.log("usercontainer created..");
        // success 
      },
      function(err){
        // error 
      })
    }
    function(err){}
  );

/*Use an ObjectStorage instance to connect to the IBM Object Storage service and manage containers.
Pass in a credentials object containing projectId, userId, password, 
and region to the ObjectStorage constructor in order to establish a connection 
with the IBM Object Storage service on Bluemix*/
//var objStorage = new ObjectStorage(config);
//console.log("objStorage:  " + objStorage.getContainerList());
//objStorage.getContainer("username-password").set("Sarah", "1");


//objStorage.createContainer("username-password")
//var objStorage = new ObjectStorage(credentials);

//	objstorage.createContainer('user-password'){
//    .then(function(container) {
//    	
//        // container - the ObjectStorageContainer that was created 
//    	
//    })
//    .catch(function(err) {
//        // AuthTokenError if there was a problem refreshing authentication token 
//        // ServerError if any unexpected status codes were returned from the request 
//    });
//}


/*Note: If a credentials object is not passed into the ObjectStorage constructor, 
then the constructor will attempt to read the appropriate values from VCAP_SERVICES. 
If no entry for Object Storage can be found in VCAP_SERVICES, then an error will be thrown.*/
//Retrieve a list of existing containers
//	objstorage.listContainers()
//	.then(function(containerList) {
//    // containerList - an array of ObjectStorageContainers 
//    // containerList may be empty 
//	})
//	.catch(function(err) {
//    // AuthTokenError if there was a problem refreshing authentication token 
//    // ServerError if any unexpected status codes were returned from the request 
//	});
//}


//
//Object obj = parser.parse(envServices);
//JSONObject jsonObject = (JSONObject) obj;
//JSONArray vcapArray = (JSONArray) jsonObject.get("Object-Storage");
//JSONObject vcap = (JSONObject) vcapArray.get(0);
//JSONObject credentials = (JSONObject) vcap.get("credentials");
//String userId = credentials.get("userId").toString();
//String password = credentials.get("password").toString();
//String auth_url = credentials.get("auth_url").toString() + "/v3";
//String domain = credentials.get("domainName").toString();
//String project = credentials.get("project").toString();
//Identifier domainIdent = Identifier.byName(domain);
//Identifier projectIdent = Identifier.byName(project);
	
	
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
	//throws error--> console.log("cre - config.Object-Storage[0]: " + config.Object-Storage[0]);
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


//http.listen(3000, function() {
//	console.log('listening on *:3000');
//});

// start server on the specified port and binding host
//app.listen(appEnv.port, '0.0.0.0', function() {
//});
http.listen(appEnv.port, '0.0.0.0', function() {
console.log('listening');
});
