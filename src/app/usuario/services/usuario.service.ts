import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
//import { environment } from 'src/environments/environment';
import { environment } from 'src/environments/environment.prod';
import { Sesion } from '../interfaces/sesion';
import { Login } from '../interfaces/login';
import { ApiResponse } from 'src/app/Interfaces/api-response';
import { CookieService } from 'ngx-cookie-service';
import { Usuario } from '../interfaces/usuario';
import { Registro } from '../interfaces/registro';


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

  editar(request: Usuario): Observable<ApiResponse>{
    return this.http.put<ApiResponse>(`${this.baseUrl}actualizar`, request)
  }

  crear(request: Registro): Observable<Sesion>{
    return this.http.post<Sesion>(`${this.baseUrl}registro`, request)
  }

  eliminar(id: number): Observable<ApiResponse>{
    return this.http.delete<ApiResponse>(`${this.baseUrl}${id}`)
  }

  listadoRoles(): Observable<ApiResponse>{
    return this.http.get<ApiResponse>(`${this.baseUrl}ListadoRoles`)
  }

  listadoClientes(): Observable<ApiResponse>{
    return this.http.get<ApiResponse>(`${this.baseUrl}ListadoClientes`)
  }
}

