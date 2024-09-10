import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import {HttpClientModule} from '@angular/common/http';
import { ChairComponent } from './chair/pages/chair/chair.component';
import { NegocioComponent } from './negocio/negocio.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { UsuarioModule } from './usuario/usuario.module';
import { MaterialModule } from './material/material.module';
import { FormsModule } from '@angular/forms';
import { ServiciosComponent } from './servicios/servicios.component';
import { OrdenComponent } from './orden/pages/orden/orden.component';
import { ModalComponent } from './chair/pages/modal/modal.component';
import { ReactiveFormsModule } from '@angular/forms';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';

@NgModule({
  declarations: [
    AppComponent,
    ChairComponent,
    NegocioComponent,
    ServiciosComponent,
    OrdenComponent,
    ModalComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    BrowserAnimationsModule,
    UsuarioModule, MaterialModule, FormsModule, ReactiveFormsModule,SweetAlert2Module
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
