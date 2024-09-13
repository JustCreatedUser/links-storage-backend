import { accountDbRequest } from "./connect-db.js";
import * as editors from "./Editor.js";
import { sidebar } from "./SidebarFunctions.js";
const { groupEditor, linkEditor } = editors;
export const main = document.querySelector("main") as HTMLElement;
export const DATA_STORAGE: Storage = (() => {
  if (main.dataset.display == "local") {
    return window.localStorage;
  } else {
    return window.sessionStorage;
  }
})();
if (!DATA_STORAGE) {
  alert(
    "The internet connection is worthless or your browser is too old. Update it or use a different one."
  );
}
export let linkStorage: LINK_STORAGE = JSON.parse(
    DATA_STORAGE["linkStorage"] || "[]"
  ),
  groupStorage: string[] = JSON.parse(DATA_STORAGE["groupStorage"] || "[]");
accountDbRequest("GET")
  .then(
    (user) => {
      let data: keyof typeof user;
      linkStorage = user["linkStorage"];
      groupStorage = (() => {
        try {
          if (user["groupStorage"].length === 0)
            throw new Error("groups are empty");
          return user["groupStorage"];
        } catch {
          const groups = (() => {
            const groups = Array.from(
              new Set(
                linkStorage.reduce((allGroups: string[], link) => {
                  allGroups.push(link.group);
                  return allGroups;
                }, [])
              )
            );
            if (groups.includes("Ungrouped")) {
              groups.splice(
                groups.findIndex((group: string) => group === "Ungrouped"),
                1
              );
            }
            if (!groups.length) return groups;
            accountDbRequest("PUT", { groupStorage: groups })
              .then(
                () => {},
                (reason) => {
                  console.log(reason);
                }
              )
              .catch((error) => {
                console.error(error.message);
              });
            return groups;
          })();
          DATA_STORAGE.setItem("groupStorage", JSON.stringify(groups));
          return groups;
        }
      })();
      for (data in user) {
        DATA_STORAGE.setItem(data, JSON.stringify(user[data]));
      }
    },
    () => {
      console.log("Server rejected giving data for render");
    }
  )
  .catch((error) => {
    console.log("!!!ERROR!!! - " + error);
  })
  .finally(() => {
    linkEditor.prepareGroupDatalist();
    sidebar.displayAllGroups();
    prepareSearchInput();
    showLinksToUser("All", "group");
  });
export const fieldset = document.querySelector("fieldset") as HTMLElement,
  searchButton = document.getElementById("search-button") as HTMLElement;
export interface Link {
  description: string;
  url: string;
  group: string;
}
export type LINK_STORAGE = Array<Link>;

export function prepareSearchInput() {
  const datalist = document.getElementById(
    "find-reference_options"
  ) as HTMLDataListElement;
  datalist.innerHTML = "";
  datalist.append(
    ...linkStorage.reduce((allLinks: Array<HTMLOptionElement>, link) => {
      const option = document.createElement("option");
      option.value = link.description;
      allLinks.push(option);
      return allLinks;
    }, [])
  );
}

export function showLinksToUser(
  group: string,
  elementToShow: "group" | LINK_STORAGE
) {
  main.innerHTML = "";
  linkEditor.editItem = null;
  var filteredArray =
    elementToShow === "group" ? filterLinksByGroup(group) : elementToShow;
  filteredArray.forEach((link) => {
    const linkElement = document.createElement("div");
    linkElement.innerHTML = /*html*/ `
      <a href="${link.url}" target="_blank">${link.description}</a>
      `;
    const linkEditorOpen = document.createElement("button");
    linkEditorOpen.addEventListener("click", () => {
      linkEditor.open();
    });
    linkEditorOpen.textContent = "⋮";
    linkElement.appendChild(linkEditorOpen);
    main.appendChild(linkElement);
  });
}

function filterLinksByGroup(group: string) {
  return linkStorage.filter((item) => {
    return group === "All" ? true : item.group === group;
  }) as LINK_STORAGE;
}

