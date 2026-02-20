import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { CheckInByTournamentComponent } from './check-in-by-tournament.component';

describe('CheckInByTournamentComponent', () => {
  let component: CheckInByTournamentComponent;
  let fixture: ComponentFixture<CheckInByTournamentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CheckInByTournamentComponent],
      providers: [provideHttpClientTesting(), provideRouter([])],
    })
    .compileComponents();

    fixture = TestBed.createComponent(CheckInByTournamentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
