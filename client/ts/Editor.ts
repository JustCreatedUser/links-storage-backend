import {
  dataStorage,
  showLinksToUser,
  fieldset,
  prepareSearchInput,
  LOCAL_STORAGE,
} from "./main.js";

import { Link, LinkInDatabase } from "./storage-data.js";
import {
  accountDbRequest,
  deleteData,
  patchData,
  postData,
  requestMethod,
} from "./connect-db.js";
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
    //! Here it CREATES a new group
    if (
      !this.inputs.name.value &&
      dataStorage.groups.includes(this.inputs.name.value)
    )
      return;
    const newGroup = this.inputs.name.value;
    try {
      dataStorage.groups.safeAdd(newGroup);
      LOCAL_STORAGE.setItem("groupStorage", JSON.stringify(dataStorage.groups));
      accountDbRequest("POST", { type: "group", currentItem: newGroup })
        .then(console.log, console.warn)
        .catch(console.error);
      sidebar.displayAllGroups();
      linkEditor.prepareGroupDatalist();
      this.close();
    } catch {
      alert("Error adding new group");
    }
  }
}
class LinkEditor extends Editor {
  groupDatalist: HTMLDataListElement = document.getElementById(
    "groupDatalist"
  ) as HTMLDataListElement;
  editItem: LinkInDatabase | null = null;
  constructor({ htmlElement, inputs }: editorConstructorParams) {
    super({ htmlElement, inputs });
  }
  edit(): void {
    new Promise(
      (
        resolve: (options: [requestMethod, patchData | postData]) => void,
        reject
      ) => {
        if (!this.verifyAllFields()) {
          reject("");
        }
        let saveOptions: patchData | postData;
        if (this.editItem) {
          const thisLinkInDb = dataStorage.links.find(
            (link) => link.d === this.editItem!.description
          );
          if (!thisLinkInDb) {
            reject("Link not found in database");
            return;
          }
          thisLinkInDb.edit({
            d: this.inputs.description.value,
            u: this.inputs.url.value,
            g: this.inputs.group.value,
          });
          var saveMethod: requestMethod = "PATCH";
          saveOptions = {
            type: "link",
            currentItem: thisLinkInDb.toObject(),
            previousTitle: this.editItem!.description,
          } as patchData;
        } else {
          const description = this.inputs.description.value,
            url = this.inputs.url.value,
            group = this.inputs.group.value;
          const link = new Link(description, url, group);
          var saveMethod: requestMethod = "POST";

          saveOptions = {
            type: "link",
            currentItem: link.toObject(),
          } as postData;
          dataStorage.links.safeAdd(link);
        }
        resolve([saveMethod, saveOptions]);
      }
    )
      .then(
        (options) => {
          if (
            this.editItem &&
            this.editItem.description === this.inputs.description.value &&
            this.editItem.group === this.inputs.group.value &&
            this.editItem.url === this.inputs.url.value
          ) {
            this.editItem = null;
            return;
          }
          LOCAL_STORAGE.setItem(
            "linkStorage",
            JSON.stringify(dataStorage.links)
          );
          prepareSearchInput();
          accountDbRequest(options[0] as any, options[1])
            .then(console.log, console.warn)
            .catch(console.error);

          showLinksToUser(
            (
              fieldset.querySelector<HTMLInputElement>("input:checked")!
                .nextElementSibling as HTMLSpanElement
            ).innerText,
            "group"
          );
          this.close();
        },
        () => {
          console.warn("reject");
          alert("Invalid link name, URL or group");
        }
      )
      .catch((error) => {
        console.error("!!!" + error.message);
      });
  }
  delete(): void {
    if (!confirm("Are you sure about deleting this link?")) return;
    dataStorage.links.findByDescriptionAndDelete(this.editItem!.description);
    prepareSearchInput();
    LOCAL_STORAGE.setItem("linkStorage", JSON.stringify(dataStorage.links));
    const deletedLinkData: deleteData = {
      currentItem: this.editItem!.description,
      type: "link",
    };
    accountDbRequest("DELETE", deletedLinkData)
      .then(console.log, console.warn)
      .catch(console.error);
    showLinksToUser(
      (
        fieldset.querySelector<HTMLInputElement>("input:checked")!
          .nextElementSibling as HTMLSpanElement
      ).innerText,
      "group"
    );
    this.close();
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
      dataStorage.links.some((link) => link.d === this.inputs.description.value)
    ) {
      alert("Link name already exists");
      this.inputs.description.value = this.editItem.description;
      return;
    }
  }
  verifyFilterGroup() {
    if (!this.editItem) return;
    if (!dataStorage.groups.getAlmostALL().includes(this.inputs.group.value)) {
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
          dataStorage.links.some(
            (link) => link.d === linkEditor.inputs.description.value
          )),
      isLinkURLNotValid =
        !linkEditor.inputs.url.value ||
        !/https?:\/\//g.test(linkEditor.inputs.url.value),
      isLinkGroupNotValid =
        !linkEditor.inputs.group.value ||
        !dataStorage.groups
          .getAlmostALL()
          .includes(linkEditor.inputs.group.value);
    return !(isLinkNameNotValid || isLinkURLNotValid || isLinkGroupNotValid);
  }
  prepareGroupDatalist() {
    linkEditor.groupDatalist.innerHTML = "";
    linkEditor.groupDatalist.append(
      ...dataStorage.groups
        .getAlmostALL()
        .reduce((groups: HTMLOptionElement[], group: string) => {
          const option = document.createElement("option");
          option.value = group;
          option.innerText = group;
          groups.push(option);
          return groups;
        }, [])
    );
  }
  prepareFieldsForEditing(event: MouseEvent) {
    if ((event.target as HTMLElement).tagName !== "BUTTON") return;
    this.editItem = {
      ...dataStorage.links.find(
        (link) =>
          link.d ===
          (
            (event.target as HTMLInputElement)
              .previousElementSibling as HTMLAnchorElement
          ).innerText
      ),
    } as LinkInDatabase;

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
        console.error("!groupEditor html ERROR!");
      }
      return object;
    })(),
  });
