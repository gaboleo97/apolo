import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@apolo/core";
import { products, categories, stockMovements } from "./schema";
import { eq, like, and, desc, sql } from "drizzle-orm";
import type { DB } from "@apolo/database";

export function createInventoryRouter(db: DB) {
  return createTRPCRouter({
    listProducts: protectedProcedure
      .input(z.object({
        search: z.string().optional(),
        categoryId: z.string().uuid().optional(),
        page: z.number().default(1),
        limit: z.number().default(20),
      }))
      .query(async ({ ctx, input }) => {
        return db.query.products.findMany({
          where: and(
            input.search ? like(products.name, `%${input.search}%`) : undefined,
            input.categoryId ? eq(products.categoryId, input.categoryId) : undefined,
          ),
          limit: input.limit,
          offset: (input.page - 1) * input.limit,
          orderBy: desc(products.createdAt),
        });
      }),

    getProduct: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .query(async ({ input }) => {
        return db.query.products.findFirst({
          where: eq(products.id, input.id),
          with: { category: true },
        });
      }),

    createProduct: protectedProcedure
      .input(z.object({
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
      }))
      .mutation(async ({ ctx, input }) => {
        return db.insert(products).values({
          ...input,
          tenantId: ctx.session.tenantId,
        }).returning();
      }),

    adjustStock: protectedProcedure
      .input(z.object({
        productId: z.string().uuid(),
        type: z.enum(["in", "out", "adjustment"]),
        quantity: z.number().int().positive(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const sign = input.type === "out" ? -1 : 1;
        return db.transaction(async (tx) => {
          await tx.update(products)
            .set({ currentStock: sql`current_stock + ${sign * input.quantity}` })
            .where(eq(products.id, input.productId));

          await tx.insert(stockMovements).values({
            productId: input.productId,
            userId: ctx.session.userId,
            type: input.type,
            quantity: input.quantity,
            notes: input.notes,
            tenantId: ctx.session.tenantId,
          });
        });
      }),

    listCategories: protectedProcedure.query(async () => {
      return db.query.categories.findMany({
        where: eq(categories.isActive, true),
        orderBy: desc(categories.createdAt),
      });
    }),

    createCategory: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        parentId: z.string().uuid().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const slug = input.name.toLowerCase().replace(/\s+/g, "-");
        return db.insert(categories).values({
          ...input,
          slug,
          tenantId: ctx.session.tenantId,
        }).returning();
      }),
  });
}
