import { Injectable } from "@angular/core"
import { HttpClient } from '@angular/common/http';
import { Observable } from "rxjs"
import { ApiResponse } from "src/app/Interfaces/api-response"
import { environment } from "src/environments/environment.prod"
import { Product } from "../interfaces/product";


@Injectable({
  providedIn: 'root'
})
export class ProductService {
  baseUrl: string = environment.apiUrl + 'product/'
  constructor(private http: HttpClient) { }

  lista() : Observable<ApiResponse>{
    return this.http.get<ApiResponse>(`${this.baseUrl}`)
  }
  getProductById(id: number): Observable<ApiResponse>{
    return this.http.get<ApiResponse>(`${this.baseUrl}${id}`);
    }

  editar(request: Product): Observable<ApiResponse>{
      return this.http.put<ApiResponse>(`${this.baseUrl}actualizar`, request)
    }
  crear(request: Product): Observable<ApiResponse>{
      return this.http.post<ApiResponse>(`${this.baseUrl}registro`, request)
    }

  eliminar(id: number): Observable<ApiResponse>{
      return this.http.delete<ApiResponse>(`${this.baseUrl}${id}`)
    }
}
