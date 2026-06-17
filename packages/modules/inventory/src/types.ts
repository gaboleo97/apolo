import type { z } from "zod";

export const CreateProductSchema = z.object({
  name: z.string().min(1),
  categoryId: z.string().uuid().optional(),
  price: z.number().positive(),
  cost: z.number().optional(),
  taxRate: z.number().default(21),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  unitType: z.enum(["unit", "kg", "lt", "m", "box", "pack"]).default("unit"),
  minStock: z.number().int().default(0),
  description: z.string().optional(),
});

export type CreateProductInput = z.infer<typeof CreateProductSchema>;

export const UpdateStockSchema = z.object({
  productId: z.string().uuid(),
  type: z.enum(["in", "out", "adjustment"]),
  quantity: z.number().int().positive(),
  notes: z.string().optional(),
});

export type UpdateStockInput = z.infer<typeof UpdateStockSchema>;