function configureGroupNameInput(
  situation: "rename",
  target: HTMLSpanElement
): void;
function configureGroupNameInput(
  situation: "create",
  target: undefined
): HTMLInputElement;
function configureGroupNameInput(
  situation: "create" | "rename",
  span: HTMLSpanElement | undefined
) {
  const groupInput = document.createElement("input");
  groupInput.placeholder = "new group";
  groupInput.type = "text";
  switch (situation) {
    case "create":
      groupInput.addEventListener("blur", function (): void {
        if (!groupInput.value) {
          groupInput.parentElement?.remove();
          return;
        }
        if ([...groupStorage, "Ungrouped", "All"].includes(groupInput.value)) {
          alert("This groups already exists");
          groupInput.parentElement?.remove();
          return;
        }
        groupInput.before(
          (() => {
            const span = document.createElement("span");
            (
              groupInput.previousElementSibling as HTMLSpanElement
            ).dataset.group = span.innerText = groupInput.value;
            return span;
          })()
        );
        groupStorage.push(groupInput.value);
        DATA_STORAGE.setItem("groupStorage", JSON.stringify(groupStorage));
        linkEditor.prepareGroupDatalist();
        groupInput.remove();
      });
      return groupInput;
    case "rename":
      linkEditor.inputs.group.value = span?.innerText as string;
      span!.before(linkEditor.inputs.group);
      linkEditor.inputs.group.focus();
      span!.style.display = "none";
      linkEditor.inputs.group.addEventListener("blur", function (): void {
        if (
          linkEditor.inputs.group.value == "" ||
          [...groupStorage, "Ungrouped", "All"].includes(
            linkEditor.inputs.group.value
          )
        ) {
          alert("Field is empty or name already exists. Unsuitable name");
          (span as HTMLSpanElement).removeAttribute("style");
          linkEditor.inputs.group.remove();
          return;
        }
        groupStorage[
          groupStorage.findIndex((group) => group === span!.innerText)
        ] = linkEditor.inputs.group.value;
        linkStorage
          .filter((link) => link.group === span!.innerText)
          .forEach((oldLink) => {
            oldLink.group = linkEditor.inputs.group.value;
          });
        DATA_STORAGE.setItem("groupStorage", JSON.stringify(groupStorage));
        DATA_STORAGE.setItem("linkStorage", JSON.stringify(linkStorage));
        main
          .querySelectorAll<HTMLAnchorElement>(
            `a[data-group="${span!.innerText}"]`
          )
          .forEach((anchor) => {
            anchor.dataset.group = linkEditor.inputs.group.value;
          });
        span!.innerText = linkEditor.inputs.group.value;
        span!.removeAttribute("style");
        (span!.parentElement?.firstChild as HTMLInputElement).dataset.group =
          linkEditor.inputs.group.value;

        linkEditor.inputs.group.remove();
        linkEditor.prepareGroupDatalist();
      });
      return;
  }
}
fieldset.addEventListener("click", function (event: any): any {
  if (event.target.tagName === "BUTTON") {
    const action = event.target.innerText;
    switch (action) {
      // case "-":
      //   confirm(
      //     "Are you sure to remove this group? All elements will be ungrouped, but not deleted"
      //   )
      //     ? (() => {
      //         event.target.parentElement.firstChild.checked
      //           ? (
      //               fieldset.querySelector(
      //                 "[data-group=All]"
      //               ) as HTMLInputElement
      //             ).click()
      //           : "";

      //         linkStorage
      //           .filter(
      //             (link) =>
      //               link.group === event.target.previousElementSibling.innerText
      //           )
      //           .forEach((link) => {
      //             link.group = "Ungrouped";
      //           });
      //         groupStorage.splice(
      //           groupStorage.findIndex(
      //             (group) =>
      //               group === event.target.previousElementSibling.innerText
      //           ),
      //           1
      //         );
      //         DATA_STORAGE.setItem(
      //           "groupStorage",
      //           JSON.stringify(groupStorage)
      //         );
      //         event.target.parentElement.remove();
      //         DATA_STORAGE.setItem("linkStorage", JSON.stringify(linkStorage));
      //         linkEditor.prepareGroupDatalist();
      //       })()
      //     : "";
      //   break;
      case "+":
        groupEditor.open();
        groupEditor.prepareForNewGroup(/*event*/);
        // const newGroup = document.createElement("label");
        // newGroup.prepend(
        //   (() => {
        //     const radio = document.createElement("input");
        //     radio.dataset.group = "";
        //     radio.name = "group";
        //     radio.setAttribute("type", "radio");
        //     radio.addEventListener("change", function (event) {
        //       const group = (event.target as HTMLElement).dataset.group;
        //       if (group) {
        //         showLinksToUser(group, "group");
        //       }
        //     });
        //     return radio;
        //   })(),
        //   configureGroupNameInput("create", undefined),
        //   (() => {
        //     const button = document.createElement("button");
        //     button.onclick = function () {
        //       //groupEditor.open();
        //     };
        //     button.innerHTML = "<img src='./pencil.svg'>";
        //     return button;
        //   })()
        // );
        // fieldset.append(newGroup);
        // (
        //   (fieldset.lastChild as HTMLElement).children[1] as HTMLElement
        // ).focus();

        break;
    }
  }
});
fieldset.addEventListener("contextmenu", function (event: MouseEvent): void {
  event.preventDefault();
  const TARGET = event.target as HTMLSpanElement;
  if (
    TARGET.tagName !== "SPAN" ||
    TARGET.parentElement == fieldset.children[1] ||
    TARGET.parentElement == fieldset.children[2]
  )
    return;
  configureGroupNameInput("rename", TARGET);
});
function searchOneLink() {
  if (
    (document.querySelector('input[type="search"]') as HTMLInputElement)
      .value === ""
  ) {
    (fieldset.querySelector('input[type="radio"]') as HTMLInputElement).click();
    showLinksToUser(
      (fieldset.querySelector("input:checked") as HTMLInputElement).dataset
        .group as string,
      "group"
    );
    return;
  }
  const searchedLink = linkStorage.find(
    (link) =>
      link.description ===
      (document.querySelector('input[type="search"]') as HTMLInputElement).value
  );
  if (searchedLink) {
    (fieldset.querySelector('input[type="radio"]') as HTMLInputElement).click();
    showLinksToUser(
      (fieldset.querySelector("input:checked") as HTMLInputElement).dataset
        .group as string,
      [searchedLink] as LINK_STORAGE
    );
  } else {
    alert("There is no link you tried to find");
  }
}
function setEventListeners() {
  try {
    Array.from(
      document.getElementsByClassName("editor") as HTMLCollectionOf<HTMLElement>
    ).forEach((editor) => {
      const currentEditor = (editor.classList[1].split("-")[0] + "Editor") as
        | "linkEditor"
        | "groupEditor";
      editor.addEventListener("click", (event: MouseEvent) =>
        editors[currentEditor].close(event)
      );
    });
    linkEditor.edit_addButton.addEventListener("click", () =>
      linkEditor.edit()
    );
    linkEditor.deleteButton.addEventListener("click", () =>
      linkEditor.delete()
    );
    linkEditor.inputs.url.addEventListener("blur", () =>
      linkEditor.verifyUrl()
    );
    linkEditor.inputs.group.addEventListener("blur", () =>
      linkEditor.verifyFilterGroup()
    );
    linkEditor.inputs.description.addEventListener("blur", () =>
      linkEditor.verifyDescription()
    );
    document
      .getElementById("addNewLinkButton")!
      .addEventListener("click", () => {
        linkEditor.prepareFieldsForNewLink();
        linkEditor.open();
      });
    main.addEventListener("click", (event) => {
      linkEditor.prepareFieldsForEditing(event);
    });
    groupEditor.edit_addButton.addEventListener("click", () => {
      groupEditor.edit();
    });
    searchButton.addEventListener("click", searchOneLink);
  } catch (error: any) {
    console.log("!EVENT-LISTENERS' ERROR! - " + error.message);
  }
}
setEventListeners();
