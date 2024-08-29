import mongoose from "mongoose";
interface LINK {
  description: string;
  url: string;
  group: string;
}
export type LINK_STORAGE = LINK[];
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
      validator: function (storage: Array<LINK>) {
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
