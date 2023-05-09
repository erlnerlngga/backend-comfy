import { Request, Response, NextFunction } from "express";

import * as productModels from "../models/productModels";
import catchAsync from "../utils/catchAsync";
import AppError from "../utils/appError";
import { SearchParamsType } from "../models/productModels";

export const getAllProducts = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const query = req.query as SearchParamsType;

    const product = await productModels.getAllProducts(query);

    if (!product) {
      return next(new AppError("No Product is Found", 404));
    }

    console.log(req.query);

    res.status(200).json({
      status: "success",
      data: {
        product,
      },
    });
  }
);

export const getAllProductCategory = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const category = await productModels.getAllProductCategory();

    if (!category) {
      return next(new AppError("No Product is Found", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        category,
      },
    });
  }
);

export const getAllProductCompany = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const company = await productModels.getAllProductCompany();

    if (!company) {
      return next(new AppError("No Company is Found", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        company,
      },
    });
  }
);

export const getProduct = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const product = await productModels.getProduct(id);

    if (!product) {
      return next(new AppError("No Product is Found with that ID", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        product,
      },
    });
  }
);

// export const createProduct = catchAsync(
//   async (req: Request, res: Response, next: NextFunction) => {
//     //
//   }
// );
