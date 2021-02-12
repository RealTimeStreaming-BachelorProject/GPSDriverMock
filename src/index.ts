import io from "socket.io-client";
import { readFileSync } from "fs";
import { env } from "process";
import { username, password, route } from "./driverinfo";
import { loginToApplication } from "./helpers/api";
import { DELIVERY_START, DRIVER_INIT, NEW_COORDINATES, PACKAGE_DELIVERED } from "./socketevents";
import { v4 as uuidv4 } from "uuid";

const driverSerivceURL =
  env.DRIVER_SERVICE_URL ?? "ws://localhost:5001/drivers";
console.log(driverSerivceURL);
const routename = env.ROUTENAME ?? "route1";
console.log(routename);
const driverUpdateInterval = 3000;

const socket = io(driverSerivceURL);

const rawrouteData = readFileSync("./routes.json");
const routes = JSON.parse(rawrouteData.toString());

const routeCoordinates = routes[routename]["coordinates"];

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
