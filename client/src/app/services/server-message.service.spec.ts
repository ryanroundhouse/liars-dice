import { TestBed } from '@angular/core/testing';

import { ServerMessageService } from './server-message.service';

describe('ServerMessageService', () => {
  let service: ServerMessageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ServerMessageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
