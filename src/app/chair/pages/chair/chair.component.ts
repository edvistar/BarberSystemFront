import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { ChairService } from '../../services/chair.service';
import { ServiciosService } from '../../../servicios/services/servicios.service';
import { CompartidoService } from '../../../compartido/compartido.service';
import { Chair } from '../../interfaces/chair';
import { ModalChairComponent } from '../modal/modal-chair.component';
import { MatDialog } from '@angular/material/dialog';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-chair',
  templateUrl: './chair.component.html',
  styleUrls: ['./chair.component.css']
})
export class ChairComponent implements OnInit, AfterViewInit {
  displayedColumns: string [] = [
    'name',
    'numero',
    'logo',
    'ocuped',
    'acciones'
  ];

  dataInicial: Chair []= [];
  dataSource = new MatTableDataSource(this.dataInicial);
  @ViewChild(MatPaginator) paginacionTabla!: MatPaginator;


  constructor(
    private _chairServicio: ChairService,
    private _servicioServicio: ServiciosService,
    private _compartidoService: CompartidoService,
    private dialog: MatDialog ) {}

  nuevoChair(){
    this.dialog
        .open(ModalChairComponent, {disableClose: true, width: '400px'})
        .afterClosed()
        .subscribe((resultado)=> {
          if(resultado === 'true') this.obtenerChairs();
        })
  }

  editarChair(chair: Chair){
    this.dialog
    .open(ModalChairComponent, {disableClose: true, width: '400px', data: chair})
    .afterClosed()
    .subscribe((resultado)=> {
      if(resultado === 'true') this.obtenerChairs();
    })
  }

  obtenerChairs(){
    this._chairServicio.lista().subscribe({
      next: (data) => {
          if(data.isExitoso)
          {
            this.dataSource = new MatTableDataSource(data.resultado);
            this.dataSource.paginator = this.paginacionTabla;
          } else
            this._compartidoService.mostrarAlerta(
              'No se  encontraron datos',
              'Advertencia!'
            );
        },
          error: (e) => {}
    });
  }

  removerChair(chair: Chair){

    Swal.fire({
     title: 'Desea eliminar la especialidad',
     text: chair.name,
     icon: 'warning',
     confirmButtonColor: '#3085d6',
     confirmButtonText: 'Si, Eliminar',
     showCancelButton: true,
     cancelButtonColor: '#d33',
     cancelButtonText: 'No'
    }).then((resultado)=> {
      if(resultado.isConfirmed){
        this._chairServicio.eliminar(chair.id).subscribe({
            next: (data) =>{
              if(data.isExitoso){
                this._compartidoService.mostrarAlerta('La especialidad fue eliminada', 'Completo');
                this.obtenerChairs();
              }
              else{
                this._compartidoService.mostrarAlerta('No se pudo eliminar la especialidad', 'Error!');
              }
            },
          error: (e) => {}
        });
      }
    });
  }

  aplicarFiltroListado(event: Event){
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if(this.dataSource.paginator){
      this.dataSource.paginator.firstPage();
    }
  }

  ngOnInit(): void {
    this.obtenerChairs();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginacionTabla;
  }
}
