import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CompartidoService } from '../compartido/compartido.service';
import jwt_decode from 'jwt-decode';
import { CookieService } from 'ngx-cookie-service';

export const authGuard: CanActivateFn = (route, state) => {

  const compartidoService = inject(CompartidoService);
  const router = inject(Router);
  const cookieService = inject(CookieService);
  const usuario = compartidoService.obtenerSesion();
  let token = cookieService.get('Authorization');

   // Imprimir el token en consola
   console.log('Token obtenido ahora:', usuario);

  if(token &&usuario){
    token = token.replace('Bearer ','');
      const decodeToken: any = jwt_decode(token);
      const fechaExpiracion = decodeToken.exp * 1000;
      const fechaActual = new Date().getTime();
      if(fechaExpiracion < fechaActual){
        router.navigate(['login']);
        return false;
      }
    return true
  }
  else{
    router.navigate(['login']);
    return false;
  }
};
// function jwt_decode(token: string): any {
//   throw new Error('Function not implemented.');
// }

