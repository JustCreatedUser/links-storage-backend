import { LOCAL_STORAGE } from "./main.js";
import { Link, LinkEdits, LinkInDatabase } from "./storage-data.js";
export class DataStorage {
  private _links: LinkArray;
  private _groups: GroupArray;
  constructor({
    links,
    groups,
  }: {
    links: LinkInDatabase[];
    groups: Array<string>;
  }) {
    this._links = new LinkArray(links);
    this._groups = new GroupArray(groups);
  }
  public get links(): LinkArray {
    return this._links;
  }
  public set links(links: Array<LinkInDatabase>) {
    this._links = new LinkArray(links);
  }
  public get groups() {
    return this._groups;
  }
  public set groups(groups: Array<string>) {
    this._groups = new GroupArray(groups);
  }
}
class LinkArray extends Array<Link> {
  constructor(MemoryData: Array<LinkInDatabase>) {
    super();
    let isMemoryValid: boolean = true;
    for (const link of MemoryData) {
      const { description, group, url } = link;

      try {
        this.safeAdd(new Link(description, group, url));
      } catch {
        isMemoryValid = false;
      }
    }
    if (!isMemoryValid)
      LOCAL_STORAGE.setItem("linkStorage", JSON.stringify(this));
  }
  public safeAdd(newLink: Link) {
    const theSameLink = this.find((link) => link.d === newLink.d);
    if (theSameLink || !Link.verify(newLink))
      throw new Error("Link already exists or is not valid");
    this.push(newLink);
  }
  public filterByGroup(group: string) {
    return this.filter((link) => (group === "All" ? true : link.g === group));
  }
  findAndEdit(prevDescription: string, changes: LinkEdits) {
    const linkInStorage = this.find((link) => link.d === prevDescription);
    if (!linkInStorage) throw new Error("Link not found");
    linkInStorage.edit(changes);
  }
}
class GroupArray extends Array<string> {
  constructor(groups: string[]) {
    super();
    for (const key of groups) {
      try {
        this.safeAdd(key);
      } catch {
        // ignore
      }
    }
  }
  public safeAdd(value: string) {
    if (this.find((group) => group === value))
      throw new Error("Link already exists");
    this.push(value);
  }
  findAndEdit(prevVal: string, currentVal: string) {
    if (prevVal === currentVal) return;
    let index = this.findIndex((group) => group === prevVal);
    this[index] = currentVal;
  }
}
const dataStorage = new DataStorage({
  links: JSON.parse(LOCAL_STORAGE["linkStorage"] || "[]"),
  groups: JSON.parse(LOCAL_STORAGE["groupStorage"] || "[]"),
});
export default dataStorage;
