import { readFileSync, writeFileSync } from "fs";

const rawrouteData = readFileSync("./routesOLD.json");
const routes = JSON.parse(rawrouteData);

for (const [routename, routeObject] of Object.entries(routes)) {
    const coordinates = routeObject.coordinates
    const flippedCoordinates = []

    for (const coordinate of coordinates) {
        const longlat = coordinate.split(",");
        const latlong = longlat[1].toString() + "," + longlat[0].toString();
        flippedCoordinates.push(latlong);   
    }
    routeObject.coordinates = flippedCoordinates;
  }

writeFileSync('routes.json', JSON.stringify(routes));


// const routeCoordinates = routes[routename]["coordinates"];
