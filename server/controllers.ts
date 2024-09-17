import bcrypt from "bcrypt";
import USER_SCHEMA from "./User-model";
import jsonwebtoken from "jsonwebtoken";
import { deleteData } from "../client/ts/connect-db";
type renderedApp = "local" | "synchronized";
export function authMiddleware(req: any, res: any, next: any) {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).redirect("/login");
  }
  try {
    const decoded = jsonwebtoken.verify(token, process.env.JWT_SECRET!);
    req.userId = (decoded as { userId: string }).userId;
    next();
  } catch (error: any) {
    res.redirect("/login");
  }
}
export async function createUser(req: any, res: any) {
  console.log("post createUser");
  try {
    const { username, password } = req.body,
      hashedPassword = bcrypt.hashSync(password, bcrypt.genSaltSync(10)),
      userRegisteredInDB = await USER_SCHEMA.findOne({
        username: username,
      });
    if (userRegisteredInDB) {
      res.status(409).redirect("/register/?attempt=again");
    }
    const newUser = new USER_SCHEMA({
      username,
      password: hashedPassword,
    });
    const token = jsonwebtoken.sign(
      { userId: newUser._id },
      process.env.JWT_SECRET!
    );
    res.cookie("token", token, { httpOnly: true });
    await newUser.save();
    res.status(200).redirect(`/main-app`);
  } catch (error: any) {
    console.log("!createUser ERROR! - " + error.message);
  }
}
export function renderLocalApp(_: any, res: any) {
  const app: renderedApp = "local";
  res.render("app", {
    app,
    headerTitle: "Local app",
    metaPageDescription:
      "This is the local version of this app. It gives you same opportunities as the main one, however you can't access your data on other device",
  });
}
export async function renderMainApp(req: any, res: any) {
  const app: renderedApp = "synchronized";
  console.log("entry /main-app");
  try {
    const userId: string = req.userId,
      user = await USER_SCHEMA.findById(userId),
      username = (() => {
        if (user) return user.username;
        else {
          throw new Error("NO USER");
        }
      })(),
      linkStorage = JSON.stringify(user.linkStorage),
      groupStorage = JSON.stringify(user.groupStorage);
    res.render("app", {
      app,
      username,
      linkStorage,
      groupStorage,
      userId,
      headerTitle: "Main app",
      metaPageDescription:
        "This is the main version of this app. Everything here is available: your links are stored properly and securely, you can access the data with account synchronization and it's just a better choice!",
    });
  } catch (error: any) {
    console.log("!Main-page ERROR! - " + error);
    res.status(401).redirect("/login");
  }
}
export async function signIn(req: any, res: any) {
  console.log("post /signIn");
  try {
    const { password, username } = req.body;
    const user = await USER_SCHEMA.findOne({ username: username });
    if (!user) return res.status(401).redirect("/login?status=again");
    const isValidPassword = bcrypt.compareSync(password, user.password);
    if (!isValidPassword) return res.status(401).redirect("/login");
    const token = jsonwebtoken.sign(
      { userId: user._id },
      process.env.JWT_SECRET!
    );
    res.cookie("token", token, { httpOnly: true });
    res.redirect("/main-app");
  } catch (error) {
    console.log("!Post singIn ERROR! - " + error);
  }
}
export async function goToAccountPage(req: any, res: any) {
  console.log("entry /users/:user");
  try {
    const userId = req.params.user;
    const user = await USER_SCHEMA.findById(userId),
      username = (() => {
        if (user) return user.username;
        else {
          throw new Error("NO USER");
        }
      })();
    res.render("account", {
      userId,
      headerTitle: "Account - " + username,
      metaPageDescription:
        "This is your account's page. Here you can configure your user's params",
    });
  } catch (error: any) {
    console.log("!Account-controller error! - " + error.message);
  }
}
export async function deleteUser(req: any, res: any) {
  try {
    const userId = req.params.user;
    await USER_SCHEMA.findByIdAndDelete(userId);
    res.status(200).redirect("/login");
  } catch (error: any) {
    console.log(error.message);
  }
}
export function logout(_: any, res: any) {
  try {
    res.clearCookie("token");
    res.redirect("/login");
  } catch (error: any) {
    console.log(error.message);
  }
}
export async function getAccountDb(req: any, res: any) {
  try {
    const userId = req.params.user as string;
    const userInDB = await USER_SCHEMA.findById(userId);
    console.log("Getting data");

    if (!userInDB) {
      console.log("NO USER");

      throw new Error("!ERROR! - USER not found");
    }
    res.status(200).json({
      linkStorage: userInDB.linkStorage,
      groupStorage: userInDB.groupStorage,
    });
  } catch (error: any) {
    console.log(error.message);
  }
}
export async function updateAccountDb(req: any, res: any) {
  try {
    const userId = req.params.user as string;
    const userInDB = await USER_SCHEMA.findById(userId);
    if (!userInDB) {
      res.status(400).send("!ERROR! - No such user in db");
      return;
    }
    const sentData = req.body;
    userInDB.linkStorage.find((link) => {
      if (link.description === sentData.previousLink.description) {
        for (const data in sentData.currentLink) {
          link[data] = sentData.currentLink[data];
        }
      }
    });

    if (sentData.linkStorage) userInDB.linkStorage = sentData.linkStorage;

    if (sentData.groupStorage) userInDB.groupStorage = sentData.groupStorage;

    await userInDB.save();
    res.status(200).send("saved");
  } catch (error: any) {
    console.log(error.message);
  }
}
export async function isPersonVerifiedForRequest(
  req: any,
  res: any,
  next: () => void
) {
  try {
    const decoded = jsonwebtoken.verify(
      req.cookies.token,
      process.env.JWT_SECRET!
    );
    if (!decoded || (decoded as any).userId !== req.params.user) {
      res.status(400).send("!ERROR! - no JWT for USER");
      return;
    }
    next();
  } catch (error) {
    console.error(error.message);
  }
}
export async function createNewData(req: any, res: any) {
  try {
    const newData = req.body;
    if (!newData.type) {
      res.status(400).send("!ERROR! - no data type specified");
      return;
    }
    if (newData.type === "link") {
    }
  } catch {}
}
export async function deleteSomethingFromDb(req: any, res: any) {
  try {
    const userId = req.params.user as string;
    const userInDB = await USER_SCHEMA.findById(userId);
    if (!userInDB) {
      res.status(400).send("!ERROR! - No such user in db");
      return;
    }
    const dataToDelete: deleteData = req.body;
    switch (dataToDelete.type) {
      case "link":
        const neededLinkIndex = userInDB.linkStorage.findIndex(
          (link) => link.description === dataToDelete.currentItem
        );
        userInDB.linkStorage.splice(neededLinkIndex, 1);
        break;
      case "group":
        const neededGroupIndex = userInDB.groupStorage.findIndex(
          (group) => group === dataToDelete.currentItem
        );
        userInDB.groupStorage.splice(neededGroupIndex, 1);
        break;
      default:
        res.status(400).send("!ERROR! - no such type");
        return;
    }

    await userInDB.save();
    res.status(200).send("saved");
  } catch (error) {
    console.error("!DELETE ERROR! " + error.message);
  }
}
// export async function insertReadyData(req:any,res:any){
//   try{

// }
