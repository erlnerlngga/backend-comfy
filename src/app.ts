import express, { Application, Request, Response, NextFunction } from "express";
import morgan from "morgan";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";

import AppError from "./utils/appError";
import globalErrorHandler from "./controllers/errorController";
import authRoutes from "./routes/authRoutes";
import productRoutes from "./routes/productRoutes";
// import seed from "./data/seed";

const app: Application = express();

app.use(morgan("dev"));
app.use(helmet());
app.disable("x-powered-by");

app.use(
  cors({
    origin: "http://127.0.0.1:3000",
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use("/user", authRoutes);
app.use("/product", productRoutes);

app.all("*", (req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);

export default app;
