import express from "express";
type registerAttempt = "normal" | "again";
const router = express.Router();
import {
  authMiddleware,
  createUser,
  renderLocalApp,
  renderMainApp,
  signIn,
  synchronizeDataWithAccount,
  goToAccountPage,
  deleteUser,
  logout,
} from "./controllers";
router
  .get("/", authMiddleware, (_, res) => {
    res.redirect("/main-app");
  })
  .get("/login", (req: any, res) => {
    if (req.userId) {
      res.redirect("/main-app");
    }
    res.render("login", { headerTitle: "Login" });
  })
  .get("/register", (req, res) => {
    const attempt: registerAttempt =
      (req.query as { attempt: "again" }).attempt || "normal";
    res.render("register", { attempt, headerTitle: "Register" });
  })
  .get("/users/:user", goToAccountPage)
  .put("/users/:user", synchronizeDataWithAccount)
  .get("/local-app", renderLocalApp)
  .get("/main-app", authMiddleware, renderMainApp)
  .post("/login", signIn)
  .post("/users", createUser)
  .delete("/users/:user", deleteUser)
  .get("/logout", logout);
export default router;
