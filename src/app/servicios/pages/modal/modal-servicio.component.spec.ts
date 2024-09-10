import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalServicioComponent } from './modal-servicio.component';

describe('ModalComponent', () => {
  let component: ModalServicioComponent;
  let fixture: ComponentFixture<ModalServicioComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ModalServicioComponent]
    });
    fixture = TestBed.createComponent(ModalServicioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
