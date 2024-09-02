export function getAccountDb() {
  const xhr = new XMLHttpRequest();
  const method = "GET";
  const url =
    (document.querySelector("aside")!.lastElementChild as HTMLAnchorElement)
      .href + "/db";

  xhr.open(method, url, true);
  xhr.onreadystatechange = () => {
    if (xhr.readyState === XMLHttpRequest.DONE) {
      const status = xhr.status;
      if (status === 0 || (status >= 200 && status < 400)) {
        console.log(xhr.responseText);
      } else {
        console.error(xhr.statusText);
      }
    }
  };
  xhr.send();
}
