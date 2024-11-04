import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BlogReelComponent } from './blog-reel.component';

describe('BlogReelComponent', () => {
  let component: BlogReelComponent;
  let fixture: ComponentFixture<BlogReelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BlogReelComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BlogReelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
