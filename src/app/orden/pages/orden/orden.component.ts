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
  sillasOcupadas: Chair[] = []; // Lista de sillas ocupadas
  chairServices: { [key: number]: { services: Servicios[] } } = {}; // Servicios por silla

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

  // Inicializa la conexión a SignalR
  iniciarSignalRConnection() {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('http://localhost:26900/ordenHub', { withCredentials: true }) // Cambia la URL según tu configuración
      .build();

    this.hubConnection.start()
      .then(() => console.log('Conectado a SignalR'))
      .catch(err => console.error('Error al conectar a SignalR', err));

    this.hubConnection.on('ReceiveChairUpdate', (chairId: number, status: string, services: Servicios[]) => {
      this.actualizarEstadoDeSilla(chairId, status, services);
    });
  }

  // Actualiza el estado de una silla y sus servicios
  actualizarEstadoDeSilla(chairId: number, status: string, services: Servicios[]) {
    const chair = this.chairs.find(c => c.numero === chairId);
    if (chair) {
      chair.ocupada = status === 'ocupada';
      this.chairServices[chairId] = { services };
      this.guardarEstadoEnLocalStorage();
      this.actualizarSillasOcupadas();
    }
  }

  // Obtiene la lista de sillas del servidor
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

  // Obtiene la lista de servicios del servidor
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

  // Maneja la ocupación de una silla
  nuevaOrden(numero: number, chair: Chair) {
    chair.ocupada = true;
    this.selectedChairId = numero;

    if (!this.chairServices[numero]) {
      this.chairServices[numero] = { services: [] };
    }

    this.guardarEstadoEnLocalStorage();

    this.hubConnection.invoke('UpdateChairStatus', numero, 'ocupada', this.chairServices[numero].services)
      .catch(err => console.error('Error al enviar actualización de silla', err));
  }

  // Agrega un servicio a la silla seleccionada
  agregarServicio() {
    if (this.selectedValue && this.selectedChairId) {
      const selectedValueAsNumber = +this.selectedValue;
      const selectedServicio = this.servicios.find(servicio => servicio.id === selectedValueAsNumber);

      if (selectedServicio) {
        const chairService = this.chairServices[this.selectedChairId];
        if (!chairService) {
          console.error('Silla no encontrada');
          return;
        }

        const services = chairService.services || [];

        if (!services.some(service => service.id === selectedServicio.id)) {
          services.push(selectedServicio);
          this.selectedValue = undefined;
          this.guardarEstadoEnLocalStorage();

          this.hubConnection.invoke('UpdateChairStatus', this.selectedChairId, 'ocupada', services)
            .then(() => console.log('Servicio añadido y actualización enviada'))
            .catch(err => console.error('Error al enviar actualización de servicios', err));
        }
      } else {
        console.error('Servicio no encontrado');
      }
    } else {
      console.error('Valores de selección no válidos');
    }
  }

  // Quita un servicio de la silla
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

      if (services.length === 0) {
        this.chairs.forEach(chair => {
          if (chair.numero === chairId) {
            chair.ocupada = false;
          }
        });
      }

      this.guardarEstadoEnLocalStorage();

      this.hubConnection.invoke('UpdateChairStatus', chairId, 'ocupada', services)
        .then(() => console.log('Servicio eliminado y actualización enviada'))
        .catch(err => console.error('Error al enviar actualización de servicios', err));
    }
  }

  // Calcula el total del precio de los servicios de una silla
  calcularTotalPrecio(chairId: number): number {
    return (this.chairServices[chairId]?.services ?? []).reduce((total, service) => total + service.price, 0);
  }

  // Obtiene las claves de un objeto
  objectKeys(obj: { [key: string]: any }): string[] {
    return Object.keys(obj);
  }

  // Carga el estado de las sillas y servicios desde el almacenamiento local
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

  // Guarda el estado de las sillas y servicios en el almacenamiento local
  guardarEstadoEnLocalStorage() {
    localStorage.setItem('chairs', JSON.stringify(this.chairs));
    localStorage.setItem('chairServices', JSON.stringify(this.chairServices));
  }

  // Elimina todos los servicios de una silla y la marca como disponible
  eliminarServicios(numero: number) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Eliminarás esta silla de la lista para ocuparla seleccionela nuevamente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        // Eliminar los servicios de la silla
        delete this.chairServices[numero];

        // Marcar la silla como disponible
        this.chairs.forEach(chair => {
          if (chair.numero === chair.numero) {
            chair.ocupada = false;
          }
        });

        // Actualizar el estado en localStorage
        this.guardarEstadoEnLocalStorage();

        // Actualizar la lista de sillas disponibles y ocupadas
        this.actualizarSillasDisponibles();
        this.actualizarSillasOcupadas();
        //this.liberarSilla(numero);

        // Mostrar alerta
        this._compartidoService.mostrarAlerta('Servicios eliminados y silla liberada', 'Completo');


      }
    });
  }


  // Obtiene el estado de ocupación de una silla
  getSillaOcupadaStatus(numero: number): boolean {
    const silla = this.chairs.find(chair => chair.numero === numero);
    return !!(silla && silla.ocupada);
  }

  // Libera una silla y notifica a otros clientes
liberarSilla(silla: Chair): void {
  // Marcar la silla como disponible
  silla.ocupada = false;


  // Eliminar la silla de la lista de sillas ocupadas
  this.actualizarSillasOcupadas();

  // Actualizar el estado de la silla a través de SignalR
  if (this.hubConnection.state === signalR.HubConnectionState.Connected) {
    this.hubConnection.invoke('UpdateChairStatus', silla.numero, 'disponible', [])
      .then(() => {
        console.log(`Silla ${silla.numero} liberada y actualización enviada`);
      })
      .catch(err => {
        console.error('Error al enviar la actualización de la silla', err);
      });
  }

  // Eliminar la silla de la lista de sillas ocupadas localmente
  this.actualizarSillasOcupadas();
}

  // Actualiza la lista de sillas ocupadas
  actualizarSillasOcupadas(): void {
    this.sillasOcupadas = this.chairs.filter(chair => chair.ocupada);
  }

  // Actualiza las sillas disponibles en base a los servicios
  actualizarSillasDisponibles() {
    this.chairs = this.chairs.map(chair => {
      if (this.chairServices[chair.numero]?.services.length === 0) {
        chair.ocupada = false;
      }
      return chair;
    });
  }
}
