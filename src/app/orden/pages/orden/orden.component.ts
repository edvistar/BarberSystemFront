import { ApplicationRef, Component, OnInit } from '@angular/core';
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
import { MatSnackBar } from '@angular/material/snack-bar';
import { Cliente } from '../../interfaces/cliente';

@Component({
  selector: 'app-orden',
  templateUrl: './orden.component.html',
  styleUrls: ['./orden.component.css'],
})
export class OrdenComponent implements OnInit {
  title: string = 'Lista de Sillas';
  chairs: Chair[] = [];
  servicios: Servicios[] = [];
  selectedChairId: number = 0;
  selectedValue: string | undefined;
  selectedValues: { [key: number]: number } = {}; // Un objeto donde la clave es el número de la silla
  numero: number | null = null; // Número de la silla seleccionada
  //sillaOcupada: boolean = false; // Estado de ocupación de la silla seleccionada
  sillasOcupadas: Chair[] = [];
  //chairServices: { [key: number]: { services: Servicios[]; ocuped: boolean } } = {};
  ngContainerVisible: boolean = false; // Declaración de la variable
  chairServices: {
    [key: number]: {
      services: Servicios[]; // Servicios asociados a cada silla
      ocuped: number; // Estado de ocupación de la silla
      selectedValue?: number; // Valor seleccionado para un nuevo servicio (opcional)
    };
  } = {};

  // listadoClientes: {
  //   [key: number]: {

  //     nombres:string,
  //     apellidos: string,
  //     selectedValue: string

  //   };
  // } = {};

  ordenId: number | null = null;
  private hubConnection!: signalR.HubConnection;
  username: any;
  zone: any;

  ListadoClientes: Cliente[] = [];
  //selectedClienteId: { [key: number]: number } = {}; // Objeto para guardar el cliente seleccionado por índice
  //selectedClienteId: number | null = null; // Agrega esta propiedad en tu clase
  selectedClienteId: { [key: number]: number } = {}; // Inicializa como un objeto vacío


  constructor(
    private fb: FormBuilder,
    private _chairServicio: ChairService,
    private _servicioServicio: ServiciosService,
    private _compartidoService: CompartidoService,
    private _usuarioService: UsuarioService,
    private _ordenService: OrdenService,
    private snackBar: MatSnackBar,
    private appRef: ApplicationRef
  ) {}

  ngOnInit(): void {

    this.iniciarSignalRConnection();
    this.obtenerEstadoSillas();
    // Inicializa chairServices si es necesario
    if (!this.chairServices) {
      this.chairServices = {};
    }
    this.obtenerServicios();
    this.obtenerClientes();

    this.loadChairServices();

    const usuarioToken = this._compartidoService.obtenerSesion();
    if (usuarioToken != null) {
      this.username = usuarioToken.userName;
    }

    // En el evento de SignalR, ejecuta dentro de la zona
    this.hubConnection.on('ReceiveChairUpdate', (chairId: number, ocuped: number, services: any[]) => {
      console.log(`Evento SignalR recibido para la silla ${chairId}. Estado: ${ocuped}`, services);

      if (this.chairServices[chairId]) {
        // Actualizamos la ocupación y los servicios para la silla
        this.chairServices[chairId] = {
          ...this.chairServices[chairId],
          ocuped: ocuped,
          services: services
        };

        console.log('Estado de chairServices actualizado:', this.chairServices);
        // Ejecutar el método obtenerEstadoSillas() para volver a cargar el estado de todas las sillas
       this.obtenerEstadoSillas();

      } else {
        console.error(`No se encontró chairServices para chairId ${chairId}`);
      }
    });

    this.hubConnection.on(
      'ReceiveServiceUpdate',
      (chairId: number, serviceId: number, services: Servicios[]) => {
        console.log(
          `Actualizando servicios para la silla ${chairId} ${serviceId}`,
          services
        );
        if (this.chairServices[chairId]) {
          this.chairServices[chairId].services = services;
          console.log('chairServices actualizado:', this.chairServices);
        }
      }
    );
  }

