import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './usuario/login/login.component';
import { LayoutComponent } from './compartido/layout/layout.component';
import { HomeComponent } from './compartido/pages/home/home.component';
import { UsuarioRegistroComponent } from './usuario/usuario-registro/usuario-registro.component';
import { ProductDetalleComponent } from './Producto/pages/product-detalle/product-detalle.component';

const routes: Routes = [
  {
    path: '',
   component: HomeComponent,
    pathMatch: 'full'
  },
  {
    path: 'productDetalle/:id',
   component: ProductDetalleComponent,
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: LoginComponent,
    pathMatch: 'full'
  },
  {
    path: 'usuarioRegistro',
    component: UsuarioRegistroComponent,
    pathMatch: 'full'
  },
  {
    path: 'layout', //Layout/dashboard, layout/servicios
    loadChildren: () => import('./compartido/compartido.module').then(m => m.CompartidoModule)

  },
  {
    path:'**',
    redirectTo: '',
    pathMatch:'full'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
