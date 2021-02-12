import fetch from "node-fetch";
import {
  LOGINSERVICE_LOGIN_ROUTE,
  LOGINSERVICE_REGISTER_ROUTE,
} from "./environment";

export async function loginToApplication(username: string, password: string) {
  const body = { username, password };

  let response = await fetch(LOGINSERVICE_LOGIN_ROUTE, {
    method: "post",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  }).then((res) => res.json());

  if (response.statusCode !== 200) {
    console.log("ERROR - Could not login, trying to create a user");
    // Try to register
    const registerResponse = await fetch(LOGINSERVICE_REGISTER_ROUTE, {
      method: "post",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    }).then((res) => res.json());

    if (registerResponse.statusCode !== 201) {
      throw new Error("ERROR - Could not create a new user")
    }
    console.log("SUCCESS - created a new user")

    response = await fetch(LOGINSERVICE_LOGIN_ROUTE, {
      method: "post",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    }).then((res) => res.json());

    if (response.statusCode !== 200) {
      console.log("ERROR - Could still not login after user registering");
      throw new Error("ERROR - Could still not login after user registering")
    }
    console.log("SUCCESS - Logged in")
  }
  return response.token;
}
