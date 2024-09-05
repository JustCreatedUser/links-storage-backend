import { accountDbRequest } from "./connect-db";
export const main = document.querySelector("main") as HTMLElement;
export const DATA_STORAGE: Storage = (() => {
  if (main.dataset.display == "local") {
    return window.localStorage;
  } else {
    return window.sessionStorage;
  }
})();
accountDbRequest("GET")
  .then(
    (response) => {
      console.log(response, typeof response);
    },
    (rejection) => {
      console.log(rejection);
    }
  )
  .catch((error) => {
    console.log(error);
  });

const linksStorage: LINK_STORAGE = (function () {
    try {
      let neededDB = JSON.parse(DATA_STORAGE.linksStorage);
      return neededDB;
    } catch {
      if (!DATA_STORAGE) {
        alert(
          "The internet connection is worthless or your browser is too old. Update it or use a different one."
        );
      }
      return [];
    }
  })(),
  allFilterGroups: string[] = (function () {
    try {
      let neededGroups: Array<string> = JSON.parse(
        DATA_STORAGE.getItem("allFilterGroups") as string
      );
      if (neededGroups.length == 0) {
        throw new Error("groups are empty");
      }
      return neededGroups;
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
        return groups;
      })();
      DATA_STORAGE.setItem("allFilterGroups", JSON.stringify(groups));
      return groups;
    }
  })(),
  fieldset = document.querySelector("fieldset") as HTMLElement,
  searchButton = document.getElementById("search-button") as HTMLElement,
  linkGroupInput = document.getElementById(
    "linkGroupInput"
  ) as HTMLInputElement,
  linkGroupSelect = document.getElementById(
    "linkGroupSelect"
  ) as HTMLDataListElement,
  linkURL = document.getElementById("linkURL") as HTMLTextAreaElement,
  linkName = document.getElementById("linkName") as HTMLInputElement;
var editableLinkInfo: Link | null = null,
  checkedLinkRadio: HTMLInputElement | null = null;

export interface Link {
  description: string;
  url: string;
  group: string;
}
export type LINK_STORAGE = Array<Link>;

function prepareSearchInput() {
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

function showAllGroupsInSidebar() {
  allFilterGroups.forEach((group) => {
    const newGroup = document.createElement("label");
    newGroup.innerHTML = /*html*/ `<input type="radio" name="group" data-group="${group}" />
    <span>${group}</span>
    <button>-</button>`;
    fieldset.append(newGroup);
  });
  document.querySelectorAll('input[type="radio"]').forEach((input) => {
    input.addEventListener("change", function (event) {
      const group = (event.target as HTMLElement).dataset.group;
      if (group) {
        showLinksToUser(group, "group");
      }
    });
  });
}

function prepareLinkGroupSelect() {
  linkGroupSelect.innerHTML = "";
  const allMeaningfulGroups = [...allFilterGroups, "Ungrouped"];
  linkGroupSelect.append(
    ...allMeaningfulGroups.reduce(
      (groups: HTMLOptionElement[], group: string) => {
        const option = document.createElement("option");
        option.value = group;
        option.innerText = group;
        groups.push(option);
        return groups;
      },
      []
    )
  );
}

function showLinksToUser(group: string, elementToShow: "group" | LINK_STORAGE) {
  //! показує відфільтровані за групою АБО фільтром результати в html
  editableLinkInfo = null;
  var filteredArray =
    elementToShow === "group" ? getFilteredResults(group) : elementToShow;
  main.innerHTML = filteredArray.reduce(function (): string {
    return (
      arguments[0] +
      /*html*/ `<div><input id="radio${arguments[2]}" type="radio" name="link-settings"><a data-group="${arguments[1].group}" target="_blank" href="${arguments[1].url}">${arguments[1].description}</a><label for="radio${arguments[2]}">⋮</label></div>`
    );
  }, "");
}

function getFilteredResults(group: string) {
  //! відфільтровує результати за групою
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
        prepareLinkGroupSelect();
        groupInput.remove();
      });
      return groupInput;
    case "rename":
      groupInput.value = span?.innerText as string;
      span!.before(groupInput);
      groupInput.focus();
      span!.style.display = "none";
      groupInput.addEventListener("blur", function (): void {
        if (
          groupInput.value == "" ||
          [...allFilterGroups, "Ungrouped", "All"].includes(groupInput.value)
        ) {
          alert("Field is empty or name already exists. Unsuitable name");
          (span as HTMLSpanElement).removeAttribute("style");
          groupInput.remove();
          return;
        }
        allFilterGroups[
          allFilterGroups.findIndex((group) => group === span!.innerText)
        ] = groupInput.value;
        linksStorage
          .filter((link) => link.group === span!.innerText)
          .forEach((oldLink) => {
            oldLink.group = groupInput.value;
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
            anchor.dataset.group = groupInput.value;
          });
        span!.innerText = groupInput.value;
        span!.removeAttribute("style");
        (span!.parentElement?.firstChild as HTMLInputElement).dataset.group =
          groupInput.value;

        groupInput.remove();
        prepareLinkGroupSelect();
      });
      return;
  }
}

