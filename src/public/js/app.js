const myUuid = document.getElementById("myUuid").innerText;
document.getElementById("myUuid").innerText = "";
const serverUrl = document.getElementById("serverUrl").innerText;
document.getElementById("serverUrl").innerText = "";

const socket = io.connect(serverUrl, { query: `uuid=${myUuid}`});

const messageForm = document.getElementById("messageToSend");
const chatList = document.getElementById("chats");
const call = document.getElementById("call");
const chatDiv = document.getElementById("chats");

let roomName;

function handleSendMessage(event) {
    event.preventDefault();
    const input = messageForm.querySelector("input");
    const message = {
        "sender" : myUuid,
        "roomName" : roomName,
        "content" : input.value
    }
    socket.emit("new_message", message);
    input.value = "";
}

messageForm.addEventListener("submit", handleSendMessage);

// Welcome For  (join a room)
const welcome = document.getElementById("welcome");
const welcomeForm = welcome.querySelector("form");

call.hidden = true;

async function initCall() {
    welcome.hidden = true;
    call.hidden = false;
}

async function handleWelcomeSubmit(event) {
    event.preventDefault();
    const input = welcomeForm.querySelector("input");
    await initCall();
    socket.emit("join_room", input.value);
    roomName = input.value;
    input.value = "";
}

welcomeForm.addEventListener("submit", handleWelcomeSubmit);

// Socket Code

socket.on("welcome", async () => {
    console.log("welcome!");
});

socket.on("new_message", message => {
    const li = document.createElement("li");
    if (message["sender"] == myUuid) {
        li.classList.add("sentMessage");
    }
    else {
        li.classList.add("receivedMessage");
    }

    li.innerText = message["content"];
    chatList.appendChild(li);
    chatDiv.scrollTop = chatDiv.scrollHeight;
});