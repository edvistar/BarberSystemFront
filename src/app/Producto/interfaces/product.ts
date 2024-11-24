export interface Product{
  id: number;
  name: string;
  serialNumber: string;
  description: string;
  status: boolean;
  offer: boolean;
  price: number;
  cost: number;
  imageUrl: string;
  localImageUrl: string;
  categoriaId: number;
  marcaId: number;
}
