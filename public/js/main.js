const chatForm = document.getElementById("chat-form");
const chatMessages = document.querySelector(".chat-messages"); 
const roomName = document.querySelector("#room-name");
const userList = document.querySelector("#users");

//Get username and room
const {username, room}= Qs.parse(location.search, {
    ignoreQueryPrefix:true
});

const socket=io();

//Join chat room
socket.emit("joinRoom", {username, room});

//Get Room users
socket.on("roomUsers", function({room,users}){
    outputRoomName(room);
    outputUser(users);
});
//message from server
socket.on("message", function(message){
    outputMessage(message);
    //Auto Scroll
    chatMessages.scrollTop=chatMessages.scrollHeight;
});

chatForm.addEventListener("submit", function(e){
    e.preventDefault();

    const msg=e.target.elements.msg.value;
    //emittting 
    socket.emit("chatMessage",msg);
    e.target.elements.msg.value="";
    e.target.elements.msg.focus();
});

//adding a div to print message 
function outputMessage(message){
    const div = document.createElement('div');
    if(message.username === username){
        div.classList.add("ownmessage");
    }
    else{
        div.classList.add("othermessage");
    }
    div.classList.add("message");
    div.innerHTML=`<p class="meta">${message.username} <span>${message.time}</span></p>
              <p class="text">
              ${message.text}
              </p>
    `;
    document.querySelector(".chat-messages").appendChild(div);
}

function outputRoomName(room){
    roomName.innerText=room;
}
function outputUser(users){
    userList.innerHTML= `${users.map(user=>`<li><span class="online">O</span>${user.username}</li>`).join('')}`;
}