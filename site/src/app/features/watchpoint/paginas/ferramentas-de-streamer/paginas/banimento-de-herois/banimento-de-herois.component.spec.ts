import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BanimentoDeHeroisComponent } from './banimento-de-herois.component';

describe('BanimentoDeHeroisComponent', () => {
  let component: BanimentoDeHeroisComponent;
  let fixture: ComponentFixture<BanimentoDeHeroisComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BanimentoDeHeroisComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BanimentoDeHeroisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
