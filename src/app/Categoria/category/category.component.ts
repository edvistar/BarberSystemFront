import { Component, OnInit } from '@angular/core';
import { CategoryService } from '../services/category.service';
import { CompartidoService } from 'src/app/compartido/compartido.service';

@Component({
  selector: 'app-category',
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.css']
})
export class CategoryComponent implements OnInit {

  constructor(
    private _categoryService: CategoryService,
    private _compartidoService: CompartidoService) {}

  ngOnInit(): void {
    this.obtenerCategories();
  }
  obtenerCategories(){
    this._categoryService.lista().subscribe({
      next: (data) => {
          if(data.isExitoso)
          {
            // this.dataSource = new MatTableDataSource(data.resultado);
            // this.dataSource.paginator = this.paginacionTabla;
            console.log("Categorias: ", data.resultado);
          } else
            this._compartidoService.mostrarAlerta(
              'No se  encontraron datos',
              'Advertencia!'
            );
        },
          error: (e) => {}
    });
  }

}
