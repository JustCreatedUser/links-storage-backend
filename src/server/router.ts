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
  .get("/sign-in", (req: any, res) => {
    if (req.userId) {
      res.redirect("/main-app");
    }
    if (req.params.status == "again") {
    }
    res.render("sign-in");
  })
  .get("/register", (req, res) => {
    const attempt: registerAttempt =
      (req.query as { attempt: "again" }).attempt || "normal";
    res.render("register", { attempt });
  })
  .get("/users/:user", goToAccountPage)
  .put("/users/:user", synchronizeDataWithAccount)
  .get("/local-app", renderLocalApp)
  .get("/main-app", authMiddleware, renderMainApp)
  .post("/sign-in", signIn)
  .post("/users", createUser)
  .delete("/users/:user", deleteUser)
  .get("/logout", logout);
export default router;
