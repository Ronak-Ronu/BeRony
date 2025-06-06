import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActivityHeatmapComponent } from './activity-heatmap.component';

describe('ActivityHeatmapComponent', () => {
  let component: ActivityHeatmapComponent;
  let fixture: ComponentFixture<ActivityHeatmapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ActivityHeatmapComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ActivityHeatmapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
