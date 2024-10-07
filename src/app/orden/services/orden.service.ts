import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from 'src/app/Interfaces/api-response';
import { environment } from 'src/environments/environment';
import { AgregarServicioDto } from '../interfaces/agregarservicio';
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

  obtenerChairServices(): Observable<any> {
    return this.http.get(`${this.baseUrl}/chair-services`);
  }

  agregarServicioASilla(request: AgregarServicioDto): Observable<any> {
    return this.http.post(`${this.baseUrl}AddServicesChair`,request);
  }

  quitarServicioDeSilla(request: AgregarServicioDto): Observable<any> {
    return this.http.delete(`${this.baseUrl}RemoveServicesChair`, { body: request });
}

eliminarServicioDeSilla(chairId: number, servicioId: number): Observable<any> {
  return this.http.delete(`${this.baseUrl}RemoveServicesChair?chairId=${chairId}&serviceId=${servicioId}`);
}

obtenerServiciosPorSilla(chairId: number): Observable<any> {
  return this.http.get(`${this.baseUrl}GetServicesByChair/${chairId}`);
}

}
