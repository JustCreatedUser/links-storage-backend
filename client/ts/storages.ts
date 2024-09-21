import { LOCAL_STORAGE } from "./main.js";
import { Link, LinkEdits, LinkInDatabase } from "./storage-data.js";

export class DataStorage {
  private _links = new LinkArray([]);
  private _groups = new GroupArray([]);
  constructor() {}
  public get links(): LinkArray {
    return this._links;
  }
  public set links(links: Array<LinkInDatabase>) {
    if (typeof links !== "object") throw new Error("Wrong type of parameter");
    this._links = new LinkArray(links);
  }
  public get groups(): GroupArray {
    return this._groups;
  }
  public set groups(groups: Array<string>) {
    this._groups = new GroupArray(groups);
  }
}
export class LinkArray extends Array<Link> {
  constructor(MemoryData?: Array<LinkInDatabase>) {
    super();
    if (typeof MemoryData === "object") {
      let isMemoryValid: boolean = true;
      MemoryData.forEach((link) => {
        try {
          const { description, group, url } = link;
          const newLink = new Link(description, url, group);
          this.safeAdd(newLink);
        } catch (error) {
          console.log(error);

          isMemoryValid = false;
        }
      });
      if (!isMemoryValid)
        LOCAL_STORAGE.setItem("linkStorage", JSON.stringify(this));
    }
  }
  public safeAdd(newLink: Link) {
    const theSameLink = this.find((link) => link.d === newLink.d);
    if (theSameLink || !Link.verify(newLink))
      throw new Error("Link already exists or is not valid");
    this.push(newLink);
  }
  public filterByGroup(group: string): Link[] {
    try {
      if (this.length === 0) return [];
      return this.reduce((prev: Link[], current: Link) => {
        group === "All"
          ? prev.push(current)
          : current.g === group
          ? prev.push(current)
          : "";
        return prev;
      }, [] as Link[]);
    } catch (error) {
      console.log(error);
      return [];
    }
  }
  findAndEdit(prevDescription: string, changes: LinkEdits) {
    const linkInStorage = this.find((link) => link.d === prevDescription);
    if (!linkInStorage) throw new Error("Link not found");
    linkInStorage.edit(changes);
  }
  getAllGroups(): string[] {
    return [...new Set(this.map((link) => link.g))];
  }
  findByDescriptionAndDelete(description: string) {
    const linkIndex = this.findIndex((link) => link.d === description);
    if (linkIndex === -1) throw new Error("Link not found");
    try {
      this.splice(linkIndex, 1);
    } catch (error) {
      console.log(error);
    }
  }
}
export class GroupArray extends Array<string> {
  constructor(groups: string[]) {
    super();
    let success: boolean = true;
    for (const key of groups) {
      try {
        this.safeAdd(key);
      } catch {
        success = false;
      }
    }
    if (!success) LOCAL_STORAGE.setItem("groupStorage", JSON.stringify(this));
  }
  public safeAdd(value: string) {
    if (this.includes(value) || typeof value !== "string" || !value.trim())
      throw new Error("There is an error with creating new group");
    if (value === "Ungrouped") return;
    this.push(value);
  }
  findAndEdit(prevVal: string, currentVal: string) {
    if (prevVal === currentVal) return;
    let index = this.findIndex((group) => group === prevVal);
    this[index] = currentVal;
  }
}
export default DataStorage;
