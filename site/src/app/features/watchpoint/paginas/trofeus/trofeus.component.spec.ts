import { ComponentFixture, TestBed } from '@angular/core/testing';
import { computed, signal } from '@angular/core';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import type { UserRole } from '../../../../core/auth/user-role';
import { environment } from '../../../../../environments/environment';
import { TrofeusComponent } from './trofeus.component';

class AuthServiceMock {
  readonly role = signal<UserRole | null>('admin');
  readonly userRole = computed(() => this.role());
}

describe('TrofeusComponent', () => {
  let component: TrofeusComponent;
  let fixture: ComponentFixture<TrofeusComponent>;
  let httpController: HttpTestingController;

  function createComponent(): void {
    fixture = TestBed.createComponent(TrofeusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrofeusComponent],
      providers: [
        provideHttpClientTesting(),
        { provide: AuthService, useValue: new AuthServiceMock() },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap({}),
              paramMap: convertToParamMap({}),
            },
          },
        },
      ],
    }).compileComponents();

    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  it('should create and load catalog', async () => {
    createComponent();

    const request = httpController.expectOne(environment.apiURLTrofeus);
    expect(request.request.method).toBe('GET');
    request.flush([
      {
        id: 'trophy-1',
        code: 'checkin-pro',
        name: 'Checkin Pro',
        icon: '🏅',
        target: 'user',
        active: true,
        automation: {
          enabled: true,
          event: 'tournament_random_checkin',
        },
      },
    ]);

    await fixture.whenStable();

    expect(component.catalog().length).toBe(1);
    expect(component.catalog()[0].code).toBe('checkin-pro');
  });

  it('should submit award payload for user battletag', async () => {
    createComponent();

    httpController.expectOne(environment.apiURLTrofeus).flush([
      {
        id: 'trophy-1',
        code: 'checkin-pro',
        name: 'Checkin Pro',
        icon: '🏅',
        target: 'user',
        active: true,
        automation: {
          enabled: false,
          event: null,
        },
      },
    ]);

    await fixture.whenStable();

    component.updateAwardField('trophyId', 'trophy-1');
    component.updateAwardField('targetType', 'user');
    component.updateAwardField('targetIdentifier', 'Player#1234');

    const submitPromise = component.onAwardTrophy(new Event('submit'));

    const awardRequest = httpController.expectOne(`${environment.apiURLTrofeus}/award`);
    expect(awardRequest.request.method).toBe('POST');
    expect(awardRequest.request.body).toEqual({
      trophyId: 'trophy-1',
      targetType: 'user',
      battletag: 'Player#1234',
      reason: undefined,
    });
    awardRequest.flush({
      targetType: 'user',
      targetId: 'uid-1',
      trophyId: 'trophy-1',
      trophyCode: 'checkin-pro',
      trophyName: 'Checkin Pro',
      assigned: true,
      alreadyAssigned: false,
    });

    httpController.expectOne(environment.apiURLTrofeus).flush([
      {
        id: 'trophy-1',
        code: 'checkin-pro',
        name: 'Checkin Pro',
        icon: '🏅',
        target: 'user',
        active: true,
        automation: {
          enabled: false,
          event: null,
        },
      },
    ]);

    await submitPromise;

    expect(component.awardStatus()).toBe('success');
    expect(component.awardMessage()).toContain('Trofeu concedido');
  });
});
