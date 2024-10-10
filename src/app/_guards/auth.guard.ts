import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CompartidoService } from '../compartido/compartido.service';

export const authGuard: CanActivateFn = (route, state) => {

  const compartidoService = inject(CompartidoService);
  const router = inject(Router);
  const usuarioToken = compartidoService.obtenerSesion();

   // Imprimir el token en consola
   console.log('Token obtenido ahora:', usuarioToken);

  if(usuarioToken != null){
    return true
  }
  else{
    router.navigate(['login']);
    return false;
  }
};
