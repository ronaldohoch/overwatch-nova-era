import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OwRouletteComponent } from './ow-roulette.component';

describe('OwRouletteComponent', () => {
  let component: OwRouletteComponent;
  let fixture: ComponentFixture<OwRouletteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OwRouletteComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OwRouletteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
