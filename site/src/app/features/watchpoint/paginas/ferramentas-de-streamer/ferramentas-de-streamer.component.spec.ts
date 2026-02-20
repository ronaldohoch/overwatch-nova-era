import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FerramentasDeStreamerComponent } from './ferramentas-de-streamer.component';

describe('FerramentasDeStreamerComponent', () => {
  let component: FerramentasDeStreamerComponent;
  let fixture: ComponentFixture<FerramentasDeStreamerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FerramentasDeStreamerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FerramentasDeStreamerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
