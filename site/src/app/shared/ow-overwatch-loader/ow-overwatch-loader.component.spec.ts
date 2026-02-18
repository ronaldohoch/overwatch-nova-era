import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OwOverwatchLoaderComponent } from './ow-overwatch-loader.component';

describe('OwOverwatchLoaderComponent', () => {
  let component: OwOverwatchLoaderComponent;
  let fixture: ComponentFixture<OwOverwatchLoaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OwOverwatchLoaderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OwOverwatchLoaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
