import { accountDbRequest } from "./connect-db.js";
import { linkEditor } from "./LinkEditor.js";
import { sidebar } from "./SidebarFunctions.js";
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
export let linksStorage = JSON.parse(DATA_STORAGE["linksStorage"] || "[]"), allFilterGroups = JSON.parse(DATA_STORAGE["allFilterGroups"] || "[]");
accountDbRequest("GET")
    .then((user) => {
    let data;
    linksStorage = user["linksStorage"];
    allFilterGroups = (() => {
        try {
            if (user["allFilterGroups"].length === 0)
                throw new Error("groups are empty");
            return user["allFilterGroups"];
        }
        catch (_a) {
            const groups = (() => {
                const groups = Array.from(new Set(linksStorage.reduce((allGroups, link) => {
                    allGroups.push(link.group);
                    return allGroups;
                }, [])));
                if (groups.includes("Ungrouped")) {
                    groups.splice(groups.findIndex((group) => group === "Ungrouped"), 1);
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
}, () => {
    console.log("Server rejected giving data for render");
})
    .catch((error) => {
    console.log("!!!ERROR!!! - " + error);
})
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
    datalist.append(...linksStorage.reduce((allLinks, link) => {
        const option = document.createElement("option");
        option.value = link.description;
        allLinks.push(option);
        return allLinks;
    }, []));
}
export function showLinksToUser(group, elementToShow) {
    //! показує відфільтровані за групою АБО фільтром результати в html
    linkEditor.currentLink = null;
    var filteredArray = elementToShow === "group" ? getFilteredResults(group) : elementToShow;
    main.innerHTML = filteredArray.reduce(function () {
        return (arguments[0] +
            /*html*/ `<div><a data-group="${arguments[1].group}" target="_blank" href="${arguments[1].url}">${arguments[1].description}</a><label for="sectionVisibilityCheckbox">⋮</label></div>`);
    }, "");
}
function getFilteredResults(group) {
    //! відфільтровує результати за групою
    return linksStorage.filter((item) => {
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
                if ([...allFilterGroups, "Ungrouped", "All"].includes(groupInput.value)) {
                    alert("This groups already exists");
                    (_b = groupInput.parentElement) === null || _b === void 0 ? void 0 : _b.remove();
                    return;
                }
                groupInput.before((() => {
                    const span = document.createElement("span");
                    groupInput.previousElementSibling.dataset.group = span.innerText = groupInput.value;
                    return span;
                })());
                allFilterGroups.push(groupInput.value);
                DATA_STORAGE.setItem("allFilterGroups", JSON.stringify(allFilterGroups));
                linkEditor.prepareGroupDatalist();
                groupInput.remove();
            });
            return groupInput;
        case "rename":
            linkEditor.groupInput.value = span === null || span === void 0 ? void 0 : span.innerText;
            span.before(linkEditor.groupInput);
            linkEditor.groupInput.focus();
            span.style.display = "none";
            linkEditor.groupInput.addEventListener("blur", function () {
                var _a;
                if (linkEditor.groupInput.value == "" ||
                    [...allFilterGroups, "Ungrouped", "All"].includes(linkEditor.groupInput.value)) {
                    alert("Field is empty or name already exists. Unsuitable name");
                    span.removeAttribute("style");
                    linkEditor.groupInput.remove();
                    return;
                }
                allFilterGroups[allFilterGroups.findIndex((group) => group === span.innerText)] = linkEditor.groupInput.value;
                linksStorage
                    .filter((link) => link.group === span.innerText)
                    .forEach((oldLink) => {
                    oldLink.group = linkEditor.groupInput.value;
                });
                DATA_STORAGE.setItem("allFilterGroups", JSON.stringify(allFilterGroups));
                DATA_STORAGE.setItem("linksStorage", JSON.stringify(linksStorage));
                main
                    .querySelectorAll(`a[data-group="${span.innerText}"]`)
                    .forEach((anchor) => {
                    anchor.dataset.group = linkEditor.groupInput.value;
                });
                span.innerText = linkEditor.groupInput.value;
                span.removeAttribute("style");
                ((_a = span.parentElement) === null || _a === void 0 ? void 0 : _a.firstChild).dataset.group =
                    linkEditor.groupInput.value;
                linkEditor.groupInput.remove();
                linkEditor.prepareGroupDatalist();
            });
            return;
    }
}
fieldset.addEventListener("click", function (event) {
    if (event.target.tagName === "BUTTON") {
        const action = event.target.innerText;
        switch (action) {
            case "-":
                confirm("Are you sure to remove this group? All elements will be ungrouped, but not deleted")
                    ? (() => {
                        event.target.parentElement.firstChild.checked
                            ? fieldset.querySelector("[data-group=All]").click()
                            : "";
                        linksStorage
                            .filter((link) => link.group === event.target.previousElementSibling.innerText)
                            .forEach((link) => {
                            link.group = "Ungrouped";
                        });
                        allFilterGroups.splice(allFilterGroups.findIndex((group) => group === event.target.previousElementSibling.innerText), 1);
                        DATA_STORAGE.setItem("allFilterGroups", JSON.stringify(allFilterGroups));
                        event.target.parentElement.remove();
                        DATA_STORAGE.setItem("linksStorage", JSON.stringify(linksStorage));
                        linkEditor.prepareGroupDatalist();
                    })()
                    : "";
                break;
            case "+":
                const newGroup = document.createElement("label");
                newGroup.prepend((() => {
                    const radio = document.createElement("input");
                    radio.dataset.group = "";
                    radio.name = "group";
                    radio.setAttribute("type", "radio");
                    radio.addEventListener("change", function (event) {
                        const group = event.target.dataset.group;
                        if (group) {
                            showLinksToUser(group, "group");
                        }
                    });
                    return radio;
                })(), configureGroupNameInput("create", undefined), (() => {
                    const button = document.createElement("button");
                    button.innerText = "-";
                    return button;
                })());
                fieldset.append(newGroup);
                fieldset.lastChild.children[1].focus();
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
searchButton.addEventListener("click", function () {
    if (document.querySelector('input[type="search"]')
        .value === "") {
        fieldset.querySelector('input[type="radio"]').click();
        showLinksToUser(fieldset.querySelector("input:checked").dataset
            .group, "group");
        return;
    }
    const searchedLink = linksStorage.find((link) => link.description ===
        document.querySelector('input[type="search"]').value);
    if (searchedLink) {
        fieldset.querySelector('input[type="radio"]').click();
        showLinksToUser(fieldset.querySelector("input:checked").dataset
            .group, [searchedLink]);
    }
    else {
        alert("There is no link you tried to find");
    }
});
main.addEventListener("click", function (event) {
    if (event.target.tagName !== "LABEL")
        return;
    linkEditor.currentLink = Object.assign({}, linksStorage.find((link) => link.description ===
        event.target
            .previousElementSibling.innerText));
    linkEditor.descriptionInput.value = linkEditor.currentLink.description;
    linkEditor.urlInput.value = linkEditor.currentLink.url;
    linkEditor.groupInput.value = linkEditor.currentLink.group;
});
function setEventListeners() {
    document
        .querySelector("section")
        .addEventListener("click", (event) => linkEditor.close(event));
    linkEditor.edit_addButton.addEventListener("click", () => linkEditor.edit());
    linkEditor.deleteButton.addEventListener("click", () => linkEditor.delete());
    linkEditor.urlInput.addEventListener("blur", () => linkEditor.verifyUrl());
    linkEditor.groupInput.addEventListener("blur", () => linkEditor.verifyFilterGroup());
    linkEditor.descriptionInput.addEventListener("blur", () => linkEditor.verifyDescription());
    document.getElementById("addNewLinkButton").addEventListener("click", () => {
        linkEditor.prepareForNewLink();
        linkEditor.visibilityCheckbox.checked = true;
    });
}
setEventListeners();
//# sourceMappingURL=main.js.map