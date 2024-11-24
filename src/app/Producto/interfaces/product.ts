export interface Product {
  id: number;
  name: string;
  serialNumber: string;
  description: string;
  status: boolean;
  offer: boolean;
  price: number;
  cost: number;
  categoriaId: number;  // Aquí solo dejamos el id de la categoría
  marcaId: number;  // Aquí solo dejamos el id de la marca
  imagenes: {
    id: number;
    productId: number;
    imageUrl: string;
    localImageUrl: string;
    description: string;
    esPrincipal: boolean;
  }[];
}

