import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

// Generate 10,000+ mock orders
const statuses = ['Pending', 'Processing', 'Packed', 'Shipped', 'Delivered', 'Held', 'Cancelled'];
let orders = Array.from({ length: 10500 }).map((_, i) => ({
  id: `ORD-${String(i + 1).padStart(6, '0')}`,
  customer: `Customer ${i + 1}`,
  status: statuses[Math.floor(Math.random() * statuses.length)],
  items: Math.floor(Math.random() * 10) + 1,
  total: (Math.random() * 500 + 20).toFixed(2),
  createdAt: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
}));

app.get('/api/orders', (req, res) => {
  res.json({ orders });
});

app.post('/api/orders/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const order = orders.find((o) => o.id === id);
  
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  // Simulate business rule failure randomly (10% chance)
  if (Math.random() < 0.1) {
    return res.status(400).json({ error: 'Business rule conflict: Status change not allowed at this time' });
  }

  order.status = status;
  res.json(order);
});

// SSE endpoint for live updates
app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Send initial connected event
  res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

  const interval = setInterval(() => {
    // Randomly update 1-5 orders every second
    const updatesCount = Math.floor(Math.random() * 5) + 1;
    const updates = [];

    for (let i = 0; i < updatesCount; i++) {
      const randomIndex = Math.floor(Math.random() * orders.length);
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      orders[randomIndex].status = randomStatus;
      updates.push(orders[randomIndex]);
    }

    res.write(`data: ${JSON.stringify({ type: 'update', payload: updates })}\n\n`);
  }, 1000);

  req.on('close', () => {
    clearInterval(interval);
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
