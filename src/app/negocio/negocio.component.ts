import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-negocio',
  templateUrl: './negocio.component.html',
  styleUrls: ['./negocio.component.css']
})
export class NegocioComponent implements OnInit {
  chairId: number | undefined;
  titulo: string = "Vista Negocio";
  selectedValue: string | undefined;
  selectedServices: { value: string, viewValue: string, precio: number }[] = [];
  totalPrecio: number = 0;

  options = [
    { value: 'cortedecabello', viewValue: 'Corte de Cabello', precio: 15 },
    { value: 'cortedebarba', viewValue: 'Corte de Barba', precio: 10 },
    { value: 'manicure', viewValue: 'Manicure', precio: 20 }
  ];

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    // Obtiene el ID de la silla desde la URL
    this.route.paramMap.subscribe(params => {
      this.chairId = +params.get('id')!;
    });
  }

  agregarServicio() {
    if (this.selectedValue) {
      const selectedOption = this.options.find(option => option.value === this.selectedValue);
      if (selectedOption && !this.selectedServices.some(service => service.value === this.selectedValue)) {
        this.selectedServices.push({
          value: selectedOption.value,
          viewValue: selectedOption.viewValue,
          precio: selectedOption.precio
        });
        this.actualizarTotal();
        // Limpiar la selección después de agregar
        this.selectedValue = undefined;
      }
    }
  }

  actualizarTotal() {
    this.totalPrecio = this.selectedServices.reduce((total, service) => total + service.precio, 0);
  }
}
