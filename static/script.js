const socket = io();
let peerConnection;
let dataChannel;

const connectBtn = document.getElementById("connectBtn");
const sendBtn = document.getElementById("sendBtn");
const fileInput = document.getElementById("fileInput");
const status = document.getElementById("status");

connectBtn.onclick = async () => {
  peerConnection = new RTCPeerConnection();

  // Create data channel if you are the first to connect
  dataChannel = peerConnection.createDataChannel("fileChannel");
  setupDataChannel();

  peerConnection.onicecandidate = event => {
    if (event.candidate) {
      socket.emit("ice-candidate", event.candidate);
    }
  };

  socket.emit("join");

  socket.on("joined", async isInitiator => {
    if (isInitiator) {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      socket.emit("offer", offer);
    } else {
      peerConnection.ondatachannel = event => {
        dataChannel = event.channel;
        setupDataChannel();
      };
    }
  });

  socket.on("offer", async offer => {
    await peerConnection.setRemoteDescription(offer);
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit("answer", answer);
  });

  socket.on("answer", async answer => {
    await peerConnection.setRemoteDescription(answer);
  });

  socket.on("ice-candidate", async candidate => {
    try {
      await peerConnection.addIceCandidate(candidate);
    } catch (err) {
      console.error("ICE error", err);
    }
  });
};

function setupDataChannel() {
  dataChannel.onopen = () => {
    sendBtn.disabled = false;
    status.textContent = "Connected ✅";
  };

  dataChannel.onmessage = event => {
    const received = new Blob([event.data]);
    const url = URL.createObjectURL(received);
    const a = document.createElement("a");
    a.href = url;
    a.download = "received_file";
    a.click();
  };
}

sendBtn.onclick = () => {
  const file = fileInput.files[0];
  if (file && dataChannel && dataChannel.readyState === "open") {
    dataChannel.send(file);
    status.textContent = "File sent ✅";
  }
};
