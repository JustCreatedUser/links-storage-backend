import { DATA_STORAGE, linkStorage, groupStorage, showLinksToUser, fieldset, prepareSearchInput, } from "./main.js";
import { accountDbRequest } from "./connect-db.js";
import { sidebar } from "./SidebarFunctions.js";
class Editor {
    constructor({ htmlElement, inputs }) {
        Object.defineProperty(this, "htmlElement", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "deleteButton", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "edit_addButton", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "editItem", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "inputs", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.htmlElement = htmlElement;
        this.deleteButton = htmlElement.querySelector(".delete-button");
        this.edit_addButton = this.htmlElement.querySelector(".edit_add-button");
        this.inputs = inputs;
    }
    open() {
        this.htmlElement.classList.add("opened");
    }
    close(event) {
        if (arguments[0] && this.htmlElement !== event.target)
            return;
        if (this.editItem) {
            for (const input in this.inputs) {
                this.inputs[input].value = "";
            }
            this.editItem = null;
        }
        else {
            this.htmlElement.classList.remove("create-new");
        }
        this.htmlElement.classList.remove("opened");
    }
    styleForNewItem() {
        this.htmlElement.classList.add("create-new");
    }
}
class GroupEditor extends Editor {
    constructor(params) {
        super(params);
    }
    prepareForNewGroup( /*event: MouseEvent*/) {
        this.styleForNewItem();
        this.inputs.name.value = "";
    }
    edit() {
        if (!this.inputs.name.value &&
            groupStorage.includes(this.inputs.name.value))
            return;
        const newGroup = this.inputs.name.value;
        groupStorage.push(newGroup);
        DATA_STORAGE.setItem("groupStorage", JSON.stringify(groupStorage));
        accountDbRequest("PUT", { groupStorage })
            .then(console.log, console.warn)
            .catch(console.error);
        sidebar.displayAllGroups();
        linkEditor.prepareGroupDatalist();
        this.close();
    }
}
class LinkEditor extends Editor {
    constructor({ htmlElement, inputs }) {
        super({ htmlElement, inputs });
        Object.defineProperty(this, "groupDatalist", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: document.getElementById("groupDatalist")
        });
        Object.defineProperty(this, "editItem", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
    }
    edit() {
        new Promise((resolve, reject) => {
            if (!this.verifyAllFields()) {
                reject("");
            }
            if (this.editItem) {
                const thisLinkInDb = linkStorage.find((link) => link.description === this.editItem.description);
                thisLinkInDb.description = this.inputs.description.value;
                thisLinkInDb.url = this.inputs.url.value;
                thisLinkInDb.group = this.inputs.group.value;
            }
            else
                linkStorage.push({
                    description: this.inputs.description.value,
                    url: this.inputs.url.value,
                    group: this.inputs.group.value,
                });
            resolve("");
        })
            .then(() => {
            this.close();
            if (this.editItem &&
                this.editItem.description === this.inputs.description.value &&
                this.editItem.group === this.inputs.group.value &&
                this.editItem.url === this.inputs.url.value) {
                this.editItem = null;
                return;
            }
            DATA_STORAGE.setItem("linkStorage", JSON.stringify(linkStorage));
            prepareSearchInput();
            const putLinks = {
                linkStorage,
            };
            accountDbRequest("PUT", putLinks)
                .then(console.log, console.warn)
                .catch(console.error);
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
        linkStorage.splice(linkStorage.findIndex((link) => {
            let right = true;
            let data;
            for (data in link) {
                if (!(link[data] === this.inputs[data].value)) {
                    right = false;
                    break;
                }
            }
            return right;
        }), 1);
        this.close();
        this.editItem = null;
        showLinksToUser(fieldset.querySelector("input:checked")
            .nextElementSibling.innerText, "group");
        prepareSearchInput();
        DATA_STORAGE.setItem("linkStorage", JSON.stringify(linkStorage));
        const putLinks = { linkStorage };
        accountDbRequest("PUT", putLinks)
            .then(console.log, console.warn)
            .catch(console.error);
    }
    verifyUrl() {
        if (!this.editItem)
            return;
        if (!this.inputs.url.value || !/https?:\/\//g.test(this.inputs.url.value)) {
            this.inputs.url.value = this.editItem.url;
            alert("URL should start from http");
            return;
        }
        this.inputs.url.value = this.inputs.url.value.trim();
    }
    verifyDescription() {
        if (!this.editItem)
            return;
        if (!this.inputs.description.value) {
            alert("Name should contain at least 1 character");
            this.inputs.description.value = this.editItem.description;
            return;
        }
        else if (!(this.editItem.description === this.inputs.description.value) &&
            linkStorage.some((link) => link.description === this.inputs.description.value)) {
            alert("Link name already exists");
            this.inputs.description.value = this.editItem.description;
            return;
        }
    }
    verifyFilterGroup() {
        if (!this.editItem)
            return;
        if (![...groupStorage, "Ungrouped"].includes(this.inputs.group.value)) {
            this.inputs.group.value = this.editItem.group;
            alert("This group doesn't exist");
            return;
        }
    }
    verifyAllFields() {
        const isLinkNameNotValid = !linkEditor.inputs.description.value ||
            ((linkEditor.editItem
                ? !(linkEditor.inputs.description.value ===
                    linkEditor.editItem.description)
                : true) &&
                linkStorage.some((link) => link.description === linkEditor.inputs.description.value)), isLinkURLNotValid = !linkEditor.inputs.url.value ||
            !/https?:\/\//g.test(linkEditor.inputs.url.value), isLinkGroupNotValid = !linkEditor.inputs.group.value ||
            ![...groupStorage, "Ungrouped"].includes(linkEditor.inputs.group.value);
        return !(isLinkNameNotValid || isLinkURLNotValid || isLinkGroupNotValid);
    }
    prepareGroupDatalist() {
        linkEditor.groupDatalist.innerHTML = "";
        const allMeaningfulGroups = [...groupStorage, "Ungrouped"];
        linkEditor.groupDatalist.append(...allMeaningfulGroups.reduce((groups, group) => {
            const option = document.createElement("option");
            option.value = group;
            option.innerText = group;
            groups.push(option);
            return groups;
        }, []));
    }
    prepareFieldsForEditing(event) {
        if (event.target.tagName !== "BUTTON")
            return;
        this.editItem = Object.assign({}, linkStorage.find((link) => link.description ===
            event.target
                .previousElementSibling.innerText));
        this.inputs.description.value = this.editItem.description;
        this.inputs.url.value = this.editItem.url;
        this.inputs.group.value = this.editItem.group;
    }
    prepareFieldsForNewLink() {
        this.styleForNewItem();
        this.inputs.description.value = "";
        this.inputs.url.value = "";
        this.inputs.group.value = "Ungrouped";
    }
}
export const linkEditor = new LinkEditor({
    htmlElement: document.body.querySelector(".link-editor"),
    inputs: (() => {
        var object = {
            url: document.getElementById("urlInput"),
            description: document.getElementById("descriptionInput"),
            group: document.getElementById("groupInput"),
        };
        if (Object.values(object).some((data) => !data)) {
            console.log(Object.values(object));
            console.error("!LinkEditor html ERROR!");
        }
        return object;
    })(),
}), groupEditor = new GroupEditor({
    htmlElement: document.body.querySelector(".group-editor"),
    inputs: (() => {
        var object = {
            name: document.getElementById("nameInput"),
        };
        if (Object.values(object).some((data) => !data)) {
            console.log(Object.values(object));
            console.error("!groupEditor html ERROR!");
        }
        return object;
    })(),
});
//# sourceMappingURL=Editor.js.map