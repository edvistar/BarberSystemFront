import { Injectable } from '@angular/core';
import { ApiResponse } from 'src/app/Interfaces/api-response';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';
import { Servicios } from 'src/app/servicios/interfaces/servicios';

@Injectable({
  providedIn: 'root'
})
export class ServiciosService {

  baseUrl: string = environment.apiUrl + 'service/'
  constructor(private http: HttpClient) { }

  lista() : Observable<ApiResponse>{
    return this.http.get<ApiResponse>(`${this.baseUrl}`);
  }
  // listaActivos() : Observable<ApiResponse>{
  //   return this.http.get<ApiResponse>(`${this.baseUrl}ListadoActivos`);
  // }

  crear(request: Servicios): Observable<ApiResponse>{
  return this.http.post<ApiResponse>(`${this.baseUrl}`, request);
  }

  editar(request: Servicios): Observable<ApiResponse>{
    return this.http.put<ApiResponse>(`${this.baseUrl}`, request);
    }

  eliminar(id: number): Observable<ApiResponse>{
      return this.http.delete<ApiResponse>(`${this.baseUrl}${id}`);
      }
}
