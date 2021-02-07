const { Socket, io } = require("socket.io-client");
const fs = require("fs");
const { env } = require("process");
const driverinfo = require("./driverinfo")

driverinfo.uuid = env.DRIVERID ?? driverinfo.uuid;
const driverSerivceURL = env.DRIVER_SERVICE_URL ?? "ws://localhost:5001/drivers";
console.log(driverSerivceURL);
const routename = env.ROUTENAME ?? "route1";
console.log(routename);
const driverUpdateInterval = 4000;

const socket = io(driverSerivceURL);

const rawrouteData = fs.readFileSync("./routes.json");
const routes = JSON.parse(rawrouteData);

const routeCoordinates = routes[routename]["coordinates"];

socket.on("connect", () => {
  console.log("I am connected, sending JWT");
  socket.emit("driver_auth", { jwt: driverinfo.jwt, username: driverinfo.username })
  continouslySendCoordinates(routeCoordinates);
});

socket.on("disconnect", () => {
    console.log("I disconnected");
    socket.disconnect();
})

async function continouslySendCoordinates(coordinates) {
  counter = 0;
  setInterval(() => {
    if (counter >= coordinates.length) {
      counter = 0; // reset back to start of route
    }
    let coordinate = coordinates[counter++];
    console.log(coordinate)
    socket.emit("new_coordinates", { coordinate: coordinate, userid: driverinfo.uuid });
  }, driverUpdateInterval);
}
