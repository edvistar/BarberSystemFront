import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Sesion } from '../interfaces/sesion';
import { Login } from '../interfaces/login';
import {jwtDecode} from 'jwt-decode'; // Importa correctamente el método
import { ApiResponse } from 'src/app/Interfaces/api-response';
import { CookieService } from 'ngx-cookie-service';


@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  baseUrl: string = environment.apiUrl + 'usuario/';

  constructor(private http: HttpClient, private cookieService: CookieService) { }

  lista() : Observable<ApiResponse>{

    return this.http.get<ApiResponse>(`${this.baseUrl}`);



  }

  // Método para iniciar sesión
  iniciarSesion(request: Login): Observable<Sesion> {
    return this.http.post<Sesion>(`${this.baseUrl}login`, request);
  }

  // // Método para guardar el token en el almacenamiento local
  // guardarToken(token: string): void {
  //   localStorage.setItem('auth_token', token);
  // }

  // // Método para eliminar el token del almacenamiento local
  // eliminarToken(): void {
  //   localStorage.removeItem('auth_token');
  // }
  //  // Método para obtener la sesión del usuario decodificando el token
  //  obtenerSesion(): any {
  //   const token = localStorage.getItem('auth_token');
  //   if (token) {
  //     const decodedToken: any = jwtDecode(token); // Decodifica el token
  //     return decodedToken; // Devuelve la información decodificada del token
  //   }
  //   return null; // Si no hay token, devuelve null
  // }


  // Método en UsuarioService
// lista(): Observable<ApiResponse> {
//   const token = localStorage.getItem('auth_token'); // Obtener el token
//   const headers = new HttpHeaders({
//       'Authorization': `Bearer ${token}` // Formato correcto del encabezado
//   });

//   return this.http.get<ApiResponse>(`${this.baseUrl}`, { headers })

// }
}

