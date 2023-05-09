import { db } from "../utils/db.server";
import dat2 from "./data";
import { Request, Response, NextFunction } from "express";

async function seed(req: Request, res: Response, next: NextFunction) {
  // const categories = [...new Set(data.map((item) => item.category))];
  // const companies = [...new Set(data.map((item) => item.company))];

  // await db.category.createMany({
  //   data: categories.map((item) => {
  //     return { name: item };
  //   }),
  // });

  // await db.company.createMany({
  //   data: companies.map((item) => {
  //     return { name: item };
  //   }),
  // });

  const cat = await db.category.findMany();
  const com = await db.company.findMany();

  // console.log(cat);
  // console.log(com);

  await Promise.all(
    dat2.map((item) => {
      return db.product.create({
        data: {
          name: item.name,
          description: item.description,
          stock: item.stock,
          price: item.price,
          shipping: item.shipping ? true : false,
          review: item.reviews,
          star: item.stars,
          category_id: cat.find((c) => c.name === item.category)?.id || "1",
          company_id: com.find((c) => c.name === item.company)?.id || "1",
          colors: {
            create: item.colors.map((color) => {
              return { name: color };
            }),
          },
          images: {
            create: item.images.map((image) => {
              return { url: image };
            }),
          },
        },
      });
    })
  );

  await res.status(200).json({ name: "hello" });
}

export default seed;
