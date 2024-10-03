import { Component, OnInit } from '@angular/core';
import Swal from 'sweetalert2';
import { ChairService } from '../../../chair/services/chair.service';
import { ServiciosService } from '../../../servicios/services/servicios.service';
import { CompartidoService } from '../../../compartido/compartido.service';
import { Chair } from '../../../chair/interfaces/chair';
import { Servicios } from '../../../servicios/interfaces/servicios';
import * as signalR from '@microsoft/signalr';
import { UsuarioService } from '../../../usuario/services/usuario.service';
import { Orden } from '../../interfaces/orden';
import { OrdenService } from '../../services/orden.service';
import { FormBuilder } from '@angular/forms';
import { AgregarServicioDto } from '../../interfaces/agregarservicio';

import { catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs'; // Esto es necesario para usar 'of' en el manejo de errores
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-orden',
  templateUrl: './orden.component.html',
  styleUrls: ['./orden.component.css']
})
export class OrdenComponent implements OnInit {
  title: string = 'Lista de Sillas';
  chairs: Chair[] = [];
  servicios: Servicios[] = [];
  selectedChairId: number = 0;
  selectedValue: string | undefined;
  sillasOcupadas: Chair[] = [];
  chairServices: { [key: number]: { services: Servicios[]; ocuped: boolean } } = {};


  ordenId: number | null = null;
  private hubConnection!: signalR.HubConnection;
  username: any;

  constructor(
    private fb: FormBuilder,
    private _chairServicio: ChairService,
    private _servicioServicio: ServiciosService,
    private _compartidoService: CompartidoService,
    private _usuarioService: UsuarioService,
    private _ordenService: OrdenService
  ) { }

  ngOnInit(): void {

    this.iniciarSignalRConnection();
    this.obtenerChairs();
    this.obtenerServicios();

    const usuarioToken = this._compartidoService.obtenerSesion();
    if (usuarioToken != null) {
      this.username = usuarioToken.userName;
    }
    this.hubConnection.on('ReceiveServiceUpdate', (chairId: number, services: Servicios[]) => {
      console.log(`Actualizando servicios para la silla ${chairId}`, services);
      if (this.chairServices[chairId]) {
          this.chairServices[chairId].services = services;
          console.log('chairServices actualizado:', this.chairServices);
      }
  });

  }

  iniciarSignalRConnection() {
    const hubUrl = 'http://localhost:26900/ordenHub'; // Asegúrate de que esta URL es correcta

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, { withCredentials: true })
      .build();

