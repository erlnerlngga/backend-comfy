import { Express } from "express-serve-static-core";
import { UserType } from "./src/models/authModels";

declare module "express-serve-static-core" {
  //  will add object user in request
  // req.user will be type UserType
  interface Request {
    user: UserType;
  }
}
