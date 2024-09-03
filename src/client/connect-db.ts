import { LINK_STORAGE } from "./main";
export async function accountDbRequest(
  method: "GET" | "PUT",
  DATA_STORAGE: any
): Promise<void> {
  const xhr = new XMLHttpRequest();
  const url =
    (document.querySelector("aside")!.children[5] as HTMLAnchorElement).href +
    "/db";

  xhr.open(method, url, true);
  if (method == "GET") {
    xhr.onreadystatechange = () => {
      if (xhr.readyState === XMLHttpRequest.DONE) {
        const status = xhr.status;
        type user = {
          linksStorage: LINK_STORAGE;
          allFilterGroups: string[];
        };
        if (status === 0 || (status >= 200 && status < 400)) {
          console.log(xhr.response as user);
        } else {
          alert(xhr.statusText);
        }
      }
    };
  } else {
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onload = () => {
      console.log(`${xhr.status}, ${xhr.responseText}`);
    };
  }
  xhr.onerror = () => {
    alert(xhr.statusText);
  };
  xhr.send(JSON.stringify({ ...DATA_STORAGE }));
}
