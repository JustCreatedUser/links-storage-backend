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
      if (main.dataset.display !== "synchronized") reject();
      const xhr = new XMLHttpRequest();
      xhr.timeout = 2000;
      const url =
        (document.querySelector("aside")!.children[5] as HTMLAnchorElement)
          .href + "/db";
      xhr.open(method, url, true);
      if (method === "PUT")
        xhr.setRequestHeader("Content-Type", "application/json");
      xhr.onload = () => {
        if (method == "GET") {
          if (xhr.readyState !== XMLHttpRequest.DONE) return;
          const status = xhr.status;
          if (status === 0 || (status >= 200 && status < 400))
            resolve(JSON.parse(xhr.response) as user);
          else reject();
        } else {
          resolve("ok");
        }
      };
      xhr.onerror = () => {
        reject();
      };

      xhr.send(JSON.stringify({ ...data }));
    } catch {
      reject();
    }
  });
}