function areLinkFieldsNotValid() {
  const isLinkNameNotValid =
      !linkName.value ||
      ((editableLinkInfo
        ? !(linkName.value === editableLinkInfo!.description)
        : true) &&
        linksStorage.some((link) => link.description === linkName.value)),
    isLinkURLNotValid = !linkURL.value || !/https?:\/\//g.test(linkURL.value),
    isLinkGroupNotValid =
      !linkGroupInput.value ||
      ![...allFilterGroups, "Ungrouped"].includes(linkGroupInput.value);

  return isLinkNameNotValid || isLinkURLNotValid || isLinkGroupNotValid;
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
              prepareLinkGroupSelect();
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
searchButton.addEventListener("click", function () {
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
});
main.addEventListener("click", function (event) {
  if ((event.target as HTMLElement).tagName !== "INPUT") return;
  checkedLinkRadio = event.target as HTMLInputElement;
  editableLinkInfo = {
    ...linksStorage.find(
      (link) =>
        link.description ===
        (
          (event.target as HTMLInputElement)
            .nextElementSibling as HTMLAnchorElement
        ).innerText
    ),
  } as Link;
  const configuration = document.querySelector(
    ".configure-link"
  ) as HTMLDivElement;
  (configuration.children[0] as HTMLInputElement).value =
    editableLinkInfo.description;
  (configuration.children[1] as HTMLInputElement).value = editableLinkInfo.url;
  linkGroupInput.value = editableLinkInfo.group;
});

document
  .getElementById("addNewLinkButton")!
  .addEventListener("click", function () {
    linkName.value = "";
    linkURL.value = "";
    linkGroupInput.value = "Ungrouped";
    checkedLinkRadio = document.getElementById(
      "createLinkState"
    ) as HTMLInputElement;
  });

linkGroupInput.addEventListener("blur", function () {
  if (!editableLinkInfo) return;
  if (![...allFilterGroups, "Ungrouped"].includes(linkGroupInput.value)) {
    linkGroupInput.value = editableLinkInfo.group;
    alert("This group doesn't exist");
    return;
  }
});
linkURL.addEventListener("blur", function () {
  if (!editableLinkInfo) return;
  if (!linkURL.value || !/https?:\/\//g.test(linkURL.value)) {
    linkURL.value = editableLinkInfo!.url;
    alert("URL should start from http");
    return;
  }
  linkURL.value = linkURL.value.trim();
  DATA_STORAGE.setItem("linksStorage", JSON.stringify(linksStorage));
});
linkName.addEventListener("blur", function () {
  if (!editableLinkInfo) return;
  if (!linkName.value) {
    alert("Name should contain at least 1 character");
    linkName.value = editableLinkInfo.description;
    return;
  } else if (
    !(editableLinkInfo.description === linkName.value) &&
    linksStorage.some((link) => link.description === linkName.value)
  ) {
    alert("Link name already exists");
    linkName.value = editableLinkInfo.description;
    return;
  }
});
document
  .getElementById("delete-link-button")!
  .addEventListener("click", function () {
    confirm("Are you sure about deleting this link?")
      ? (() => {
          linksStorage.splice(
            linksStorage.findIndex(
              (link) =>
                link.description === linkName.value &&
                link.url === linkURL.value &&
                link.group === linkGroupInput.value
            ),
            1
          );
          checkedLinkRadio!.checked = false;
          checkedLinkRadio = null;
          editableLinkInfo = null;
          showLinksToUser(
            (
              fieldset.querySelector<HTMLInputElement>("input:checked")!
                .nextElementSibling as HTMLSpanElement
            ).innerText,
            "group"
          );
          prepareSearchInput();
          DATA_STORAGE.setItem("linksStorage", JSON.stringify(linksStorage));
          accountDbRequest("PUT", {
            linksStorage,
          });
        })()
      : "";
  });
document.getElementById("edit-link-button")!.addEventListener("click", () => {
  new Promise((resolve, reject) => {
    if (areLinkFieldsNotValid()) {
      reject("");
    }
    if (editableLinkInfo) {
      const thisLinkInDb = linksStorage.find(
        (link) => link.description === editableLinkInfo!.description
      ) as Link;
      thisLinkInDb.description = linkName.value;
      thisLinkInDb.url = linkURL.value;
      thisLinkInDb.group = linkGroupInput.value;
      editableLinkInfo = null;
    } else
      linksStorage.push({
        description: linkName.value,
        url: linkURL.value,
        group: linkGroupInput.value,
      });

    resolve("");
  }).then(
    () => {
      DATA_STORAGE.setItem("linksStorage", JSON.stringify(linksStorage));
      prepareSearchInput();
      accountDbRequest("PUT", {
        linksStorage,
      });
      checkedLinkRadio!.checked = false;
      checkedLinkRadio = null;
      showLinksToUser(
        (
          fieldset.querySelector<HTMLInputElement>("input:checked")!
            .nextElementSibling as HTMLSpanElement
        ).innerText,
        "group"
      );
    },
    () => {
      alert("Invalid link name, URL or group");
    }
  );
});
document.querySelector("section")!.addEventListener("click", function (event) {
  if (this !== event.target) return;
  if (editableLinkInfo) {
    linkName.value = editableLinkInfo.description;
    linkURL.value = editableLinkInfo.url;
    linkGroupInput.value = editableLinkInfo.group;
    editableLinkInfo = null;
  }
  checkedLinkRadio!.checked = false;
});

prepareLinkGroupSelect();
showAllGroupsInSidebar();
prepareSearchInput();
showLinksToUser("All", "group");
