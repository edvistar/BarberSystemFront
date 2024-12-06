import { Component, OnInit } from '@angular/core';
import { CompartidoService } from 'src/app/compartido/compartido.service';
import { MarcaService } from '../services/marca.service';

@Component({
  selector: 'app-marca',
  templateUrl: './marca.component.html',
  styleUrls: ['./marca.component.css']
})
export class MarcaComponent implements OnInit{

  constructor(
    private _marcaService: MarcaService,
    private _compartidoService: CompartidoService) {}

  ngOnInit(): void {
    this.obtenerMarcas();
  }

  obtenerMarcas(){
    this._marcaService.lista().subscribe({
      next: (data) => {
          if(data.isExitoso)
          {
            // this.dataSource = new MatTableDataSource(data.resultado);
            // this.dataSource.paginator = this.paginacionTabla;
            console.log("Marcas: ", data.resultado);
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
