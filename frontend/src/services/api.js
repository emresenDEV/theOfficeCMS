import axios from "axios";

// Base URL for Flask API (FIXME: UPDATE TO WHERE BACKEND IS HOSTED)
const API_BASE_URL = "http://127.0.0.1:5001";

// Axios instance for API requests
const api = axios.create({
baseURL: API_BASE_URL,
headers: { "Content-Type": "application/json" },
});

// Fetch all accounts EXPLAINED:
// EXPORT: exports the fetchDataTable function so it can be used in other parts of the app.
// ASYNC () => {: keyword to perform an asynchronous operation (API calls). Allows fetching data from the server without blocking the main thread. UI remains responsive.
// TRY: attempts to fetch the data from the server.
// CATCH: error handling (server issues, network problems). Logs error to console and returns an empty array. Error handling ensures the component doesn't break if the API request fails.
// CONST RESPONSE: makes the GET request to the endpoint ("/dataTableName")
// AWAIT: keyword. Pauses execution of function until api.get is resolved. Once resolved, the response is stored in the response variable. Allows for asynchronous code to be written in a synchronous style.
//  RETURN RESPONSE.DATA: returns the data from the response object. This is the data fetched from the server.

export default api;
