import { LINK_STORAGE, main } from "./main";
type user = {
  linksStorage: LINK_STORAGE;
  allFilterGroups: string[];
};
type requestMethod = "GET" | "PUT";
type putData = data1 | data2 | syncLocalData;
type data1 = {
  linksStorage: LINK_STORAGE;
};
type data2 = {
  allFilterGroups: string[];
};
type syncLocalData = {
  linksStorage: LINK_STORAGE;
  allFilterGroups: string[];
};

export function accountDbRequest(method: "GET"): Promise<user>;

export function accountDbRequest(method: "PUT", data: putData): Promise<"ok">;

export function accountDbRequest(
  method: requestMethod,
  data?: putData
): Promise<"ok" | user> {
  return new Promise((resolve: (value: user | "ok") => void, reject) => {
    try {
      if (main.dataset.display !== "synchronized") {
        reject(new Error("Dataset display is not synchronized"));
        return;
      }
      const sideBar = document.querySelector("aside");
      if (!sideBar) {
        reject(new Error("Aside element not found"));
        return;
      }

      const xhr = new XMLHttpRequest();
      xhr.timeout = 2000;

      const url = (sideBar.children[5] as HTMLAnchorElement).href + "/db";
      xhr.open(method, url, true);

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
              reject(new Error("Invalid JSON response"));
            }
          else reject(new Error(`HTTP error ${status}`));
        } else {
          resolve("ok");
        }
      };
      xhr.onerror = () => {
        reject(new Error("XHR error"));
      };
      xhr.ontimeout = () => {
        reject(new Error("Request ran out of time"));
      };

      if (data) xhr.send(JSON.stringify(data));
      else xhr.send();
    } catch (error) {
      reject(error);
    }
  });
}
