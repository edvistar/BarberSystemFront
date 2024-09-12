import { Component, OnInit } from '@angular/core';
import Swal from 'sweetalert2';
import { ChairService } from '../../../chair/services/chair.service';
import { ServiciosService } from '../../../servicios/services/servicios.service';
import { CompartidoService } from '../../../compartido/compartido.service';
import { Chair } from '../../../chair/interfaces/chair';
import { Servicios } from '../../../servicios/interfaces/servicios';
import * as signalR from '@microsoft/signalr';

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
  chairServices: { [key: number]: { services: Servicios[] } } = {}; // Asegúrate de que esto esté inicializado como un objeto vacío

  // SignalR connection
  private hubConnection!: signalR.HubConnection;

  constructor(
    private _chairServicio: ChairService,
    private _servicioServicio: ServiciosService,
    private _compartidoService: CompartidoService
  ) {}

  ngOnInit(): void {
    this.iniciarSignalRConnection();
    this.obtenerChairs();
    this.obtenerServicios();
    this.cargarEstadoDesdeLocalStorage();
  }

  iniciarSignalRConnection() {
    // Inicializamos la conexión con el hub de SignalR
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('http://localhost:26900/ordenHub',{withCredentials: true}) // Cambia esto a la URL de tu API
      .build();

    this.hubConnection
      .start()
      .then(() => console.log('Conectado a SignalR'))
      .catch(err => console.error('Error al conectar a SignalR', err));

    // Escuchar actualizaciones de otras sesiones
    this.hubConnection.on('ReceiveChairUpdate', (chairId: number, status: string, services: any[]) => {
      this.actualizarEstadoDeSilla(chairId, status, services);
    });
  }

  actualizarEstadoDeSilla(chairId: number, status: string, services: any[]) {
    const chair = this.chairs.find(c => c.numero === chairId);
    if (chair) {
      chair.ocupada = status === 'ocupada';

      // Actualiza los servicios de la silla
      this.chairServices[chairId] = { services };

      this.guardarEstadoEnLocalStorage();
    }
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

        // Enviar actualización de la silla a través de SignalR
        this.hubConnection.invoke('UpdateChairStatus', numero, 'ocupada', this.chairServices[numero].services)
          .catch(err => console.error('Error al enviar actualización de silla', err));
      }
    });
  }

  agregarServicio() {
    if (this.selectedValue && this.selectedChairId) {
      const selectedValueAsNumber = +this.selectedValue;
      const selectedServicio = this.servicios.find(servicio => servicio.id === selectedValueAsNumber);

      if (selectedServicio) {
        const services = this.chairServices[this.selectedChairId]?.services || [];

        // Agregar el nuevo servicio solo si no está ya presente
        if (!services.some(service => service.id === selectedServicio.id)) {
          services.push({
            id: selectedServicio.id,
            name: selectedServicio.name,
            description: selectedServicio.description,
            price: selectedServicio.price
          });

          // Actualizar la silla como ocupada si no lo está
          if (!this.chairs.some(chair => chair.numero === this.selectedChairId && chair.ocupada)) {
            this.chairs.forEach(chair => {
              if (chair.numero === this.selectedChairId) {
                chair.ocupada = true;
              }
            });
          }

          // Limpiar selección y guardar estado en Local Storage
          this.selectedValue = undefined;
          this.guardarEstadoEnLocalStorage();

          // Sincronizar con SignalR
          this.hubConnection.invoke('UpdateChairStatus', this.selectedChairId, 'ocupada', services)
            .catch(err => console.error('Error al enviar actualización de servicios', err));
        }
      }
    }
  }

quitarServicio(chairId: number, servicioId: number) {
  const chairService = this.chairServices[chairId];
  if (!chairService) {
      console.error('Silla no encontrada');
      return;
  }
  const services = chairService.services || [];
  const index = services.findIndex(service => service.id === servicioId);

  if (index > -1) {
      services.splice(index, 1);

      // Actualizar el estado de la silla a desocupada si no hay servicios
      if (services.length === 0) {
          this.chairs.forEach(chair => {
              if (chair.id === chairId) {
                  chair.ocupada = false;
              }
          });
      }

      this.guardarEstadoEnLocalStorage();

      // Enviar actualización de servicios de la silla a través de SignalR
      this.hubConnection.invoke('UpdateChairStatus', chairId, 'ocupada', services)
          .then(() => console.log('Servicio eliminado y actualización enviada'))
          .catch(err => console.error('Error al enviar actualización de servicios', err));
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
