import { Router } from "express";
import {
  register,
  login,
  logout,
  protect,
  updateUser,
  getUser,
  forgotPassword,
  resetPassword,
  updatePassword,
} from "../controllers/authController";

const router = Router();

router.route("/register").post(register);
router.route("/login").post(login);
router.route("/forgot-password").post(forgotPassword);
router.route("/reset-password/:token").post(resetPassword);

router.route("/me").get(protect, getUser);
router.route("/logout").get(logout);

router.route("/update-user").patch(protect, updateUser);
router.route("/update-password").patch(protect, updatePassword);

export default router;
