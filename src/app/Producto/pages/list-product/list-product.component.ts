import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-list-product',
  templateUrl: './list-product.component.html',
  styleUrls: ['./list-product.component.css']
})
export class ListProductComponent implements OnInit {

  constructor(private router: Router){

  }
  nuevoProducto(){
    this.router.navigate(['/layout/product']);
  }

  ngOnInit(): void {
    throw new Error('Method not implemented.');
  }



}
