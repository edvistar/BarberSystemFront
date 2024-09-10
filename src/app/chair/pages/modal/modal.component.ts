import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ChairService } from '../../services/chair.service';
import { Chair } from '../../interfaces/chair';
import { CompartidoService } from 'src/app/compartido/compartido.service';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.css']
})
export class ModalComponent implements OnInit {
  formChair: FormGroup;
  titulo: string = "Agregar";
  nombreBoton: string = "Guardar";

  constructor(private modal: MatDialogRef<ModalComponent>,
              @Inject(MAT_DIALOG_DATA) public datosChair: Chair,
              private fb: FormBuilder,
              private _chairServicio: ChairService,
              private _compartidoServicio: CompartidoService){

    this.formChair = this.fb.group({
      name: ['', Validators.required],
      numero: ['', Validators.required],
      logo: ['', Validators.required]
    });
    if(this.datosChair != null){
      this.titulo = 'Editar';
      this.nombreBoton = 'Actualizar'
    }
  }
  ngOnInit(): void {
    if(this.datosChair != null)
    {
      this.formChair.patchValue({
        name: this.datosChair.name,
        numero: this.datosChair.numero,
        logo: this.datosChair.logo
      })
    }
  }

  crearModificarChair(){
    const chair: Chair = {
      id: this.datosChair == null ? 0 : this.datosChair.id,
      name: this.formChair.value.name,
      numero: this.formChair.value.numero,
      logo: this.formChair.value.logo
    }
    if(this.datosChair == null)
    {
        //Crear nueva Especiali
        this._chairServicio.crear(chair).subscribe({
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
      this._chairServicio.editar(chair).subscribe({
        next: (data) =>{
          if(data.isExitoso)
          {
            this._compartidoServicio.mostrarAlerta('La Especialidad ha sido Actualizada con Exito!',
                                                  'Completo');
            this.modal.close("true");
          }
          else
            this._compartidoServicio.mostrarAlerta('No se pudo Actualizar la especialidad',
                                      'Error!');

        },
        error: (e) => {}
      })
    }
  }
}
