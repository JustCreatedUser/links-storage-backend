import mongoose from "mongoose";
import { LINK_STORAGE, Link } from "../client/main";
const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
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
  allFilterGroups: {
    type: [String],
    default: [],
    validate: {
      validator: function (THIS: Array<string>) {
        const specialGroup = "Ungrouped";
        if (THIS.includes(specialGroup)) return false;

        const uniqueGroups = new Set(THIS);
        return uniqueGroups.size === THIS.length;
      },
      message: () => `Some group names repeat!`,
    },
  },
  linksStorage: {
    type: Array,
    default: [],
    validate: {
      validator: function (storage: Array<Link>) {
        const uniqueLinksNames = new Set(
          storage.reduce((previous, current) => {
            previous.push(current.description);
            return previous;
          }, [] as Array<string>)
        );
        return uniqueLinksNames.size === storage.length;
      },
      message: () => `Some link descriptions repeat!`,
    },
  },
});
const USER_SCHEMA = mongoose.model("User", UserSchema);
export default USER_SCHEMA;
