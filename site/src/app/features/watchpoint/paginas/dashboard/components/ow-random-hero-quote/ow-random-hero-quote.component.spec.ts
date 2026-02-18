import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OwRandomHeroQuoteComponent } from './ow-random-hero-quote.component';

describe('OwRandomHeroQuoteComponent', () => {
  let component: OwRandomHeroQuoteComponent;
  let fixture: ComponentFixture<OwRandomHeroQuoteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OwRandomHeroQuoteComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OwRandomHeroQuoteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
