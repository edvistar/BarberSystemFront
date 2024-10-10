import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UsuarioListadoComponent } from './usuario-listado.component';

describe('UsuarioListadoComponent', () => {
  let component: UsuarioListadoComponent;
  let fixture: ComponentFixture<UsuarioListadoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [UsuarioListadoComponent]
    });
    fixture = TestBed.createComponent(UsuarioListadoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
