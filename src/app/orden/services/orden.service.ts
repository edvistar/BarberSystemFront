import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from 'src/app/Interfaces/api-response';
import { environment } from 'src/environments/environment';
import { Orden } from '../interfaces/orden';


@Injectable({
  providedIn: 'root'
})
export class OrdenService {
  baseUrl: string = environment.apiUrl + 'orden/'
  constructor(private http: HttpClient) { }

  lista() : Observable<ApiResponse>{
    return this.http.get<ApiResponse>(`${this.baseUrl}`);
  }
  // listaActivos() : Observable<ApiResponse>{
  //   return this.http.get<ApiResponse>(`${this.baseUrl}ListadoActivos`);
  // }

  crear(request: Orden): Observable<ApiResponse>{
  return this.http.post<ApiResponse>(`${this.baseUrl}`, request);
  }

  editar(request: Orden): Observable<ApiResponse>{
    return this.http.put<ApiResponse>(`${this.baseUrl}`, request);
    }

  eliminar(id: number): Observable<ApiResponse>{
      return this.http.delete<ApiResponse>(`${this.baseUrl}${id}`);
      }
}
