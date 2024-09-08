import { accountDbRequest } from "./connect-db.js";
import { linkEditor } from "./LinkEditor.js";
import { sidebar } from "./SidebarFunctions.js";
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
export let linksStorage: LINK_STORAGE = JSON.parse(
    DATA_STORAGE["linksStorage"] || "[]"
  ),
  allFilterGroups: string[] = JSON.parse(
    DATA_STORAGE["allFilterGroups"] || "[]"
  );
accountDbRequest("GET")
  .then(
    (user) => {
      let data: keyof typeof user;
      linksStorage = user["linksStorage"];
      allFilterGroups = (() => {
        try {
          if (user["allFilterGroups"].length === 0)
            throw new Error("groups are empty");
          return user["allFilterGroups"];
        } catch {
          const groups = (() => {
            const groups = Array.from(
              new Set(
                linksStorage.reduce((allGroups: string[], link) => {
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
            accountDbRequest("PUT", { allFilterGroups: groups });
            return groups;
          })();
          DATA_STORAGE.setItem("allFilterGroups", JSON.stringify(groups));
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
    ...linksStorage.reduce((allLinks: Array<HTMLOptionElement>, link) => {
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
  linkEditor.currentLink = null;
  var filteredArray =
    elementToShow === "group" ? filterLinksByGroup(group) : elementToShow;
  main.innerHTML = filteredArray.reduce(function (): string {
    return (
      arguments[0] +
      /*html*/ `<div><a data-group="${arguments[1].group}" target="_blank" href="${arguments[1].url}">${arguments[1].description}</a><label for="sectionVisibilityCheckbox">⋮</label></div>`
    );
  }, "");
}

function filterLinksByGroup(group: string) {
  return linksStorage.filter((item) => {
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
        if (
          [...allFilterGroups, "Ungrouped", "All"].includes(groupInput.value)
        ) {
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
        allFilterGroups.push(groupInput.value);
        DATA_STORAGE.setItem(
          "allFilterGroups",
          JSON.stringify(allFilterGroups)
        );
        linkEditor.prepareGroupDatalist();
        groupInput.remove();
      });
      return groupInput;
    case "rename":
      linkEditor.groupInput.value = span?.innerText as string;
      span!.before(linkEditor.groupInput);
      linkEditor.groupInput.focus();
      span!.style.display = "none";
      linkEditor.groupInput.addEventListener("blur", function (): void {
        if (
          linkEditor.groupInput.value == "" ||
          [...allFilterGroups, "Ungrouped", "All"].includes(
            linkEditor.groupInput.value
          )
        ) {
          alert("Field is empty or name already exists. Unsuitable name");
          (span as HTMLSpanElement).removeAttribute("style");
          linkEditor.groupInput.remove();
          return;
        }
        allFilterGroups[
          allFilterGroups.findIndex((group) => group === span!.innerText)
        ] = linkEditor.groupInput.value;
        linksStorage
          .filter((link) => link.group === span!.innerText)
          .forEach((oldLink) => {
            oldLink.group = linkEditor.groupInput.value;
          });
        DATA_STORAGE.setItem(
          "allFilterGroups",
          JSON.stringify(allFilterGroups)
        );
        DATA_STORAGE.setItem("linksStorage", JSON.stringify(linksStorage));
        main
          .querySelectorAll<HTMLAnchorElement>(
            `a[data-group="${span!.innerText}"]`
          )
          .forEach((anchor) => {
            anchor.dataset.group = linkEditor.groupInput.value;
          });
        span!.innerText = linkEditor.groupInput.value;
        span!.removeAttribute("style");
        (span!.parentElement?.firstChild as HTMLInputElement).dataset.group =
          linkEditor.groupInput.value;

        linkEditor.groupInput.remove();
        linkEditor.prepareGroupDatalist();
      });
      return;
  }
}
fieldset.addEventListener("click", function (event: any): any {
  if (event.target.tagName === "BUTTON") {
    const action = event.target.innerText;
    switch (action) {
      case "-":
        confirm(
          "Are you sure to remove this group? All elements will be ungrouped, but not deleted"
        )
          ? (() => {
              event.target.parentElement.firstChild.checked
                ? (
                    fieldset.querySelector(
                      "[data-group=All]"
                    ) as HTMLInputElement
                  ).click()
                : "";

              linksStorage
                .filter(
                  (link) =>
                    link.group === event.target.previousElementSibling.innerText
                )
                .forEach((link) => {
                  link.group = "Ungrouped";
                });
              allFilterGroups.splice(
                allFilterGroups.findIndex(
                  (group) =>
                    group === event.target.previousElementSibling.innerText
                ),
                1
              );
              DATA_STORAGE.setItem(
                "allFilterGroups",
                JSON.stringify(allFilterGroups)
              );
              event.target.parentElement.remove();
              DATA_STORAGE.setItem(
                "linksStorage",
                JSON.stringify(linksStorage)
              );
              linkEditor.prepareGroupDatalist();
            })()
          : "";
        break;
      case "+":
        const newGroup = document.createElement("label");
        newGroup.prepend(
          (() => {
            const radio = document.createElement("input");
            radio.dataset.group = "";
            radio.name = "group";
            radio.setAttribute("type", "radio");
            radio.addEventListener("change", function (event) {
              const group = (event.target as HTMLElement).dataset.group;
              if (group) {
                showLinksToUser(group, "group");
              }
            });
            return radio;
          })(),
          configureGroupNameInput("create", undefined),
          (() => {
            const button = document.createElement("button");
            button.innerText = "-";
            return button;
          })()
        );
        fieldset.append(newGroup);
        (
          (fieldset.lastChild as HTMLElement).children[1] as HTMLElement
        ).focus();

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
  const searchedLink = linksStorage.find(
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
  document
    .querySelector("section")!
    .addEventListener("click", (event: MouseEvent) => linkEditor.close(event));
  linkEditor.edit_addButton.addEventListener("click", () => linkEditor.edit());
  linkEditor.deleteButton.addEventListener("click", () => linkEditor.delete());
  linkEditor.urlInput.addEventListener("blur", () => linkEditor.verifyUrl());
  linkEditor.groupInput.addEventListener("blur", () =>
    linkEditor.verifyFilterGroup()
  );
  linkEditor.descriptionInput.addEventListener("blur", () =>
    linkEditor.verifyDescription()
  );
  document.getElementById("addNewLinkButton")!.addEventListener("click", () => {
    linkEditor.prepareForNewLink();
    linkEditor.visibilityCheckbox.checked = true;
  });
  main.addEventListener("click", (event) => {
    linkEditor.prepareFieldsForEditing(event);
  });
  searchButton.addEventListener("click", searchOneLink);
}
setEventListeners();
