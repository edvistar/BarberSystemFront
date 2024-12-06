import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UsuarioService } from '../services/usuario.service';
import { CompartidoService } from '../../compartido/compartido.service';
import { Router } from '@angular/router';
import { Login } from '../interfaces/login';
import { CookieService } from 'ngx-cookie-service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {

  formLogin: FormGroup;
  ocultarPassword:boolean = true;
  mostrarLoading: boolean = false;

  constructor (private fb: FormBuilder,
                private router: Router,
                private UsuarioService: UsuarioService,
                private CompartidoService: CompartidoService,
                private cookieService: CookieService){
    this.formLogin = this.fb.group({
      username:['', Validators.required],
      password:['', Validators.required]

    });
  }

  iniciarSesion(){
    this.mostrarLoading = true;
    const request: Login = {
      userName: this.formLogin.value.username,
      password: this.formLogin.value.password
    };
    this.UsuarioService.iniciarSesion(request).subscribe({
      next: (response) => {
        this.CompartidoService.guardarSesion(response);
        this.cookieService.set(
          'Authorization',
          `Bearer ${response.token}`,
          undefined,
          '/',
          undefined,
          true,
          'Strict'
        );
        this.router.navigate(['layout']);

      },
      complete: ()=>{
        this.mostrarLoading = false;
      },
      error:(error) =>{
        this.CompartidoService.mostrarAlerta(error.error, 'Error!');
        this.mostrarLoading = false;

      }
    });
  }
  BackHome(): void {
    this.router.navigate(['/home']); // Cambia '/home' a la ruta correspondiente a la vista principal.
  }
}
