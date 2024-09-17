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
const route = "/users/:user/db";
dbRouter
  .get("/users/:user/db", getAccountDb)
  .post("/users/:user/db", isPersonVerifiedForRequest, createNewData)
  .put("/users/:user/db", isPersonVerifiedForRequest, insertReadyData)
  .patch("/users/:user/db", isPersonVerifiedForRequest, updateAccountDb)
  .delete("/users/:user/db", isPersonVerifiedForRequest, deleteSomethingFromDb);
export default dbRouter;
