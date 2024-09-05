import { accountDbRequest } from "./connect-db";
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
let linksStorage: LINK_STORAGE = DATA_STORAGE["linksStorage"] || [],
  allFilterGroups: string[] = DATA_STORAGE["allFilterGroups"] || [];
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
      console.log("No response");
    }
  )
  .catch((error) => {
    console.log(error);
  })
  .finally(() => {
    prepareLinkGroupSelect();
    showAllGroupsInSidebar();
    prepareSearchInput();
    showLinksToUser("All", "group");
  });
const fieldset = document.querySelector("fieldset") as HTMLElement,
  searchButton = document.getElementById("search-button") as HTMLElement;

var editableLinkInfo: Link | null = null,
  checkedLinkRadio: HTMLInputElement | null = null;
class LinkEditorParts {
  readonly htmlElement: HTMLElement = document.querySelector("section")!;
  readonly uriInput = document.getElementById(
    "uriInput"
  ) as HTMLTextAreaElement;
  readonly descriptionInput = document.getElementById(
    "descriptionInput"
  ) as HTMLInputElement;
  readonly deleteButton = document.getElementById("delete-link-button")!;
  readonly edit_addButton = document.getElementById("edit_add-link-button")!;
  readonly groupDatalist = document.getElementById(
    "LinkEditor.prototype.groupDatalist"
  ) as HTMLDataListElement;
  readonly groupInput = document.getElementById(
    "groupInput"
  ) as HTMLInputElement;
}
class LinkEditor extends LinkEditorParts {
  constructor() {
    super();
  }
  static edit(): void {
    new Promise((resolve, reject) => {
      if (areLinkFieldsNotValid()) {
        reject("");
      }
      if (editableLinkInfo) {
        const thisLinkInDb = linksStorage.find(
          (link) => link.description === editableLinkInfo!.description
        ) as Link;
        thisLinkInDb.description = LinkEditor.prototype.descriptionInput.value;
        thisLinkInDb.url = LinkEditor.prototype.uriInput.value;
        thisLinkInDb.group = LinkEditor.prototype.groupInput.value;
        editableLinkInfo = null;
      } else
        linksStorage.push({
          description: LinkEditor.prototype.descriptionInput.value,
          url: LinkEditor.prototype.uriInput.value,
          group: LinkEditor.prototype.groupInput.value,
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
  }
  static delete(): void {
    if (!confirm("Are you sure about deleting this link?")) return;
    linksStorage.splice(
      linksStorage.findIndex(
        (link) =>
          link.description === LinkEditor.prototype.descriptionInput.value &&
          link.url === LinkEditor.prototype.uriInput.value &&
          link.group === LinkEditor.prototype.groupInput.value
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
  }
  static close(event: MouseEvent): void {
    if (LinkEditor.prototype.htmlElement !== event.target) return;
    if (editableLinkInfo) {
      LinkEditor.prototype.descriptionInput.value =
        editableLinkInfo.description;
      LinkEditor.prototype.uriInput.value = editableLinkInfo.url;
      LinkEditor.prototype.groupInput.value = editableLinkInfo.group;
      editableLinkInfo = null;
    }
    checkedLinkRadio!.checked = false;
  }
  static verifyUri() {
    if (!editableLinkInfo) return;
    if (
      !LinkEditor.prototype.uriInput.value ||
      !/https?:\/\//g.test(LinkEditor.prototype.uriInput.value)
    ) {
      LinkEditor.prototype.uriInput.value = editableLinkInfo!.url;
      alert("URL should start from http");
      return;
    }
    LinkEditor.prototype.uriInput.value =
      LinkEditor.prototype.uriInput.value.trim();
    DATA_STORAGE.setItem("linksStorage", JSON.stringify(linksStorage));
  }
}
const {
  deleteButton,
  descriptionInput,
  edit_addButton,
  groupDatalist,
  groupInput,
  htmlElement,
  uriInput,
} = LinkEditorParts.prototype;
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
  (Array.from(fieldset.children) as HTMLElement[]).forEach((child, index) => {
    if (index < 3) return;
    child.remove();
  });
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
  LinkEditor.prototype.groupDatalist.innerHTML = "";
  const allMeaningfulGroups = [...allFilterGroups, "Ungrouped"];
  LinkEditor.prototype.groupDatalist.append(
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
  LinkEditor.prototype.groupInput.placeholder = "new group";
  LinkEditor.prototype.groupInput.type = "text";
  switch (situation) {
    case "create":
      LinkEditor.prototype.groupInput.addEventListener(
        "blur",
        function (): void {
          if (!LinkEditor.prototype.groupInput.value) {
            LinkEditor.prototype.groupInput.parentElement?.remove();
            return;
          }
          if (
            [...allFilterGroups, "Ungrouped", "All"].includes(
              LinkEditor.prototype.groupInput.value
            )
          ) {
            alert("This groups already exists");
            LinkEditor.prototype.groupInput.parentElement?.remove();
            return;
          }
          LinkEditor.prototype.groupInput.before(
            (() => {
              const span = document.createElement("span");
              (
                LinkEditor.prototype.groupInput
                  .previousElementSibling as HTMLSpanElement
              ).dataset.group = span.innerText =
                LinkEditor.prototype.groupInput.value;
              return span;
            })()
          );
          allFilterGroups.push(LinkEditor.prototype.groupInput.value);
          DATA_STORAGE.setItem(
            "allFilterGroups",
            JSON.stringify(allFilterGroups)
          );
          prepareLinkGroupSelect();
          LinkEditor.prototype.groupInput.remove();
        }
      );
      return LinkEditor.prototype.groupInput;
    case "rename":
      LinkEditor.prototype.groupInput.value = span?.innerText as string;
      span!.before(LinkEditor.prototype.groupInput);
      LinkEditor.prototype.groupInput.focus();
      span!.style.display = "none";
      LinkEditor.prototype.groupInput.addEventListener(
        "blur",
        function (): void {
          if (
            LinkEditor.prototype.groupInput.value == "" ||
            [...allFilterGroups, "Ungrouped", "All"].includes(
              LinkEditor.prototype.groupInput.value
            )
          ) {
            alert("Field is empty or name already exists. Unsuitable name");
            (span as HTMLSpanElement).removeAttribute("style");
            LinkEditor.prototype.groupInput.remove();
            return;
          }
          allFilterGroups[
            allFilterGroups.findIndex((group) => group === span!.innerText)
          ] = LinkEditor.prototype.groupInput.value;
          linksStorage
            .filter((link) => link.group === span!.innerText)
            .forEach((oldLink) => {
              oldLink.group = LinkEditor.prototype.groupInput.value;
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
              anchor.dataset.group = LinkEditor.prototype.groupInput.value;
            });
          span!.innerText = LinkEditor.prototype.groupInput.value;
          span!.removeAttribute("style");
          (span!.parentElement?.firstChild as HTMLInputElement).dataset.group =
            LinkEditor.prototype.groupInput.value;

          LinkEditor.prototype.groupInput.remove();
          prepareLinkGroupSelect();
        }
      );
      return;
  }
}

function areLinkFieldsNotValid() {
  const isLinkNameNotValid =
      !LinkEditor.prototype.descriptionInput.value ||
      ((editableLinkInfo
        ? !(
            LinkEditor.prototype.descriptionInput.value ===
            editableLinkInfo!.description
          )
        : true) &&
        linksStorage.some(
          (link) =>
            link.description === LinkEditor.prototype.descriptionInput.value
        )),
    isLinkURLNotValid =
      !LinkEditor.prototype.uriInput.value ||
      !/https?:\/\//g.test(LinkEditor.prototype.uriInput.value),
    isLinkGroupNotValid =
      !LinkEditor.prototype.groupInput.value ||
      ![...allFilterGroups, "Ungrouped"].includes(
        LinkEditor.prototype.groupInput.value
      );

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
  LinkEditor.prototype.groupInput.value = editableLinkInfo.group;
});

document
  .getElementById("addNewLinkButton")!
  .addEventListener("click", function () {
    LinkEditor.prototype.descriptionInput.value = "";
    LinkEditor.prototype.uriInput.value = "";
    LinkEditor.prototype.groupInput.value = "Ungrouped";
    checkedLinkRadio = document.getElementById(
      "createLinkState"
    ) as HTMLInputElement;
  });

LinkEditor.prototype.groupInput.addEventListener("blur", function () {
  if (!editableLinkInfo) return;
  if (
    ![...allFilterGroups, "Ungrouped"].includes(
      LinkEditor.prototype.groupInput.value
    )
  ) {
    LinkEditor.prototype.groupInput.value = editableLinkInfo.group;
    alert("This group doesn't exist");
    return;
  }
});
LinkEditor.prototype.descriptionInput.addEventListener("blur", function () {
  if (!editableLinkInfo) return;
  if (!LinkEditor.prototype.descriptionInput.value) {
    alert("Name should contain at least 1 character");
    LinkEditor.prototype.descriptionInput.value = editableLinkInfo.description;
    return;
  } else if (
    !(
      editableLinkInfo.description ===
      LinkEditor.prototype.descriptionInput.value
    ) &&
    linksStorage.some(
      (link) => link.description === LinkEditor.prototype.descriptionInput.value
    )
  ) {
    alert("Link name already exists");
    LinkEditor.prototype.descriptionInput.value = editableLinkInfo.description;
    return;
  }
});

function setEventListeners() {
  document
    .querySelector("section")!
    .addEventListener("click", LinkEditor.close);
  LinkEditor.prototype.edit_addButton.addEventListener(
    "click",
    LinkEditor.edit
  );
  deleteButton.addEventListener("click", LinkEditor.delete);
  LinkEditor.prototype.uriInput.addEventListener("blur", LinkEditor.verifyUri);
}
