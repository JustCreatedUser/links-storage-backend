import mongoose from "mongoose";
import { LinkInDatabase } from "../client/ts/storage-data";
const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: (username: string) => {
        return username.length >= 3 && username.length <= 20;
      },
      message: () => "Invalid username length",
    },
  },
  password: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: () => Date.now(),
    immutable: true,
  },
  updatedAt: {
    type: Date,
    default: () => Date.now(),
  },
  groupStorage: {
    type: [String],
    default: [],
    validate: {
      validator: function (groups: Array<string>) {
        if (!groups) return false;
        const specialGroup = "Ungrouped";
        if (groups.includes(specialGroup)) return false;

        const uniqueGroups = new Set(groups);
        return uniqueGroups.size === groups.length;
      },
      message: () => `Some group names repeat!`,
    },
  },
  linkStorage: {
    type: Array,
    default: [],
    validate: {
      validator: function (storage: Array<LinkInDatabase>) {
        if (!storage) return false;
        const uniqueLinks = new Set();
        for (const link of storage) {
          if (!link || !link.description) return false;
          uniqueLinks.add(link.description);
        }
        return uniqueLinks.size === storage.length;
      },
      message: () => `Some link descriptions repeat!`,
    },
  },
});
UserSchema.pre("save", function () {
  this.updatedAt = Date.now() as unknown as Date;
});
const USER_SCHEMA = mongoose.model("User", UserSchema);

export default USER_SCHEMA;
