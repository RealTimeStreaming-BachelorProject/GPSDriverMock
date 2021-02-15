import io from "socket.io-client";
import { env } from "process";
import { username, password, route } from "./driverinfo";
import { loginToApplication } from "./helpers/api";
import { DELIVERY_START, DRIVER_INIT, NEW_COORDINATES } from "./socketevents";
import { v4 as uuidv4 } from "uuid";
import routes from "./routes.json";
import { listenForSignals } from "./helpers/shutdown";

const driverSerivceURL =
  env.DRIVER_SERVICE_URL ?? "ws://localhost:5002/drivers";
const routename = env.ROUTENAME ?? "route1";
const driverUpdateInterval = 3000;

const socket = io(driverSerivceURL, {
  reconnectionAttempts: 5,
});

const routeCoordinates = (routes as any)[routename]["coordinates"];

// Create package uuids which in the real world would be generated somewhere else
for (var i = 0; i < 100; i++) {
  (route.packages as any).push(uuidv4());
}

let intervalID: NodeJS.Timeout;

function continouslySendCoordinates(coordinates: any) {
  let counter = 0;
  intervalID = setInterval(() => {
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

socket.on("connect", async () => {
  console.log("🚀 Connected to server");
  try {
    // Get token when connecting
    const token = await loginToApplication(username, password);
    console.log("I am connected, initializing connection");
    socket.emit(DRIVER_INIT, { jwt: token });

    console.log("I have initialized. Starting delivery route");
    socket.emit(DELIVERY_START, { packages: route.packages });

    continouslySendCoordinates(routeCoordinates);
  } catch (error) {
    console.log(error.message);
  }
});

socket.on("disconnect", () => {
  console.log("I disconnected");
  clearInterval(intervalID);
});

socket.on("connect_error", () => {
  console.log("Can't connect to server");
});

listenForSignals(socket);
