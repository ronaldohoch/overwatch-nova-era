import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EscolherMapasComponent } from './escolher-mapas.component';

describe('EscolherMapasComponent', () => {
  let component: EscolherMapasComponent;
  let fixture: ComponentFixture<EscolherMapasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EscolherMapasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EscolherMapasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
