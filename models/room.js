var mongoose=require("mongoose");

var RoomSchema= new mongoose.Schema({
	name:String,
	messages: { type : Array , "default" : [] }
});

module.exports=mongoose.model("Room", RoomSchema);