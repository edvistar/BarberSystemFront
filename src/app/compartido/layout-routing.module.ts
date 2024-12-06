import { Component, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayoutComponent } from './layout/layout.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { RouterModule, Routes } from '@angular/router';
import { ChairComponent } from '../chair/pages/chair/chair.component';
import { NegocioComponent } from '../negocio/negocio.component';
import { OrdenComponent } from '../orden/pages/orden/orden.component';
import { ServiciosComponent } from '../servicios/pages/servicios/servicios.component';
import { FormOrdenComponent } from '../orden/pages/form-orden/form-orden.component';
import { authGuard } from '../_guards/auth.guard';
import { UsuarioListadoComponent } from '../usuario/usuario-listado/usuario-listado.component';
import { UsuarioRegistroComponent } from '../usuario/usuario-registro/usuario-registro.component';
import { ListadoOrdenComponent } from '../orden/pages/listado-orden/listado-orden.component';
import { ProductComponent } from '../Producto/pages/product/product.component';
import { ListProductComponent } from '../Producto/pages/list-product/list-product.component';
import { MarcaComponent } from '../Marcas/marca/marca.component';
import { CategoryComponent } from '../Categoria/category/category.component';


const routes: Routes = [
  {
    path: '', component: LayoutComponent,
    runGuardsAndResolvers:'always',
    canActivate:[authGuard],
    children:[
      {path: 'dashboard', component: DashboardComponent, pathMatch: 'full'},
      {path: 'chair', component: ChairComponent, pathMatch: 'full'},
      {path: 'ListProduct', component: ListProductComponent, pathMatch: 'full'},
      {path: 'product', component: ProductComponent, pathMatch: 'full'},
      {path: 'servicios', component: ServiciosComponent, pathMatch: 'full'},
      {path: 'marca', component: MarcaComponent, pathMatch: 'full'},
      {path: 'category', component: CategoryComponent, pathMatch: 'full'},
      {path: 'orden', component: OrdenComponent, pathMatch: 'full'},
      // {path: 'formOrden', component: FormOrdenComponent, pathMatch: 'full'},
      {path: 'listadoOrden', component: ListadoOrdenComponent, pathMatch: 'full'},
      {path: 'usuarioListado', component: UsuarioListadoComponent, pathMatch: 'full'},
      {path: 'usuarioRegistro', component: UsuarioRegistroComponent, pathMatch: 'full'},
      {path: 'usuarioRegistro/:id', component: UsuarioRegistroComponent, pathMatch: 'full' },
      {path: '**', redirectTo: '', pathMatch: 'full'},
    ]
  }
]

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ],
  exports:[
    RouterModule
  ]
})
export class LayoutRoutingModule { }
