import { LINK_STORAGE, main } from "./main.js";
type user = {
  linkStorage: LINK_STORAGE;
  groupStorage: string[];
};
type requestMethod = "GET" | "PUT";
type putData = putLinks | putGroups | syncLocalData;
type putLinks = {
  linkStorage: LINK_STORAGE;
};
type putGroups = {
  groupStorage: string[];
};
type syncLocalData = {
  linkStorage: LINK_STORAGE;
  groupStorage: string[];
};
/**
 * Makes a request to the account database.
 *
 * @param {requestMethod} method - The request method, either "GET" or "PUT".
 * @param {putData} [data] - The data to send with the request, only required for "PUT" requests.
 * @returns {Promise<string | user>} - A promise that resolves to either string for successful "PUT" requests or a user object for successful "GET" requests.
 *
 * @example
 * // GET request
 * accountDbRequest("GET").then((user) => {
 *   console.log(user); // { linkStorage: LINK_STORAGE, groupStorage: string[] }
 * });
 *
 * @example
 * // PUT request with putLinks
 * const data: putLinks = { linkStorage: LINK_STORAGE };
 * accountDbRequest("PUT", data).then((response) => {
 *   console.log(response); // string
 * });
 *
 * @example
 * // PUT request with putGroups
 * const data: putGroups = { groupStorage: ["filter1", "filter2"] };
 * accountDbRequest("PUT", data).then((response) => {
 *   console.log(response); // string
 * });
 *
 * @example
 * // PUT request with syncLocalData
 * const data: syncLocalData = { linkStorage: LINK_STORAGE, groupStorage: ["filter1", "filter2"] };
 * accountDbRequest("PUT", data).then((response) => {
 *   console.log(response); // string
 * });
 */
export function accountDbRequest(method: "GET"): Promise<user>;

export function accountDbRequest(method: "PUT", data: putData): Promise<string>;

export function accountDbRequest(
  method: requestMethod,
  data?: putData
): Promise<string | user> {
  return new Promise((resolve: (value: user | string) => void, reject) => {
    try {
      if (main.dataset.display !== "synchronized") {
        reject("App version is not synchronized, db request rejected");
        return;
      }
      const sideBar = document.querySelector("aside");
      if (!sideBar) {
        reject(new Error("!HTML Error - Aside element not found!"));
        return;
      }

      const xhr = new XMLHttpRequest();
      xhr.timeout = 5000;

      const url = (sideBar.children[5] as HTMLAnchorElement).href + "/db";
      xhr.open(method, url);

      if (method === "PUT")
        xhr.setRequestHeader("Content-Type", "application/json");

      xhr.onload = () => {
        if (method == "GET") {
          const status = xhr.status;
          if (xhr.readyState !== XMLHttpRequest.DONE) return;
          if (status === 0 || (status >= 200 && status < 400))
            try {
              const userData = JSON.parse(xhr.response) as user;
              resolve(userData);
            } catch {
              reject(new Error("!GET request error - Invalid JSON response"));
            }
          else reject(new Error(`!GET request error code - ${status}`));
        } else {
          resolve("PUT request completed successfully");
        }
      };
      xhr.onerror = () => {
        reject(new Error("!!!Request ERROR!!!"));
      };
      xhr.ontimeout = () => {
        reject(new Error("!Request error - TIMED OUT!"));
      };

      if (data) xhr.send(JSON.stringify(data));
      else xhr.send();
    } catch (error: any) {
      reject(error.message);
    }
  });
}
