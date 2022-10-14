const myUuid = document.getElementById("myUuid").innerText;
document.getElementById("myUuid").innerText = "";
const serverUrl = document.getElementById("serverUrl").innerText;
document.getElementById("serverUrl").innerText = "";

const socket = io.connect(serverUrl, { query: `uuid=${myUuid}`});

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const cameraSelect = document.getElementById("cameras");
const messageForm = document.getElementById("messageToSend");
const chatList = document.getElementById("chats");
const call = document.getElementById("call");
const chatDiv = document.getElementById("chats");

let myStream;
let muted = false;
let cameraOff = false;
let roomName;
let myPeerConnection;

async function getCameras() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter((device) => device.kind === "videoinput");
        const currentCamera = myStream.getVideoTracks()[0];
        cameras.forEach((camera) => {
            const option = document.createElement("option");
            option.value = camera.deviceId;
            option.innerText = camera.label;
            if(currentCamera.label == camera.label) {
                option.selected = true;
            }
            cameraSelect.appendChild(option);
        });
    } catch(e) {
        console.log(e);
    }
}

async function getMedia(deviceId) {
    const initialConstraints = {
        audio : true,
        video : { facingMode : "user" }
    };
    const cameraConstraints = {
        audio : true,
        video : { deviceId : { exact : deviceId } }
    };
    try {
        myStream = await navigator.mediaDevices.getUserMedia(
            deviceId ? cameraConstraints : initialConstraints
        );
        myFace.srcObject = myStream;
        if(!deviceId) {
            await getCameras();
        }
        myStream.getVideoTracks().forEach((track) => (track.enabled = !cameraOff));
        myStream.getAudioTracks().forEach((track) => (track.enabled = !muted));
    } catch(e) {
        console.log(e);
    }
}

function handleMuteClick() {
    myStream.getAudioTracks().forEach((track) => (track.enabled = !track.enabled));
    if(!muted) {
        muteBtn.innerText = "unmute";
        muted = true;
    } else {
        muteBtn.innerText = "Mute";
        muted = false;
    }
}

function handleCameraClick() {
    myStream.getVideoTracks().forEach((track) => (track.enabled = !track.enabled));
    if(!cameraOff) {
        cameraBtn.innerText = "Turn Camera On";
        cameraOff = true;
    } else {
        cameraBtn.innerText = "Trun Camera Off";
        cameraOff = false;
    }
}

async function handleCameraChange() {
    await getMedia(cameraSelect.value);
    if(myPeerConnection) {
        const videoTrack = myStream.getVideoTracks()[0];
        const videoSender = myPeerConnection
        .getSenders()
        .find((sender) => sender.track.kind === "video");
        videoSender.replaceTrack(videoTrack);
    }
}

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

muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
cameraSelect.addEventListener("click", handleCameraChange);
messageForm.addEventListener("submit", handleSendMessage);

// Welcome For  (join a room)
const welcome = document.getElementById("welcome");
const welcomeForm = welcome.querySelector("form");

call.hidden = true;

async function initCall() {
    welcome.hidden = true;
    call.hidden = false;
    await getMedia();
    makeConnection();
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
    console.log("made data channel");
    const offer = await myPeerConnection.createOffer();
    console.log(offer);
    myPeerConnection.setLocalDescription(offer);
    console.log("sent the offer");
    socket.emit("offer", offer, roomName);
});

socket.on("offer", async (offer) => {
    console.log("received the offer");
    myPeerConnection.setRemoteDescription(offer);
    const answer = await myPeerConnection.createAnswer();
    myPeerConnection.setLocalDescription(answer);
    socket.emit("answer", answer, roomName);
    console.log("sent the answer");
});

socket.on("answer", answer => {
    console.log("received the answer");
    myPeerConnection.setRemoteDescription(answer);
});

socket.on("ice", ice => {
    console.log("received candidate");
    myPeerConnection.addIceCandidate(ice);
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

socket.on("disconnected", handleRemoveStream);

// RTC Code

function makeConnection() {
    myPeerConnection = new RTCPeerConnection({
        iceServers: [
            {
                urls: [
                    "stun:stun.l.google.com:19302",
                    "stun:stun1.l.google.com:19302",
                    "stun:stun2.l.google.com:19302",
                    "stun:stun3.l.google.com:19302",
                    "stun:stun4.l.google.com:19302",
                ]
            }
        ]
    });
    myPeerConnection.addEventListener("icecandidate", handleIce);
    myPeerConnection.addEventListener("addstream", handleAddStream);
    myStream.getTracks()
    .forEach(track => myPeerConnection.addTrack(track, myStream));
}

function handleIce(data) {
    console.log("sent candidate");
    socket.emit("ice", data.candidate, roomName);
}

function handleAddStream(data) {
    const peerFace = document.getElementById("peerFace");
    peerFace.srcObject = data.stream;
}

function handleRemoveStream() {
    document.getElementById("peerFace").srcObject = null;
}