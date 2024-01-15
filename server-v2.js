const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const _ = require('lodash'); // For shuffling and operations on collections

const PORT = 9001;

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let connectedClients = [];
let packetsSentByServer = new Map();
let totalPacketsSentSinceStart = 0;
let sessionPacketsSent = 0;
const DUPLICATE_PACKETS = 100;

io.on('connection', (socket) => {
    // console.log('Client connected:', socket.id);
    connectedClients.push(socket);
    packetsSentByServer.set(socket, 0);

    socket.on('message', (data) => {
        // console.log('Received message:', data);

        let allClients = getAllClients();
        // console.log("allClients.length : "+allClients.length);
        for (let client of allClients) {
            client.emit('message', 'Message from client: ' + data);
            packetsSentByServer.set(client, packetsSentByServer.get(client) + 1);
            totalPacketsSentSinceStart++;
            sessionPacketsSent++;
        }
    });

    socket.on('disconnect', () => {
        // console.log('Client disconnected:', socket.id);
        connectedClients = connectedClients.filter(s => s !== socket);
        packetsSentByServer.delete(socket);
    });
});

setInterval(printServerStatus, 1000);

server.listen(PORT, () => {
    console.log(`Server is now listening on ${PORT}`);
});

process.on('SIGINT', () => {
    console.log("================ FORCE TERMINATED !! =======================");
    printServerStatus();
    process.exit(0);
});

function printServerStatus() {
    console.log("----- Server Packet Report -----");
    console.log("  Total packets sent since start:", totalPacketsSentSinceStart);
    console.log("  Session packets sent:", sessionPacketsSent);
    sessionPacketsSent = 0;
}

// function getRandomClients(excludingSocket, maxClients) {
//     let filtered = connectedClients.filter(s => s !== excludingSocket);
//     return _.sampleSize(filtered, maxClients);
// }
function getRandomClients(includingSocket, maxClients) {
    return _.sampleSize(connectedClients, maxClients);
}
function getAllClients() {
    return connectedClients;
}




// // TODO : 2d 메타버스의 경우 :
// //          EMIT_INTERVAL_IN_MS = 33
// //              이유 : 맥북 실험결과 키반복 1초에 33ms 나옴
// //          DUPLICATE_PACKETS = 100
// //              이유 : 100명이 동시에 움직임을 가정해야함
// //          ASCII_TO_STRING='A'.repeat(1);
// //              이유 : string으로도 못버티면 노답이어서
//
// // TODO : 채팅의 경우 :
// //          EMIT_INTERVAL_IN_MS = 200 ~ 1000
// //              이유 : 사람 손으로 1초에 10개 이상 채팅 넣는건 어려움
// //          DUPLICATE_PACKETS = 100
// //              이유 : 한 채팅방에 백명 있다고 가정함. 한명이 보낸 메시지가 100명에게 뻥튀기
// //          JSON_TO_STRING='A'.repeat(5 * 1024);
// //              이유 : JSON으로 송수신 할거라서
// const express = require('express');
// const http = require('http');
// const {Server} = require('socket.io');
//
// const app = express();
// const server = http.createServer(app);
// const io = new Server(server);
//
// let packetsSentByServer = {};
// let connectedClients = 0;
// let totalPacketsSentSinceStart = 0;
//
// let minClientsForRandomSelection;
// // minClientsForRandomSelection = 10;
// // minClientsForRandomSelection = 100;
// // minClientsForRandomSelection = 1000;
//
//
// let DUPLICATE_PACKETS;
// // DUPLICATE_PACKETS = 1;
// // DUPLICATE_PACKETS = 10;
// // DUPLICATE_PACKETS = 60;
// // DUPLICATE_PACKETS = 50;
// DUPLICATE_PACKETS = 100;
// // DUPLICATE_PACKETS = 1000;
// minClientsForRandomSelection = DUPLICATE_PACKETS;
//
// const getRandomClients = (excludingID) => {
//     const clientIDs = Object.keys(packetsSentByServer);
//     const filtered = clientIDs.filter(id => id !== excludingID);
//     if (filtered.length <= minClientsForRandomSelection) {
//         // console.log(`   filtered.length : if문 진입`);
//         return filtered;
//     } else {
//         // console.log(`   filtered.length : else 문 진입`);
//     }
//
//     const randomClients = [];
//     for (let i = 0; i < DUPLICATE_PACKETS; i++) {
//         const index = Math.floor(Math.random() * filtered.length);
//         randomClients.push(filtered.splice(index, 1)[0]);
//     }
//     // console.log(`   randomClients.length : `, randomClients.length);
//
//     return randomClients;
// };
//
// io.on('connection', (socket) => {
//     connectedClients++;
//
//     packetsSentByServer[socket.id] = 0;
//
//     socket.on('client to server event', (data) => {
//
//         const randomSubsetClients = getRandomClients(socket.id);
//         // setInterval(() => {
//         //     console.log(`randomSubsetClients.length :`,randomSubsetClients.length );
//         // }, 1000);
//
//         for (const clientID of randomSubsetClients) {
//             io.to(clientID).emit('server to client event', data);
//             if (packetsSentByServer[clientID] != null) {
//                 packetsSentByServer[clientID]++;
//                 totalPacketsSentSinceStart++;
//             }
//         }
//     });
//
//     socket.on('disconnect', () => {
//         connectedClients--;
//         delete packetsSentByServer[socket.id];
//     });
// });
//
// app.get('/terminate', (req, res) => {
//     io.emit("terminate");
//     res.send("Termination signal sent to all clients.");
// });
//
// app.get('/status', (req, res) => {
//     res.json({
//         totalClients: Object.keys(packetsSentByServer).length,
//         connectedClients: connectedClients,
//         packetsSentByServer: packetsSentByServer
//     });
// });
//
// const PORT = 9002;
// server.listen(PORT, () => {
//     console.log(`Server is running on http://localhost:${PORT}`);
// });
//
// const printServerStatus = () => {
//     const packetCounts = Object.values(packetsSentByServer);
//     const sessionPacketsSent = packetCounts.reduce((a, b) => a + b, 0);
//     const avgPacketsPerClient = (packetCounts.length === 0) ? 0 : (sessionPacketsSent / packetCounts.length).toFixed(2);
//     const maxPackets = Math.max(...packetCounts);
//     const minPackets = Math.min(...packetCounts);
//
//     console.log("----- Server Packet Report -----");
//     console.log("   Total packets sent since start:", totalPacketsSentSinceStart);
//     console.log("   Session packets sent:", sessionPacketsSent);
//     console.log("   Average packets per client:", avgPacketsPerClient);
//     console.log("   Most packets sent to a client:", maxPackets);
//     console.log("   Least packets sent to a client:", minPackets);
//
//     // 로그 출력 후 패킷 카운트 초기화
//     for (const clientID in packetsSentByServer) {
//         packetsSentByServer[clientID] = 0;
//     }
// }
//
// setInterval(printServerStatus, 1000);
//
// process.on('SIGINT', function () {
//     console.log("================ FORCE TERMINATED !! =======================");
//     printServerStatus();
//     process.exit();
// });
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
