const express=require("express");
const http=require('http');
const path=require("path");
const socketio=require("socket.io");
const formatMessage=require("./utils/messages");
const {userJoin, getCurrentUser, userLeave,getRoomUsers} =require("./utils/users");
const app=express();

var mongoose=require("mongoose"),
    flash=require("connect-flash");
    Room=require("./models/room");

var PORT=process.env.DATABASEURL || 'mongodb://localhost:27017/chatapp';
mongoose.connect(PORT, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify:false
}).then(()=>{
  console.log("DB started");
}).catch(err=>{
  console.log(err.message);
});

app.use(express.static(__dirname+"/public"));

const server=http.createServer(app);
const io=socketio(server);

const botName="ChatBot";
io.on("connection", function(socket){
	//Listen for joined user
	socket.on("joinRoom", function({username, room}){
		const user= userJoin(socket.id, username, room);
		socket.join(user.room);

		//Find previous messages of the room and emit them, or create a new room
		Room.findOne({name:room}, function(err, ROOM){
			if(ROOM && ROOM.messages){
				ROOM.messages.forEach(function(MSG){
					socket.emit("message", MSG);
				});
			}else{
				socket.emit("message", formatMessage(botName,"Started new Room!"));
				var newroom={
					name:user.room
				}
				Room.create(newroom, function(err,room){
				});
			}
		});

		//Welcome user
		socket.emit("message", formatMessage(botName,"Welcome!"));

		//When a user connects
		socket.broadcast
		.to(user.room)
		.emit("message", formatMessage(botName,`${user.username} has joined the chat!`));

		//Send users info
		io.to(user.room).emit("roomUsers", {
			room:user.room,
			users: getRoomUsers(user.room)
		});
	});

	//listen for chat message
	socket.on("chatMessage", function(msg){
		const user= getCurrentUser(socket.id);
		Room.updateOne(
		    { name: user.room },
		    { $push: { messages: [formatMessage(user.username, msg)] } },
		    function(err, result) {
		      if (err) {
		        console.log(err);
		      } else {
		        console.log(result);
		      }
		    }
		  );
		io.to(user.room).emit("message", formatMessage(user.username,msg));
	});
	//When disconnect
	socket.on("disconnect", function(){
		const user = userLeave(socket.id);
		if(user){
			io
			.to(user.room)
			.emit("message", formatMessage(botName,`${user.username} has left the chat!`));

			//Send users info again
			io.to(user.room).emit("roomUsers", {
				room:user.room,
				users: getRoomUsers(user.room)
			});
		}
	});
});

//Server start
var port = process.env.PORT || 3000;
server.listen(port, function () {
  console.log("Server Has Started!");
});