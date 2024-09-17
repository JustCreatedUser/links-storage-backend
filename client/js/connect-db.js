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
                reject(new Error("!HTML Error - Aside element not found!"));
                return;
            }
            const xhr = new XMLHttpRequest();
            xhr.timeout = 5000;
            const url = sideBar.children[5].href + "/db";
            xhr.open(method, url);
            if (method !== "GET")
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
                            reject(new Error("!GET request error - Invalid JSON response"));
                        }
                    else
                        reject(new Error(`!GET request error code - ${status}`));
                }
                else {
                    resolve(method + " request completed successfully");
                }
            };
            xhr.onerror = () => {
                reject(new Error("!!!Request ERROR!!!"));
            };
            xhr.ontimeout = () => {
                reject(new Error("!Request error - TIMED OUT!"));
            };
            if (data)
                xhr.send(JSON.stringify(data));
            else
                xhr.send();
        }
        catch (error) {
            reject(error.message);
        }
    });
}
//# sourceMappingURL=connect-db.js.map