import { LOCAL_STORAGE } from "./main.js";
import { Link } from "./storage-data.js";
export class DataStorage {
    constructor() {
        Object.defineProperty(this, "_links", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new LinkArray([])
        });
        Object.defineProperty(this, "_groups", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new GroupArray([])
        });
    }
    get links() {
        return this._links;
    }
    set links(links) {
        if (typeof links !== "object")
            throw new Error("Wrong type of parameter");
        this._links = new LinkArray(links);
    }
    get groups() {
        return this._groups;
    }
    set groups(groups) {
        this._groups = new GroupArray(groups);
    }
}
export class LinkArray extends Array {
    constructor(MemoryData) {
        super();
        if (typeof MemoryData === "object") {
            let isMemoryValid = true;
            MemoryData.forEach((link) => {
                try {
                    const { description, group, url } = link;
                    const newLink = new Link(description, url, group);
                    this.safeAdd(newLink);
                }
                catch (error) {
                    console.log(error);
                    isMemoryValid = false;
                }
            });
            if (!isMemoryValid)
                LOCAL_STORAGE.setItem("linkStorage", JSON.stringify(this));
        }
    }
    safeAdd(newLink) {
        const theSameLink = this.find((link) => link.d === newLink.d);
        if (theSameLink || !Link.verify(newLink))
            throw new Error("Link already exists or is not valid");
        this.push(newLink);
    }
    filterByGroup(group) {
        try {
            if (this.length === 0)
                return [];
            return this.reduce((prev, current) => {
                group === "All"
                    ? prev.push(current)
                    : current.g === group
                        ? prev.push(current)
                        : "";
                return prev;
            }, []);
        }
        catch (error) {
            console.log(error);
            return [];
        }
    }
    findAndEdit(prevDescription, changes) {
        const linkInStorage = this.find((link) => link.d === prevDescription);
        if (!linkInStorage)
            throw new Error("Link not found");
        linkInStorage.edit(changes);
    }
    getAllGroups() {
        return [...new Set(this.map((link) => link.g))];
    }
    findByDescriptionAndDelete(description) {
        const linkIndex = this.findIndex((link) => link.d === description);
        if (linkIndex === -1)
            throw new Error("Link not found");
        try {
            this.splice(linkIndex, 1);
        }
        catch (error) {
            console.log(error);
        }
    }
}
export class GroupArray extends Array {
    constructor(groups) {
        super();
        let success = true;
        for (const key of groups) {
            try {
                this.safeAdd(key);
            }
            catch (_a) {
                success = false;
            }
        }
        if (!success)
            LOCAL_STORAGE.setItem("groupStorage", JSON.stringify(this));
    }
    safeAdd(value) {
        if (this.includes(value) || typeof value !== "string" || !value.trim())
            throw new Error("There is an error with creating new group");
        if (value === "Ungrouped")
            return;
        this.push(value);
    }
    findAndEdit(prevVal, currentVal) {
        if (prevVal === currentVal)
            return;
        let index = this.findIndex((group) => group === prevVal);
        this[index] = currentVal;
    }
}
export default DataStorage;
//# sourceMappingURL=storages.js.map