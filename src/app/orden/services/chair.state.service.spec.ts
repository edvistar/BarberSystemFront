import { TestBed } from '@angular/core/testing';

import { ChairStateService } from './chair.state.service';

describe('ChairStateService', () => {
  let service: ChairStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChairStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
