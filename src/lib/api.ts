import { z } from 'zod';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

// ── Zod Schemas (runtime validation at the API boundary) ──────────────────────
export const OrderStatusSchema = z.enum([
  'Pending', 'Processing', 'Packed', 'Shipped', 'Delivered', 'Held', 'Cancelled',
]);

export const OrderSchema = z.object({
  id: z.string(),
  customer: z.string(),
  status: OrderStatusSchema,
  items: z.number(),
  total: z.string(),
  createdAt: z.string(),
});

export const OrdersResponseSchema = z.object({
  orders: z.array(OrderSchema),
});

export const SSEConnectedEventSchema = z.object({
  type: z.literal('connected'),
});

export const SSEUpdateEventSchema = z.object({
  type: z.literal('update'),
  payload: z.array(OrderSchema),
});

export const SSEEventSchema = z.discriminatedUnion('type', [
  SSEConnectedEventSchema,
  SSEUpdateEventSchema,
]);

// ── Inferred TypeScript types ─────────────────────────────────────────────────
export type Order = z.infer<typeof OrderSchema>;
export type OrderStatus = z.infer<typeof OrderStatusSchema>;
export type SSEEvent = z.infer<typeof SSEEventSchema>;

// ── Typed API Layer ───────────────────────────────────────────────────────────
export class ApiError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

async function handleResponse<T>(res: Response, schema: z.ZodType<T>): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new ApiError(body.error ?? 'Request failed', res.status);
  }
  const data = await res.json();
  return schema.parse(data);
}

export const api = {
  getOrders: async (): Promise<Order[]> => {
    const res = await fetch(`${API_BASE}/api/orders`);
    const validated = await handleResponse(res, OrdersResponseSchema);
    return validated.orders;
  },

  updateOrderStatus: async (id: string, status: OrderStatus): Promise<Order> => {
    const res = await fetch(`${API_BASE}/api/orders/${id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    return handleResponse(res, OrderSchema);
  },
};
