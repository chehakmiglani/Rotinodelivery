import { z } from 'zod';

export const createOrderSchema = z.object({
  restaurant: z.string().min(1, 'Restaurant ID is required'),
  items: z.array(z.object({
    menuItem: z.string().min(1, 'Menu item ID is required'),
    quantity: z.number().min(1, 'Quantity must be at least 1'),
    customizations: z.array(z.object({
      name: z.string(),
      selectedOptions: z.array(z.object({
        name: z.string(),
        price: z.number().min(0)
      }))
    })).optional(),
    specialInstructions: z.string().optional()
  })).min(1, 'At least one item is required'),
  deliveryAddress: z.object({
    street: z.string().min(1, 'Street address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    pincode: z.string().regex(/^[0-9]{6}$/, 'Please enter a valid 6-digit pincode'),
    landmark: z.string().optional()
  }),
  contactInfo: z.object({
    phone: z.string().regex(/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number'),
    name: z.string().min(1, 'Contact name is required')
  }),
  specialInstructions: z.string().optional(),
  couponCode: z.string().optional()
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    'confirmed',
    'preparing',
    'ready_for_pickup',
    'out_for_delivery',
    'delivered',
    'cancelled'
  ]),
  description: z.string().optional()
});

export const rateOrderSchema = z.object({
  food: z.number().min(1).max(5),
  delivery: z.number().min(1).max(5),
  overall: z.number().min(1).max(5),
  review: z.string().optional()
});
