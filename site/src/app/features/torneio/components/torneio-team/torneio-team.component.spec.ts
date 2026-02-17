import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TorneioTeamComponent } from './torneio-team.component';

describe('TorneioTeamComponent', () => {
  let component: TorneioTeamComponent;
  let fixture: ComponentFixture<TorneioTeamComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TorneioTeamComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TorneioTeamComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
