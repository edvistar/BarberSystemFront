import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductDetalleComponent } from './product-detalle.component';

describe('ProductDetalleComponent', () => {
  let component: ProductDetalleComponent;
  let fixture: ComponentFixture<ProductDetalleComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ProductDetalleComponent]
    });
    fixture = TestBed.createComponent(ProductDetalleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
