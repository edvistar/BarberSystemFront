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

          // Si ya no hay servicios en la silla, eliminar la silla del listado y actualizar el estado a desocupado
          if (chairService.services.length === 0) {
            chairService.ocuped = false; // Marcar la silla como desocupada si no tiene servicios
            this.chairServices[chairId] = { ...chairService }; // Actualizar el estado local
          }

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

  eliminarServicios(chairId: number) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Eliminarás todos los servicios asociados a esta silla.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar todos los servicios',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        // Obtener los servicios asociados a la silla
        const serviciosAsociados = this.chairServices[chairId]?.services || [];

        if (serviciosAsociados.length === 0) {
          console.warn(`No hay servicios asociados a la silla con ID ${chairId}`);
          this._compartidoService.mostrarAlerta('No hay servicios asociados a esta silla.', 'Advertencia');
        } else {
          // Iterar sobre cada servicio y eliminarlo uno por uno pasando el chairId y serviceId
          const eliminaciones = serviciosAsociados.map(async (servicio) => {
            try {
              // Usar el ID de la silla y el ID del servicio para eliminarlos
              const response = await firstValueFrom(this._ordenService.eliminarServicioDeSilla(chairId, servicio.id));
              if (response && response.isExitoso) {
                console.log(`Servicio con id ${servicio.id} eliminado exitosamente de la silla ${chairId}`);
              } else {
                const errorMessage = response?.mensaje || 'Error desconocido al eliminar el servicio';
                console.error(`Error al eliminar el servicio con id ${servicio.id}:`, errorMessage);
                this._compartidoService.mostrarAlerta(errorMessage, 'Error');
              }
            } catch (e) {
              console.error('Error al eliminar el servicio:', e);
              this._compartidoService.mostrarAlerta('Error al eliminar el servicio. Intente de nuevo.', 'Error');
            }
          });

          // Esperar hasta que todos los servicios se eliminen
          await Promise.all(eliminaciones);

          // Llamar al método liberarSilla para liberar la silla después de eliminar todos los servicios
          const silla = this.chairs.find(chair => chair.id === chairId); // Usar el ID de la silla para encontrarla
          if (silla) {
            this.liberarSilla(silla);
          } else {
            console.error(`Silla con ID ${chairId} no encontrada.`);
          }
        }
      }
    });
  }








  getSillaOcupadaStatus(numero: number): boolean {
    const silla = this.chairs.find(chair => chair.numero === numero);
    return !!(silla && silla.ocuped);
  }



  liberarSilla(silla: Chair): void {
    // Cambiar el estado de la silla a no ocupada (disponible) localmente
    silla.ocuped = false; // Se asume que silla tiene la propiedad 'ocuped'

    // Llamar al servicio para actualizar el estado de la silla en el backend
    this._chairServicio.editarEstado(silla).subscribe({
      next: (response) => {
        if (response.isExitoso) {
          console.log(`Silla ${silla.id} liberada exitosamente en el backend.`);

          // Actualizar el estado local de las sillas ocupadas
          // Aquí puedes limpiar los servicios asociados si es necesario
          //this.chairServices[silla.id].services = []; // Limpiar servicios si es necesario
         this.chairServices[silla.id].ocuped = false; // Actualizar el estado a no ocupada

          // Enviar la actualización de estado mediante SignalR
          if (this.hubConnection.state === signalR.HubConnectionState.Connected) {
            this.hubConnection.invoke('UpdateChairStatus', silla.id, silla.ocuped, this.chairServices[silla.id].services)
              .then(() => {
                console.log(`Silla con ID ${silla.id} liberada y actualización enviada por SignalR.`);
              })
              .catch(err => {
                console.error('Error al enviar la actualización de la silla por SignalR', err);
              });
          }
        } else {
          console.error(`Error al liberar la silla ${silla.id}:`, response.mensaje);
        }
      },
      error: (error) => {
        console.error('Error al liberar la silla:', error);
      },
      complete: () => {
        console.log('Liberación de silla completada.');
      }
    });
  }

  // liberarSilla(silla: Chair): void {
  //   silla.ocuped = false; // Set chair as not occupied

  //   // Update backend
  //   this._chairServicio.editarEstado(silla).subscribe({
  //     next: (response) => {
  //       if (response.isExitoso) {

  //         console.log(`Silla ${silla.id} liberada exitosamente.`);
  //         this.actualizarSillasOcupadas(); // Update local state of occupied chairs

  //         // SignalR update
  //         if (this.hubConnection.state === signalR.HubConnectionState.Connected) {
  //           this.hubConnection.invoke('UpdateChairStatus', silla.id, 'disponible', [])
  //             .catch(err => console.error('Error updating via SignalR', err));
  //         }
  //       }
  //     },
  //     error: (error) => {
  //       console.error('Error al liberar la silla:', error);
  //     }
  //   });
  // }







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
          this.chairServices[this.selectedChairId] = { services: [], ocuped: false }; // Limpiar servicios y establecer ocupada en false

          this.liberarSilla(this.chairs.find(chair => chair.numero === this.selectedChairId)!); // Liberar la silla
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

  quitarTodosLosServicios(chairId: number) {
    // Obtener los servicios asociados a la silla
    const serviciosAsociados = this.chairServices[chairId]?.services || [];

    // Si no hay servicios, no hay nada que hacer
    if (serviciosAsociados.length === 0) {
      console.warn(`No hay servicios asociados a la silla con ID ${chairId}`);
      return; // Puedes agregar aquí un mensaje si lo deseas
    }

    // Iterar sobre cada servicio y eliminarlo uno por uno pasando el chairId y serviceId
    const eliminaciones = serviciosAsociados.map(async (servicio) => {
      try {
        // Usar el ID de la silla y el ID del servicio para eliminarlos
        const response = await firstValueFrom(this._ordenService.eliminarServicioDeSilla(chairId, servicio.id));
        if (response && response.isExitoso) {
          console.log(`Servicio con id ${servicio.id} eliminado exitosamente de la silla ${chairId}`);
        } else {
          const errorMessage = response?.mensaje || 'Error desconocido al eliminar el servicio';
          console.error(`Error al eliminar el servicio con id ${servicio.id}:`, errorMessage);
        }
      } catch (e) {
        console.error('Error al eliminar el servicio:', e);
      }
    });

    // Esperar hasta que todos los servicios se eliminen
    Promise.all(eliminaciones).then(() => {
      // Aquí puedes actualizar la vista si es necesario
      // Por ejemplo, eliminando la silla de la lista de sillas ocupadas
      this.chairServices[chairId].services = []; // Actualiza los servicios en la vista
    });
  }

  // ocuparSilla(silla: Chair) {
  //   silla.ocuped = true; // Actualizamos el estado localmente primero
  //   this._chairServicio.editarEstado(silla).subscribe({
  //     next: (response) => {
  //       if (response.isExitoso) {
  //         console.log(`Silla ${silla.id} ocupada/liberada exitosamente.`);
  //       } else {
  //         console.error(`Error al actualizar el estado de la silla ${silla.id}:`, response.mensaje);
  //       }
  //     },
  //     error: (error) => {
  //       console.error('Error al actualizar el estado de la silla:', error);
  //     },
  //     complete: () => {
  //       console.log('Actualización de estado completada.');
  //     }
  //   });

  // }
}
