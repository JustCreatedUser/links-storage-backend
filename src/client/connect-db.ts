import { LINK_STORAGE } from "../server/User-model";

export function getAccountDb() {
  const xhr = new XMLHttpRequest();
  const method = "GET";
  console.log(document.querySelector("aside")!.children[5]);

  const url =
    (document.querySelector("aside")!.children[5] as HTMLAnchorElement).href +
    "/db";

  xhr.open(method, url, true);
  xhr.onreadystatechange = () => {
    if (xhr.readyState === XMLHttpRequest.DONE) {
      const status = xhr.status;
      type user = {
        username: string;
        password: string;
        linksStorage: LINK_STORAGE;
        allFilterGroups: string[];
      };
      if (status === 0 || (status >= 200 && status < 400)) {
        console.log((JSON.parse(xhr.responseText) as user).linksStorage);
      } else {
        alert(xhr.statusText);
      }
    }
  };
  xhr.onerror = () => {
    alert(xhr.statusText);
  };
  xhr.send();
}
