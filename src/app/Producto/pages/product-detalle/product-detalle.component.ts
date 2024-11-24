import { Component, OnInit } from '@angular/core';
import { ProductService } from '../../services/product.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Product } from '../../interfaces/product';
import { CompartidoService } from 'src/app/compartido/compartido.service';

@Component({
  selector: 'app-product-detalle',
  templateUrl: './product-detalle.component.html',
  styleUrls: ['./product-detalle.component.css']
})
export class ProductDetalleComponent implements OnInit {
  productId: number = 0;
  product: any;  // Aquí almacenarás los detalles del producto

  currentImage: any;


  constructor(
    private route: ActivatedRoute,  // Para obtener el ID desde la URL
    private _productService: ProductService,  // Servicio para obtener los detalles del producto
    private _compartidoService: CompartidoService,
    private router: Router
  ) {}
  ngOnInit(): void {
    // Obtener el 'id' desde la URL
    this.productId = +this.route.snapshot.paramMap.get('id')!;  // Asegúrate de usar el nombre correcto del parámetro
    this.getProductDetail();

  }
  getProductDetail() {
    this._productService.getProductById(this.productId).subscribe({
      next: (data) => {
        if (data.isExitoso) {
          // this.dataSource = new MatTableDataSource(data.resultado);
          // this.dataSource.paginator = this.paginacionTabla;
          console.log("Lo atrapamos por Id" , data.resultado);
          this.product = data.resultado;
           // Establecer la imagen principal como la que tiene la propiedad EsPrincipal = true
        this.currentImage = this.product.imagenes.find((img: any) => img.esPrincipal) || this.product.imagenes[0]; // Si no se encuentra ninguna, usar la primera por defecto
        } else
          this._compartidoService.mostrarAlerta(
            'No se  encontraron datos',
            'Advertencia!'
          );
      },
      error: (e) => {
        this._compartidoService.mostrarAlerta(e.error.mensaje, 'Error!');
      },
    });
  }

  changeImage(imagen: any): void {
    this.currentImage = imagen; // Cambiar la imagen principal
  }
  BackHome(): void {
    this.router.navigate(['/home']); // Cambia '/home' a la ruta correspondiente a la vista principal.
  }
}

