import { ComponentFixture, TestBed } from '@angular/core/testing';
import { computed, signal } from '@angular/core';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import { AuthService } from '../../../../core/auth/auth.service';
import type { UserRole } from '../../../../core/auth/user-role';
import { TorneiosStatusComponent } from './torneios-status.component';

class AuthServiceMock {
  readonly role = signal<UserRole | null>('admin');
  readonly userRole = computed(() => this.role());
  readonly isAuthenticated = computed(() => true);
}

describe('TorneiosStatusComponent', () => {
  let component: TorneiosStatusComponent;
  let fixture: ComponentFixture<TorneiosStatusComponent>;
  let httpController: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TorneiosStatusComponent],
      providers: [
        provideHttpClientTesting(),
        { provide: AuthService, useValue: new AuthServiceMock() },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ id: 'tournament-1' }),
            },
          },
        },
      ],
    }).compileComponents();

    httpController = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(TorneiosStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    httpController.verify();
  });

  it('should create and load tournament by route id', async () => {
    const request = httpController.expectOne(`${environment.apiURLTorneios}/tournament-1`);
    expect(request.request.method).toBe('GET');
    request.flush({
      id: 'tournament-1',
      name: 'Torneio Teste',
      status: 'published',
      teamMode: 'random',
      startAt: '2026-03-10T19:00:00.000Z',
    });

    await fixture.whenStable();

    expect(component).toBeTruthy();
    expect(component.selectedTournament()?.id).toBe('tournament-1');
  });
});
