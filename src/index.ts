import io from "socket.io-client";
import { env } from "process";
import { username, password, route } from "./driverinfo";
import { loginToApplication } from "./helpers/api";
import { DELIVERY_START, NEW_COORDINATES, AUTHENTICATED, AUTHENTICATE } from "./socketevents";
import { v4 as uuidv4 } from "uuid";
import routes from "./routes.json";
import { listenForSignals } from "./helpers/shutdown";

const driverSerivceURL =
  env.DRIVER_SERVICE_URL ?? "ws://localhost:5002/drivers";
const routename = process.env.ROUTENAME ?? "route1";
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

function configureEndpoints(socket: SocketIOClient.Socket) {
  socket.on("connect", async () => {
    socket
      .emit(AUTHENTICATE, { token }) // send the jwt
      .on(AUTHENTICATED, () => {
        console.log("🚀 Connected to server");
        try {
          console.log("Starting delivery route");
          socket.emit(DELIVERY_START, { packages: route.packages });

          continouslySendCoordinates(routeCoordinates, socket);
        } catch (error) {
          console.log(error.message);
        }
      }).on("unauthorized", (msg: { data: { type: string | undefined; }; }) => {
        console.log(`unauthorized: ${JSON.stringify(msg.data)}`);
        throw new Error(msg.data.type);
      });
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
