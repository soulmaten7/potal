export interface Product {
  id: number;
  name: string;
  price: number;
  currency: string;
  site: string;
  image: string;
  shipping: 'Domestic' | 'International';
  deliveryDays: string;
}

export const MOCK_PRODUCTS: Product[] = [
  { id: 1, name: "LEGO Star Wars Millennium Falcon", price: 159.99, currency: "USD", site: "Amazon", image: "https://placehold.co/200x200?text=Lego+Amazon", shipping: "Domestic", deliveryDays: "2 Days" },
  { id: 2, name: "Apple AirPods Pro 2nd Gen", price: 249.00, currency: "USD", site: "Walmart", image: "https://placehold.co/200x200?text=AirPods+Walmart", shipping: "Domestic", deliveryDays: "3 Days" },
  { id: 3, name: "Sony WH-1000XM5 Headphones", price: 348.00, currency: "USD", site: "BestBuy", image: "https://placehold.co/200x200?text=Sony+BestBuy", shipping: "Domestic", deliveryDays: "1 Day" },
  { id: 4, name: "Compatible Star Plan Blocks", price: 45.00, currency: "USD", site: "AliExpress", image: "https://placehold.co/200x200?text=Blocks+Ali", shipping: "International", deliveryDays: "15-30 Days" },
  { id: 5, name: "Wireless Earbuds Bluetooth 5.3", price: 12.99, currency: "USD", site: "Temu", image: "https://placehold.co/200x200?text=Buds+Temu", shipping: "International", deliveryDays: "10-20 Days" },
  { id: 6, name: "Noise Cancelling Headset", price: 25.50, currency: "USD", site: "DHgate", image: "https://placehold.co/200x200?text=Headset+DH", shipping: "International", deliveryDays: "20+ Days" },
];
