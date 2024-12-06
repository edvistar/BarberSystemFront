import { Component, Input, OnInit } from '@angular/core';
import { Registro } from '../interfaces/registro';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CompartidoService } from 'src/app/compartido/compartido.service';
import { UsuarioService } from '../services/usuario.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Rol } from '../interfaces/rol';
import { Usuario } from '../interfaces/usuario';

@Component({
  selector: 'app-usuario-registro',
  templateUrl: './usuario-registro.component.html',
  styleUrls: ['./usuario-registro.component.css']
})
export class UsuarioRegistroComponent implements OnInit {
  usuarioId: number| null = null;
;




  @Input() datosUsuario: Registro | null = null;
  formUsuario: FormGroup;
  titulo: string = "Agregar";
  nombreBoton: string = "Guardar";
  errorMessage: string | undefined;
  listaRoles: Rol[] = [];

  constructor(private fb: FormBuilder,
              private _compartidoService: CompartidoService,
              private _usuarioService: UsuarioService,
              private route: ActivatedRoute,
              private router: Router
              ){
    this.formUsuario = this.fb.group({
      apellidos: ['', Validators.required],
      nombres: ['', Validators.required],
      documento: ['', Validators.required],
      userName: ['', Validators.required],
      address: ['', Validators.required],
      phoneNumber: ['', Validators.required],
      email: ['',
        [
          Validators.required,
          Validators.pattern('[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$')
        ]
      ],
      rol: ['', Validators.required],
      password: ['', Validators.required],
      //password: ['', this.usuarioId ? null : Validators.required],

    });

    this._usuarioService.listadoRoles().subscribe({
      next: (data) =>{
        if(data.isExitoso) this.listaRoles = data.resultado;
      },
      error: (e) =>{}
    });

  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
        const id = +params['id']; // Asegúrate de convertir el ID a número
        if (id) {
          this.usuarioId = +id;
            this.obtenerUsuarios(id);
        } else {
            this.titulo = 'Agregar Usuario';
            this.nombreBoton = 'Guardar';
        }
    });
}

volver(): void {
  this.router.navigate(['/layout/usuarioListado']); // Ajusta la ruta según tu configuración
}
  obtenerUsuarios(id: number): void {
    this._usuarioService.lista().subscribe({
      next: (data) => {
        if(data.isExitoso) {
          const usuario = data.resultado.find((u: Usuario) => u.id === id);
          if (usuario) {
            this.formUsuario.patchValue({
            apellidos: usuario.apellidos,
            nombres: usuario.nombres,
            documento: usuario.documento,
            userName: usuario.userName,
            address: usuario.address,
            phoneNumber: usuario.phoneNumber,
            email: usuario.email,
            rol: usuario.rol,
            password: usuario.password
            });
            this.titulo = 'Editar Usuario';
            this.nombreBoton = 'Actualizar';
          } else {
            this._compartidoService.mostrarAlerta(
              'No se encontró el proyecto',
              'Advertencia!'
            );
          }
        } else {
          this._compartidoService.mostrarAlerta(
            'No se encontraron datos',
            'Advertencia!'
          );
        }
      },
      error: (e) => {
        console.error('Error loading projects:', e);
      }
    });
  }
  CrearModificarUsuario(){
    if(this.formUsuario.valid){
      const usuario: Registro = {
        id:this.usuarioId || 0,
        apellidos: this.formUsuario.value.apellidos,
        nombres: this.formUsuario.value.nombres,
        documento: this.formUsuario.value.documento,
        userName: this.formUsuario.value.userName,
        address: this.formUsuario.value.address,
        phoneNumber: this.formUsuario.value.phoneNumber,
        email: this.formUsuario.value.email,
        rol: this.formUsuario.value.rol,
        password: this.formUsuario.value.password

      };
      if(this.usuarioId){
        console.log("id enviado", this.usuarioId)
         // Editar proyecto usuario
         this._usuarioService.editar(usuario).subscribe({
          next: () => {
            this._compartidoService.mostrarAlerta('El Usuario se actualizó con éxito!', 'Completo');
            this.router.navigate(['/layout/usuarioListado']);
          },
          error: (e) => {
            this._compartidoService.mostrarAlerta('No se actualizó el Usuario', 'Error!');
          }
         });
      }else {
        console.log("No edito")
        // Crear nuevo proyecto
        this._usuarioService.crear(usuario).subscribe({
          next: () => {
            this._compartidoService.mostrarAlerta('El Usuario se Creo con éxito!', 'Completo');
            this.router.navigate(['/layout/usuarioListado']);
          },
          error: (e) => {
            this._compartidoService.mostrarAlerta('No se creó el Usuario', 'Error!');
          }
        });
      }
    }else {
      this.errorMessage = 'Form is invalid. Please correct the errors and try again.';
    }
  }
  get email(){
    return this.formUsuario.get('email');
  }
  BackHome(): void {
    this.router.navigate(['/home']); // Cambia '/home' a la ruta correspondiente a la vista principal.
  }
}
