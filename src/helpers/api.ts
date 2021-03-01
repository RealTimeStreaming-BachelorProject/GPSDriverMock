import fetch from "node-fetch";
import {
  LOGINSERVICE_LOGIN_ROUTE,
  LOGINSERVICE_REGISTER_ROUTE,
} from "./environment";

export async function loginToApplication(username: string, password: string) {
  const body = { username, password };
  try {
    let response = await fetch(LOGINSERVICE_LOGIN_ROUTE, {
      method: "post",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    }).then((res) => res.json());

    if (response.statusCode !== 200) {
      // Try to register
      response = await fetch(LOGINSERVICE_REGISTER_ROUTE, {
        method: "post",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      }).then((res) => res.json());

      if (response.statusCode !== 201) {
        throw new Error("ERROR - Could not create a new user");
      }
    }
    
    return response.token;
  } catch (error) {
    console.log(error);
  }
}
