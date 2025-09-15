// In-memory data store for mock mode (no MongoDB)
// NOTE: Resets on server restart; only for demo purposes.

export const mockStore = {
  orders: [],
};

export const addMockOrder = (order) => {
  mockStore.orders.unshift(order); // newest first
  return order;
};

export const listMockOrdersByUser = (userId) => {
  return mockStore.orders.filter(o => o.user === userId);
};

export const getMockOrder = (id) => {
  return mockStore.orders.find(o => o._id === id);
};