    // Start connection with simplified error handling
    this.hubConnection.start()
      .then(() => {
        console.log('Conexión a SignalR establecida');
        this.registrarEventos(); // Función para registrar los eventos
      })
      .catch(err => {
        console.error('Error al conectar a SignalR:', err);
        setTimeout(() => this.iniciarSignalRConnection(), 5000); // Reintentar en 5 segundos
      });
  }


  registrarEventos() {
    this.hubConnection.on('ReceiveChairUpdate', (chairId: number, ocuped: boolean, services: Servicios[]) => {
      console.log('Evento recibido:', { chairId, ocuped, services });
      this.actualizarEstadoDeSilla(chairId, ocuped, services);
    });
  }


  // Método para obtener las claves de un objeto
  objectKeys(obj: any): string[] {
    return Object.keys(obj);
  }

  actualizarEstadoDeSilla(chairId: number, ocuped: boolean, services: Servicios[]) {
    const chair = this.chairs.find(c => c.numero === chairId);
    if (chair) {
      chair.ocuped = ocuped; // Update the ocuped state
      this.chairServices[chairId] = { services, ocuped }; // Include ocuped in the services object
      this.actualizarSillasOcupadas(); // Update the list of occupied chairs
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

  nuevaOrden(numero: number, chair: Chair) {
    // Ocupar la silla
    chair.ocuped = true;

    // Actualizar el estado de la silla en el backend
    this._chairServicio.editarEstado(chair).subscribe({
        next: (response) => {
            if (response.isExitoso) {
                console.log(`Silla ${chair.id} ocupada exitosamente.`);

                // Inicializar o actualizar el objeto de servicios para la silla
                this.chairServices[numero] = {
                    services: this.chairServices[numero]?.services || [],
                    ocuped: true
                };

                // Actualizar el estado local de las sillas ocupadas
                this.actualizarSillasOcupadas();

                // Sincronizar el estado con SignalR
                if (this.hubConnection.state === signalR.HubConnectionState.Connected) {
                    console.log('SignalR está conectado');
                    this.hubConnection.invoke('UpdateChairStatus', chair.id, chair.ocuped, this.chairServices[numero].services)
                        .catch(err => console.error('Error al enviar actualización de silla', err));
                } else {
                    console.error('SignalR no está conectado');
                }
            } else {
                console.error(`Error al ocupar la silla ${chair.id}:`, response.mensaje);
            }
        },
        error: (error) => console.error('Error al ocupar la silla:', error),
        complete: () => console.log('Ocupación de silla completada.')
    });

    // Configuración local: mantener el número de la silla ocupada
    this.selectedChairId = numero;
}

agregarServicio() {
  if (this.selectedValue && this.selectedChairId) {
      const selectedValueAsNumber = +this.selectedValue;
      const selectedServicio = this.servicios.find(servicio => servicio.id === selectedValueAsNumber);

      if (selectedServicio) {
          // Asegúrate de inicializar chairServices correctamente
          if (!this.chairServices[this.selectedChairId]) {
              this.chairServices[this.selectedChairId] = { services: [], ocuped: false };
          }

          const chairService = this.chairServices[this.selectedChairId];

          // Verifica si el servicio ya está agregado a la silla
          if (!chairService.services.some(service => service.id === selectedServicio.id)) {
              chairService.services.push(selectedServicio); // Agregar el servicio

              const payload: AgregarServicioDto = {
                  chairId: this.selectedChairId,
                  serviceId: selectedServicio.id
              };

              // Llamada a la API para agregar el servicio
              this._ordenService.agregarServicioASilla(payload).subscribe({
                  next: (response) => {
                      console.log('Response:', response); // Log para inspeccionar la respuesta del servidor

                      if (response && response.isExitoso) {
                          console.log('Servicio añadido exitosamente');
                          this._compartidoService.mostrarAlerta('Servicio añadido exitosamente a la silla.', 'Éxito');

                          // Notificación de actualización con SignalR
                          if (this.hubConnection.state === signalR.HubConnectionState.Connected) {
                            console.error('SignalR está conectado');
                            // Invoke your method here
                             // Después de agregar el servicio en el backend
                        this.hubConnection.invoke('NotifyServiceAdded', this.selectedChairId, chairService.services)
                        .then(() => console.log('Notificación de servicio añadido enviada exitosamente.'))
                        .catch(err => {
                            console.error('Error al notificar adición del servicio:', err);
                            this._compartidoService.mostrarAlerta('Error al notificar la adición del servicio.', 'Error');
                        });
                        } else {
                            console.error('SignalR no está conectado');
                        }


                      } else {
                          const errorMsg = response?.mensaje || 'Error desconocido al agregar servicio';
                          console.error('Error en la respuesta al agregar servicio a la silla:', errorMsg);
                          this._compartidoService.mostrarAlerta(errorMsg, 'Error');
                      }
                  },
                  error: (e) => {
                      console.error('Error al llamar al endpoint agregarServicioASilla:', e);
                      this._compartidoService.mostrarAlerta('Error al agregar el servicio. Intente de nuevo.', 'Error');
                  }
              });

              this.selectedValue = undefined; // Reiniciar la selección después de agregar el servicio
          } else {
              const message = `El servicio ${selectedServicio.name} ya está en la silla ${this.selectedChairId}`;
              console.log(message);
              this._compartidoService.mostrarAlerta(message, 'Advertencia');
          }
      } else {
          console.error('Servicio no encontrado');
          this._compartidoService.mostrarAlerta('El servicio seleccionado no se encontró.', 'Error');
      }
  } else {
      console.error('Valores de selección no válidos');
      this._compartidoService.mostrarAlerta('Debe seleccionar un servicio válido.', 'Error');
  }
}



quitarServicio(chairId: number, servicioId: number) {
  const chairService = this.chairServices[chairId];

  if (!chairService) {
    console.error('Silla no encontrada');
    return;
  }

  const servicioIndex = chairService.services.findIndex(service => service.id === servicioId);

  if (servicioIndex === -1) {
    console.error('Servicio no encontrado en la silla');
    return;
  }

  // Llamar al servicio para eliminar el servicio de la base de datos, pasando chairId y servicioId
  this._ordenService.eliminarServicioDeSilla(chairId, servicioId).subscribe({
    next: (response) => {
      console.log('Servicio eliminado:', response);

      if (response && response.isExitoso) {
        // Eliminar el servicio de la lista localmente
        chairService.services.splice(servicioIndex, 1);

        // Mostrar alerta de éxito
        this._compartidoService.mostrarAlerta('Servicio eliminado exitosamente.', 'Éxito');

        // Notificación de actualización con SignalR
        this.hubConnection.invoke('UpdateChairStatus', chairId, chairService.ocuped, chairService.services)
          .catch(err => {
            console.error('Error al notificar actualización del servicio:', err);
            this._compartidoService.mostrarAlerta('Error al notificar la actualización del servicio.', 'Error');
          });
      } else {
        const errorMsg = response?.mensaje || 'Error desconocido al eliminar el servicio';
        console.error('Error en la respuesta al eliminar servicio de la silla:', errorMsg);
        this._compartidoService.mostrarAlerta(errorMsg, 'Error');
      }
    },
    error: (e) => {
      console.error('Error al llamar al endpoint eliminarServicioDeSilla:', e);
      this._compartidoService.mostrarAlerta('Error al eliminar el servicio. Intente de nuevo.', 'Error');
    }
  });
}

  calcularTotalPrecio(chairId: number): number {
    return (this.chairServices[chairId]?.services ?? []).reduce((total, service) => total + service.price, 0);
  }

  getSillaOcupadaStatus(numero: number): boolean {
    const silla = this.chairs.find(chair => chair.numero === numero);
    return !!(silla && silla.ocuped);
  }


  liberarSilla(chairId: number) {
    const chairService = this.chairServices[chairId];

    if (!chairService) {
        console.error('Silla no encontrada');
        return;
    }

    // Comprobar si la silla está ocupada
    if (!chairService.ocuped) {
        console.error('La silla ya está desocupada.');
        return;
    }

    // Verificar si la silla tiene servicios asociados
    if (chairService.services && chairService.services.length > 0) {
        // Mostrar alerta de que no se puede liberar la silla
        this._compartidoService.mostrarAlerta('No se puede liberar la silla porque tiene servicios asociados.', 'Error');
        console.error('No se puede liberar la silla porque tiene servicios asociados.');
        return;
    } else {
        // Si no hay servicios, marcar la silla como desocupada directamente
        chairService.ocuped = false; // Marcar la silla como desocupada
        this.chairServices[chairId] = { ...chairService }; // Actualizar el estado local

        // Notificar a través de SignalR
        this.hubConnection.invoke('UpdateChairStatus', chairId, chairService.ocuped, chairService.services)
            .then(() => {
                console.log(`Silla ${chairId} liberada sin servicios.`);
                this._compartidoService.mostrarAlerta('Silla liberada exitosamente.', 'Éxito');
            })
            .catch(err => {
                console.error('Error al notificar la liberación de la silla:', err);
                this._compartidoService.mostrarAlerta('Error al notificar la liberación de la silla.', 'Error');
            });
    }
}

eliminarServiciosSilla(chair: Chair): void {
  const chairService = this.chairServices[chair.id];

  if (!chairService) {
      console.error('Silla no encontrada');
      return;
  }

  // Verificar si hay servicios asociados a la silla
  if (chairService.services && chairService.services.length > 0) {
      // Hacer una copia de los servicios para evitar problemas de modificación durante la iteración
      const serviciosAEliminar = chairService.services.slice();

      serviciosAEliminar.forEach(service => {
          this._ordenService.eliminarServicioDeSilla(chair.id, service.id).subscribe({
              next: (response) => {
                  console.log('Servicio eliminado:', response);

                  if (response && response.isExitoso) {
                      // Eliminar el servicio de la lista localmente
                      const servicioIndex = chairService.services.findIndex(s => s.id === service.id);
                      if (servicioIndex !== -1) {
                          chairService.services.splice(servicioIndex, 1);
                      }

                      // Mostrar alerta de éxito
                      this._compartidoService.mostrarAlerta('Servicio eliminado exitosamente.', 'Éxito');

                      // Notificación de actualización con SignalR
                      this.hubConnection.invoke('UpdateChairStatus', chair.id, chairService.ocuped, chairService.services)
                          .catch(err => {
                              console.error('Error al notificar actualización del servicio:', err);
                              this._compartidoService.mostrarAlerta('Error al notificar la actualización del servicio.', 'Error');
                          });
                  } else {
                      const errorMsg = response?.mensaje || 'Error desconocido al eliminar el servicio';
                      console.error('Error en la respuesta al eliminar servicio de la silla:', errorMsg);
                      this._compartidoService.mostrarAlerta(errorMsg, 'Error');
                  }
              },
              error: (e) => {
                  console.error('Error al llamar al endpoint eliminarServicioDeSilla:', e);
                  this._compartidoService.mostrarAlerta('Error al eliminar el servicio. Intente de nuevo.', 'Error');
              }
          });
      });
  } else {
      this._compartidoService.mostrarAlerta('No hay servicios asociados a esta silla.', 'Info');
  }
}











  actualizarSillasOcupadas(): void {
    this.sillasOcupadas = this.chairs.filter(chair => chair.ocuped);
  }

  enviarOrden() {
    const orden: Orden = {
      id: this.selectedChairId, // Opcional para nuevas órdenes
      numero: this.selectedChairId,
      servicios: this.chairServices[this.selectedChairId]?.services.map(service => service.name) || [],
      nombreCliente: this.username,
      usuarioAtiende: this.username
    };

    this._ordenService.crear(orden).subscribe({
      next: (response) => {
        if (response.isExitoso) {
          Swal.fire('Éxito', 'Orden enviada correctamente', 'success');

          // Llamar a eliminarServiciosLiberarSilla para limpiar servicios y liberar la silla
          this.eliminarServiciosLiberarSilla(this.selectedChairId);
        } else {
          Swal.fire('Error', 'No se pudo enviar la orden', 'error');
        }
      },
      error: (error) => {
        console.error('Error al enviar la orden', error);
        Swal.fire('Error', 'Error en el servidor', 'error');
      }
    });
  }

  eliminarServiciosLiberarSilla(chairId: number) {
    const chairService = this.chairServices[chairId];

    // Limpiar los servicios de la silla
    if (chairService && chairService.services) {
      chairService.services.forEach(async (service) => {
        await this._ordenService.eliminarServicioDeSilla(chairId, service.id).toPromise();
      });

      // Limpiar servicios y establecer ocupada en false
      this.chairServices[chairId] = { services: [], ocuped: false };

      // Notificación de actualización con SignalR
      this.hubConnection.invoke('UpdateChairStatus', chairId, false, [])
        .catch(err => {
          console.error('Error al notificar actualización del servicio:', err);
        });
    }
  }

}
