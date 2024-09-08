import { allFilterGroups, showLinksToUser } from "./main.js";
class SidebarFunctions {
    constructor() {
        Object.defineProperty(this, "groupList", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: document.querySelector("fieldset")
        });
        Object.defineProperty(this, "htmlElement", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: document.querySelector("aside")
        });
    }
    displayAllGroups() {
        this.clearGroupList();
        this.fillGroupList();
        this.htmlElement
            .querySelectorAll('input[type="radio"]')
            .forEach((input) => {
            input.addEventListener("change", function (event) {
                const group = event.target.dataset.group;
                if (group) {
                    showLinksToUser(group, "group");
                }
            });
        });
    }
    clearGroupList() {
        Array.from(this.groupList.children).forEach((child, index) => {
            if (index < 3)
                return;
            child.remove();
        });
    }
    fillGroupList() {
        allFilterGroups.forEach((group) => {
            const newGroup = document.createElement("label");
            newGroup.innerHTML = /*html*/ `<input type="radio" name="group" data-group="${group}" />
          <span>${group}</span>
          <button>-</button>`;
            this.groupList.append(newGroup);
        });
    }
}
export const sidebar = new SidebarFunctions();
//# sourceMappingURL=SidebarFunctions.js.map