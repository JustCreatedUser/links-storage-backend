import { groupStorage, showLinksToUser } from "./main.js";
class SidebarFunctions {
  readonly groupList = document.querySelector("fieldset") as HTMLElement;
  readonly htmlElement: HTMLElement = document.querySelector("aside")!;
  constructor() {}
  displayAllGroups() {
    this.clearGroupList();
    this.fillGroupList();
    this.htmlElement
      .querySelectorAll('input[type="radio"]')
      .forEach((input) => {
        input.addEventListener("change", function (event) {
          const group = (event.target as HTMLElement).dataset.group;
          if (group) {
            showLinksToUser(group, "group");
          }
        });
      });
  }
  clearGroupList() {
    (Array.from(this.groupList.children) as HTMLElement[]).forEach(
      (child, index) => {
        if (index < 3) return;
        child.remove();
      }
    );
  }
  fillGroupList() {
    groupStorage.forEach((group) => {
      const newGroup = document.createElement("label");
      newGroup.innerHTML = /*html*/ `<input type="radio" name="group" data-group="${group}" />
          <span>${group}</span>
          <button>-</button>`;
      this.groupList.append(newGroup);
    });
  }
}
export const sidebar = new SidebarFunctions();
