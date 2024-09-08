import {
  DATA_STORAGE,
  Link,
  linksStorage,
  allFilterGroups,
  showLinksToUser,
  fieldset,
  prepareSearchInput,
} from "./main.js";
import { accountDbRequest } from "./connect-db.js";
class LinkEditorParts {
  readonly htmlElement: HTMLElement = document.querySelector("section")!;
  readonly urlInput = document.getElementById(
    "urlInput"
  ) as HTMLTextAreaElement;
  readonly descriptionInput = document.getElementById(
    "descriptionInput"
  ) as HTMLInputElement;
  readonly deleteButton = document.getElementById("delete-link-button")!;
  readonly edit_addButton = document.getElementById("edit_add-link-button")!;
  readonly groupDatalist = document.getElementById(
    "groupDatalist"
  ) as HTMLDataListElement;
  readonly groupInput = document.getElementById(
    "groupInput"
  ) as HTMLInputElement;
  currentLink: Link | null = null;
  readonly visibilityCheckbox = document.getElementById(
    "sectionVisibilityCheckbox"
  ) as HTMLInputElement;
  readonly addLinkCheckbox = document.getElementById(
    "newLinkCheckbox"
  ) as HTMLInputElement;
}

class LinkEditor extends LinkEditorParts {
  constructor() {
    super();
  }
  edit(): void {
    new Promise((resolve, reject) => {
      if (!this.verifyAllFields()) {
        reject("");
      }
      if (this.currentLink) {
        const thisLinkInDb = linksStorage.find(
          (link) => link.description === this.currentLink!.description
        ) as Link;
        thisLinkInDb.description = this.descriptionInput.value;
        thisLinkInDb.url = this.urlInput.value;
        thisLinkInDb.group = this.groupInput.value;
      } else
        linksStorage.push({
          description: this.descriptionInput.value,
          url: this.urlInput.value,
          group: this.groupInput.value,
        });
      resolve("");
    })
      .then(
        () => {
          this.visibilityCheckbox!.checked = false;
          if (
            this.currentLink!.description === this.descriptionInput.value &&
            this.currentLink!.group === this.groupInput.value &&
            this.currentLink!.url === this.urlInput.value
          ) {
            this.currentLink = null;
            return;
          }
          this.currentLink = null;
          DATA_STORAGE.setItem("linksStorage", JSON.stringify(linksStorage));
          prepareSearchInput();
          accountDbRequest("PUT", {
            linksStorage,
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
    linksStorage.splice(
      linksStorage.findIndex(
        (link) =>
          link.description === this.descriptionInput.value &&
          link.url === this.urlInput.value &&
          link.group === this.groupInput.value
      ),
      1
    );
    this.visibilityCheckbox!.checked = false;
    this.currentLink = null;
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
  close(event: MouseEvent): void {
    if (this.htmlElement !== event.target) return;
    if (this.currentLink) {
      this.descriptionInput.value = this.currentLink.description;
      this.urlInput.value = this.currentLink.url;
      this.groupInput.value = this.currentLink.group;
      this.currentLink = null;
    } else {
      this.addLinkCheckbox.checked = false;
    }

    this.visibilityCheckbox!.checked = false;
  }
  verifyUrl() {
    if (!this.currentLink) return;
    if (!this.urlInput.value || !/https?:\/\//g.test(this.urlInput.value)) {
      this.urlInput.value = this.currentLink.url;
      alert("URL should start from http");
      return;
    }
    this.urlInput.value = this.urlInput.value.trim();
  }
  verifyDescription() {
    if (!this.currentLink) return;
    if (!this.descriptionInput.value) {
      alert("Name should contain at least 1 character");
      this.descriptionInput.value = this.currentLink.description;
      return;
    } else if (
      !(this.currentLink.description === this.descriptionInput.value) &&
      linksStorage.some(
        (link) => link.description === this.descriptionInput.value
      )
    ) {
      alert("Link name already exists");
      this.descriptionInput.value = this.currentLink.description;
      return;
    }
  }
  verifyFilterGroup() {
    if (!this.currentLink) return;
    if (![...allFilterGroups, "Ungrouped"].includes(this.groupInput.value)) {
      this.groupInput.value = this.currentLink.group;
      alert("This group doesn't exist");
      return;
    }
  }
  verifyAllFields(): boolean {
    const isLinkNameNotValid =
        !linkEditor.descriptionInput.value ||
        ((linkEditor.currentLink
          ? !(
              linkEditor.descriptionInput.value ===
              linkEditor.currentLink!.description
            )
          : true) &&
          linksStorage.some(
            (link) => link.description === linkEditor.descriptionInput.value
          )),
      isLinkURLNotValid =
        !linkEditor.urlInput.value ||
        !/https?:\/\//g.test(linkEditor.urlInput.value),
      isLinkGroupNotValid =
        !linkEditor.groupInput.value ||
        ![...allFilterGroups, "Ungrouped"].includes(
          linkEditor.groupInput.value
        );
    console.log(
      !(isLinkNameNotValid || isLinkURLNotValid || isLinkGroupNotValid)
    );

    return !(isLinkNameNotValid || isLinkURLNotValid || isLinkGroupNotValid);
  }
  prepareGroupDatalist() {
    linkEditor.groupDatalist.innerHTML = "";
    const allMeaningfulGroups = [...allFilterGroups, "Ungrouped"];
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
  prepareForNewLink() {
    this.descriptionInput.value = "";
    this.urlInput.value = "";
    this.groupInput.value = "Ungrouped";
  }
}
export const linkEditor = new LinkEditor();
