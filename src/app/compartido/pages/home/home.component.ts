import { Component, OnInit } from '@angular/core';
import { ProductService } from 'src/app/Producto/services/product.service';
import { CompartidoService } from '../../compartido.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  products: any[] = [];
  constructor(private _productService: ProductService,
    private _compartidoService: CompartidoService,
    private router: Router
  ){

  }
  ngOnInit(): void {
    this.obtenerProducts();
  }

  obtenerProducts() {
    this._productService.lista().subscribe({
      next: (data) => {
        if (data.isExitoso) {
          // this.dataSource = new MatTableDataSource(data.resultado);
          // this.dataSource.paginator = this.paginacionTabla;
          this.products = data.resultado;
          console.log(data.resultado);
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

  getPrincipalImage(images: any[]): string {
    // Busca la imagen principal o devuelve la primera
    const principal = images.find(image => image.esPrincipal);
    return principal ? principal.imageUrl : images[0]?.imageUrl || 'assets/no-image.png';
  }

  ProductDetalle(productId: number){
    console.log('ID del producto seleccionado:', productId);
  this.router.navigate(['productDetalle', productId]);
  }
}


