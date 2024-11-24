import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import {HttpClientModule} from '@angular/common/http';
import { LayoutComponent } from './layout/layout.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { MaterialModule } from '../material/material.module';
import { LayoutRoutingModule } from './layout-routing.module';
import {MatDialogModule} from '@angular/material/dialog';
import { HomeComponent } from './pages/home/home.component';
import { FooterComponent } from './pages/footer/footer.component';
import { NavbarComponent } from './pages/navbar/navbar.component';
import { ProductDetalleComponent } from '../Producto/pages/product-detalle/product-detalle.component';


@NgModule({
  declarations: [
    LayoutComponent,
    DashboardComponent,
    HomeComponent,
    FooterComponent,
    NavbarComponent
  ],
  imports: [
    CommonModule,
    MaterialModule,
    LayoutRoutingModule
  ], exports:[
    ReactiveFormsModule, FormsModule, HttpClientModule,
    LayoutComponent, DashboardComponent, MatDialogModule
  ]
})
export class CompartidoModule { }
