import { z } from "zod";

const nullableString = z.preprocess(
  (val) => (val === null || val === "" ? undefined : val),
  z.string().optional(),
);

const nullableNumber = z.preprocess(
  (val) => (val === null || val === "" ? undefined : val),
  z.number().optional(),
);

const nullableNumberDefault = (defaultValue: number) =>
  z.preprocess(
    (val) => (val === null || val === "" ? undefined : val),
    z.number().default(defaultValue),
  );

export const orderItemSchema = z.object({
  product: z.number(),
  quantity: z.number().min(1),
  price: z.number().min(0),
  total: nullableNumber,
  size: nullableString,
  refModel: z.enum(["Product", "Scrap"]).default("Product"),
});

export const orderWeightItemSchema = z.object({
  weightProduct: z.number(),
  weight: z.number().positive(),
  pricePerKg: z.number().min(0),
  total: nullableNumber,
});

export const createOrderSchema = z
  .object({
    customer: z.preprocess(
      (val) => (val === null || val === "" ? undefined : val),
      z
        .union([
          z.number(),
          z.object({
            name: z.string().min(2, "Name must be at least 2 characters"),
            phone: z.string().min(10, "Invalid phone number"),
            location: z.preprocess(
              (val) => (val === null || val === "" ? undefined : val),
              z.string().optional(),
            ),
            dateOfBirth: z.preprocess(
              (val) => (val === null || val === "" ? undefined : val),
              z.string().optional(),
            ),
          }),
        ])
        .optional(),
    ),
    supplier: nullableNumber,
    items: z.preprocess(
      (val) => (val === null ? [] : val),
      z.array(orderItemSchema).default([]),
    ),
    weightItems: z.preprocess(
      (val) => (val === null ? [] : val),
      z.array(orderWeightItemSchema).default([]),
    ),
    discount: z.preprocess(
      (val) => (val === null ? undefined : val),
      z
        .object({
          type: z.enum(["fixed", "percentage"]).default("fixed"),
          value: nullableNumberDefault(0),
          amount: nullableNumber,
        })
        .optional(),
    ),
    shipping: nullableNumberDefault(0),
    status: z.enum(["pending", "completed", "cancelled"]).default("pending"),
    order_type: z.enum(["regular", "weight"]).default("regular"),
    paymentMethod: nullableString,
    notes: nullableString,
    priceDiff: nullableNumberDefault(0),
    orderNumber: nullableString,
    total: z.number(),
    subtotal: nullableNumber,
  })
  .refine(
    (data) => {
      if (data.order_type === "regular") return data.items.length > 0;
      if (data.order_type === "weight") return data.weightItems.length > 0;
      return false;
    },
    {
      message: "Order must include items for the selected type",
      path: ["order_type"],
    },
  );

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
