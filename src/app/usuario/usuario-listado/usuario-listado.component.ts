import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { Usuario } from '../interfaces/usuario';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { UsuarioService } from '../services/usuario.service';
import { CompartidoService } from 'src/app/compartido/compartido.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';


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
    'email',
    'rol',
    'acciones'
  ];
  dataInicial: Usuario []= [];
  dataSource = new MatTableDataSource(this.dataInicial);
  @ViewChild(MatPaginator) paginacionTabla!: MatPaginator;
  constructor(private _usuarioService: UsuarioService,
              private _compartidoService: CompartidoService,
              private router: Router){ }



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

aplicarFiltroListado(event: Event){
  const filterValue = (event.target as HTMLInputElement).value;
  this.dataSource.filter = filterValue.trim().toLowerCase();
  if(this.dataSource.paginator){
    this.dataSource.paginator.firstPage();
  }
}



nuevoUsuario(){
  this.router.navigate(['/layout/usuarioRegistro']);
}

editarUsuario(usuario: Usuario) {
  const usuarioId = usuario.id;
  console.log("data", usuarioId)
      this._usuarioService.editar(usuario).subscribe({
        next: ()=>{
          this.router.navigate(['/layout/usuarioRegistro', usuarioId]);
        },
        error: (e) => {}
      })
}

removerUsuario(usuario: Usuario){
  Swal.fire({
    title: 'Desea eliminar el usuario',
    text: usuario.userName,
    icon: 'warning',
    confirmButtonColor: '#3085d6',
    confirmButtonText: 'Si, Eliminar',
    showCancelButton: true,
    cancelButtonColor: '#d33',
    cancelButtonText: 'No'
   }).then((resultado)=> {
     if(resultado.isConfirmed){
       this._usuarioService.eliminar(usuario.id).subscribe({
           next: (data) =>{
             if(data.isExitoso){
               this._compartidoService.mostrarAlerta('El proyecto fue eliminado', 'Completo');
               this.obtenerUsuarios();
             }
             else{
               this._compartidoService.mostrarAlerta('No se pudo eliminar el proyecto', 'Error!');
             }
           },
         error: (e) => {}
       });
     }
   });
}


ngOnInit(): void {
  this.obtenerUsuarios();
}
ngAfterViewInit(): void {
  this.dataSource.paginator = this.paginacionTabla;
}

}
