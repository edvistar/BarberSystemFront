import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalChairComponent } from './modal-chair.component';

describe('ModalComponent', () => {
  let component: ModalChairComponent;
  let fixture: ComponentFixture<ModalChairComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ModalChairComponent]
    });
    fixture = TestBed.createComponent(ModalChairComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
