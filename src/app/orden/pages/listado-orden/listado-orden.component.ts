import { Component, ViewChild } from '@angular/core';
import { OrdenService } from '../../services/orden.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { CompartidoService } from 'src/app/compartido/compartido.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { Orden } from '../../interfaces/orden';
import { Servicios } from '../../../servicios/interfaces/servicios';
import { ServiciosService } from '../../../servicios/services/servicios.service';

@Component({
  selector: 'app-listado-orden',
  templateUrl: './listado-orden.component.html',
  styleUrls: ['./listado-orden.component.css']
})
export class ListadoOrdenComponent {
  displayedColumns: string [] = [
    'numero',
    'servicios',
    'nombreCliente',
    'usuarioAtiende',
    'acciones'
  ];
  servicioNombres: { [key: string]: string } = {};
  servicios: any[] = []; // Lista completa de servicios
  dataInicial: OrdenService []= [];
  dataSource = new MatTableDataSource(this.dataInicial);
  @ViewChild(MatPaginator) paginacionTabla!: MatPaginator;

  constructor(private _ordenServicio: OrdenService,
              private _compartidoService: CompartidoService,
              private _servicioServicio: ServiciosService,
              private router: Router){}


  ngOnInit(){
    this.obtenerOrdenes();
    this.obtenerServicios();
  }
  nuevaOrden(){
    this.router.navigate(['/layout/orden']);
  }

  obtenerOrdenes(){
    this._ordenServicio.lista().subscribe({
      next: (data) => {
        console.log("Respuesta completa de Orden:", data);
        if (data.isExitoso) {
          console.log("Data Orden", data.resultado); // Verifica si es un array
          this.dataSource = new MatTableDataSource(data.resultado);
          this.dataSource.paginator = this.paginacionTabla;
        } else {
          this._compartidoService.mostrarAlerta(
            'No se encontraron datos',
            'Advertencia!'
          );
        }
      },
      error: (e) => {
        console.error("Error en obtenerOrdenes:", e);
      }
   });
  }

  obtenerServicios() {
    this._servicioServicio.lista().subscribe({
      next: (data) => {
        if (data.isExitoso) {
          this.servicios = data.resultado;
          // Llenar el diccionario servicioNombres con los datos recibidos
          this.servicioNombres = this.servicios.reduce((acc, servicio) => {
            acc[servicio.id] = servicio.name;
            return acc;
          }, {});
        } else {
          this._compartidoService.mostrarAlerta(
            'No se encontraron servicios',
            'Advertencia!'
          );
        }
      },
      error: (e) => {
        this._compartidoService.mostrarAlerta(e.error.mensaje, 'Error!');
        console.error('Error al obtener los servicios', e);
      },
    });
}

  aplicarFiltroListado(event: Event){
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if(this.dataSource.paginator){
      this.dataSource.paginator.firstPage();
    }
  }

  editarOrden(orden: Orden){

  }

  removerOrden(orden: Orden){

    Swal.fire({
     title: 'Desea eliminar la orden del Cliente',
     text: orden.nombreCliente,
     icon: 'warning',
     confirmButtonColor: '#3085d6',
     confirmButtonText: 'Si, Eliminar',
     showCancelButton: true,
     cancelButtonColor: '#d33',
     cancelButtonText: 'No'
    }).then((resultado)=> {
      if(resultado.isConfirmed){
        this._ordenServicio.eliminar(orden.id).subscribe({
            next: (data) =>{
              if(data.isExitoso){
                this._compartidoService.mostrarAlerta('La especialidad fue eliminada', 'Completo');
                this.obtenerOrdenes();
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
}
