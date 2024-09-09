import { DATA_STORAGE, linksStorage, allFilterGroups, showLinksToUser, fieldset, prepareSearchInput, } from "./main.js";
import { accountDbRequest } from "./connect-db.js";
class LinkEditorParts {
    constructor() {
        Object.defineProperty(this, "htmlElement", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: document.querySelector("section")
        });
        Object.defineProperty(this, "urlInput", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: document.getElementById("urlInput")
        });
        Object.defineProperty(this, "inputs", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (() => {
                var object = {
                    url: document.getElementById("urlInput"),
                    description: document.getElementById("descriptionInput"),
                    group: document.getElementById("groupInput"),
                };
                if (Object.values(object).some((data) => !data)) {
                    console.error("!LinkEditor html ERROR!");
                    return null;
                }
                return object;
            })()
        });
        Object.defineProperty(this, "descriptionInput", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: document.getElementById("descriptionInput")
        });
        Object.defineProperty(this, "deleteButton", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: document.getElementById("delete-link-button")
        });
        Object.defineProperty(this, "edit_addButton", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: document.getElementById("edit_add-link-button")
        });
        Object.defineProperty(this, "groupDatalist", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: document.getElementById("groupDatalist")
        });
        Object.defineProperty(this, "groupInput", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: document.getElementById("groupInput")
        });
        Object.defineProperty(this, "currentLink", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "visibilityCheckbox", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: document.getElementById("sectionVisibilityCheckbox")
        });
        Object.defineProperty(this, "addLinkCheckbox", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: document.getElementById("newLinkCheckbox")
        });
    }
}
class LinkEditor extends LinkEditorParts {
    constructor() {
        super();
    }
    edit() {
        new Promise((resolve, reject) => {
            if (!this.verifyAllFields()) {
                reject("");
            }
            if (this.currentLink) {
                const thisLinkInDb = linksStorage.find((link) => link.description === this.currentLink.description);
                thisLinkInDb.description = this.descriptionInput.value;
                thisLinkInDb.url = this.urlInput.value;
                thisLinkInDb.group = this.groupInput.value;
            }
            else
                linksStorage.push({
                    description: this.descriptionInput.value,
                    url: this.urlInput.value,
                    group: this.groupInput.value,
                });
            resolve("");
        })
            .then(() => {
            this.visibilityCheckbox.checked = false;
            if (this.currentLink.description === this.descriptionInput.value &&
                this.currentLink.group === this.groupInput.value &&
                this.currentLink.url === this.urlInput.value) {
                this.currentLink = null;
                return;
            }
            this.currentLink = null;
            DATA_STORAGE.setItem("linksStorage", JSON.stringify(linksStorage));
            prepareSearchInput();
            accountDbRequest("PUT", {
                linksStorage,
            });
            showLinksToUser(fieldset.querySelector("input:checked")
                .nextElementSibling.innerText, "group");
        }, () => {
            console.log("reject");
            alert("Invalid link name, URL or group");
        })
            .catch((error) => {
            console.log("!!!" + error.message);
        });
    }
    delete() {
        if (!confirm("Are you sure about deleting this link?"))
            return;
        linksStorage.splice(linksStorage.findIndex((link) => link.description === this.descriptionInput.value &&
            link.url === this.urlInput.value &&
            link.group === this.groupInput.value), 1);
        this.visibilityCheckbox.checked = false;
        this.currentLink = null;
        showLinksToUser(fieldset.querySelector("input:checked")
            .nextElementSibling.innerText, "group");
        prepareSearchInput();
        DATA_STORAGE.setItem("linksStorage", JSON.stringify(linksStorage));
        accountDbRequest("PUT", {
            linksStorage,
        });
    }
    close(event) {
        if (this.htmlElement !== event.target)
            return;
        if (this.currentLink) {
            this.descriptionInput.value = this.currentLink.description;
            this.urlInput.value = this.currentLink.url;
            this.groupInput.value = this.currentLink.group;
            this.currentLink = null;
        }
        else {
            this.addLinkCheckbox.checked = false;
        }
        this.visibilityCheckbox.checked = false;
    }
    verifyUrl() {
        if (!this.currentLink)
            return;
        if (!this.urlInput.value || !/https?:\/\//g.test(this.urlInput.value)) {
            this.urlInput.value = this.currentLink.url;
            alert("URL should start from http");
            return;
        }
        this.urlInput.value = this.urlInput.value.trim();
    }
    verifyDescription() {
        if (!this.currentLink)
            return;
        if (!this.descriptionInput.value) {
            alert("Name should contain at least 1 character");
            this.descriptionInput.value = this.currentLink.description;
            return;
        }
        else if (!(this.currentLink.description === this.descriptionInput.value) &&
            linksStorage.some((link) => link.description === this.descriptionInput.value)) {
            alert("Link name already exists");
            this.descriptionInput.value = this.currentLink.description;
            return;
        }
    }
    verifyFilterGroup() {
        if (!this.currentLink)
            return;
        if (![...allFilterGroups, "Ungrouped"].includes(this.groupInput.value)) {
            this.groupInput.value = this.currentLink.group;
            alert("This group doesn't exist");
            return;
        }
    }
    verifyAllFields() {
        const isLinkNameNotValid = !linkEditor.descriptionInput.value ||
            ((linkEditor.currentLink
                ? !(linkEditor.descriptionInput.value ===
                    linkEditor.currentLink.description)
                : true) &&
                linksStorage.some((link) => link.description === linkEditor.descriptionInput.value)), isLinkURLNotValid = !linkEditor.urlInput.value ||
            !/https?:\/\//g.test(linkEditor.urlInput.value), isLinkGroupNotValid = !linkEditor.groupInput.value ||
            ![...allFilterGroups, "Ungrouped"].includes(linkEditor.groupInput.value);
        console.log(!(isLinkNameNotValid || isLinkURLNotValid || isLinkGroupNotValid));
        return !(isLinkNameNotValid || isLinkURLNotValid || isLinkGroupNotValid);
    }
    prepareGroupDatalist() {
        linkEditor.groupDatalist.innerHTML = "";
        const allMeaningfulGroups = [...allFilterGroups, "Ungrouped"];
        linkEditor.groupDatalist.append(...allMeaningfulGroups.reduce((groups, group) => {
            const option = document.createElement("option");
            option.value = group;
            option.innerText = group;
            groups.push(option);
            return groups;
        }, []));
    }
    prepareFieldsForEditing(event) {
        if (event.target.tagName !== "LABEL")
            return;
        this.currentLink = Object.assign({}, linksStorage.find((link) => link.description ===
            event.target
                .previousElementSibling.innerText));
        this.descriptionInput.value = this.currentLink.description;
        this.urlInput.value = this.currentLink.url;
        this.groupInput.value = this.currentLink.group;
    }
    prepareForNewLink() {
        this.descriptionInput.value = "";
        this.urlInput.value = "";
        this.groupInput.value = "Ungrouped";
    }
}
// abstract class Editor {
//   readonly htmlElement: HTMLElement;
//   readonly visibilityCheckbox: HTMLInputElement;
//   readonly newItemCheckbox: HTMLInputElement;
//   editItem: any | null = null;
//   inputs: editorInputs;
//   constructor(
//     htmlElement: HTMLElement,
//     visibilityCheckbox: HTMLInputElement,
//     inputs: editorInputs,
//     newItemCheckbox: HTMLInputElement
//   ) {
//     this.htmlElement = htmlElement;
//     this.visibilityCheckbox = visibilityCheckbox;
//     this.inputs = inputs;
//     this.newItemCheckbox = newItemCheckbox;
//   }
//   close(event: MouseEvent): void {
//     if (this.htmlElement !== event.target) return;
//     if (this.editItem) {
//       for (const input in this.inputs) {
//         this.inputs[input].value = this.editItem[input];
//       }
//       this.editItem = null;
//     } else {
//       this.newItemCheckbox.checked = false;
//     }
//     this.visibilityCheckbox!.checked = false;
//   }
// }
export const linkEditor = new LinkEditor();
//
//# sourceMappingURL=Editor.js.map