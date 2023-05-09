import { Router } from "express";
import {
  getAllProducts,
  getProduct,
  getAllProductCategory,
  getAllProductCompany,
} from "../controllers/productController";

const router = Router();

router.route("/").get(getAllProducts);
router.route("/category").get(getAllProductCategory);
router.route("/company").get(getAllProductCompany);

router.route("/:id").get(getProduct);

export default router;
