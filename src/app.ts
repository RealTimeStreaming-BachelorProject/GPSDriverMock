import io from "socket.io-client";
import { username, password } from "./driverinfo";
import { loginToApplication } from "./helpers/api";
import { NEW_COORDINATES, AUTHENTICATED, AUTHENTICATE } from "./socketevents";
import routes from "./routes.json";
import { listenForSignals } from "./helpers/shutdown";
import jwt from "jsonwebtoken";
import fetch from "node-fetch";

const driverSerivceURL = process.env.DRIVER_SERVICE_URL as string;
const routename = process.env.ROUTENAME ?? "route1";
const packageServiceURL = process.env.PACKAGE_SERVICE_URL;
const driverUpdateInterval = 3000;

const routeCoordinates = (routes as any)[routename]["coordinates"];

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
          continouslySendCoordinates(routeCoordinates, socket);
        } catch (error) {
          console.log(error.message);
        }
      })
      .on("unauthorized", (msg: { data: { type: string | undefined } }) => {
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

async function registerInRoutePackages(token) {
  const packagesToDeliver = JSON.parse(
    process.env.PACKAGES_TO_DELIVER as string
  );
  const body = {
    fakeScenario: true,
    packageIDs: packagesToDeliver,
    driverID: (jwt.decode(token) as object)["driverID"],
  };

  const response = await fetch(packageServiceURL + "/inroute", {
    method: "post",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then((res) => res.json());

  console.log(response);
}

let token: string;
(async () => {
  token = await loginToApplication(username, password);
  await registerInRoutePackages(token);
})()
  .catch((e) => {
    console.log(e);
  })
  .then(() => {
    const socket = io(driverSerivceURL, {
      reconnectionAttempts: 5,
    });
    configureEndpoints(socket);
  });
