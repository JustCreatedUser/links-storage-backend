import express from "express";
import {
  getAccountDb,
  createNewData,
  // insertReadyData,
  updateAccountDb,
  deleteUser,
  isPersonVerifiedForRequest,
  deleteSomethingFromDb,
} from "../controllers";
const dbRouter = express.Router();
function insertReadyData() {}
dbRouter
  .get("/", getAccountDb)
  .post("/", isPersonVerifiedForRequest, createNewData)
  .put("/", isPersonVerifiedForRequest, insertReadyData)
  .patch("/", isPersonVerifiedForRequest, updateAccountDb)
  .delete("/", isPersonVerifiedForRequest, deleteSomethingFromDb);
export default dbRouter;
