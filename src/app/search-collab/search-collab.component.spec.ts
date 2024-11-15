import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchCollabComponent } from './search-collab.component';

describe('SearchCollabComponent', () => {
  let component: SearchCollabComponent;
  let fixture: ComponentFixture<SearchCollabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SearchCollabComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SearchCollabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
