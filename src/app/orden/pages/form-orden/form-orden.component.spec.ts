import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormOrdenComponent } from './form-orden.component';

describe('FormOrdenComponent', () => {
  let component: FormOrdenComponent;
  let fixture: ComponentFixture<FormOrdenComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FormOrdenComponent]
    });
    fixture = TestBed.createComponent(FormOrdenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
