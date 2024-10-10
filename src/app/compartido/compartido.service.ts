import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Sesion } from '../usuario/interfaces/sesion';

@Injectable({
  providedIn: 'root'
})
export class CompartidoService {

  constructor(private _snackBar: MatSnackBar) { }

  mostrarAlerta(mensaje: string, tipo:string){
    this._snackBar.open(mensaje, tipo, {
      horizontalPosition: "end",
      verticalPosition: "top",
      duration:3000
    })
  }

  guardarSesion(sesion: Sesion){
    localStorage.setItem("usuarioSesion", JSON.stringify (sesion.userName));
  }

  obtenerSesion(){
    const sesionString = localStorage.getItem("usuarioSesion");
    console.log("Aqui estamos verificando",sesionString);
    const usuarioSesion = JSON.parse(sesionString!);
    console.log("Aqui estamos verificando",usuarioSesion);
    return usuarioSesion;
  }

  eliminarSesion(){
    localStorage.removeItem("usuarioSesion");
  }
}
