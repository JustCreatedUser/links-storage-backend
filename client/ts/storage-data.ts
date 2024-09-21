import { dataStorage } from "./main.js";
export interface LinkI {
  d: string;
  u: string;
  g: string;
}
export interface LinkInDatabase {
  description: string;
  url: string;
  group: string;
}
export interface LinkEdits {
  d?: string;
  u?: string;
  g?: string;
}

export class Link implements LinkI {
  private description: string = "Unedited link";
  private url: string = "https://";
  private group: string = "Ungrouped";
  constructor(description: string, url: string, group: string) {
    this.d = description;
    this.u = url;
    this.g = group;
  }
  public get d(): string {
    return this.description;
  }
  public set d(value: string) {
    if (!value) throw new Error("Something is wrong with description");
    this.description = value;
  }
  public get u(): string {
    return this.url;
  }
  public set u(value: string) {
    if (!value || !/https?:\/\//g.test(value))
      throw new Error("BAD URL - " + value);
    else this.url = value;
  }
  public get g(): string {
    return this.group;
  }
  public set g(value: string) {
    if (!dataStorage.groups.includes(value) && value !== "Ungrouped")
      throw new Error("No such group");
    this.group = value;
  }
  static verify(link: Link) {
    if (
      link.d &&
      link.u &&
      link.g &&
      /https?:\/\//g.test(link.u) //&&
      //(LOCAL_STORAGE.groups.includes(link.g) || link.g === "Ungrouped")
    )
      return true;
    return false;
  }
  edit(changes: LinkEdits) {
    type KEYS = "d" | "u" | "g";
    let key: KEYS;
    for (key in changes) {
      if (!this.hasOwnProperty(key)) continue;
      (this as any)[key] = changes[key];
    }
  }
  toObject(): LinkInDatabase {
    return {
      description: this.description,
      url: this.url,
      group: this.group,
    };
  }
}
