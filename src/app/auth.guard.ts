import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { UsuarioService } from '../app/usuario/services/usuario.service'; // El servicio de autenticación

export const authGuard = () => {
  const usuarioService = inject(UsuarioService);
  const router = inject(Router);

  if (usuarioService.isAuthenticated()) {
    return true;
  } else {
    // Si no está autenticado, redirigir al login
    router.navigate(['/login']);
    return false;
  }
};
