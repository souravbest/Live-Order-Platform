import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type Order, type OrderStatus } from '../../lib/api';

export function useOrderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      api.updateOrderStatus(id, status),

    // ── Optimistic Update ─────────────────────────────────────────────────────
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['orders'] });

      const previousOrders = queryClient.getQueryData<Order[]>(['orders']);

      queryClient.setQueryData(['orders'], (old: Order[] | undefined) =>
        old?.map((o) => (o.id === id ? { ...o, status } : o))
      );

      return { previousOrders };
    },

    // ── On Error: roll back and return error message ───────────────────────────
    onError: (_err, _vars, context) => {
      if (context?.previousOrders) {
        queryClient.setQueryData(['orders'], context.previousOrders);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
