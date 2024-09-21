import { dataStorage } from "./main.js";
export class Link {
    constructor(description, url, group) {
        Object.defineProperty(this, "description", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "Unedited link"
        });
        Object.defineProperty(this, "url", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "https://"
        });
        Object.defineProperty(this, "group", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "Ungrouped"
        });
        this.d = description;
        this.u = url;
        this.g = group;
    }
    get d() {
        return this.description;
    }
    set d(value) {
        if (!value)
            throw new Error("Something is wrong with description");
        this.description = value;
    }
    get u() {
        return this.url;
    }
    set u(value) {
        if (!value || !/https?:\/\//g.test(value))
            throw new Error("BAD URL - " + value);
        else
            this.url = value;
    }
    get g() {
        return this.group;
    }
    set g(value) {
        if (!dataStorage.groups.includes(value) && value !== "Ungrouped")
            throw new Error("No such group");
        this.group = value;
    }
    static verify(link) {
        if (link.d &&
            link.u &&
            link.g &&
            /https?:\/\//g.test(link.u) //&&
        //(LOCAL_STORAGE.groups.includes(link.g) || link.g === "Ungrouped")
        )
            return true;
        return false;
    }
    edit(changes) {
        let key;
        for (key in changes) {
            if (!this.hasOwnProperty(key))
                continue;
            this[key] = changes[key];
        }
    }
    toObject() {
        return {
            description: this.description,
            url: this.url,
            group: this.group,
        };
    }
}
//# sourceMappingURL=storage-data.js.map