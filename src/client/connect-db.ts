import { LINK_STORAGE, main } from "./main";
type user = {
  linksStorage: LINK_STORAGE;
  allFilterGroups: string[];
};
type requestMethod = "GET" | "PUT";
interface successfulResponse {
  success: true;
}
interface successfulGetResponse extends successfulResponse {
  data: user;
}
interface failureResponse {
  success: false;
}
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

export function accountDbRequest(
  method: "GET"
): Promise<successfulGetResponse | failureResponse>;

export function accountDbRequest(
  method: "PUT",
  data: putData
): Promise<successfulResponse | failureResponse>;

export function accountDbRequest(method: requestMethod, data?: putData) {
  return new Promise((resolve, reject) => {
    try {
      if (main.dataset.display !== "synchronized")
        reject({
          success: false,
        });
      const xhr = new XMLHttpRequest();
      xhr.timeout = 2000;
      const url =
        (document.querySelector("aside")!.children[5] as HTMLAnchorElement)
          .href + "/db";
      xhr.open(method, url, true);

      if (method == "GET")
        xhr.onload = () => {
          if (xhr.readyState === XMLHttpRequest.DONE) {
            const status = xhr.status;
            if (status === 0 || (status >= 200 && status < 400)) {
              console.log("resolve");

              resolve({
                success: true,
                data: JSON.parse(xhr.response) as user,
              } satisfies successfulGetResponse);
            } else {
              reject({
                success: false,
              } satisfies failureResponse);
            }
          }
        };
      else {
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.onload = () => {
          resolve({
            success: true,
          } satisfies successfulResponse);
        };
      }
      xhr.onerror = () => {
        reject({
          success: false,
        } as failureResponse);
      };

      xhr.send(JSON.stringify({ ...data }));
    } catch {
      reject({
        success: false,
      });
    }
  });
}
