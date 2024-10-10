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
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';

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
  selectedValues: { [key: number]: number } = {}; // Un objeto donde la clave es el número de la silla
  sillasOcupadas: Chair[] = [];
  //chairServices: { [key: number]: { services: Servicios[]; ocuped: boolean } } = {};
  chairServices: {
    [key: number]: {
      services: Servicios[],
      ocuped: number,
      selectedValue?: number // Agregamos selectedValue como opcional
    }
  } = {};



  ordenId: number | null = null;
  private hubConnection!: signalR.HubConnection;
  username: any;

  constructor(
    private fb: FormBuilder,
    private _chairServicio: ChairService,
    private _servicioServicio: ServiciosService,
    private _compartidoService: CompartidoService,
    private _usuarioService: UsuarioService,
    private _ordenService: OrdenService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {

    this.iniciarSignalRConnection();
    //this.obtenerChairs();
    this.obtenerServicios();
    this.obtenerEstadoSillas();



    const usuarioToken = this._compartidoService.obtenerSesion();
    if (usuarioToken != null) {
      this.username = usuarioToken.userName;
    }
    this.hubConnection.on('ReceiveServiceUpdate', (chairId: number, ocuped: number, services: Servicios[]) => {
      console.log(`Actualizando servicios para la silla ${chairId} ${ocuped}`, services);
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
    this.hubConnection.on('ReceiveChairUpdate', (chairId: number, ocuped: number, services: Servicios[]) => {
      console.log('Evento recibido:', { chairId, ocuped, services });
      this.actualizarEstadoDeSilla(chairId, ocuped, services);
    });
  }


  // Método para obtener las claves de un objeto
  objectKeys(obj: any): string[] {
    return Object.keys(obj);
  }

  actualizarEstadoDeSilla(chairId: number, ocuped: number, services: Servicios[]) {
    console.log('Actualizando estado de la silla:', { chairId, ocuped, services });

    // Busca la silla dentro de la lista de sillas y actualiza su estado
    const chairIndex = this.chairs.findIndex(chair => chair.id === chairId);

    if (chairIndex !== -1) {
      this.chairs[chairIndex].ocuped = ocuped; // Actualiza el estado de ocupación
      // Si quieres actualizar los servicios también:
      this.chairServices[chairId] = { services, ocuped };

      console.log('Estado actualizado:', this.chairs[chairIndex]);
    } else {
      console.error('Silla no encontrada:', chairId);
    }
  }

// Método para ocupar o liberar una silla
nuevaOrden(chair: Chair) {
  const chairId = chair.id; // o chair.numero si ese es el ID
  chair.ocuped = 1; // Cambiar a 1 si está ocupada, o a 0 si está libre

  // Ocupar la silla
  // Actualizar el estado de la silla en el backend
  this._chairServicio.editarEstado(chair).subscribe({
      next: (response) => {
          if (response.isExitoso) {
              console.log(`Silla ${chair.id} ocupada exitosamente.`);

              // Inicializar o actualizar el objeto de servicios para la silla
              this.chairServices[chairId] = {
                  services: this.chairServices[chairId]?.services || [],
                  ocuped: chair.ocuped
              };

              // Actualizar el estado local de las sillas ocupadas
              this.actualizarSillasOcupadas();

              // Sincronizar el estado con SignalR
              if (this.hubConnection.state === signalR.HubConnectionState.Connected) {
                  console.log('SignalR está conectado OK');
                  let ocupedBool: boolean = chair.ocuped === 1;
                  this.hubConnection.invoke('UpdateChairStatus', chair.id, ocupedBool
                    , this.chairServices[chairId].services
                  )
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
  this.selectedChairId = chairId;
}

// Método para obtener el estado inicial de las sillas
obtenerEstadoSillas() {
  this._chairServicio.lista().subscribe({
      next: (data) => {
          if (data.isExitoso) {
              this.chairs = data.resultado;

              // Inicializar chairServices basado en la respuesta
              this.chairs.forEach(chair => {
                  this.chairServices[chair.id] = { services: [], ocuped: chair.ocuped }; // Asumir que chair.ocupada tiene el estado

                  // Obtener los servicios para cada silla
                  this._ordenService.obtenerServiciosPorSilla(chair.id).subscribe((services: any[]) => {
                      this.chairServices[chair.id].services = services; // Almacenar los servicios en chairServices
                  });
              });
          } else {
              this._compartidoService.mostrarAlerta('No se encontraron datos', 'Advertencia!');
          }
      },
      error: (e) => {this._compartidoService.mostrarAlerta(e.error.mensaje, 'Error!')
          console.error('Error al obtener las sillas', e);
      }
  });
}



// Al salir de la página, si necesitas guardar algo, podrías hacerlo aquí

  obtenerServicios() {
    this._servicioServicio.lista().subscribe({
      next: (data) => {
        if (data.isExitoso) {
          this.servicios = data.resultado;
        } else {
          this._compartidoService.mostrarAlerta('No se encontraron servicios', 'Advertencia!');
        }
      },
      error: (e) => {this._compartidoService.mostrarAlerta(e.error.mensaje, 'Error!');
        console.error('Error al obtener los servicios', e);
      }
    });
  }

  agregarServicio() {
    if (this.selectedChairId == null) {
        console.error('selectedChairId no está definido');
        this._compartidoService.mostrarAlerta('Debe seleccionar una silla antes de agregar un servicio.', 'Error');
        return;
    }

    const chairService = this.chairServices[this.selectedChairId];

    // Verifica si chairService está correctamente inicializado
    if (!chairService) {
        console.error(`No se encontró información de servicios para la silla con ID ${this.selectedChairId}`);
        this._compartidoService.mostrarAlerta('Información de la silla no encontrada.', 'Error');
        return;
    }

    // Verifica si selectedValue está definido en chairService
    if (chairService.selectedValue == null) {
        console.error('No se ha seleccionado un servicio');
        this._compartidoService.mostrarAlerta('Debe seleccionar un servicio antes de agregarlo a la silla.', 'Error');
        return;
    }

    const selectedValueAsNumber = +chairService.selectedValue;
    const selectedServicio = this.servicios.find(servicio => servicio.id === selectedValueAsNumber);

    if (selectedServicio) {
        console.log('Servicio seleccionado:', selectedServicio);

        // Verifica si el servicio ya está agregado a la silla
        if (!chairService.services.some(service => service.id === selectedServicio.id)) {
            // Agregar el servicio en la memoria temporal
            chairService.services.push(selectedServicio);

            // Prepara el payload con solo el id de la silla y el id del servicio
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
                            this.hubConnection.invoke('NotifyServiceAdded', this.selectedChairId, selectedServicio.id)
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

            // Reiniciar la selección después de agregar el servicio
            chairService.selectedValue = undefined;
        } else {
            const message = `El servicio ${selectedServicio.name} ya está en la silla ${this.selectedChairId}`;
            console.log(message);
            this._compartidoService.mostrarAlerta(message, 'Advertencia');
        }
    } else {
        console.error('Servicio no encontrado');
        this._compartidoService.mostrarAlerta('El servicio seleccionado no se encontró.', 'Error');
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
    //console.log(`Silla Nº ${numero} estado:`, silla?.ocuped);
    return !!(silla && silla.ocuped === 1);
  }

  liberarSilla(chair: Chair): void {
    const chairService = this.chairServices[chair.id];
    const chairId = chair.id; // o chair.numero si ese es el ID
    //const estado = 0; // o el valor correspondiente para ocupación (1 o 0)

    if (!chairService) {
        console.error('Silla no encontrada');
        return;
    }

    // Verificar si hay servicios asociados
    if (chairService.services && chairService.services.length > 0) {
        this._compartidoService.mostrarAlerta('No se puede liberar la silla porque tiene servicios asociados.', 'Error');
        return;
    }

    // Cambiar el estado de la silla a no ocupada (disponible)
    chair.ocuped = 0; // Cambiar el estado del objeto chair que se pasará al backend

    // Llamar al servicio para actualizar el estado de la silla en el backend
    this._chairServicio.editarEstado(chair).subscribe({
        next: (response) => {
            console.log('Response:', response); // Para depuración
            if (response.isExitoso) {
                console.log(`Silla ${chair.id} liberada exitosamente en el backend.`);

                // Actualizar el estado local
                //this.chairServices[chair.id].ocuped = 0;
                let ocupedBool: boolean = chair.ocuped === 0;

                // Enviar la actualización de estado mediante SignalR
                this.hubConnection.invoke('UpdateChairStatus', chair.id, ocupedBool, chairService.services)
                    .then(() => {
                      chair.ocuped = 0;
                        console.log(`Silla con ID ${chair.id} liberada y actualización enviada por SignalR.`);
                    })
                    .catch(err => {
                        console.error('Error al enviar la actualización de la silla por SignalR', err);
                    });
            } else {
                console.error(`Error al liberar la silla ${chair.id}:`, response.mensaje);
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


  enviarOrden(chair: number) {
    const chairService = this.chairServices[chair]; // Obtenemos el servicio de la silla correspondiente

    // Asegúrate de que chairService y services estén definidos
    if (chairService && chairService.services.length > 0) {
        const orden: Orden = {
           id: this.selectedChairId, // ID opcional para nuevas órdenes
            numero: chair, // ID de la silla como número
            servicios: chairService.services.map(service => service.id.toString()), // Convertir IDs a string
            nombreCliente: this.username, // Nombre del cliente
            usuarioAtiende: this.username // Usuario que atiende
        };
        const chairObj = this.chairs.find(c => c.id === chair);
        // Paso 2: Verificar que se encontró la silla
          if (!chairObj) {
            console.error('Silla no encontrada');
            return; // Salir si no se encontró la silla
        }
        console.log("encontre la silla", chairObj)
        this._ordenService.crear(orden).subscribe({
            next: (response) => {
                if (response.isExitoso) {
                    Swal.fire('Éxito', 'Orden enviada correctamente', 'success');

                    // Llamar a eliminarServiciosLiberarSilla para limpiar servicios y liberar la silla
                   this.eliminarServiciosSilla(chairObj);
                    if (chairObj) {
                      console.log("ingreso",chairObj)
                      // Cambiar el estado de la silla a no ocupada (disponible)
                      chairObj.ocuped = 0; // Cambiar el estado del objeto chair que se pasará al backend
                      this._chairServicio.editarEstado(chairObj).subscribe({
                        next: (response) => {
                            console.log('Response:', response); // Para depuración
                            if (response.isExitoso) {
                                console.log(`Silla ${chairObj.id} liberada exitosamente en el backend.`);

                                // Actualizar el estado local
                                //this.chairServices[chair.id].ocuped = 0;
                                let ocupedBool: boolean = chairObj.ocuped === 0;

                                // Enviar la actualización de estado mediante SignalR
                                this.hubConnection.invoke('UpdateChairStatus', chairObj.id, ocupedBool, chairService.services)
                                    .then(() => {
                                      chairObj.ocuped = 0;
                                        console.log(`Silla con ID ${chairObj.id} liberada y actualización enviada por SignalR.`);
                                    })
                                    .catch(err => {
                                        console.error('Error al enviar la actualización de la silla por SignalR', err);
                                    });
                            } else {
                                console.error(`Error al liberar la silla ${chairObj.id}:`, response.mensaje);
                            }
                        },
                        error: (error) => {
                            console.error('Error al liberar la silla:', error);
                        },
                        complete: () => {

                            console.log('Liberación de silla completada.');
                        }
                    });
                    } else {
                        console.error('Silla no encontrada');
                    }

                } else {
                    Swal.fire('Error', 'No se pudo enviar la orden', 'error');
                }
            },
            error: (error) => {
                console.error('Error al enviar la orden', error);
                Swal.fire('Error', 'Error en el servidor', 'error');
            }
        });
    } else {
        console.error('Silla no válida o sin servicios asociados.');
        Swal.fire('Advertencia', 'Debe seleccionar al menos un servicio para la silla.', 'warning');
    }
  }

}
