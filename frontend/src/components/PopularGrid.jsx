import React from "react";
import { useCart } from "../context/CartContext";

const curated = [
  { id: "pop_1", name: "Margherita Pizza", restaurant: { _id: "r1", name: "Pizzeria A" }, price: 19900, image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=900&auto=format&fit=crop" },
  { id: "pop_2", name: "Cheeseburger", restaurant: { _id: "r2", name: "Burger Joint" }, price: 14900, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=900&auto=format&fit=crop" },
  { id: "pop_3", name: "Chicken Tikka Masala", restaurant: { _id: "r3", name: "Spice House" }, price: 24900, image: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=900&auto=format&fit=crop" },
  { id: "pop_4", name: "Paneer Butter Masala", restaurant: { _id: "r4", name: "Curry Palace" }, price: 22900, image: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=900&auto=format&fit=crop" },
  // Replace Chow Mein image with a cleaner landscape shot
  { id: "pop_5", name: "Chow Mein", restaurant: { _id: "r5", name: "Dragon Wok" }, price: 17900, image: "https://images.unsplash.com/photo-1585032226651-759b35686dda?w=1200&auto=format&fit=crop" },
  { id: "pop_6", name: "Chocolate Cake", restaurant: { _id: "r6", name: "Sweet Treats" }, price: 12900, image: "https://images.pexels.com/photos/533325/pexels-photo-533325.jpeg?auto=compress&cs=tinysrgb&w=1200&h=900&dpr=1" },
];

const placeholder = "https://placehold.co/800x600?text=Food";
const formatINR = (p) => `₹${Math.round(p / 100)}`;

export default function PopularGrid() {
  const { addItem } = useCart();

  const toCart = (item) => ({
    _id: item.id,
    name: item.name,
    price: item.price,
    image: item.image,
    restaurant: {
      _id: item.restaurant._id,
      name: item.restaurant.name,
      image: item.image,
      deliveryTime: { min: 20, max: 35 },
      deliveryFee: 1000,
      minimumOrder: 19900,
    },
    quantity: 1,
  });

  return (
    <section aria-labelledby="popular-heading" className="w-full mx-auto max-w-7xl px-4">
      <div className="mb-4 flex items-end justify-between">
        <h2 id="popular-heading" className="text-2xl font-bold tracking-tight text-slate-900">
          Popular Dishes
        </h2>
        <a href="#" className="text-sm font-medium text-orange-700 hover:text-orange-800">
          View all
        </a>
      </div>

      <ul className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-6">
        {curated.map((item) => (
          <li
            key={item.id}
            className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white transition shadow-sm hover:shadow-md"
          >
            <div className="relative aspect-[4/3] overflow-hidden">
              <img
                src={item.image}
                alt={item.name}
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = placeholder;
                }}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            <div className="p-4">
              <h3 className="line-clamp-2 text-lg font-semibold text-slate-900">{item.name}</h3>
              <p className="mt-0.5 text-sm text-slate-600">{item.restaurant.name}</p>

              <div className="mt-3 flex items-center justify-between">
                <span className="text-lg font-bold text-slate-900">{formatINR(item.price)}</span>
                <button
                  onClick={() => addItem(toCart(item), 1)}
                  className="inline-flex items-center gap-2 rounded-full bg-orange-600 px-4 py-2 text-white font-medium shadow-sm hover:bg-orange-700 active:translate-y-px focus:outline-none focus:ring-4 focus:ring-orange-100"
                  aria-label={`Add ${item.name} to cart`}
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 6h15l-1.5 9H8L6 6z" />
                    <circle cx="9" cy="20" r="1" />
                    <circle cx="18" cy="20" r="1" />
                  </svg>
                  Add to Cart
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
