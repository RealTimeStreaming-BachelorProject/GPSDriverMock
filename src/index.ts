import io from "socket.io-client";
import { env } from "process";
import { username, password, route } from "./driverinfo";
import { loginToApplication } from "./helpers/api";
import {
  DELIVERY_START,
  LATENCY_RESULT,
  NEW_COORDINATES,
} from "./socketevents";
import { v4 as uuidv4 } from "uuid";
import routes from "./routes.json";
import { listenForSignals } from "./helpers/shutdown";

const driverSerivceURL =
  env.DRIVER_SERVICE_URL ?? "ws://localhost:5002/drivers";
const routename = env.ROUTENAME ?? "route1";
const driverUpdateInterval = 3000;

const routeCoordinates = (routes as any)[routename]["coordinates"];

// Create package uuids which in the real world would be generated somewhere else
for (var i = 0; i < 100; i++) {
  (route.packages as any).push(uuidv4());
}

let coordinateIntervalID: NodeJS.Timeout;

function continouslySendCoordinates(
  coordinates: any,
  socket: SocketIOClient.Socket
) {
  let counter = 0;
  coordinateIntervalID = setInterval(() => {
    if (counter >= coordinates.length) {
      counter = 0; // reset back to start of route
    }
    let coordinate = coordinates[counter++];
    try {
      socket.emit(NEW_COORDINATES, { coordinate: coordinate });
    } catch (error) {
      console.log(error);
    }
  }, driverUpdateInterval);
}

let latencyIntervalID: NodeJS.Timeout;

// https://stackoverflow.com/questions/4071258/how-can-i-find-the-response-time-latency-of-a-client-in-nodejs-with-sockets-s/45216554#45216554
function latencyTest(socket: SocketIOClient.Socket) {
  socket.on("pong", (heartbeatLatency: number) => {
    socket.emit(LATENCY_RESULT, heartbeatLatency); // emit the result back to the server for metrics
  });
}

function configureEndpoints(socket: SocketIOClient.Socket) {
  socket.on("connect", async () => {
    console.log("🚀 Connected to server");
    try {
      console.log("Starting delivery route");
      socket.emit(DELIVERY_START, { packages: route.packages });

      continouslySendCoordinates(routeCoordinates, socket);
      latencyTest(socket);
    } catch (error) {
      console.log(error.message);
    }
  });

  socket.on("disconnect", () => {
    console.log("I disconnected");
    clearInterval(coordinateIntervalID);
    clearInterval(latencyIntervalID);
  });

  socket.on("connect_error", (err: Error) => {
    console.log(err.message);
  });

  listenForSignals(socket);
}

let token: string;
(async () => {
  token = await loginToApplication(username, password);
})()
  .catch((e) => {
    // Deal with the fact the chain failed
    console.log(e);
  })
  .then(() => {
    const socket = io(driverSerivceURL, {
      query: {
        token,
      },
      reconnectionAttempts: 5,
    });
    configureEndpoints(socket);
  });
