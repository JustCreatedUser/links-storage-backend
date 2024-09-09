import { main } from "./main.js";
export function accountDbRequest(method, data) {
    return new Promise((resolve, reject) => {
        try {
            if (main.dataset.display !== "synchronized") {
                reject("App version is not synchronized, db request rejected");
                return;
            }
            const sideBar = document.querySelector("aside");
            if (!sideBar) {
                reject(new Error("Aside element not found"));
                return;
            }
            const xhr = new XMLHttpRequest();
            xhr.timeout = 5000;
            const url = sideBar.children[5].href + "/db";
            xhr.open(method, url);
            if (method === "PUT")
                xhr.setRequestHeader("Content-Type", "application/json");
            xhr.onload = () => {
                if (method == "GET") {
                    const status = xhr.status;
                    if (xhr.readyState !== XMLHttpRequest.DONE)
                        return;
                    if (status === 0 || (status >= 200 && status < 400))
                        try {
                            const userData = JSON.parse(xhr.response);
                            resolve(userData);
                        }
                        catch (_a) {
                            reject(new Error("Invalid JSON response"));
                        }
                    else
                        reject(new Error(`HTTP error ${status}`));
                }
                else {
                    resolve("ok");
                }
            };
            xhr.onerror = () => {
                reject(new Error("XHR error"));
            };
            xhr.ontimeout = () => {
                reject(new Error("Request ran out of time"));
            };
            if (data)
                xhr.send(JSON.stringify(data));
            else
                xhr.send();
        }
        catch (error) {
            reject(error);
        }
    });
}
//# sourceMappingURL=connect-db.js.map