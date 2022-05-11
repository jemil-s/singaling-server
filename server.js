const ws = require("ws");
const { v4: uuidv4 } = require("uuid");

const wss = new ws.Server(
  {
    port: 8080,
  },
  () => console.log(`Server started on 4000`)
);

let db = {};
let webSockets = {};

wss.on("connection", function connection(ws, req) {
  setId(ws);
  ws.on("message", function (msg) {
    const message = JSON.parse(msg);

    switch (message.type) {
      case "createRoom": {
        handleCreateRoom(message);
        break;
      }
      case "offer":
        handleOffer(message);
        break;
      case "answer":
        handleAnswer(message);
        break;
      case "getOffer":
        console.log("called getOffer", message);
        handleGetOffer(message);
        break;
      case "connection":
        broadcastMessage(message);
        break;
      case "setAnswer":
        handleSetAnswer(message);
        break;
    }
  });
});

function setId(ws) {
  const userID = uuidv4();
  webSockets[userID] = ws;
  ws.send(JSON.stringify({ type: "id", payload: userID }));
}

function handleOffer(message) {
  //const msg = JSON.parse(message);
  const { userId, roomId } = message.payload;

  console.log(userId);
  const creatorId = db[roomId].creatorId;

  webSockets[userId].send(
    JSON.stringify({
      type: "offer",
      payload: { offer: message.payload.offer, creatorId },
    })
  );
}

function handleAnswer(message) {
  const { userId, offer, roomId } = message.payload;
  const creator = db[roomId].creatorId;
  webSockets[creator].send(
    JSON.stringify({ type: "setAnswer", payload: offer })
  );
}

function handleGetOffer(message) {
  //const offer = db[message.payload].offer;
  const { userId, roomId } = message.payload;
  const creatorId = db[roomId].creatorId;
  webSockets[creatorId].send(
    JSON.stringify({
      type: "getOffer",
      payload: {
        userId,
      },
    })
  );
}

function handleCreateRoom(message) {
  const roomId = uuidv4();
  db[roomId] = {
    creatorId: message.payload.userId,
  };
  broadcastMessage({
    type: "setRoomId",
    payload: { creatorId: message.payload.userId, roomId },
  });
}

function handleSetAnswer(message) {
  const { roomId, answer } = message.payload;
  const creatorId = db[roomId].creatorId;
  webSockets[creatorId].send(
    JSON.stringify({ type: "setAnswer", payload: answer })
  );
}

function broadcastMessage(message) {
  wss.clients.forEach((client) => {
    client.send(JSON.stringify(message));
  });
}
