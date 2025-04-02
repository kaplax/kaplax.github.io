declare module "*.json" {
  const value: {
    category: Array<{
      name: string;
      items: Array<{
        name: string;
        price: number;
      }>;
    }>;
  };
  export default value;
}