  iniciarSignalRConnection() {
    const hubUrl = 'https://barberapi.softallweb.co/ordenHub'; // Asegúrate de que esta URL es correcta
    //const hubUrl = 'http://localhost:26900/api/ordenHub'; // Asegúrate de que esta URL es correcta


    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, { withCredentials: true })
      .build();

    // Start connection with simplified error handling
    this.hubConnection
      .start()
      .then(() => {
        console.log('Conexión a SignalR establecida');
        this.registrarEventos(); // Función para registrar los eventos
      })
      .catch((err) => {
        console.error('Error al conectar a SignalR:', err);
        setTimeout(() => this.iniciarSignalRConnection(), 5000); // Reintentar en 5 segundos
      });
  }

  registrarEventos() {
    this.hubConnection.on('ReceiveChairUpdate', (chairId, ocupedNumber, services) => {
      console.log(`Actualización recibida para la silla ${chairId}. Ocupado: ${ocupedNumber}, Servicios:`, services);

      // Actualizar el estado local de la silla
      this.chairServices[chairId] = {
        ocuped: ocupedNumber,
        services: services || [],
      };
    });

    this.hubConnection.on(
      'ReceiveServiceUpdate',
      (chairId: number, serviceId: number, services: Servicios[]) => {
        console.log(
          `Actualizando servicios para la silla ${chairId} ${serviceId}`,
          services
        );
        if (this.chairServices[chairId]) {
          this.chairServices[chairId].services = services;
          console.log('chairServices actualizado:', this.chairServices);
        }
      }
    );
  }

  // Método para obtener las claves de un objeto
  objectKeys(obj: any): string[] {
    return Object.keys(obj);
  }
  updateLocalChairStatus(chairId: number, ocuped: number, services: any[]) {
    if (this.hubConnection.state === signalR.HubConnectionState.Connected) {
      console.log('SignalR en el evento');
    }
  }
  // Método para verificar si hay sillas ocupadas
  checkOccupiedChairs(): boolean {
    // Lógica para determinar si hay al menos una silla ocupada
    return Object.values(this.chairServices).some(
      (chairService) => chairService.ocuped === 1
    );
  }

  loadChairServices() {
    // Iterar sobre las sillas en chairServices para cargar los servicios
    for (const chairId in this.chairServices) {
      if (this.chairServices.hasOwnProperty(chairId)) {
        const chairService = this.chairServices[chairId];

        // Solo carga los servicios si aún no se han cargado o están vacíos
        if (!chairService.services || chairService.services.length === 0) {
          console.log(
            `Cargando servicios para la silla con ID ${chairId} desde el backend...`
          );

          this._ordenService.obtenerServiciosPorSilla(+chairId).subscribe({
            next: (response) => {
              if (response.isExitoso && response.servicios) {
                // Guardar los servicios obtenidos en la propiedad services de la silla
                this.chairServices[chairId].services = response.servicios;
                console.log(
                  `Servicios cargados exitosamente para la silla ${chairId}:`,
                  response.servicios
                );
              } else {
                console.error(
                  `No se pudieron cargar los servicios para la silla ${chairId}`
                );
              }
            },
            error: (error) => {
              console.error(
                `Error al cargar los servicios para la silla ${chairId}:`,
                error
              );
            },
          });
        } else {
          console.log(
            `Servicios ya cargados previamente para la silla ${chairId}`
          );
        }
      }
    }
  }

  obtenerChairs() {
    this._chairServicio.lista().subscribe({
      next: (data) => {
        if (data.isExitoso) {
          // this.dataSource = new MatTableDataSource(data.resultado);
          // this.dataSource.paginator = this.paginacionTabla;
        } else
          this._compartidoService.mostrarAlerta(
            'No se  encontraron datos',
            'Advertencia!'
          );
      },
      error: (e) => {
        this._compartidoService.mostrarAlerta(e.error.mensaje, 'Error!');
      },
    });
  }

  nuevaOrden(chair: Chair) {
    const chairId = chair.numero;
    chair.ocuped = 1;

    this._chairServicio.editarEstado(chair).subscribe({
      next: (response) => {
        if (response.isExitoso) {
          console.log(`Silla ${chairId} ocupada exitosamente.`);

          // Cambia la visibilidad del ng-container
          this.ngContainerVisible = true;

          // Almacenar servicios asociados
          this._ordenService.obtenerServiciosPorSilla(chairId).subscribe({
            next: (servicesResponse) => {
              if (servicesResponse.isExitoso) {
                this.chairServices[chairId].services =
                  servicesResponse.servicios; // Actualiza servicios
              }
            },
            error: (error) =>
              console.log(`No hay servicios para la silla ${chairId}:`, error),
          });

          if (
            this.hubConnection.state === signalR.HubConnectionState.Connected
          ) {
            console.log('SignalR está conectado al ocupar la silla');

            let ocupedBool: boolean = chair.ocuped === 1;
            let services = this.chairServices[chairId]
              ? this.chairServices[chairId].services
              : [];

            console.log(
              `Enviando estado de la silla ${chairId}. Ocupado: ${ocupedBool}, Servicios:`,
              services
            );

            this.hubConnection
              .invoke('UpdateChairStatus', chairId, ocupedBool, services)
              .then(() =>
                console.log(
                  `Notificación de estado de la silla ${chairId} enviada correctamente.`
                )
              )
              .catch((err) =>
                console.error('Error al enviar actualización de silla', err)
              );
          } else {
            console.error('SignalR no está conectado');
          }

          console.log('SignalR está conectado al ocupar la silla y salir');
        }
      },
      error: (error) => console.error('Error al ocupar la silla:', error),
    });

    this.selectedChairId = chairId;
  }

  obtenerEstadoSillas() {
    console.log('Cargando estado de sillas...');
    this._chairServicio.lista().subscribe({
      next: (data) => {
        if (data.isExitoso) {
          this.chairs = data.resultado;

          // Inicializar chairServices basado en la respuesta
          this.chairs.forEach((chair) => {
            this.chairServices[chair.id] = {
              services: [], // Inicializar como vacío
              ocuped: chair.ocuped,
            };


            // Obtener servicios para cada silla
            this._ordenService.obtenerServiciosPorSilla(chair.id).subscribe({
              next: (servicesResponse) => {
                this.chairServices[chair.id].services =
                servicesResponse.servicios; // Almacenar servicios
              console.log(
                `Servicios cargados para la silla ${chair.id}:`,
                servicesResponse.servicios
              );

               },
               error: (error) => {
                // Este error solo se manejará si hay un problema técnico con la API
                console.log(`No hay servicios para la silla ${chair.id}:`, error);
              },

            });
            this.getSillaOcupadaStatus(chair.id);


          // Aseguramos que el ng-container esté visible si alguna silla está ocupada
          this.ngContainerVisible = this.chairs.some(
            (chair) => chair.ocuped === 1
          );
        });
        } else {
          this._compartidoService.mostrarAlerta(
            'No se encontraron datos',
            'Advertencia!'
          );
        }
      },
      error: (e) => {
        this._compartidoService.mostrarAlerta(e.error.mensaje, 'Error!');
        console.error('Error al obtener las sillas', e);
      },
    });
  }


  cargarServiciosPorSilla(chairId: number) {
    this._ordenService.obtenerServiciosPorSilla(chairId).subscribe({
      next: (response) => {
        if (response.isExitoso) {
          this.chairServices[chairId].services = response.servicios; // Asigna los servicios a la silla
          console.log(
            `Servicios cargados para la silla ${chairId}:`,
            response.servicios
          );
        } else {
          console.error(
            `No se pudieron cargar los servicios para la silla ${chairId}`
          );
        }
      },
      error: (error) =>
        console.error(
          `Error al cargar servicios para la silla ${chairId}:`,
          error
        ),
    });
  }

  updateNgContainerVisibility() {
    // Verificar si hay servicios para la silla seleccionada
    if (this.chairServices[this.selectedChairId]?.services.length > 0) {
      // Lógica para mostrar el ng-container
      this.ngContainerVisible = true; // Cambia esto según tu lógica de visibilidad
    } else {
      this.ngContainerVisible = false; // Ocultar si no hay servicios
    }
  }

  // Al salir de la página, si necesitas guardar algo, podrías hacerlo aquí

  obtenerServicios() {
    this._servicioServicio.lista().subscribe({
      next: (data) => {
        if (data.isExitoso) {
          this.servicios = data.resultado;
        } else {
          this._compartidoService.mostrarAlerta(
            'No se encontraron servicios',
            'Advertencia!'
          );
        }
      },
      error: (e) => {
        this._compartidoService.mostrarAlerta(e.error.mensaje, 'Error!');
        console.error('Error al obtener los servicios', e);
      },
    });
  }

  obtenerClientes() {
    this._usuarioService.listadoClientes().subscribe({
      next: (data) => {
        if (data.isExitoso) {
          this.ListadoClientes = data.resultado;
          console.log("Clientes obtenidos:", this.ListadoClientes); // Verifica los clientes asignados a la variable
        } else {
          this._compartidoService.mostrarAlerta(
            'No se encontraron Clientes',
            'Advertencia!'
          );
        }
      },
      error: (e) => {
        this._compartidoService.mostrarAlerta(e.error.mensaje, 'Error!');
        console.error('Error al obtener los Clientes', e);
      },
    });
  }


  agregarServicio(numero: number) {
    const chairId = numero;
    if (this.selectedChairId == 0) {
      this.selectedChairId = chairId;
      console.error('Lo recupere', chairId);
    }
    if (this.selectedChairId == null) {
      console.error('selectedChairId no está definido');
      this._compartidoService.mostrarAlerta(
        'Debe seleccionar una silla antes de agregar un servicio.',
        'Error'
      );
      return;
    }

    const chairService = this.chairServices[this.selectedChairId];

    // Verifica si chairService está correctamente inicializado
    if (!chairService) {
      console.error(
        `No se encontró información de servicios para la silla con Index ${this.selectedChairId}`
      );
      this._compartidoService.mostrarAlerta(
        'Información de la silla no encontrada.',
        'Error'
      );
      return;
    }

    // Asegúrate de que el servicio está cargado
    if (!chairService.services) {
      console.error(
        `No hay servicios cargados para la silla con ID ${this.selectedChairId}`
      );
      this._compartidoService.mostrarAlerta(
        'No hay servicios asociados a la silla.',
        'Error'
      );
      return;
    }

    // Verifica si selectedValue está definido en chairService
    if (chairService.selectedValue == null) {
      console.error('No se ha seleccionado un servicio');
      this._compartidoService.mostrarAlerta(
        'Debe seleccionar un servicio antes de agregarlo a la silla.',
        'Error'
      );
      return;
    }

    const selectedValueAsNumber = +chairService.selectedValue;
    const selectedServicio = this.servicios.find(
      (servicio) => servicio.id === selectedValueAsNumber
    );

    if (selectedServicio) {
      console.log('Servicio seleccionado:', selectedServicio);

      // Verifica si el servicio ya está agregado a la silla
      if (
        !chairService.services.some(
          (service) => service.id === selectedServicio.id
        )
      ) {
        // Agregar el servicio en la memoria temporal
        chairService.services.push(selectedServicio);

        // Prepara el payload con solo el id de la silla y el id del servicio
        const payload: AgregarServicioDto = {
          chairId: this.selectedChairId,
          serviceId: selectedServicio.id,
        };

        // Llamada a la API para agregar el servicio
        this._ordenService.agregarServicioASilla(payload).subscribe({
          next: (response) => {
            console.log('Response:', response); // Log para inspeccionar la respuesta del servidor

            if (response && response.isExitoso) {
              console.log('Servicio añadido exitosamente');
              this._compartidoService.mostrarAlerta(
                'Servicio añadido exitosamente a la silla.',
                'Éxito'
              );

              // Notificación de actualización con SignalR
              // Asegúrate de que existe la lista de servicios para la silla seleccionada
              const services = this.chairServices[chairId]?.services || [];

              if (
                this.hubConnection.state ===
                signalR.HubConnectionState.Connected
              ) {
                this.hubConnection
                  .invoke(
                    'NotifyServiceAddedRemoved',
                    this.selectedChairId,
                    selectedServicio.id,
                    services
                  )
                  .then(() =>
                    console.log(
                      'Notificación de servicio añadido enviada exitosamente.'
                    )
                  )
                  .catch((err) => {
                    console.error(
                      'Error al notificar adición del servicio:',
                      err
                    );
                    this._compartidoService.mostrarAlerta(
                      'Error al notificar la adición del servicio.',
                      'Error'
                    );
                  });
              } else {
                console.error('SignalR no está conectado');
              }
            } else {
              const errorMsg =
                response?.mensaje || 'Error desconocido al agregar servicio';
              console.error(
                'Error en la respuesta al agregar servicio a la silla:',
                errorMsg
              );
              this._compartidoService.mostrarAlerta(errorMsg, 'Error');
            }
          },
          error: (e) => {
            console.error(
              'Error al llamar al endpoint agregarServicioASilla:',
              e
            );
            this._compartidoService.mostrarAlerta(
              'Error al agregar el servicio. Intente de nuevo.',
              'Error'
            );
          },
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
      this._compartidoService.mostrarAlerta(
        'El servicio seleccionado no se encontró.',
        'Error'
      );
    }
  }

  quitarServicio(chairId: number, servicioId: number) {
    const chairService = this.chairServices[chairId];

    if (!chairService) {
      console.error('Silla no encontrada');
      return;
    }

    const servicioIndex = chairService.services.findIndex(
      (service) => service.id === servicioId
    );

    if (servicioIndex === -1) {
      console.error('Servicio no encontrado en la silla');
      return;
    }

    // Llamar al servicio para eliminar el servicio de la base de datos, pasando chairId y servicioId
    this._ordenService.eliminarServicioDeSilla(chairId, servicioId).subscribe({
      next: (response) => {
        console.log('Servicio eliminado:', response);

        if (response && response.isExitoso) {
          console.log('Servicio eliminado exitosamente');
          this._compartidoService.mostrarAlerta(
            'Servicio eliminado exitosamente de la silla.',
            'Éxito'
          );

          // Eliminar el servicio de la lista local
          chairService.services.splice(servicioIndex, 1);

          // Notificación de actualización con SignalR
          const services = this.chairServices[chairId]?.services || [];

          if (
            this.hubConnection.state === signalR.HubConnectionState.Connected
          ) {
            this.hubConnection
              .invoke(
                'NotifyServiceAddedRemoved',
                chairId,
                servicioId,
                services
              )
              .then(() =>
                console.log(
                  'Notificación de servicio eliminado enviada exitosamente.'
                )
              )
              .catch((err) => {
                console.error(
                  'Error al notificar eliminación del servicio:',
                  err
                );
                this._compartidoService.mostrarAlerta(
                  'Error al notificar la eliminación del servicio.',
                  'Error'
                );
              });
          } else {
            console.error('SignalR no está conectado');
          }
        } else {
          const errorMsg =
            response?.mensaje || 'Error desconocido al eliminar el servicio';
          console.error(
            'Error en la respuesta al eliminar el servicio de la silla:',
            errorMsg
          );
          this._compartidoService.mostrarAlerta(errorMsg, 'Error');
        }
      },
      error: (e) => {
        console.error(
          'Error al llamar al endpoint eliminarServicioDeSilla:',
          e
        );
        this._compartidoService.mostrarAlerta(
          'Error al eliminar el servicio. Intente de nuevo.',
          'Error'
        );
      },
    });
  }

  calcularTotalPrecio(chairId: number): number {
    return (this.chairServices[chairId]?.services ?? []).reduce(
      (total, service) => total + service.price,
      0
    );
  }

  getSillaOcupadaStatus(numero: number): boolean {
    const silla = this.chairs.find((chair) => chair.id === numero); // Busca la silla por su ID

    return !!(silla && silla.ocuped === 1);
  }

  liberarSilla(chair: Chair): void {
    const chairService = this.chairServices[chair.id];
    const chairId = chair.id;

    if (!chairService) {
      console.error('Silla no encontrada');
      return;
    }

    // Verificar si hay servicios asociados
    if (chairService.services && chairService.services.length > 0) {
      this._compartidoService.mostrarAlerta(
        'No se puede liberar la silla porque tiene servicios asociados.',
        'Error'
      );
      return;
    }

    // Cambiar el estado de la silla a no ocupada (disponible)
    chair.ocuped = 0;

    // Llamar al servicio para actualizar el estado de la silla en el backend
    this._chairServicio.editarEstado(chair).subscribe({
      next: (response) => {
        console.log('Response respuesta al liberar:', response.resultado); // Para depuración
        if (response.isExitoso) {
          console.log(`Silla ${chair.id} liberada exitosamente en el backend.`);

          // Actualizar el estado local inmediatamente después de la respuesta exitosa
          this.chairServices[chair.id].ocuped = 0;

          // Verificar que SignalR esté conectado antes de invocar
          if (
            this.hubConnection.state === signalR.HubConnectionState.Connected
          ) {
            let ocupedBool: boolean = chair.ocuped === 0;
            ocupedBool = false;
            this.hubConnection
              .invoke(
                'UpdateChairStatus',
                chair.id,
                ocupedBool,
                chairService.services
              )
              .then(() => {
                console.log(
                  `Silla con ID ${chair.id} liberada y actualización enviada por SignalR. estado ${ocupedBool}`
                );
              })
              .catch((err) => {
                console.error(
                  'Error al enviar la actualización de la silla por SignalR',
                  err
                );
              });
          } else {
            console.error('SignalR no está conectado.');
          }
        } else {
          console.error(
            `Error al liberar la silla ${chair.id}:`,
            response.mensaje
          );
        }
      },
      error: (error) => {
        console.error('Error al liberar la silla:', error);
      },
      complete: () => {
        console.log('Liberación de silla completada.');
      },
    });
  }


  eliminarServiciosSilla(chairId: number): void {
    const chairService = this.chairServices[chairId];

    if (!chairService) {
      console.error('Silla no encontrada');
      return;
    }

    // Verificar si hay servicios asociados a la silla
    if (chairService.services && chairService.services.length > 0) {
      // Hacer una copia de los servicios para evitar problemas de modificación durante la iteración
      const serviciosAEliminar = chairService.services.slice();

      serviciosAEliminar.forEach((service) => {
        this._ordenService.eliminarServicioDeSilla(chairId, service.id).subscribe({
          next: (response) => {
            console.log('Servicio eliminado:', response);

            if (response && response.isExitoso) {
              console.log('Servicio eliminado exitosamente');
              this._compartidoService.mostrarAlerta(
                'Servicio eliminado exitosamente de la silla.',
                'Éxito'
              );

              // Eliminar el servicio de la lista local
              const servicioIndex = chairService.services.findIndex(
                (s) => s.id === service.id
              );
              if (servicioIndex !== -1) {
                chairService.services.splice(servicioIndex, 1);
              }

              // Notificación de actualización con SignalR
              const services = this.chairServices[chairId]?.services || [];

              if (
                this.hubConnection.state === signalR.HubConnectionState.Connected
              ) {
                this.hubConnection
                  .invoke(
                    'NotifyServiceAddedRemoved', // Método SignalR para notificar cambios en servicios
                    chairId,
                    service.id,
                    services
                  )
                  .then(() =>
                    console.log(
                      'Notificación de servicio eliminado enviada exitosamente.'
                    )
                  )
                  .catch((err) => {
                    console.error(
                      'Error al notificar eliminación del servicio:',
                      err
                    );
                    this._compartidoService.mostrarAlerta(
                      'Error al notificar la eliminación del servicio.',
                      'Error'
                    );
                  });
              } else {
                console.error('SignalR no está conectado');
              }
            } else {
              const errorMsg =
                response?.mensaje || 'Error desconocido al eliminar el servicio';
              console.error(
                'Error en la respuesta al eliminar el servicio de la silla:',
                errorMsg
              );
              this._compartidoService.mostrarAlerta(errorMsg, 'Error');
            }
          },
          error: (e) => {
            console.error(
              'Error al llamar al endpoint eliminarServicioDeSilla:',
              e
            );
            this._compartidoService.mostrarAlerta(
              'Error al eliminar el servicio. Intente de nuevo.',
              'Error'
            );
          },
        });
      });
    } else {
      this._compartidoService.mostrarAlerta(
        'No hay servicios asociados a esta silla.',
        'Info'
      );
    }
  }



  actualizarSillasOcupadas(): void {
  // Filtrar las sillas ocupadas
    this.sillasOcupadas = this.chairs.filter((chair) => chair.ocuped); // Asegúrate de que 'ocuped' sea un valor numérico (1 para ocupado, 0 para libre)

    // Para depuración: imprimir la lista de sillas ocupadas en la consola
    console.log('Sillas ocupadas validadas:', this.sillasOcupadas);
  }

  // enviarOrden(chair: number) {
  //   const userName = this._compartidoService.obtenerSesion();
  //   this.username = userName;
  //   console.error('Usuario logueado desde compartido:', this.username);
  //   const chairService = this.chairServices[chair]; // Obtenemos el servicio de la silla correspondiente
  //   console.log('Usuario logueado:', this.username);
  //   // Asegúrate de que chairService y services estén definidos
  //   if (chairService && chairService.services.length > 0) {
  //     const orden: Orden = {
  //       id: this.selectedChairId, // ID opcional para nuevas órdenes
  //       numero: chair, // ID de la silla como número
  //       servicios: chairService.services.map((service) =>
  //         service.id.toString()
  //       ), // Convertir IDs a string
  //       nombreCliente: this.username, // Nombre del cliente
  //       usuarioAtiende: this.username, // Usuario que atiende
  //     };

  //     const chairObj = this.chairs.find((c) => c.id === chair);
  //     // Paso 2: Verificar que se encontró la silla
  //     if (!chairObj) {
  //       console.error('Silla no encontrada');
  //       return; // Salir si no se encontró la silla
  //     }
  //     console.log('encontre la silla', chairObj);
  //     this._ordenService.crear(orden).subscribe({
  //       next: (response) => {
  //         if (response.isExitoso) {
  //           Swal.fire('Éxito', 'Orden enviada correctamente', 'success');

  //           // Llamar a eliminarServiciosLiberarSilla para limpiar servicios y liberar la silla
  //           this.eliminarServiciosSilla(chairObj.id);
  //           if (chairObj) {
  //             console.log('ingreso', chairObj);
  //             // Cambiar el estado de la silla a no ocupada (disponible)
  //             chairObj.ocuped = 0; // Cambiar el estado del objeto chair que se pasará al backend
  //             this._chairServicio.editarEstado(chairObj).subscribe({
  //               next: (response) => {
  //                 console.log('Response:', response); // Para depuración
  //                 if (response.isExitoso) {
  //                   console.log(
  //                     `Silla ${chairObj.id} liberada exitosamente en el backend.`
  //                   );

  //                   // Actualizar el estado local
  //                   //this.chairServices[chair.id].ocuped = 0;
  //                   let ocupedBool: boolean = chairObj.ocuped === 0;

  //                   // Enviar la actualización de estado mediante SignalR
  //                   this.hubConnection
  //                     .invoke(
  //                       'UpdateChairStatus',
  //                       chairObj.id,
  //                       ocupedBool,
  //                       chairService.services
  //                     )
  //                     .then(() => {
  //                       chairObj.ocuped = 0;
  //                       console.log(
  //                         `Silla con ID ${chairObj.id} liberada y actualización enviada por SignalR.`
  //                       );
  //                     })
  //                     .catch((err) => {
  //                       console.error(
  //                         'Error al enviar la actualización de la silla por SignalR',
  //                         err
  //                       );
  //                     });
  //                 } else {
  //                   console.error(
  //                     `Error al liberar la silla ${chairObj.id}:`,
  //                     response.mensaje
  //                   );
  //                 }
  //               },
  //               error: (error) => {
  //                 console.error('Error al liberar la silla:', error);
  //               },
  //               complete: () => {
  //                 console.log('Liberación de silla completada.');
  //               },
  //             });
  //           } else {
  //             console.error('Silla no encontrada');
  //           }
  //         } else {
  //           Swal.fire('Error', 'No se pudo enviar la orden', 'error');
  //         }
  //       },
  //       error: (error) => {
  //         console.error('Error al enviar la orden', error);
  //         Swal.fire('Error', 'Error en el servidor', 'error');
  //       },
  //     });
  //   } else {
  //     console.error('Silla no válida o sin servicios asociados.');
  //     Swal.fire(
  //       'Advertencia',
  //       'Debe seleccionar al menos un servicio para la silla.',
  //       'warning'
  //     );
  //   }
  // }
  // Supongamos que tienes una propiedad para almacenar el ID del cliente seleccionado


enviarOrden(chair: number) {
    const userName = this._compartidoService.obtenerSesion();
    this.username = userName;
    console.error('Usuario logueado desde compartido:', this.username);
    const chairService = this.chairServices[chair]; // Obtenemos el servicio de la silla correspondiente
    console.log('Usuario logueado:', this.username);

    // Asegúrate de que chairService y services estén definidos
    if (chairService && chairService.services.length > 0 && this.selectedClienteId) {
      const orden: Orden = {
        id: this.selectedChairId, // ID opcional para nuevas órdenes
        numero: chair, // ID de la silla como número
        servicios: chairService.services.map((service) =>
          service.id.toString()
        ), // Convertir IDs a string
        nombreCliente: this.ListadoClientes.find(cliente => cliente.id === this.selectedClienteId[chair])?.nombres || 'Cliente no encontrado',

        usuarioAtiende: this.username, // Usuario que atiende
      };

      const chairObj = this.chairs.find((c) => c.id === chair);
      // Paso 2: Verificar que se encontró la silla
      if (!chairObj) {
        console.error('Silla no encontrada');
        return; // Salir si no se encontró la silla
      }
      console.log('encontre la silla', chairObj);

      this._ordenService.crear(orden).subscribe({
        next: (response) => {
          if (response.isExitoso) {
            Swal.fire('Éxito', 'Orden enviada correctamente', 'success');

            // Llamar a eliminarServiciosLiberarSilla para limpiar servicios y liberar la silla
            this.eliminarServiciosSilla(chairObj.id);
            if (chairObj) {
              console.log('ingreso', chairObj);
              // Cambiar el estado de la silla a no ocupada (disponible)
              chairObj.ocuped = 0; // Cambiar el estado del objeto chair que se pasará al backend
              this._chairServicio.editarEstado(chairObj).subscribe({
                next: (response) => {
                  console.log('Response:', response); // Para depuración
                  if (response.isExitoso) {
                    console.log(
                      `Silla ${chairObj.id} liberada exitosamente en el backend.`
                    );

                    // Enviar la actualización de estado mediante SignalR
                    this.hubConnection
                      .invoke(
                        'UpdateChairStatus',
                        chairObj.id,
                        true, // Silla liberada
                        chairService.services
                      )
                      .then(() => {
                        chairObj.ocuped = 0;
                        console.log(
                          `Silla con ID ${chairObj.id} liberada y actualización enviada por SignalR.`
                        );
                      })
                      .catch((err) => {
                        console.error(
                          'Error al enviar la actualización de la silla por SignalR',
                          err
                        );
                      });
                  } else {
                    console.error(
                      `Error al liberar la silla ${chairObj.id}:`,
                      response.mensaje
                    );
                  }
                },
                error: (error) => {
                  console.error('Error al liberar la silla:', error);
                },
                complete: () => {
                  console.log('Liberación de silla completada.');
                },
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
        },
      });
    } else {
      console.error('Silla no válida o sin servicios asociados o cliente no seleccionado.');
      Swal.fire(
        'Advertencia',
        'Debe seleccionar al menos un servicio y un cliente para la silla.',
        'warning'
      );
    }
  }

}
