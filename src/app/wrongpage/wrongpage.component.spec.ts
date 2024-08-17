import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WrongpageComponent } from './wrongpage.component';

describe('WrongpageComponent', () => {
  let component: WrongpageComponent;
  let fixture: ComponentFixture<WrongpageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [WrongpageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WrongpageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
