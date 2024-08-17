import { TestBed } from '@angular/core/testing';

import { WriteserviceService } from './writeservice.service';

describe('WriteserviceService', () => {
  let service: WriteserviceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WriteserviceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
