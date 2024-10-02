export interface Orden{
  id: number;
  numero: number;
  servicios: string[]; // Cambiado a array de strings
  nombreCliente: string;
  usuarioAtiende: string;

}
