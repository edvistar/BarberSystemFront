import { Component, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayoutComponent } from './layout/layout.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { RouterModule, Routes } from '@angular/router';
import { ChairComponent } from '../chair/pages/chair/chair.component';
import { NegocioComponent } from '../negocio/negocio.component';
import { OrdenComponent } from '../orden/pages/orden/orden.component';

const routes: Routes = [
  {
    path: '', component: LayoutComponent,
    children:[
      {path: 'dashboard', component: DashboardComponent, pathMatch: 'full'},
      {path: 'chair', component: ChairComponent, pathMatch: 'full'},
      {path: 'negocio/:id', component: NegocioComponent, pathMatch: 'full'},
      {path: 'orden', component: OrdenComponent, pathMatch: 'full'},
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
