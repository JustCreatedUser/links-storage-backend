import { LINK_STORAGE, main } from "./main.js";
import { LinkInDatabase } from "./storage-data.js";
type user = {
  linkStorage: LINK_STORAGE;
  groupStorage: string[];
};
export type requestMethod = "GET" | "POST" | "DELETE" | "PATCH" | "PUT";
type sendDataType = deleteData | patchData | postData | putData;
export type deleteData = singleDataType & {
  currentItem: string;
};
type putData = pluralDataType & {
  currentItem: LINK_STORAGE | string[];
};
export type postData = singleDataType & {
  currentItem: LinkInDatabase | string;
};
export type patchData = singleDataType & {
  previousTitle: string;
  currentItem: string | LinkInDatabase;
};
type singleDataType = {
  type: "group" | "link";
};
type pluralDataType = {
  type: "groupS" | "linkS";
};
/**
 * Makes a request to the account database.
 *
 * @param {requestMethod} method - The request method, either "GET" or "PUT".
 * @param {sendDataType} [data] - The data to send with the request, only required for "PUT" requests.
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

export function accountDbRequest(
  method: "PATCH",
  data: patchData
): Promise<string>;

export function accountDbRequest(method: "PUT", data: putData): Promise<string>;

export function accountDbRequest(
  method: "POST",
  data: postData
): Promise<string>;

export function accountDbRequest(
  method: "DELETE",
  data: deleteData
): Promise<string>;

export function accountDbRequest(
  method: requestMethod,
  data?: sendDataType
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
      const headers = {
        "Content-Type": "application/json",
      };
      const url = (sideBar.children[5] as HTMLAnchorElement).href + "/db";
      const options = {
        method,
        headers,
        body: JSON.stringify(data),
      };
      const request = new Request(url, options);
      fetch(request).then((response) => {
        if (!response.ok) reject(new Error(`!Request error!`));
        if (method == "GET") {
          try {
            response.json().then(resolve).catch(console.error);
          } catch {
            reject(new Error("!GET request error - Invalid JSON response"));
          }
        } else {
          resolve(method + " request completed successfully");
        }
      });
    } catch (error: any) {
      reject(error.message);
    }
  });
}
