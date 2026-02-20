import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OwCoinFlipComponent } from './ow-coin-flip.component';

describe('OwCoinFlipComponent', () => {
  let component: OwCoinFlipComponent;
  let fixture: ComponentFixture<OwCoinFlipComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OwCoinFlipComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OwCoinFlipComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
