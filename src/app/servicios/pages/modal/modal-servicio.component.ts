import { Component, Inject, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ServiciosService } from '../../services/servicios.service';
import { Servicios } from '../../interfaces/servicios';
import { CompartidoService } from 'src/app/compartido/compartido.service';



@Component({
  selector: 'app-modal',
  templateUrl: './modal-servicio.component.html',
  styleUrls: ['./modal-servicio.component.css']
})
export class ModalServicioComponent implements OnInit {
  formServicio: FormGroup;
  titulo: string = "Agregar";
  nombreBoton: string = "Guardar";

  constructor(private modal: MatDialogRef<ModalServicioComponent>,
              @Inject(MAT_DIALOG_DATA) public datosServicio: Servicios,
              private fb: FormBuilder,
              private _serviceServicio: ServiciosService,
              private _compartidoServicio: CompartidoService){

    this.formServicio = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      price: ['', Validators.required]
    });
    if(this.datosServicio != null){
      this.titulo = 'Editar';
      this.nombreBoton = 'Actualizar'
    }
  }
  ngOnInit(): void {
    if(this.datosServicio != null)
    {
      this.formServicio.patchValue({
        name: this.datosServicio.name,
        description: this.datosServicio.description,
        price: this.datosServicio.price
      })
    }
  }

  crearModificarServicio(){
    const servicio: Servicios = {
      id: this.datosServicio == null ? 0 : this.datosServicio.id,
      name: this.formServicio.value.name,
      description: this.formServicio.value.description,
      price: this.formServicio.value.price
    }
    if(this.datosServicio == null)
    {
        //Crear nueva Especiali
        this._serviceServicio.crear(servicio).subscribe({
          next: (data) =>{
            if(data.isExitoso)
            {
              this._compartidoServicio.mostrarAlerta('La Especialidad ha sido grabada con Exito!',
                                                    'Completo');
              this.modal.close("true");
            }
            else
              this._compartidoServicio.mostrarAlerta('No se pudo crear la especialidad',
                                        'Error!');
          },
          error: (e) => {
            this._compartidoServicio.mostrarAlerta(e.error.errores, 'Error!');
          }
        })
    }
    else
    {
      //Editar
      this._serviceServicio.editar(servicio).subscribe({
        next: (data) =>{
          if(data.isExitoso)
          {
            this._compartidoServicio.mostrarAlerta('El servicio ha sido Actualizado con Exito!',
                                                  'Completo');
            this.modal.close("true");
          }
          else
            this._compartidoServicio.mostrarAlerta('No se pudo Actualizar el servicio',
                                      'Error!');

        },
        error: (e) => {}
      })
    }
  }
}
