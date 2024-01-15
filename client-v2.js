const io = require('socket.io-client');
const { setInterval, clearInterval } = require('timers');

const URL = 'http://localhost:9001';
const MAX_CLIENTS = 80;
const CLIENT_CREATION_INTERVAL_IN_MS = 100;
const EMIT_INTERVAL_IN_MS = 30;
// const EMIT_INTERVAL_IN_MS = 33;
// const EMIT_INTERVAL_IN_MS = 50;
const PAYLOAD = 'A'.repeat(5 * 1024);

let clientCount = 0;
let packetsSentSinceLastReport = 0;
let packetsReceivedFromServer = 0;
let totalPacketsReceivedSinceStart = 0;
let totalResponseTime = 0;
let maxResponseTime = 0;

function createClient() {
    const socket = io(URL);

    socket.on('connect', () => {
        // console.log(`Client connected: ${socket.id}`);

        const emitInterval = setInterval(() => {
            const payload = `Message: ${PAYLOAD}, Timestamp: ${Date.now()}`;
            socket.emit('message', payload);
            packetsSentSinceLastReport++;
        }, EMIT_INTERVAL_IN_MS);

        socket.on('message', (data) => {
            packetsReceivedFromServer++;
            totalPacketsReceivedSinceStart++;

            const serverTimestamp = parseInt(data.split(', Timestamp: ')[1]);
            const responseTime = Date.now() - serverTimestamp;

            totalResponseTime += responseTime;
            if (responseTime > maxResponseTime) maxResponseTime = responseTime;
        });

        socket.on('error', (error) => {
            console.error(`Error in connection: ${error}`);
            printReportAndExit();
        });

        socket.on('disconnect', () => {
            console.log('WebSocket connection closed.');
            clearInterval(emitInterval);
            printReportAndExit();
        });

        if (clientCount++ < MAX_CLIENTS) {
            setTimeout(createClient, CLIENT_CREATION_INTERVAL_IN_MS);
        }
    });
}

function printReport() {
    const averageResponseTimeMs = totalPacketsReceivedSinceStart > 0 ?
        totalResponseTime / totalPacketsReceivedSinceStart : 0;
    const averageResponseTimeS = averageResponseTimeMs / 1000;
    const maxResponseTimeS = maxResponseTime / 1000;

    console.log("----- Client Report -----");
    console.log("  Numbers clients connected : " + clientCount);
    console.log(`  Total packets received    : ${totalPacketsReceivedSinceStart}`);
    console.log(`  Session packets sent      : ${packetsSentSinceLastReport}`);
    packetsSentSinceLastReport = 0;
    console.log(`  Session packets received  : ${packetsReceivedFromServer}`);
    packetsReceivedFromServer = 0;
    console.log(`  Average response time: ${averageResponseTimeMs.toFixed(2)} ms (${averageResponseTimeS.toFixed(2)} s)`);
    console.log(`  Max response time: ${maxResponseTime} ms (${maxResponseTimeS.toFixed(2)} s)`);
    maxResponseTime = 0;
}

function printReportAndExit() {
    console.log("================ FORCE TERMINATED !! =======================");
    printReport();
    process.exit(0);
}

createClient();
setInterval(printReport, 1000);

process.on('SIGINT', printReportAndExit);








// const {io} = require("socket.io-client");
//
// const URL = process.env.URL || "http://localhost:9002";
// const MAX_CLIENTS = 100;
// const CLIENT_CREATION_INTERVAL_IN_MS = 10;
// // const EMIT_INTERVAL_IN_MS = 33; // 맥북에서 확인한 키반복률
// const EMIT_INTERVAL_IN_MS = 50; // 맥북에서 확인한 키반복률
// // const EMIT_INTERVAL_IN_MS = 200;
// // const EMIT_INTERVAL_IN_MS = 500;
// // const EMIT_INTERVAL_IN_MS = 1000;
// const JSON_TO_STRING='A'.repeat(5 * 1024);
// const ASCII_TO_STRING='A'.repeat(1);
//
// let clientCount = 0;
// let lastReport = new Date().getTime();
// let packetsSentSinceLastReport = 0;
// let packetsReceivedFromServer = 0;
// let terminatedClients = 0;
//
//
// let maxResponseTime = 0;
// let totalResponseTime = 0;
// let totalResponsesReceived = 0;
// let totalPacketsReceivedSinceStart = 0;
//
//
// const createClient = () => {
//     const socket = io(URL);
//
//     const generatePayload = () => {
//         const data = JSON_TO_STRING;  // 5KB 크기의 문자열
//         // const data =ASCII_TO_STRING;
//         return {message: data};
//     };
//
//     setInterval(() => {
//         const timestamp = new Date().getTime();
//         socket.emit("client to server event", {...generatePayload(), timestamp});
//         packetsSentSinceLastReport++;
//     }, EMIT_INTERVAL_IN_MS);
//
//     socket.on("server to client event", (data) => {
//         packetsReceivedFromServer++;
//         totalPacketsReceivedSinceStart++;
//
//         const responseTime = new Date().getTime() - data.timestamp;
//         totalResponseTime += responseTime;
//         totalResponsesReceived++;
//         if (responseTime > maxResponseTime) maxResponseTime = responseTime;
//     });
//
//     socket.on("terminate", () => {
//         socket.disconnect();
//         terminatedClients++;
//     });
//
//     socket.on("disconnect", (reason) => {
//         console.log(`disconnect due to reason `);
//         if (clientCount >= MAX_CLIENTS) {
//             console.log("================ FORCE TERMINATED !! =======================");
//             printReport();
//             clearInterval(printReportInterval);
//             process.exit(0); // 종료
//         }
//     });
//
//     if (++clientCount < MAX_CLIENTS) {
//         setTimeout(createClient, CLIENT_CREATION_INTERVAL_IN_MS);
//     }
// };
//
// createClient();
//
// const printReport = () => {
//     const avgResponseTimeInMs = (totalResponseTime / totalResponsesReceived).toFixed(2);
//     const avgResponseTimeInS = (avgResponseTimeInMs / 1000).toFixed(2);
//     const maxResponseTimeInS = (maxResponseTime / 1000).toFixed(2);
//
//     console.log("----- Client Packet Report -----");
//     console.log("   Total packets received since start:" ,totalPacketsReceivedSinceStart );
//     console.log("   Session packets sent:", packetsSentSinceLastReport );
//     console.log("   Session packets received:", packetsReceivedFromServer );
//     console.log("   Average response time:", avgResponseTimeInMs,"ms (",avgResponseTimeInS, "s)");
//     console.log("   Max response time:", maxResponseTime,"ms (",maxResponseTimeInS, "s)");
//     console.log("   Terminated clients:" ,terminatedClients );
//     // console.log("--------------------------------");
//
//     packetsReceivedFromServer = 0;
//     packetsSentSinceLastReport = 0;
//     maxResponseTime= 0;
//     lastReport = new Date().getTime();
//
// };
//
//
// const printReportInterval = setInterval(printReport, 1000);
//
// process.on('SIGINT', function() {
//     console.log("================ FORCE TERMINATED !! =======================");
//     printReport();
//     clearInterval(printReportInterval); // 리포트 인터벌을 정지시킵니다.
//     process.exit(); // 프로세스를 종료시킵니다.
// });
//
