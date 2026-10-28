export type Product = {
  slug: string;
  name: string;
  description: string;
  image: string;
  price: number;
  sizes: string[];
};

export const products: Product[] = [
  {
    slug: "tshirt",
    name: "Premium Indiana Wear T-Shirt",
    description: "Premium garment-dyed cotton tee with our coastal nature logo. Soft, breathable, relaxed fit. Printed fresh and shipped to your door.",
    image: "/images/tshirt.png",
    price: 25,
    sizes: ["S", "M", "L", "XL", "2XL"],
  },
  {
    slug: "hoodie",
    name: "Premium Indiana Wear Hoodie",
    description: "Heavyweight unisex pullover hoodie. Soft cotton-poly blend, double-lined hood and kangaroo pocket. Built for cold mornings and long evenings.",
    image: "/images/hoodie.webp",
    price: 40,
    sizes: ["S", "M", "L", "XL", "2XL"],
  },
  {
    slug: "tanktop",
    name: "Premium Indiana Wear Tank Top",
    description: "Lightweight unisex jersey tank. Smooth, soft and summer-ready. Goes anywhere from the beach to the gym.",
    image: "/images/tanktop.png",
    price: 30,
    sizes: ["S", "M", "L", "XL", "2XL"],
  },
  {
    slug: "longsleeve",
    name: "Premium Indiana Wear Long Sleeve Tee",
    description: "Garment-dyed long-sleeve tee with our coastal wildlife graphic. Soft cotton, relaxed fit and layer-friendly for any season.",
    image: "/images/longsleeve.webp",
    price: 30,
    sizes: ["S", "M", "L", "XL", "2XL"],
  },
  {
    slug: "sweater",
    name: "Premium Indiana Wear Sweatshirt",
    description: "Crewneck pullover sweatshirt featuring our island wildlife logo. Heavyweight cotton-poly with a classic fit.",
    image: "/images/sweater.webp",
    price: 35,
    sizes: ["S", "M", "L", "XL", "2XL"],
  },
  {
    slug: "cap",
    name: "Premium Indiana Wear Cap",
    description: "Retro trucker cap with mesh back and snapback closure. Mountain logo embroidered front-center. One size fits most.",
    image: "/images/cap.png",
    price: 25,
    sizes: ["One Size"],
  },
];

export function getProduct(slug: string) {
  return products.find((product) => product.slug === slug);
}
