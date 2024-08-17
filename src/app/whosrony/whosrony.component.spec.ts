import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WhosronyComponent } from './whosrony.component';

describe('WhosronyComponent', () => {
  let component: WhosronyComponent;
  let fixture: ComponentFixture<WhosronyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [WhosronyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WhosronyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
