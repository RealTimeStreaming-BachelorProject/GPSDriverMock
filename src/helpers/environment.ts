const LOGINSERVICE_URL = process.env['LOGINSERVICE_URL'] ?? "http://localhost:5005"
export const LOGINSERVICE_LOGIN_ROUTE = LOGINSERVICE_URL + "/authentication/login"
export const LOGINSERVICE_REGISTER_ROUTE = LOGINSERVICE_URL + "/authentication/register"