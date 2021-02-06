const { Socket, io } = require("socket.io-client");
const fs = require("fs");
const { env } = require("process");

const driverSerivceURL = env.DRIVER_SERVICE_URL ?? "ws://localhost:5001";
console.log(driverSerivceURL);
const routename = env.ROUTENAME ?? "route1";
console.log(routename);
const driverUpdateInterval = 4000;

const socket = io(driverSerivceURL);

const rawrouteData = fs.readFileSync("./routes.json");
const routes = JSON.parse(rawrouteData);

const routeCoordinates = routes[routename]["coordinates"];

socket.on("connect", () => {
  console.log("I am connected");
  continouslySendCoordinates(routeCoordinates);
});

socket.on("disconnect", () => {
    console.log("I disconnected");
})

async function continouslySendCoordinates(coordinates) {
  counter = 0;
  setInterval(() => {
    if (counter >= coordinates.length) {
      counter = 0; // reset back to start of route
    }
    let coordinate = coordinates[counter++];
    socket.emit("set-position", coordinate);
  }, driverUpdateInterval);
}
