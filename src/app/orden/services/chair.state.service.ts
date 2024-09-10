import { Injectable } from '@angular/core';
import { Chair } from '../../chair/interfaces/chair';
import { Servicios } from '../../Interfaces/servicios';

@Injectable({
  providedIn: 'root'
})
export class ChairStateService {
  private chairs: Chair[] = [];
  private chairServices: { [key: number]: Servicios[] } = {};

  getChairs(): Chair[] {
    return this.chairs;
  }

  setChairs(chairs: Chair[]): void {
    this.chairs = chairs;
  }

  getChairServices(chairId: number): Servicios[] {
    return this.chairServices[chairId] ?? [];
  }

  setChairServices(chairId: number, services: Servicios[]): void {
    this.chairServices[chairId] = services;
  }

  setChairOccupied(chairId: number, occupied: boolean): void {
    const chair = this.chairs.find(c => c.id === chairId);
    if (chair) {
      chair.ocupada = occupied;
    }
  }
}
Ajustar el Componente
Modifica el componente para usar los métodos del ChairStateService correctamente. Asegúrate de que las propiedades del tipo Servicios sean las correctas.

Componente (TypeScript)
typescript
Copiar código
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { ChairService } from '../../../chair/services/chair.service';
import { ServiciosService } from '../../../servicios/services/servicios.service';
import { ChairStateService } from '../../../services/chair-state.service'; // Ajustar la ruta
import { Chair } from '../../../chair/interfaces/chair';
import { Servicios } from '../../../Interfaces/servicios';

@Component({
  selector: 'app-orden',
  templateUrl: './orden.component.html',
  styleUrls: ['./orden.component.css']
})
export class OrdenComponent implements OnInit {
  title: string = 'Lista de Sillas';
  chairs: Chair[] = [];
  servicios: Servicios[] = [];
  dataSource = new MatTableDataSource<Chair>(this.chairs);

  @ViewChild(MatPaginator) paginacionTabla!: MatPaginator;

  selectedChairId: number | undefined;
  selectedValue: string | undefined;

  constructor(
    private _chairServicio: ChairService,
    private _servicioServicio: ServiciosService,
    private _chairStateService: ChairStateService // Inyectar el servicio de estado
  ) {}

  ngOnInit(): void {
    this.obtenerChairs();
    this.obtenerServicios();
  }

  obtenerChairs() {
    this._chairServicio.lista().subscribe({
      next: (data) => {
        if (data.isExitoso) {
          this.chairs = data.resultado.map((chair: Chair) => ({
            ...chair,
            ocupada: this._chairStateService.getChairs().find(ch => ch.id === chair.id)?.ocupada ?? false
          }));
          this._chairStateService.setChairs(this.chairs);
          this.dataSource.data = this.chairs;
          this.dataSource.paginator = this.paginacionTabla;
        } else {
          console.error('No se encontraron datos');
        }
      },
      error: (e) => {
        console.error('Error al obtener las sillas', e);
      }
    });
  }

  obtenerServicios() {
    this._servicioServicio.lista().subscribe({
      next: (data) => {
        if (data.isExitoso) {
          this.servicios = data.resultado;
        } else {
          console.error('No se encontraron servicios');
        }
      },
      error: (e) => {
        console.error('Error al obtener los servicios', e);
      }
    });
  }

  nuevaOrden(id: number) {
    this.chairs.forEach(chair => {
      if (chair.id === id) {
        chair.ocupada = true;
        this._chairStateService.setChairOccupied(id, true);
      }
    });

    if (!this._chairStateService.getChairServices(id)) {
      this._chairStateService.setChairServices(id, []);
    }

    this.selectedChairId = id;
  }

  agregarServicio() {
    if (this.selectedValue && this.selectedChairId) {
      const selectedValueAsNumber = +this.selectedValue;
      const selectedServicio = this.servicios.find(servicio => servicio.id === selectedValueAsNumber);

      if (selectedServicio) {
        const services = this._chairStateService.getChairServices(this.selectedChairId);

        if (!services.some(service => service.id === selectedServicio.id)) {
          services.push({
            id: selectedServicio.id,
            name: selectedServicio.name,
            description: selectedServicio.description,
            price: selectedServicio.price
          });

          this._chairStateService.setChairServices(this.selectedChairId, services);

          this.selectedValue = undefined;
        }
      }
    }
  }

  quitarServicio(chairId: number, servicioId: number) {
    const services = this._chairStateService.getChairServices(chairId);
    const index = services.findIndex(service => service.id === servicioId);

    if (index > -1) {
      services.splice(index, 1);

      if (services.length === 0) {
        this.chairs.forEach(chair => {
          if (chair.id === chairId) {
            chair.ocupada = false;
            this._chairStateService.setChairOccupied(chairId, false);
          }
        });
      }

      this._chairStateService.setChairServices(chairId, services);
    }
  }

  calcularTotalPrecio(chairId: number): number {
    return (this._chairStateService.getChairServices(chairId) ?? []).reduce((total, service) => total + service.price, 0);
  }

  objectKeys(obj: any): string[] {
    return Object.keys(obj);
  }

  getChairServices() {
    return this._chairStateService.getChairServices(this.selectedChairId ?? 0);
  }
}

