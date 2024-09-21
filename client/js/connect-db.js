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
            const headers = {
                "Content-Type": "application/json",
            };
            const url = sideBar.children[5].href + "/db";
            const options = {
                method,
                headers,
                body: JSON.stringify(data),
            };
            const request = new Request(url, options);
            fetch(request).then((response) => {
                if (!response.ok)
                    reject(new Error(`!Request error!`));
                if (method == "GET") {
                    try {
                        response.json().then(resolve).catch(console.error);
                    }
                    catch (_a) {
                        reject(new Error("!GET request error - Invalid JSON response"));
                    }
                }
                else {
                    resolve(method + " request completed successfully");
                }
            });
        }
        catch (error) {
            reject(error.message);
        }
    });
}
//# sourceMappingURL=connect-db.js.map