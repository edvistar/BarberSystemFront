import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListadoOrdenComponent } from './listado-orden.component';

describe('ListadoOrdenComponent', () => {
  let component: ListadoOrdenComponent;
  let fixture: ComponentFixture<ListadoOrdenComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ListadoOrdenComponent]
    });
    fixture = TestBed.createComponent(ListadoOrdenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
