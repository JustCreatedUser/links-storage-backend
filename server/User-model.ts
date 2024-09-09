import mongoose from "mongoose";
import { Link } from "../client/main";
const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: (username: string) => {
        // Add validation for username format and length
        return username.length >= 3;
      },
      message: () => "Invalid username format or length",
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
      validator: function (storage: Array<Link>) {
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
const USER_SCHEMA = mongoose.model("User", UserSchema);
export default USER_SCHEMA;
