import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CompartidoModule } from '../compartido/compartido.module';
import { UsuarioService } from './services/usuario.service';
import { LoginComponent } from './login/login.component';
import { MaterialModule } from '../material/material.module';
import { UsuarioListadoComponent } from './usuario-listado/usuario-listado.component';
import { UsuarioRegistroComponent } from './usuario-registro/usuario-registro.component';



@NgModule({
  declarations: [
    LoginComponent,
    UsuarioListadoComponent,
    UsuarioRegistroComponent
  ],
  imports: [
    CommonModule,
    CompartidoModule,
    MaterialModule
  ],
  exports:[
    LoginComponent
  ],
  providers:[
    UsuarioService
  ]
})
export class UsuarioModule { }
