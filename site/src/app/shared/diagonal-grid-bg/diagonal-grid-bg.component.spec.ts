import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DiagonalGridBgComponent } from './diagonal-grid-bg.component';

describe('DiagonalGridBgComponent', () => {
  let component: DiagonalGridBgComponent;
  let fixture: ComponentFixture<DiagonalGridBgComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DiagonalGridBgComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DiagonalGridBgComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
