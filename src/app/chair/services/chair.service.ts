import { Injectable } from '@angular/core';
import { ApiResponse } from 'src/app/Interfaces/api-response';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';
import { Chair } from '../interfaces/chair';

@Injectable({
  providedIn: 'root'
})
export class ChairService {

  baseUrl: string = environment.apiUrl + 'chair/'
  constructor(private http: HttpClient) { }

  lista() : Observable<ApiResponse>{
    return this.http.get<ApiResponse>(`${this.baseUrl}`);
  }
  // listaActivos() : Observable<ApiResponse>{
  //   return this.http.get<ApiResponse>(`${this.baseUrl}ListadoActivos`);
  // }EditarEstado

  crear(request: Chair): Observable<ApiResponse>{
  return this.http.post<ApiResponse>(`${this.baseUrl}`, request);
  }

  editar(request: Chair): Observable<ApiResponse>{
    return this.http.put<ApiResponse>(`${this.baseUrl}`, request);
    }

  editarEstado(request: Chair): Observable<ApiResponse>{
    return this.http.patch<ApiResponse>(`${this.baseUrl}EditarEstado`, request);
    }

  eliminar(id: number): Observable<ApiResponse>{
      return this.http.delete<ApiResponse>(`${this.baseUrl}${id}`);
      }
}
