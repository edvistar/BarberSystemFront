import { Component, OnInit } from '@angular/core';
import Swal from 'sweetalert2';
import { ChairService } from '../../../chair/services/chair.service';
import { ServiciosService } from '../../../servicios/services/servicios.service';
import { CompartidoService } from '../../../compartido/compartido.service';
import { Chair } from '../../../chair/interfaces/chair';
import { Servicios } from '../../../servicios/interfaces/servicios';

@Component({
  selector: 'app-orden',
  templateUrl: './orden.component.html',
  styleUrls: ['./orden.component.css']
})
export class OrdenComponent implements OnInit {
  title: string = 'Lista de Sillas';
  chairs: Chair[] = [];
  servicios: Servicios[] = [];
  selectedChairId: number | undefined;
  selectedValue: string | undefined;
  chairServices: { [key: number]: { services: Servicios[] } } = {};

  constructor(
    private _chairServicio: ChairService,
    private _servicioServicio: ServiciosService,
    private _compartidoService: CompartidoService
  ) {}

  ngOnInit(): void {
    this.obtenerChairs();
    this.obtenerServicios();
    this.cargarEstadoDesdeLocalStorage();
  }

  obtenerChairs() {
    this._chairServicio.lista().subscribe({
      next: (data) => {
        if (data.isExitoso) {
          this.chairs = data.resultado.map((chair: Chair) => ({
            ...chair,
            ocupada: false
          }));
        } else {
          this._compartidoService.mostrarAlerta('No se encontraron datos', 'Advertencia!');
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
          this._compartidoService.mostrarAlerta('No se encontraron servicios', 'Advertencia!');
        }
      },
      error: (e) => {
        console.error('Error al obtener los servicios', e);
      }
    });
  }

  nuevaOrden(numero: number) {
    this.chairs.forEach(chair => {
      if (chair.numero === numero) {
        chair.ocupada = true;
        this.selectedChairId = numero;

        if (!this.chairServices[numero]) {
          this.chairServices[numero] = { services: [] };
        }

        this.guardarEstadoEnLocalStorage();
      }
    });
  }

  agregarServicio() {
    if (this.selectedValue && this.selectedChairId) {
      const selectedValueAsNumber = +this.selectedValue;
      const selectedServicio = this.servicios.find(servicio => servicio.id === selectedValueAsNumber);

      if (selectedServicio) {
        const services = this.chairServices[this.selectedChairId].services;

        if (!services.some(service => service.id === selectedServicio.id)) {
          services.push({
            id: selectedServicio.id,
            name: selectedServicio.name,
            description: selectedServicio.description,
            price: selectedServicio.price
          });

          this.selectedValue = undefined;
          this.guardarEstadoEnLocalStorage();
        }
      }
    }
  }

  quitarServicio(chairId: number, servicioId: number) {
    const services = this.chairServices[chairId]?.services;
    if (services) {
      const index = services.findIndex(service => service.id === servicioId);
      if (index > -1) {
        services.splice(index, 1);

        if (services.length === 0) {
          this.chairs.forEach(chair => {
            if (chair.numero === chairId) {
              chair.ocupada = false;
            }
          });
          this.guardarEstadoEnLocalStorage();
        } else {
          this.guardarEstadoEnLocalStorage();
        }
      }
    }
  }

  calcularTotalPrecio(chairId: number): number {
    return (this.chairServices[chairId]?.services ?? []).reduce((total, service) => total + service.price, 0);
  }

  objectKeys(obj: any): string[] {
    return Object.keys(obj);
  }

  cargarEstadoDesdeLocalStorage() {
    const storedChairs = localStorage.getItem('chairs');
    const storedChairServices = localStorage.getItem('chairServices');

    if (storedChairs) {
      this.chairs = JSON.parse(storedChairs);
    }

    if (storedChairServices) {
      this.chairServices = JSON.parse(storedChairServices);
    }
  }

  guardarEstadoEnLocalStorage() {
    localStorage.setItem('chairs', JSON.stringify(this.chairs));
    localStorage.setItem('chairServices', JSON.stringify(this.chairServices));
  }

  eliminarServicios(numero: number) {
    // Usar SweetAlert2 para la confirmación
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Eliminarás todos los servicios de esta silla y la misma estará disponible para ocupar.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        // Eliminar servicios y marcar silla como disponible
        delete this.chairServices[numero];
        this.chairs.forEach(chair => {
          if (chair.numero === numero) {
            chair.ocupada = false;
          }
        });

        this.guardarEstadoEnLocalStorage();
        this.actualizarSillasDisponibles();

        // Mostrar mensaje de éxito
        this._compartidoService.mostrarAlerta('Servicios eliminados y silla liberada', 'Completo');
      }
    });
  }

  actualizarSillasDisponibles() {
    this.chairs = this.chairs.map(chair => {
      if (this.chairServices[chair.numero]?.services.length === 0) {
        chair.ocupada = false;
      }
      return chair;
    });
  }
}
