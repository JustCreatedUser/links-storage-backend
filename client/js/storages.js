import { LOCAL_STORAGE } from "./main.js";
import { Link } from "./storage-data.js";
export class DataStorage {
    constructor({ links, groups, }) {
        Object.defineProperty(this, "_links", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_groups", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this._links = new LinkArray(links);
        this._groups = new GroupArray(groups);
    }
    get links() {
        return this._links;
    }
    set links(links) {
        this._links = new LinkArray(links);
    }
    get groups() {
        return this._groups;
    }
    set groups(groups) {
        this._groups = new GroupArray(groups);
    }
}
class LinkArray extends Array {
    constructor(MemoryData) {
        super();
        let isMemoryValid = true;
        for (const link of MemoryData) {
            const { description, group, url } = link;
            try {
                this.safeAdd(new Link(description, group, url));
            }
            catch (_a) {
                isMemoryValid = false;
            }
        }
        if (!isMemoryValid)
            LOCAL_STORAGE.setItem("linkStorage", JSON.stringify(this));
    }
    safeAdd(newLink) {
        const theSameLink = this.find((link) => link.d === newLink.d);
        if (theSameLink || !Link.verify(newLink))
            throw new Error("Link already exists or is not valid");
        this.push(newLink);
    }
    filterByGroup(group) {
        return this.filter((link) => (group === "All" ? true : link.g === group));
    }
    findAndEdit(prevDescription, changes) {
        const linkInStorage = this.find((link) => link.d === prevDescription);
        if (!linkInStorage)
            throw new Error("Link not found");
        linkInStorage.edit(changes);
    }
}
class GroupArray extends Array {
    constructor(groups) {
        super();
        for (const key of groups) {
            try {
                this.safeAdd(key);
            }
            catch (_a) {
                // ignore
            }
        }
    }
    safeAdd(value) {
        if (this.find((group) => group === value))
            throw new Error("Link already exists");
        this.push(value);
    }
    findAndEdit(prevVal, currentVal) {
        if (prevVal === currentVal)
            return;
        let index = this.findIndex((group) => group === prevVal);
        this[index] = currentVal;
    }
}
const dataStorage = new DataStorage({
    links: JSON.parse(LOCAL_STORAGE["linkStorage"] || "[]"),
    groups: JSON.parse(LOCAL_STORAGE["groupStorage"] || "[]"),
});
export default dataStorage;
//# sourceMappingURL=storages.js.map