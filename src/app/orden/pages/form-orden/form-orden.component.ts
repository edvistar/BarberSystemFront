import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { UsuarioService } from '../../../usuario/services/usuario.service'; // Asegúrate de que la ruta sea correcta
import { OrdenService } from '../../services/orden.service'; // Servicio para manejar órdenes
import { Login } from 'src/app/usuario/interfaces/login';
import { CompartidoService } from 'src/app/compartido/compartido.service';
import { Servicios } from '../../../servicios/interfaces/servicios';
import { Orden } from '../../interfaces/orden';
import { Cliente } from '../../interfaces/cliente';
import { ServiciosService } from 'src/app/servicios/services/servicios.service';

@Component({
  selector: 'app-form-orden',
  templateUrl: './form-orden.component.html',
  styleUrls: ['./form-orden.component.css']
})
export class FormOrdenComponent implements OnInit{
  @Input() silla: any; // Recibe la silla desde el componente padre
  @Output() ordenEnviada = new EventEmitter<any>(); // Emitir evento hacia el padre

  formOrden: FormGroup;
  ordenId: number | null = null;
  errorMessage: string | undefined;
  orden: Orden = {
    id: 0,
    numero: 0,
    servicios: [], // Inicializamos como un array vacío
    nombreCliente: '',
    usuarioAtiende: ''
  };
  selectedClienteId: { [key: number]: number } = {}; // Inicializa como un objeto vacío
  ListadoClientes: Cliente[] = [];
  numero: number | null = null; // Número de la silla seleccionada
  servicios: Servicios[] = [];

  constructor(
    private fb: FormBuilder,
    private _compartidoService: CompartidoService,
    private _usuarioService: UsuarioService,
    private _ordenService: OrdenService,
    private _servicioServicio: ServiciosService

  ) {
    this.formOrden = this.fb.group({
      numero: ['', Validators.required],
      servicios: [[], Validators.required], // Cambia esto si se trata de un string
      nombreCliente: ['', Validators.required],
      usuarioAtiende: ['', Validators.required]
    });
  }
  ngOnInit(): void {
    this.obtenerClientes();
    this.obtenerServicios();
  }
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
  enviarOrdenForm() {
    if (this.formOrden.valid) {
      const serviciosArray: string[] = this.formOrden.value.servicios.split(',')
        .map((servicio: string) => servicio.trim()); // Especificar el tipo aquí
        //.filter(servicio => servicio); // Filtra valores vacíos

      const orden: Orden = {
        id: 0,
        numero: this.formOrden.value.numero,
        servicios: serviciosArray,
        nombreCliente: this.formOrden.value.nombreCliente,
        usuarioAtiende: this.formOrden.value.usuarioAtiende
      };

      console.log("Enviando Orden", orden);
      this._ordenService.crear(orden).subscribe({
        next: () => {
          this._compartidoService.mostrarAlerta('La orden se guardó con éxito!', 'Completo');
          console.log('Orden enviada correctamente!');
          this.formOrden.reset(); // Reiniciar el formulario
        },
        error: () => {
          this._compartidoService.mostrarAlerta('No se creó la orden', 'Error!');
          console.error('Error al enviar la orden');
        }
      });
    } else {
      this.errorMessage = 'Form is invalid. Please correct the errors and try again.';
      console.error('La orden no es válida:', this.formOrden.errors);
    }
  }


}


