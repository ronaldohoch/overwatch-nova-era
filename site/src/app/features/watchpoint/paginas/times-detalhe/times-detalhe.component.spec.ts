import { ComponentFixture, TestBed } from '@angular/core/testing';
import { computed, signal } from '@angular/core';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from '../../../../core/auth/auth.service';
import type { UserRole } from '../../../../core/auth/user-role';
import { environment } from '../../../../../environments/environment';

import { TimesDetalheComponent } from './times-detalhe.component';

class AuthServiceMock {
  readonly role = signal<UserRole | null>('admin');
  readonly authenticated = signal(true);
  readonly userState = signal<Readonly<Record<string, unknown>> | null>({
    id: 'uid-member-1',
    displayName: 'Jogador Teste',
  });

  readonly userRole = computed(() => this.role());
  readonly isAuthenticated = computed(() => this.authenticated());
  readonly user = computed(() => this.userState());
}

describe('TimesDetalheComponent', () => {
  let component: TimesDetalheComponent;
  let fixture: ComponentFixture<TimesDetalheComponent>;
  let httpController: HttpTestingController;

  function createComponent(): void {
    fixture = TestBed.createComponent(TimesDetalheComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimesDetalheComponent],
      providers: [
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AuthService, useValue: new AuthServiceMock() },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ id: 'team-1' }),
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

  it('should create and load team data', async () => {
    createComponent();

    const teamRequest = httpController.expectOne(`${environment.apiURLTimes}/team-1`);
    expect(teamRequest.request.method).toBe('GET');
    teamRequest.flush({
      id: 'team-1',
      name: 'Alpha',
      category: 'formed',
      captainUid: 'uid-captain',
      captainName: 'Capitão Alpha',
      membersCount: 2,
      createdAt: '2026-01-01T10:00:00.000Z',
    });

    const membersRequest = httpController.expectOne(`${environment.apiURLTimes}/team-1/members`);
    expect(membersRequest.request.method).toBe('GET');
    membersRequest.flush([
      {
        id: 'uid-captain',
        uid: 'uid-captain',
        displayName: 'Capitão Alpha',
        battletag: 'Alpha#1234',
        isCaptain: true,
        joinedAt: '2026-01-01T10:00:00.000Z',
      },
      {
        id: 'uid-member-1',
        uid: 'uid-member-1',
        displayName: 'Membro Bravo',
        battletag: 'Bravo#1234',
        isCaptain: false,
        joinedAt: '2026-01-02T10:00:00.000Z',
      },
    ]);

    const tournamentsRequest = httpController.expectOne(`${environment.apiURLTimes}/team-1/tournaments`);
    expect(tournamentsRequest.request.method).toBe('GET');
    tournamentsRequest.flush({
      teamId: 'team-1',
      tournaments: [
        {
          id: 'tour-1',
          name: 'Torneio Atual',
          status: 'running',
          teamMode: 'closed',
          checkedIn: true,
          startAt: '2026-02-01T18:00:00.000Z',
          participationScope: 'participa',
          participationLabel: 'Participa',
          trophyLabels: [],
        },
      ],
      trophies: [
        {
          tournamentId: 'tour-old-1',
          tournamentName: 'Torneio Antigo',
          label: 'Campeao',
          icon: '🏆',
        },
      ],
    });

    await fixture.whenStable();

    expect(component).toBeTruthy();
    expect(component.team()?.name).toBe('Alpha');
    expect(component.members().length).toBe(2);
    expect(component.tournaments().length).toBe(1);
    expect(component.trophies().length).toBe(1);
  });

  it('should add member by battletag and reload data', async () => {
    createComponent();

    httpController.expectOne(`${environment.apiURLTimes}/team-1`).flush({
      id: 'team-1',
      name: 'Alpha',
      category: 'formed',
      captainUid: 'uid-captain',
      captainName: 'Capitão Alpha',
      membersCount: 1,
      createdAt: '2026-01-01T10:00:00.000Z',
    });
    httpController.expectOne(`${environment.apiURLTimes}/team-1/members`).flush([
      {
        id: 'uid-captain',
        uid: 'uid-captain',
        displayName: 'Capitão Alpha',
        battletag: 'Alpha#1234',
        isCaptain: true,
        joinedAt: '2026-01-01T10:00:00.000Z',
      },
    ]);
    httpController.expectOne(`${environment.apiURLTimes}/team-1/tournaments`).flush({
      teamId: 'team-1',
      tournaments: [],
      trophies: [],
    });

    await fixture.whenStable();

    component.updateBattletag('Novo#1111');
    const submitPromise = component.onAddMember(new Event('submit'));

    const addMemberRequest = httpController.expectOne(`${environment.apiURLTimes}/team-1/members`);
    expect(addMemberRequest.request.method).toBe('POST');
    expect(addMemberRequest.request.body).toEqual({ battletag: 'Novo#1111' });
    addMemberRequest.flush({
      teamId: 'team-1',
      uid: 'uid-new',
      battletag: 'Novo#1111',
      action: 'added',
    });

    httpController.expectOne(`${environment.apiURLTimes}/team-1`).flush({
      id: 'team-1',
      name: 'Alpha',
      category: 'formed',
      captainUid: 'uid-captain',
      captainName: 'Capitão Alpha',
      membersCount: 2,
      createdAt: '2026-01-01T10:00:00.000Z',
    });
    httpController.expectOne(`${environment.apiURLTimes}/team-1/members`).flush([
      {
        id: 'uid-captain',
        uid: 'uid-captain',
        displayName: 'Capitão Alpha',
        battletag: 'Alpha#1234',
        isCaptain: true,
        joinedAt: '2026-01-01T10:00:00.000Z',
      },
      {
        id: 'uid-new',
        uid: 'uid-new',
        displayName: 'Novo Jogador',
        battletag: 'Novo#1111',
        isCaptain: false,
        joinedAt: '2026-01-02T10:00:00.000Z',
      },
    ]);
    httpController.expectOne(`${environment.apiURLTimes}/team-1/tournaments`).flush({
      teamId: 'team-1',
      tournaments: [],
      trophies: [],
    });

    await submitPromise;

    expect(component.addMemberMessage()).toContain('Membro adicionado');
    expect(component.members().length).toBe(2);
  });

  it('should remove member when user is admin and team is random', async () => {
    createComponent();

    httpController.expectOne(`${environment.apiURLTimes}/team-1`).flush({
      id: 'team-1',
      name: 'Alpha Random',
      category: 'random',
      captainUid: 'uid-captain',
      captainName: 'Capitao Alpha',
      membersCount: 2,
      createdAt: '2026-01-01T10:00:00.000Z',
    });
    httpController.expectOne(`${environment.apiURLTimes}/team-1/members`).flush([
      {
        id: 'uid-captain',
        uid: 'uid-captain',
        displayName: 'Capitao Alpha',
        battletag: 'Alpha#1234',
        isCaptain: true,
        joinedAt: '2026-01-01T10:00:00.000Z',
      },
      {
        id: 'uid-member-2',
        uid: 'uid-member-2',
        displayName: 'Membro Delta',
        battletag: 'Delta#9999',
        isCaptain: false,
        joinedAt: '2026-01-02T10:00:00.000Z',
      },
    ]);
    httpController.expectOne(`${environment.apiURLTimes}/team-1/tournaments`).flush({
      teamId: 'team-1',
      tournaments: [],
      trophies: [],
    });

    await fixture.whenStable();

    const targetMember = component.members().find((item) => item.uid === 'uid-member-2');
    expect(targetMember).toBeTruthy();

    const removePromise = component.onRemoveMember(targetMember!);

    const removeRequest = httpController.expectOne(`${environment.apiURLTimes}/team-1/members/uid-member-2`);
    expect(removeRequest.request.method).toBe('DELETE');
    removeRequest.flush({});

    httpController.expectOne(`${environment.apiURLTimes}/team-1`).flush({
      id: 'team-1',
      name: 'Alpha Random',
      category: 'random',
      captainUid: 'uid-captain',
      captainName: 'Capitao Alpha',
      membersCount: 1,
      createdAt: '2026-01-01T10:00:00.000Z',
    });
    httpController.expectOne(`${environment.apiURLTimes}/team-1/members`).flush([
      {
        id: 'uid-captain',
        uid: 'uid-captain',
        displayName: 'Capitao Alpha',
        battletag: 'Alpha#1234',
        isCaptain: true,
        joinedAt: '2026-01-01T10:00:00.000Z',
      },
    ]);

    await removePromise;

    expect(component.removeMemberError()).toBeFalse();
    expect(component.removeMemberMessage()).toContain('removido');
    expect(component.members().length).toBe(1);
  });

  it('should block remove member for formed team', async () => {
    createComponent();

    httpController.expectOne(`${environment.apiURLTimes}/team-1`).flush({
      id: 'team-1',
      name: 'Alpha Formed',
      category: 'formed',
      captainUid: 'uid-captain',
      captainName: 'Capitao Alpha',
      membersCount: 2,
      createdAt: '2026-01-01T10:00:00.000Z',
    });
    httpController.expectOne(`${environment.apiURLTimes}/team-1/members`).flush([
      {
        id: 'uid-captain',
        uid: 'uid-captain',
        displayName: 'Capitao Alpha',
        battletag: 'Alpha#1234',
        isCaptain: true,
        joinedAt: '2026-01-01T10:00:00.000Z',
      },
      {
        id: 'uid-member-2',
        uid: 'uid-member-2',
        displayName: 'Membro Delta',
        battletag: 'Delta#9999',
        isCaptain: false,
        joinedAt: '2026-01-02T10:00:00.000Z',
      },
    ]);
    httpController.expectOne(`${environment.apiURLTimes}/team-1/tournaments`).flush({
      teamId: 'team-1',
      tournaments: [],
      trophies: [],
    });

    await fixture.whenStable();

    const targetMember = component.members().find((item) => item.uid === 'uid-member-2');
    expect(targetMember).toBeTruthy();

    await component.onRemoveMember(targetMember!);

    expect(component.removeMemberError()).toBeTrue();
    expect(component.removeMemberMessage()).toContain('Somente admin pode remover membros de times random');
  });

  it('should allow admin to promote member to captain', async () => {
    createComponent();

    httpController.expectOne(`${environment.apiURLTimes}/team-1`).flush({
      id: 'team-1',
      name: 'Alpha Formed',
      category: 'formed',
      captainUid: 'uid-captain',
      captainName: 'Capitao Alpha',
      membersCount: 2,
      createdAt: '2026-01-01T10:00:00.000Z',
    });
    httpController.expectOne(`${environment.apiURLTimes}/team-1/members`).flush([
      {
        id: 'uid-captain',
        uid: 'uid-captain',
        displayName: 'Capitao Alpha',
        battletag: 'Alpha#1234',
        isCaptain: true,
        joinedAt: '2026-01-01T10:00:00.000Z',
      },
      {
        id: 'uid-member-2',
        uid: 'uid-member-2',
        displayName: 'Membro Delta',
        battletag: 'Delta#9999',
        isCaptain: false,
        joinedAt: '2026-01-02T10:00:00.000Z',
      },
    ]);
    httpController.expectOne(`${environment.apiURLTimes}/team-1/tournaments`).flush({
      teamId: 'team-1',
      tournaments: [],
      trophies: [],
    });

    await fixture.whenStable();

    const targetMember = component.members().find((item) => item.uid === 'uid-member-2');
    expect(targetMember).toBeTruthy();
    expect(component.canPromoteMember(targetMember!)).toBeTrue();

    const promotePromise = component.onPromoteCaptain(targetMember!);

    const promoteRequest = httpController.expectOne(`${environment.apiURLTimes}/team-1/captain`);
    expect(promoteRequest.request.method).toBe('POST');
    expect(promoteRequest.request.body).toEqual({ uid: 'uid-member-2' });
    promoteRequest.flush({});

    httpController.expectOne(`${environment.apiURLTimes}/team-1`).flush({
      id: 'team-1',
      name: 'Alpha Formed',
      category: 'formed',
      captainUid: 'uid-member-2',
      captainName: 'Membro Delta',
      membersCount: 2,
      createdAt: '2026-01-01T10:00:00.000Z',
    });
    httpController.expectOne(`${environment.apiURLTimes}/team-1/members`).flush([
      {
        id: 'uid-captain',
        uid: 'uid-captain',
        displayName: 'Capitao Alpha',
        battletag: 'Alpha#1234',
        isCaptain: false,
        joinedAt: '2026-01-01T10:00:00.000Z',
      },
      {
        id: 'uid-member-2',
        uid: 'uid-member-2',
        displayName: 'Membro Delta',
        battletag: 'Delta#9999',
        isCaptain: true,
        joinedAt: '2026-01-02T10:00:00.000Z',
      },
    ]);

    await promotePromise;

    expect(component.promoteCaptainError()).toBeFalse();
    expect(component.promoteCaptainMessage()).toContain('Capitania transferida');
    expect(component.team()?.captainUid).toBe('uid-member-2');
  });
});
