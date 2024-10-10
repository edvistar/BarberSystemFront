import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { Usuario } from '../interfaces/usuario';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { UsuarioService } from '../services/usuario.service';
import { CompartidoService } from 'src/app/compartido/compartido.service';


@Component({
  selector: 'app-usuario-listado',
  templateUrl: './usuario-listado.component.html',
  styleUrls: ['./usuario-listado.component.css']
})
export class UsuarioListadoComponent implements OnInit, AfterViewInit {

  displayedColumns: string [] = [
    'apellidos',
    'nombres',
    'userName',
    'acciones'
  ];

  dataInicial: Usuario []= [];
  dataSource = new MatTableDataSource(this.dataInicial);
  @ViewChild(MatPaginator) paginacionTabla!: MatPaginator;
  constructor(private _usuarioService: UsuarioService,
              private _compartidoService: CompartidoService){ }



obtenerUsuarios(){
  this._usuarioService.lista().subscribe({
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
        error: (e) => {
          this._compartidoService.mostrarAlerta(e.error.mensaje, 'Error!')
        }
  });
}
// obtenerUsuarios() {
//   this._usuarioService.lista().subscribe({
//     next: (data) => {
//       console.log("Aqui va la data", data);
//       console.log("Valor de isExitoso:", data.isExitoso); // Añade este log
//       if (data.isExitoso) {
//         console.log("Data exitosa", data)
//         this.dataSource = new MatTableDataSource(data.resultado);
//         this.dataSource.paginator = this.paginacionTabla;
//       } else {
//         this._compartidoService.mostrarAlerta(
//           'No se encontraron datos',
//           'Advertencia!'
//         );
//       }
//     },
//     error: (e) => {
//       console.error('Error al obtener usuarios:', e); // Registra el error
//       this._compartidoService.mostrarAlerta(
//         'Error al obtener los usuarios. Inténtalo de nuevo más tarde.',
//         'Error!'
//       );
//     }
//   });
// }

nuevoUsuario(){

}

editarUsuario(){

}
removerUsuario(){

}
aplicarFiltroListado(){

}

ngOnInit(): void {
  this.obtenerUsuarios();
}
ngAfterViewInit(): void {
  this.dataSource.paginator = this.paginacionTabla;
}

}
