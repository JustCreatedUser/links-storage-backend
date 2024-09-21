import { accountDbRequest } from "./connect-db.js";
import * as editors from "./Editor.js";
import { sidebar } from "./SidebarFunctions.js";
const { groupEditor, linkEditor } = editors;
export const main = document.querySelector("main") as HTMLElement;
export const LOCAL_STORAGE: Storage = (() => {
  if (main.dataset.display == "local") {
    return window.localStorage;
  } else {
    return window.sessionStorage;
  }
})();
import DataStorage from "./storages.js";
import { Link, LinkInDatabase } from "./storage-data.js";

if (!LOCAL_STORAGE) {
  alert(
    "The internet connection is worthless or your browser is too old. Update it or use a different one."
  );
}
export const dataStorage = new DataStorage();
dataStorage.groups = JSON.parse(LOCAL_STORAGE.groupStorage || "[]");
dataStorage.links = JSON.parse(LOCAL_STORAGE.linkStorage || "[]");
accountDbRequest("GET")
  .then(
    (user) => {
      try {
        dataStorage.groups = user.groupStorage;
        dataStorage.links = user.linkStorage;
      } catch (error) {
        console.error(error);
      }
      let data: keyof typeof user;
      for (data in user) {
        LOCAL_STORAGE.setItem(data, JSON.stringify(user[data]));
      }
    },
    () => {
      console.warn("Server rejected giving data for render");
    }
  )
  .catch(console.error)
  .finally(() => {
    linkEditor.prepareGroupDatalist();
    sidebar.displayAllGroups();
    prepareSearchInput();
    showLinksToUser("All", "group");
  });

export const fieldset = document.querySelector("fieldset") as HTMLElement,
  searchButton = document.getElementById("search-button") as HTMLElement;
export type LINK_STORAGE = Array<LinkInDatabase>;

export function prepareSearchInput() {
  const datalist = document.getElementById(
    "find-reference_options"
  ) as HTMLDataListElement;
  datalist.innerHTML = "";
  datalist.append(
    ...dataStorage.links.reduce((allLinks: Array<HTMLOptionElement>, link) => {
      const option = document.createElement("option");
      option.value = link.d;
      allLinks.push(option);
      return allLinks;
    }, [])
  );
}

export function showLinksToUser(group: string, elementToShow: "group" | Link) {
  main.innerHTML = "";
  linkEditor.editItem = null;
  var filteredArray =
    elementToShow === "group"
      ? dataStorage.links.filterByGroup(group)
      : [elementToShow];
  if (filteredArray.length === 0) {
    const warning = document.createElement("p");
    warning.textContent = `No links found for "${group}"`;
    warning.className = "no-links_warning";
    main.appendChild(warning);
  } else
    filteredArray.forEach((link) => {
      const linkElement = document.createElement("div");
      linkElement.innerHTML = /*html*/ `
      <a href="${link.u}" target="_blank">${link.d}</a>
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
// function configureGroupNameInput(
//   situation: "rename",
//   target: HTMLSpanElement
// ): void;
// function configureGroupNameInput(
//   situation: "create",
//   target: undefined
// ): HTMLInputElement;
// function configureGroupNameInput(
//   situation: "create" | "rename",
//   span: HTMLSpanElement | undefined
// ) {
//   const groupInput = document.createElement("input");
//   groupInput.placeholder = "new group";
//   groupInput.type = "text";
//   switch (situation) {
//     case "create":
//       groupInput.addEventListener("blur", function (): void {
//         if (!groupInput.value) {
//           groupInput.parentElement?.remove();
//           return;
//         }
//         if (dataStorage.groups.getALL().includes(groupInput.value)) {
//           alert("This groups already exists");
//           groupInput.parentElement?.remove();
//           return;
//         }
//         groupInput.before(
//           (() => {
//             const span = document.createElement("span");
//             (
//               groupInput.previousElementSibling as HTMLSpanElement
//             ).dataset.group = span.innerText = groupInput.value;
//             return span;
//           })()
//         );
//         dataStorage.groups.push(groupInput.value);
//         LOCAL_STORAGE.setItem(
//           "groupStorage",
//           JSON.stringify(dataStorage.groups)
//         );
//         linkEditor.prepareGroupDatalist();
//         groupInput.remove();
//       });
//       return groupInput;
//     case "rename":
//       linkEditor.inputs.group.value = span?.innerText as string;
//       span!.before(linkEditor.inputs.group);
//       linkEditor.inputs.group.focus();
//       span!.style.display = "none";
//       linkEditor.inputs.group.addEventListener("blur", function (): void {
//         if (
//           linkEditor.inputs.group.value == "" ||
//           dataStorage.groups.getALL().includes(linkEditor.inputs.group.value)
//         ) {
//           alert("Field is empty or name already exists. Unsuitable name");
//           (span as HTMLSpanElement).removeAttribute("style");
//           linkEditor.inputs.group.remove();
//           return;
//         }
//         dataStorage.groups[
//           dataStorage.groups.findIndex((group) => group === span!.innerText)
//         ] = linkEditor.inputs.group.value;
//         dataStorage.links
//           .filter((link) => link.g === span!.innerText)
//           .forEach((oldLink) => {
//             oldLink.g = linkEditor.inputs.group.value;
//           });
//         LOCAL_STORAGE.setItem(
//           "groupStorage",
//           JSON.stringify(dataStorage.groups)
//         );
//         LOCAL_STORAGE.setItem("linkStorage", JSON.stringify(dataStorage.links));
//         main
//           .querySelectorAll<HTMLAnchorElement>(
//             `a[data-group="${span!.innerText}"]`
//           )
//           .forEach((anchor) => {
//             anchor.dataset.group = linkEditor.inputs.group.value;
//           });
//         span!.innerText = linkEditor.inputs.group.value;
//         span!.removeAttribute("style");
//         (span!.parentElement?.firstChild as HTMLInputElement).dataset.group =
//           linkEditor.inputs.group.value;

//         linkEditor.inputs.group.remove();
//         linkEditor.prepareGroupDatalist();
//       });
//       return;
//   }
// }
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
      //         LOCAL_STORAGE.setItem(
      //           "groupStorage",
      //           JSON.stringify(groupStorage)
      //         );
      //         event.target.parentElement.remove();
      //         LOCAL_STORAGE.setItem("linkStorage", JSON.stringify(linkStorage));
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
// fieldset.addEventListener("contextmenu", function (event: MouseEvent): void {
//   event.preventDefault();
//   const TARGET = event.target as HTMLSpanElement;
//   if (
//     TARGET.tagName !== "SPAN" ||
//     TARGET.parentElement == fieldset.children[1] ||
//     TARGET.parentElement == fieldset.children[2]
//   )
//     return;
//   configureGroupNameInput("rename", TARGET);
// });
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
  const searchedLink = dataStorage.links.find(
    (link) =>
      link.d ===
      (document.querySelector('input[type="search"]') as HTMLInputElement).value
  );
  if (searchedLink) {
    (fieldset.querySelector('input[type="radio"]') as HTMLInputElement).click();
    try {
      showLinksToUser(
        (fieldset.querySelector("input:checked") as HTMLInputElement).dataset
          .group as string,
        searchedLink
      );
    } catch {
      console.error("Can't show wrong link");
    }
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
    console.error("!EVENT-LISTENERS' ERROR! - " + error.message);
  }
}
setEventListeners();
