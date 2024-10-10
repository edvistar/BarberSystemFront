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


const routes: Routes = [
  {
    path: '', component: LayoutComponent,
    runGuardsAndResolvers:'always',
    canActivate:[authGuard],
    children:[
      {path: 'dashboard', component: DashboardComponent, pathMatch: 'full'},
      {path: 'chair', component: ChairComponent, pathMatch: 'full'},
      {path: 'servicios', component: ServiciosComponent, pathMatch: 'full'},
      {path: 'orden', component: OrdenComponent, pathMatch: 'full'},
      {path: 'formOrden', component: FormOrdenComponent, pathMatch: 'full'},
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
