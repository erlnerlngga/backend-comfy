import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

import { db } from "../utils/db.server";
import jwt from "jsonwebtoken";
import catchAsync from "../utils/catchAsync";
import AppError from "../utils/appError";
import * as authModels from "../models/authModels";
import sendEmail from "../utils/email";

const signToken = (id: string, email: string) => {
  return jwt.sign({ id, email }, `${process.env.JWT_SECRET}`, {
    expiresIn: "24h",
  });
};

const resetPasswordToken = (id: string, email: string) => {
  return jwt.sign({ id, email }, `${process.env.JWT_RESET_PASSWORD}`, {
    expiresIn: 60 * 15,
  });
};

export const register = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const {
      first_name,
      last_name,
      city,
      email,
      password,
      image = "",
      password_reset_expires = 0,
      password_reset_token = "",
    } = req.body;

    // check email
    const checkEmail = await db.user.findUnique({
      where: {
        email,
      },
    });

    if (checkEmail) {
      return next(new AppError("Email already exist", 400));
    }

    // check validation
    const valid = authModels.validatorRegister({
      first_name,
      last_name,
      city,
      email,
      password,
      image,
      password_reset_expires,
      password_reset_token,
    });

    if (valid.length) {
      return next(new AppError(`${valid[0]}`, 400));
    }

    // if everything is okay make create a user
    const newUser = await authModels.createUser({
      first_name,
      last_name,
      city,
      email,
      password,
      image,
      password_reset_expires,
      password_reset_token,
    });

    res.status(201).json({
      status: "success",
      data: {
        user: newUser,
      },
    });
  }
);

export const login = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password: passwordLogin } = req.body;

    if (!email || !passwordLogin) {
      return next(new AppError(`Please provide a email or password`, 400));
    }

    const user = await db.user.findUnique({
      where: {
        email,
      },
    });

    if (
      !user ||
      !(await authModels.correctPassword(passwordLogin, user.password))
    ) {
      return next(new AppError("Incoreect username or password", 401));
    }

    // create token
    const token = signToken(user.id, user.email);

    const cookieOptions = {
      expires: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      httpOnly: true,
    };

    // if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

    res.cookie("jwt", token, cookieOptions);

    res.status(201).json({
      status: "succes",
      data: {
        email: user.email,
      },
    });
  }
);

// Logout
export const logout = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    res.clearCookie("jwt");

    res.status(200).json({
      status: "success",
    });
  }
);

// PROTECT
export const protect = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // 1. get the token
    let token;

    if (req.cookies) {
      token = req.cookies.jwt;
    }

    // 2. verify the token is valid or not
    // will return object with id, expire date, iat (issued at time)
    interface jwtReturn {
      id: string;
      email: string;
      iat: number;
      exp: number;
    }

    const decoded = jwt.verify(token, `${process.env.JWT_SECRET}`) as jwtReturn;

    // 3. Check if user still exist
    const currentUser = await db.user.findUnique({
      where: {
        email: decoded.email,
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        city: true,
        email: true,
        password: true,
        image: true,
        password_reset_expires: true,
        password_reset_token: true,
      },
    });

    if (!currentUser) {
      return next(
        new AppError(
          "The User belonging to this token does no longer exist",
          401
        )
      );
    }

    req.user = currentUser;
    next();
  }
);

/////////////////////////////////
// FORGET PASSWORD

export const forgotPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;
    const { resetToken, user } = await authModels.createPasswordResetToken(
      email
    );

    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "email isn't exist.",
      });
    }

    // Send URL
    const resetURL = `${req.protocol}://${req.get("host")}/user/reset-password`;

    const message = `Forgot your password? Click button below to create new password. If not just ignore it!`;

    try {
      await sendEmail({
        email,
        subject: `Your password reset token (valid for 10 min)`,
        message,
        name: `${user.first_name} ${user.last_name}`,
        // resetURL: `${resetURL}/${resetToken}`,
        resetURL: `http://localhost:3000/${resetToken}`,
      });

      // create token
      const token = resetPasswordToken(user.id, user.email);

      const cookieOptions = {
        expires: new Date(Date.now() + 60 * 15 * 1000),
        httpOnly: true,
      };

      // if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

      res.cookie("reset-password", token, cookieOptions);

      res.status(200).json({
        status: "success",
        data: {
          url: resetURL,
        },
      });
    } catch (error) {
      return next(
        new AppError(
          "There was an error sending the email. Try again later",
          500
        )
      );
    }
  }
);

//////////////////////////////
// RESET PASSWORD

export const resetPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { token } = req.params;
    const { password } = req.body;

    // 1) Get user based on the token
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // find is the token valid or not
    const user = await db.user.findFirst({
      where: {
        AND: [
          {
            password_reset_token: {
              equals: hashedToken,
            },
          },
          {
            password_reset_expires: {
              gt: Date.now(),
            },
          },
        ],
      },
    });

    if (!user) {
      return next(new AppError("Token is invalid or has expired", 400));
    }

    await db.user.update({
      where: {
        id: user.id,
      },
      data: {
        password,
        password_reset_expires: 0,
        password_reset_token: "",
      },
    });

    res.clearCookie("reset-password");

    res.status(200).json({
      status: "success",
    });
  }
);

///////////////////////////////////
//////////////// ABOUT USER

// Get User data
export const getUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.user.id;

    const user = await authModels.getUser(id);

    if (!user) {
      return next(new AppError("Couldn't find the user", 501));
    }

    res.status(200).json({
      status: "success",
      data: {
        user,
      },
    });
  }
);

// UPDATE  USER DATA
export const updateUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { first_name, last_name, city, image } = req.body;
    const id = req.user.id;

    if (!id || !req.body) {
      return next(new AppError("Invalid ID or body", 501));
    }

    const newUpdate = await authModels.updateUser({
      id,
      first_name,
      last_name,
      city,
      image,
    });

    if (!newUpdate) {
      return next(new AppError("No user find with that ID", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        user: newUpdate,
      },
    });
  }
);

// update Password
export const updatePassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { passwordCurrent, NewPassword } = req.body;
    const { id } = req.user;

    const user = await db.user.findUnique({
      where: {
        id,
      },
      select: {
        password: true,
      },
    });

    if (
      user &&
      !(await authModels.correctPassword(passwordCurrent, user.password))
    ) {
      return next(new AppError("Your current password is wrong", 401));
    }

    await db.user.update({
      where: {
        id,
      },
      data: {
        password: NewPassword,
      },
    });

    res.status(200).json({
      status: "success",
    });
  }
);
