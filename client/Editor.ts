import {
  DATA_STORAGE,
  Link,
  linkStorage,
  groupStorage,
  showLinksToUser,
  fieldset,
  prepareSearchInput,
} from "./main.js";
import { accountDbRequest } from "./connect-db.js";
import { sidebar } from "./SidebarFunctions.js";
interface editorInputs {
  [key: string]: HTMLInputElement | HTMLTextAreaElement;
}
interface editorConstructorParams {
  htmlElement: HTMLElement;
  inputs: editorInputs;
}
interface linkEditorInputs extends editorInputs {
  url: HTMLTextAreaElement;
  description: HTMLInputElement;
  group: HTMLInputElement;
}
interface groupEditorInputs extends editorInputs {
  name: HTMLInputElement;
}
abstract class Editor {
  readonly htmlElement: HTMLElement;
  readonly deleteButton: HTMLElement;
  readonly edit_addButton: HTMLElement;
  editItem: any | null = null;
  inputs: editorInputs | linkEditorInputs | groupEditorInputs;
  constructor({ htmlElement, inputs }: editorConstructorParams) {
    this.htmlElement = htmlElement;
    this.deleteButton = htmlElement.querySelector(".delete-button")!;
    this.edit_addButton = this.htmlElement.querySelector(".edit_add-button")!;
    this.inputs = inputs;
  }
  open() {
    this.htmlElement.classList.add("opened");
  }
  close(event?: MouseEvent): void {
    if (arguments[0] && this.htmlElement !== event!.target) return;
    if (this.editItem) {
      for (const input in this.inputs) {
        this.inputs[input].value = "";
      }
      this.editItem = null;
    } else {
      this.htmlElement.classList.remove("create-new");
    }
    this.htmlElement.classList.remove("opened");
  }
  styleForNewItem() {
    this.htmlElement.classList.add("create-new");
  }
}
class GroupEditor extends Editor {
  constructor(params: editorConstructorParams) {
    super(params);
  }
  prepareForNewGroup(/*event: MouseEvent*/) {
    this.styleForNewItem();
    this.inputs.name.value = "";
  }
  edit() {
    console.log(
      this.inputs.name.value && !groupStorage.includes(this.inputs.name.value)
    );

    if (
      !this.inputs.name.value &&
      groupStorage.includes(this.inputs.name.value)
    )
      return;
    const newGroup = this.inputs.name.value;
    groupStorage.push(newGroup);
    DATA_STORAGE.setItem("groupStorage", JSON.stringify(groupStorage));
    accountDbRequest("PUT", { groupStorage })
      .then(
        (message) => {
          console.log(message);
        },
        (reason) => {
          console.log(reason);
        }
      )
      .catch((error) => {
        console.error("!PUT request ERROR!!! - " + error.message);
      });
    sidebar.displayAllGroups();
    linkEditor.prepareGroupDatalist();
    this.close();
  }
}
class LinkEditor extends Editor {
  groupDatalist: HTMLDataListElement = document.getElementById(
    "groupDatalist"
  ) as HTMLDataListElement;
  editItem: Link | null = null;
  constructor({ htmlElement, inputs }: editorConstructorParams) {
    super({ htmlElement, inputs });
  }
  edit(): void {
    new Promise((resolve, reject) => {
      if (!this.verifyAllFields()) {
        reject("");
      }
      if (this.editItem) {
        const thisLinkInDb = linkStorage.find(
          (link) => link.description === this.editItem!.description
        ) as Link;
        thisLinkInDb.description = this.inputs.description.value;
        thisLinkInDb.url = this.inputs.url.value;
        thisLinkInDb.group = this.inputs.group.value;
      } else
        linkStorage.push({
          description: this.inputs.description.value,
          url: this.inputs.url.value,
          group: this.inputs.group.value,
        });
      resolve("");
    })
      .then(
        () => {
          this.close();
          if (
            this.editItem &&
            this.editItem.description === this.inputs.description.value &&
            this.editItem.group === this.inputs.group.value &&
            this.editItem.url === this.inputs.url.value
          ) {
            this.editItem = null;
            return;
          }
          DATA_STORAGE.setItem("linkStorage", JSON.stringify(linkStorage));
          prepareSearchInput();
          accountDbRequest("PUT", {
            linkStorage,
          })
            .then(
              () => {},
              (reason) => {
                console.log(reason);
              }
            )
            .catch((error) => {
              console.error(error.message);
            });

          showLinksToUser(
            (
              fieldset.querySelector<HTMLInputElement>("input:checked")!
                .nextElementSibling as HTMLSpanElement
            ).innerText,
            "group"
          );
        },
        () => {
          console.log("reject");
          alert("Invalid link name, URL or group");
        }
      )
      .catch((error) => {
        console.log("!!!" + error.message);
      });
  }
  delete(): void {
    if (!confirm("Are you sure about deleting this link?")) return;
    linkStorage.splice(
      linkStorage.findIndex((link) => {
        let right: boolean = true;
        let data: keyof typeof link;
        for (data in link) {
          if (!(link[data] === this.inputs[data].value!)) {
            right = false;
            break;
          }
        }
        return right;
      }),
      1
    );
    this.close();
    this.editItem = null;
    showLinksToUser(
      (
        fieldset.querySelector<HTMLInputElement>("input:checked")!
          .nextElementSibling as HTMLSpanElement
      ).innerText,
      "group"
    );
    prepareSearchInput();
    DATA_STORAGE.setItem("linkStorage", JSON.stringify(linkStorage));
    accountDbRequest("PUT", {
      linkStorage,
    })
      .then(
        () => {},
        (reason) => {
          console.log(reason);
        }
      )
      .catch((error) => {
        console.log(error.message);
      });
  }
  verifyUrl() {
    if (!this.editItem) return;
    if (!this.inputs.url.value || !/https?:\/\//g.test(this.inputs.url.value)) {
      this.inputs.url.value = this.editItem.url;
      alert("URL should start from http");
      return;
    }
    this.inputs.url.value = this.inputs.url.value.trim();
  }
  verifyDescription() {
    if (!this.editItem) return;
    if (!this.inputs.description.value) {
      alert("Name should contain at least 1 character");
      this.inputs.description.value = this.editItem.description;
      return;
    } else if (
      !(this.editItem.description === this.inputs.description.value) &&
      linkStorage.some(
        (link) => link.description === this.inputs.description.value
      )
    ) {
      alert("Link name already exists");
      this.inputs.description.value = this.editItem.description;
      return;
    }
  }
  verifyFilterGroup() {
    if (!this.editItem) return;
    if (![...groupStorage, "Ungrouped"].includes(this.inputs.group.value)) {
      this.inputs.group.value = this.editItem.group;
      alert("This group doesn't exist");
      return;
    }
  }
  verifyAllFields(): boolean {
    const isLinkNameNotValid =
        !linkEditor.inputs.description.value ||
        ((linkEditor.editItem
          ? !(
              linkEditor.inputs.description.value ===
              linkEditor.editItem!.description
            )
          : true) &&
          linkStorage.some(
            (link) => link.description === linkEditor.inputs.description.value
          )),
      isLinkURLNotValid =
        !linkEditor.inputs.url.value ||
        !/https?:\/\//g.test(linkEditor.inputs.url.value),
      isLinkGroupNotValid =
        !linkEditor.inputs.group.value ||
        ![...groupStorage, "Ungrouped"].includes(linkEditor.inputs.group.value);
    return !(isLinkNameNotValid || isLinkURLNotValid || isLinkGroupNotValid);
  }
  prepareGroupDatalist() {
    linkEditor.groupDatalist.innerHTML = "";
    const allMeaningfulGroups = [...groupStorage, "Ungrouped"];
    linkEditor.groupDatalist.append(
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
  prepareFieldsForEditing(event: MouseEvent) {
    if ((event.target as HTMLElement).tagName !== "BUTTON") return;
    this.editItem = {
      ...linkStorage.find(
        (link) =>
          link.description ===
          (
            (event.target as HTMLInputElement)
              .previousElementSibling as HTMLAnchorElement
          ).innerText
      ),
    } as Link;

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
    htmlElement: document.body.querySelector(".link-editor")!,
    inputs: ((): linkEditorInputs => {
      var object: linkEditorInputs = {
        url: document.getElementById("urlInput") as HTMLTextAreaElement,
        description: document.getElementById(
          "descriptionInput"
        ) as HTMLInputElement,
        group: document.getElementById("groupInput") as HTMLInputElement,
      };
      if (Object.values(object).some((data) => !data)) {
        console.log(Object.values(object));

        console.error("!LinkEditor html ERROR!");
      }

      return object;
    })(),
  }),
  groupEditor = new GroupEditor({
    htmlElement: document.body.querySelector(".group-editor")!,
    inputs: ((): groupEditorInputs => {
      var object: groupEditorInputs = {
        name: document.getElementById("nameInput") as HTMLInputElement,
      };
      if (Object.values(object).some((data) => !data)) {
        console.log(Object.values(object));
        console.error("!groupEditor html ERROR!");
      }
      return object;
    })(),
  });
