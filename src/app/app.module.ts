import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import {HTTP_INTERCEPTORS, HttpClientModule} from '@angular/common/http';
import { ChairComponent } from './chair/pages/chair/chair.component';
import { NegocioComponent } from './negocio/negocio.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { UsuarioModule } from './usuario/usuario.module';
import { MaterialModule } from './material/material.module';
import { FormsModule } from '@angular/forms';
import { ServiciosComponent } from './servicios/pages/servicios/servicios.component';
import { OrdenComponent } from './orden/pages/orden/orden.component';
import { ModalChairComponent } from './chair/pages/modal/modal-chair.component';
import { ReactiveFormsModule } from '@angular/forms';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { ModalServicioComponent } from './servicios/pages/modal/modal-servicio.component';
import { FormOrdenComponent } from './orden/pages/form-orden/form-orden.component';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { ListadoOrdenComponent } from './orden/pages/listado-orden/listado-orden.component';
import { ProductComponent } from './Producto/pages/product/product.component';
import { ListProductComponent } from './Producto/pages/list-product/list-product.component';
import { ProductDetalleComponent } from './Producto/pages/product-detalle/product-detalle.component';
import { CategoryComponent } from './Categoria/category/category.component';
import { MarcaComponent } from './Marcas/marca/marca.component';


@NgModule({
  declarations: [
    AppComponent,
    ChairComponent,
    NegocioComponent,
    ServiciosComponent,
    OrdenComponent,
    ModalChairComponent,
    ModalServicioComponent,
    FormOrdenComponent,
    ListadoOrdenComponent,
    ProductComponent,
    ListProductComponent,
    ProductDetalleComponent,
    CategoryComponent,
    MarcaComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    BrowserAnimationsModule,
    UsuarioModule, MaterialModule, FormsModule, ReactiveFormsModule,SweetAlert2Module
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass:AuthInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
