import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { ServiciosService } from '../../services/servicios.service';
import { CompartidoService } from '../../../compartido/compartido.service';
import { Servicios } from '../../interfaces/servicios';
import { ModalServicioComponent } from '../modal/modal-servicio.component';
import { MatDialog } from '@angular/material/dialog';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-servicios',
  templateUrl: './servicios.component.html',
  styleUrls: ['./servicios.component.css']
})
export class ServiciosComponent {
  displayedColumns: string [] = [
    'name',
    'description',
    'price',
    'acciones'
  ];

  dataInicial: ServiciosService []= [];
  dataSource = new MatTableDataSource(this.dataInicial);
  @ViewChild(MatPaginator) paginacionTabla!: MatPaginator;


  constructor(
    private _serviceServicio: ServiciosService,
    private _servicioServicio: ServiciosService,
    private _compartidoService: CompartidoService,
    private dialog: MatDialog ) {}

  nuevoServicio(){
    this.dialog
        .open(ModalServicioComponent, {disableClose: true, width: '400px'})
        .afterClosed()
        .subscribe((resultado)=> {
          if(resultado === 'true') this.obtenerServicios();
        })
  }

  editarServicio(servicio: Servicios){
    this.dialog
    .open(ModalServicioComponent, {disableClose: true, width: '400px', data: servicio})
    .afterClosed()
    .subscribe((resultado)=> {
      if(resultado === 'true') this.obtenerServicios();
    })
  }

  obtenerServicios(){
    this._serviceServicio.lista().subscribe({
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

  removerServicio(servicio: Servicios){

    Swal.fire({
     title: 'Desea eliminar la especialidad',
     text: servicio.name,
     icon: 'warning',
     confirmButtonColor: '#3085d6',
     confirmButtonText: 'Si, Eliminar',
     showCancelButton: true,
     cancelButtonColor: '#d33',
     cancelButtonText: 'No'
    }).then((resultado)=> {
      if(resultado.isConfirmed){
        this._serviceServicio.eliminar(servicio.id).subscribe({
            next: (data) =>{
              if(data.isExitoso){
                this._compartidoService.mostrarAlerta('La especialidad fue eliminada', 'Completo');
                this.obtenerServicios();
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
    this.obtenerServicios();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginacionTabla;
  }
}
