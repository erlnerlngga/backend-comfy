import { db } from "../utils/db.server";
import bcrypt from "bcrypt";
import validator from "validator";
import crypto from "crypto";

export interface UserType {
  id: string;
  first_name: string;
  last_name: string;
  city: string;
  email: string;
  password: string;
  image: string;
  password_reset_expires: number;
  password_reset_token: string;
}

db.$use(async (params, next) => {
  if (params.model === "User" && params.action === "create") {
    params.args.data.password = await bcrypt.hash(
      params.args.data.password,
      12
    );
  }

  return next(params);
});

// validator for register
export const validatorRegister = (user: Omit<UserType, "id">) => {
  const { first_name, last_name, city, email, password } = user;
  const errors: string[] = [];

  const validatorSchema = [
    {
      valid: validator.isLength(first_name, {
        min: 1,
        max: 20,
      }),
      errorMessage: "First name is invalid",
    },
    {
      valid: validator.isLength(last_name, {
        min: 1,
        max: 20,
      }),
      errorMessage: "Last name is invalid",
    },
    {
      valid: validator.isEmail(email),
      errorMessage: "Email is Invalid",
    },
    {
      valid: validator.isLength(city, { min: 1 }),
      errorMessage: "City is invalid",
    },
    {
      valid: validator.isStrongPassword(password),
      errorMessage: "Password is not strong enough",
    },
  ];

  validatorSchema.forEach((check) => {
    if (!check.valid) {
      errors.push(check.errorMessage);
    }
  });

  return errors;
};

// for login purpose
export const correctPassword = async (
  passwordLogin: string,
  passwordDB: string
) => {
  return await bcrypt.compare(passwordLogin, passwordDB);
};

export const createUser = async (user: Omit<UserType, "id">) => {
  const {
    first_name,
    last_name,
    city,
    email,
    password,
    image,
    password_reset_expires,
    password_reset_token,
  } = user;

  return db.user.create({
    data: {
      first_name,
      last_name,
      city,
      email,
      password,
      image,
      password_reset_expires,
      password_reset_token,
    },
    select: {
      id: true,
      email: true,
    },
  });
};

////////////////////////
// reset password token

export const createPasswordResetToken = async (email: string) => {
  const resetToken = crypto.randomBytes(32).toString("hex");
  const hashToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  const user = await db.user.update({
    where: {
      email,
    },
    data: {
      password_reset_expires: Date.now() + 10 * 60 * 1000,
      password_reset_token: hashToken,
    },
    select: {
      first_name: true,
      last_name: true,
      id: true,
      email: true,
    },
  });

  return { resetToken, user };
};

////////////////
///// about user

export const getUser = async (id: string) => {
  return db.user.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      first_name: true,
      last_name: true,
      city: true,
      email: true,
      image: true,
    },
  });
};

// update user data
interface DataUpdateType {
  id: string;
  first_name: string;
  last_name: string;
  city: string;
  image: string;
}

export const updateUser = async (user: DataUpdateType) => {
  const { id, first_name, last_name, city, image } = user;

  return db.user.update({
    where: {
      id,
    },
    data: {
      first_name,
      last_name,
      city,
      image,
    },
  });
};
