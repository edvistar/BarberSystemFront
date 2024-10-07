import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { UsuarioService } from '../../../usuario/services/usuario.service'; // Asegúrate de que la ruta sea correcta
import { OrdenService } from '../../services/orden.service'; // Servicio para manejar órdenes
import { Login } from 'src/app/usuario/interfaces/login';
import { CompartidoService } from 'src/app/compartido/compartido.service';
import { Servicios } from '../../../servicios/interfaces/servicios';
import { Orden } from '../../interfaces/orden';

@Component({
  selector: 'app-form-orden',
  templateUrl: './form-orden.component.html',
  styleUrls: ['./form-orden.component.css']
})
export class FormOrdenComponent {
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

  constructor(
    private fb: FormBuilder,
    private _compartidoService: CompartidoService,
    private _usuarioService: UsuarioService,
    private _ordenService: OrdenService,

  ) {
    this.formOrden = this.fb.group({
      numero: ['', Validators.required],
      servicios: [[], Validators.required], // Cambia esto si se trata de un string
      nombreCliente: ['', Validators.required],
      usuarioAtiende: ['', Validators.required]
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


