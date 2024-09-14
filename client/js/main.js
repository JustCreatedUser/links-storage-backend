import { accountDbRequest } from "./connect-db.js";
import * as editors from "./Editor.js";
import { sidebar } from "./SidebarFunctions.js";
const { groupEditor, linkEditor } = editors;
export const main = document.querySelector("main");
export const DATA_STORAGE = (() => {
    if (main.dataset.display == "local") {
        return window.localStorage;
    }
    else {
        return window.sessionStorage;
    }
})();
if (!DATA_STORAGE) {
    alert("The internet connection is worthless or your browser is too old. Update it or use a different one.");
}
export let linkStorage = JSON.parse(DATA_STORAGE["linkStorage"] || "[]"), groupStorage = JSON.parse(DATA_STORAGE["groupStorage"] || "[]");
accountDbRequest("GET")
    .then((user) => {
    let data;
    linkStorage = user["linkStorage"];
    groupStorage = (() => {
        try {
            if (user["groupStorage"].length === 0)
                throw new Error("groups are empty");
            return user["groupStorage"];
        }
        catch (_a) {
            const groups = (() => {
                const groups = Array.from(new Set(linkStorage.reduce((allGroups, link) => {
                    allGroups.push(link.group);
                    return allGroups;
                }, [])));
                if (groups.includes("Ungrouped")) {
                    groups.splice(groups.findIndex((group) => group === "Ungrouped"), 1);
                }
                if (!groups.length)
                    return groups;
                accountDbRequest("PUT", { groupStorage: groups })
                    .then(() => { }, (reason) => {
                    console.log(reason);
                })
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
}, () => {
    console.warn("Server rejected giving data for render");
})
    .catch(console.error)
    .finally(() => {
    linkEditor.prepareGroupDatalist();
    sidebar.displayAllGroups();
    prepareSearchInput();
    showLinksToUser("All", "group");
});
export const fieldset = document.querySelector("fieldset"), searchButton = document.getElementById("search-button");
export function prepareSearchInput() {
    const datalist = document.getElementById("find-reference_options");
    datalist.innerHTML = "";
    datalist.append(...linkStorage.reduce((allLinks, link) => {
        const option = document.createElement("option");
        option.value = link.description;
        allLinks.push(option);
        return allLinks;
    }, []));
}
export function showLinksToUser(group, elementToShow) {
    main.innerHTML = "";
    linkEditor.editItem = null;
    var filteredArray = elementToShow === "group" ? filterLinksByGroup(group) : elementToShow;
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
function filterLinksByGroup(group) {
    return linkStorage.filter((item) => {
        return group === "All" ? true : item.group === group;
    });
}
function configureGroupNameInput(situation, span) {
    const groupInput = document.createElement("input");
    groupInput.placeholder = "new group";
    groupInput.type = "text";
    switch (situation) {
        case "create":
            groupInput.addEventListener("blur", function () {
                var _a, _b;
                if (!groupInput.value) {
                    (_a = groupInput.parentElement) === null || _a === void 0 ? void 0 : _a.remove();
                    return;
                }
                if ([...groupStorage, "Ungrouped", "All"].includes(groupInput.value)) {
                    alert("This groups already exists");
                    (_b = groupInput.parentElement) === null || _b === void 0 ? void 0 : _b.remove();
                    return;
                }
                groupInput.before((() => {
                    const span = document.createElement("span");
                    groupInput.previousElementSibling.dataset.group = span.innerText = groupInput.value;
                    return span;
                })());
                groupStorage.push(groupInput.value);
                DATA_STORAGE.setItem("groupStorage", JSON.stringify(groupStorage));
                linkEditor.prepareGroupDatalist();
                groupInput.remove();
            });
            return groupInput;
        case "rename":
            linkEditor.inputs.group.value = span === null || span === void 0 ? void 0 : span.innerText;
            span.before(linkEditor.inputs.group);
            linkEditor.inputs.group.focus();
            span.style.display = "none";
            linkEditor.inputs.group.addEventListener("blur", function () {
                var _a;
                if (linkEditor.inputs.group.value == "" ||
                    [...groupStorage, "Ungrouped", "All"].includes(linkEditor.inputs.group.value)) {
                    alert("Field is empty or name already exists. Unsuitable name");
                    span.removeAttribute("style");
                    linkEditor.inputs.group.remove();
                    return;
                }
                groupStorage[groupStorage.findIndex((group) => group === span.innerText)] = linkEditor.inputs.group.value;
                linkStorage
                    .filter((link) => link.group === span.innerText)
                    .forEach((oldLink) => {
                    oldLink.group = linkEditor.inputs.group.value;
                });
                DATA_STORAGE.setItem("groupStorage", JSON.stringify(groupStorage));
                DATA_STORAGE.setItem("linkStorage", JSON.stringify(linkStorage));
                main
                    .querySelectorAll(`a[data-group="${span.innerText}"]`)
                    .forEach((anchor) => {
                    anchor.dataset.group = linkEditor.inputs.group.value;
                });
                span.innerText = linkEditor.inputs.group.value;
                span.removeAttribute("style");
                ((_a = span.parentElement) === null || _a === void 0 ? void 0 : _a.firstChild).dataset.group =
                    linkEditor.inputs.group.value;
                linkEditor.inputs.group.remove();
                linkEditor.prepareGroupDatalist();
            });
            return;
    }
}
fieldset.addEventListener("click", function (event) {
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
                groupEditor.prepareForNewGroup( /*event*/);
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
fieldset.addEventListener("contextmenu", function (event) {
    event.preventDefault();
    const TARGET = event.target;
    if (TARGET.tagName !== "SPAN" ||
        TARGET.parentElement == fieldset.children[1] ||
        TARGET.parentElement == fieldset.children[2])
        return;
    configureGroupNameInput("rename", TARGET);
});
function searchOneLink() {
    if (document.querySelector('input[type="search"]')
        .value === "") {
        fieldset.querySelector('input[type="radio"]').click();
        showLinksToUser(fieldset.querySelector("input:checked").dataset
            .group, "group");
        return;
    }
    const searchedLink = linkStorage.find((link) => link.description ===
        document.querySelector('input[type="search"]').value);
    if (searchedLink) {
        fieldset.querySelector('input[type="radio"]').click();
        showLinksToUser(fieldset.querySelector("input:checked").dataset
            .group, [searchedLink]);
    }
    else {
        alert("There is no link you tried to find");
    }
}
function setEventListeners() {
    try {
        Array.from(document.getElementsByClassName("editor")).forEach((editor) => {
            const currentEditor = (editor.classList[1].split("-")[0] + "Editor");
            editor.addEventListener("click", (event) => editors[currentEditor].close(event));
        });
        linkEditor.edit_addButton.addEventListener("click", () => linkEditor.edit());
        linkEditor.deleteButton.addEventListener("click", () => linkEditor.delete());
        linkEditor.inputs.url.addEventListener("blur", () => linkEditor.verifyUrl());
        linkEditor.inputs.group.addEventListener("blur", () => linkEditor.verifyFilterGroup());
        linkEditor.inputs.description.addEventListener("blur", () => linkEditor.verifyDescription());
        document
            .getElementById("addNewLinkButton")
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
    }
    catch (error) {
        console.log("!EVENT-LISTENERS' ERROR! - " + error.message);
    }
}
setEventListeners();
//# sourceMappingURL=main.js.map