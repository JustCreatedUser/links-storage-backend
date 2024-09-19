import dataStorage from "./storages.js";
export class Link {
    constructor(description, url, group) {
        Object.defineProperty(this, "description", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "New"
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
        if (!dataStorage.groups.has(value) && value !== "Ungrouped")
            throw new Error("No such group");
        this.group = value;
    }
}
try {
    dataStorage.links.safeAdd(new Link("d", "http://", "Ungrouped"));
    dataStorage.links.safeAdd(new Link("dsd", "http://", ""));
    console.log(dataStorage.links);
}
catch (error) {
    console.log(dataStorage.links, error.message);
}
//# sourceMappingURL=link.js.map