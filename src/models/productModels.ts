import { db } from "../utils/db.server";

interface ProductType {
  id: string;
  name: string;
  description: string;
  stock: number;
  price: number;
  shipping: boolean;
  review: number;
  star: number;
  category: string;
  color: string[];
  image: string[];
  company: string;
}

export interface SearchParamsType {
  name?: string;
  category?: string;
  company?: string;
  minPrice?: string;
  maxPrice?: string;
  freeShipping?: string;
  color?: string;
}

const getCompany = async (companyName: string) => {
  let comp = await db.company.findFirst({
    where: {
      name: {
        equals: companyName,
      },
    },
  });

  return comp;
};

const getCategory = async (categoryName: string) => {
  let cat = await db.category.findFirst({
    where: {
      name: {
        equals: categoryName,
      },
    },
  });

  return cat;
};

export const createProduct = async (prod: Omit<ProductType, "id">) => {
  const com = getCompany(prod.company);
  const cat = getCategory(prod.category);

  const [companyID, categoryID] = await Promise.all([com, cat]);

  if (!companyID || !categoryID) {
    return new Error();
  }

  return db.product.create({
    data: {
      name: prod.name,
      description: prod.description,
      stock: prod.stock,
      price: prod.price,
      shipping: prod.shipping,
      review: prod.review,
      star: prod.star,
      category_id: categoryID.id,
      company_id: companyID.id,
      colors: {
        create: prod.color.map((color) => {
          return { name: color };
        }),
      },
      images: {
        create: prod.image.map((image) => {
          return { url: image };
        }),
      },
    },
  });
};

export const getAllProductCategory = async () => {
  return db.category.findMany({
    select: {
      id: true,
      name: true,
    },
  });
};

export const getAllProductCompany = async () => {
  return db.company.findMany({
    select: {
      id: true,
      name: true,
    },
  });
};

export const getAllProducts = async (query: SearchParamsType) => {
  const minprice = query.minPrice ? parseFloat(query.minPrice) : undefined;
  const maxprice = query.maxPrice ? parseFloat(query.maxPrice) : undefined;
  const freeship = !query.freeShipping
    ? undefined
    : query.freeShipping.toLowerCase() === "true"
    ? true
    : false;

  return db.product.findMany({
    where: {
      name: {
        contains: query.name,
      },
      category: {
        name: {
          equals: query?.category,
        },
      },
      company: {
        name: {
          equals: query?.company,
        },
      },
      shipping: {
        equals: freeship,
      },
      colors: {
        every: {
          name: query.color ? `#${query.color}` : undefined,
        },
      },
      AND: [
        {
          price: {
            gte: minprice,
          },
        },
        {
          price: {
            lte: maxprice,
          },
        },
      ],
    },
    select: {
      id: true,
      name: true,
      price: true,
      images: true,
      colors: true,
      company: { select: { name: true } },
      description: true,
      category: { select: { name: true } },
      shipping: true,
    },
  });
};

export const getProduct = async (id: string) => {
  return db.product.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      name: true,
      description: true,
      stock: true, // check
      price: true,
      shipping: true,
      review: true, // check
      star: true, // check
      category: { select: { name: true } },
      colors: true,
      images: true,
      company: { select: { name: true } },
    },
  });
};

export const updateProduct = async (id: string, body: {}) => {
  return db.product.update({
    where: {
      id,
    },
    data: body,
  });
};

export const deleteProduct = async (id: string) => {
  return db.product.delete({
    where: {
      id,
    },
  });
};
