import { Component, Input, OnInit } from '@angular/core';
import { Product } from '../../interfaces/product';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CompartidoService } from 'src/app/compartido/compartido.service';
import { ProductService } from '../../services/product.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-product',
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.css']
})
export class ProductComponent implements OnInit {
productId:number | null = null;
selectedFiles: File[] = []; // Array para almacenar los archivos seleccionados
images: string[] = []; // Lista de rutas de imágenes seleccionadas para previsualización

@Input() datosProduct: Product | null = null;
  formProduct: FormGroup;
  titulo: string = "Agregar";
  nombreBoton: string = "Guardar";
  errorMessage: string | undefined;
  previewUrls: any;

  constructor(private fb: FormBuilder,
    private _compartidoService: CompartidoService,
    private _productService: ProductService,
    private route: ActivatedRoute,
    private router: Router
  ){
    this.formProduct = this.fb.group({
      name: ['', Validators.required],
      serialNumber: ['', Validators.required],
      description: ['', Validators.required],
      status: ['', Validators.required],
      offer: ['', Validators.required],
      price: ['', Validators.required],
      cost: ['', Validators.required],
      categoriaId: ['', Validators.required],
      marcaId: ['', Validators.required]
  });

  }
  CrearModificarProduct(){
    if(this.formProduct.valid){
      const product: Product = {
        id:this.productId || 0,
        name: this.formProduct.value.name,
        serialNumber: this.formProduct.value.serialNumber,
        description: this.formProduct.value.description,
        status: this.formProduct.value.status,
        offer: this.formProduct.value.offer,
        price: this.formProduct.value.price,
        cost: this.formProduct.value.cost,
        categoriaId: this.formProduct.value.categoriaId,
        marcaId: this.formProduct.value.marcaId,
        imagenes: this.formProduct.value.imagenes

      };
      if(this.productId){
        console.log("id enviado", this.productId)
         // Editar product
         this._productService.editar(product).subscribe({
          next: () => {
            this._compartidoService.mostrarAlerta('El Producto se actualizó con éxito!', 'Completo');
            this.router.navigate(['/layout/ListProduct']);
          },
          error: (e) => {
            this._compartidoService.mostrarAlerta('No se actualizó el Producto', 'Error!');
          }
         });
      }else {
        console.log("No edito")
        // Crear nuevo proyecto
        this._productService.crear(product).subscribe({
          next: () => {
            this._compartidoService.mostrarAlerta('El Producto se Creo con éxito!', 'Completo');
            this.router.navigate(['/layout/usuarioListado']);
          },
          error: (e) => {
            this._compartidoService.mostrarAlerta('No se creó el ListProduct', 'Error!');
          }
        });
      }
    }else {
      this.errorMessage = 'Form is invalid. Please correct the errors and try again.';
    }
  }

  ngOnInit(): void {
    throw new Error('Method not implemented.');
  }
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (input.files) {
      this.images = []; // Limpiar las miniaturas previas

      Array.from(input.files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result;
          if (result) {
            this.images.push(result as string); // Agregar la URL generada para previsualizar
          }
        };
        reader.readAsDataURL(file); // Leer como URL de datos
      });
    }
  }
}
