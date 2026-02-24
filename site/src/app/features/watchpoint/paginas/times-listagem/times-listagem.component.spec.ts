import { ComponentFixture, TestBed } from '@angular/core/testing';
import { computed, signal } from '@angular/core';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from '../../../../core/auth/auth.service';
import type { UserRole } from '../../../../core/auth/user-role';
import { environment } from '../../../../../environments/environment';

import { TimesListagemComponent } from './times-listagem.component';

class AuthServiceMock {
  readonly role = signal<UserRole | null>('competidor');
  readonly authenticated = signal(true);
  readonly userState = signal<Readonly<Record<string, unknown>> | null>({
    id: 'member-uid',
    displayName: 'Jogador Teste',
  });

  readonly userRole = computed(() => this.role());
  readonly isAuthenticated = computed(() => this.authenticated());
  readonly user = computed(() => this.userState());
}

describe('TimesListagemComponent', () => {
  let component: TimesListagemComponent;
  let fixture: ComponentFixture<TimesListagemComponent>;
  let httpController: HttpTestingController;
  let authMock: AuthServiceMock;

  function createComponent(): void {
    fixture = TestBed.createComponent(TimesListagemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(async () => {
    authMock = new AuthServiceMock();

    await TestBed.configureTestingModule({
      imports: [TimesListagemComponent],
      providers: [
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authMock },
      ],
    })
    .compileComponents();

    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  it('should create', async () => {
    createComponent();

    const request = httpController.expectOne(`${environment.apiURLTimes}/me`);
    request.flush([]);

    await fixture.whenStable();

    expect(component).toBeTruthy();
  });

  it('should request all teams for admin', async () => {
    authMock.role.set('admin');
    createComponent();

    const request = httpController.expectOne(environment.apiURLTimes);
    expect(request.request.method).toBe('GET');
    request.flush([
      {
        id: 'team-admin-1',
        name: 'Alpha',
        category: 'formed',
        membersCount: 4,
        createdAt: '2026-01-01T10:00:00.000Z',
      },
    ]);

    await fixture.whenStable();

    expect(component.teams().map((team) => team.id)).toEqual(['team-admin-1']);
  });

  it('should request all teams for streamer', async () => {
    authMock.role.set('streamer');
    createComponent();

    const request = httpController.expectOne(environment.apiURLTimes);
    expect(request.request.method).toBe('GET');
    request.flush([
      {
        id: 'team-streamer-1',
        name: 'Omega',
        category: 'random',
        membersCount: 8,
        createdAt: '2026-01-02T10:00:00.000Z',
      },
    ]);

    await fixture.whenStable();

    expect(component.teams().map((team) => team.id)).toEqual(['team-streamer-1']);
  });

  it('should request only my teams for admin when scope filter is mine', async () => {
    authMock.role.set('admin');
    createComponent();

    const allTeamsRequest = httpController.expectOne(environment.apiURLTimes);
    expect(allTeamsRequest.request.method).toBe('GET');
    allTeamsRequest.flush([
      {
        id: 'team-admin-all',
        name: 'Team All',
        category: 'formed',
        membersCount: 5,
        createdAt: '2026-01-10T10:00:00.000Z',
      },
    ]);

    await fixture.whenStable();

    component.applyAdminTeamScopeFilter('mine');

    const myTeamsRequest = httpController.expectOne(`${environment.apiURLTimes}/me`);
    expect(myTeamsRequest.request.method).toBe('GET');
    myTeamsRequest.flush([
      {
        id: 'team-admin-mine',
        name: 'Team Mine',
        category: 'random',
        membersCount: 8,
        createdAt: '2026-01-11T10:00:00.000Z',
      },
    ]);

    await fixture.whenStable();

    expect(component.teams().map((team) => team.id)).toEqual(['team-admin-mine']);
    expect(component.subtitle()).toContain('voce participa');
  });

  it('should request only member teams and keep formed + random categories', async () => {
    authMock.role.set('competidor');
    createComponent();

    const request = httpController.expectOne(`${environment.apiURLTimes}/me`);
    expect(request.request.method).toBe('GET');
    request.flush([
      {
        id: 'team-formed',
        name: 'Team Formed',
        category: 'formed',
        membersCount: 5,
        createdAt: '2026-01-03T10:00:00.000Z',
      },
      {
        id: 'team-random',
        name: 'Team Random',
        category: 'random',
        membersCount: 8,
        createdAt: '2026-01-02T10:00:00.000Z',
      },
    ]);

    await fixture.whenStable();

    const categories = component.teams().map((team) => team.category);

    expect(component.teams().length).toBe(2);
    expect(component.teams().map((team) => team.id)).toEqual(['team-formed', 'team-random']);
    expect(categories).toContain('formed');
    expect(categories).toContain('random');
  });

  it('should filter loaded teams by selected category', async () => {
    authMock.role.set('competidor');
    createComponent();

    const request = httpController.expectOne(`${environment.apiURLTimes}/me`);
    expect(request.request.method).toBe('GET');
    request.flush([
      {
        id: 'team-formed-only',
        name: 'Team Formed',
        category: 'formed',
        membersCount: 5,
        createdAt: '2026-01-03T10:00:00.000Z',
      },
      {
        id: 'team-random-only',
        name: 'Team Random',
        category: 'random',
        membersCount: 8,
        createdAt: '2026-01-02T10:00:00.000Z',
      },
    ]);

    await fixture.whenStable();

    component.applyTeamCategoryFilter('formed');
    expect(component.filteredTeams().map((team) => team.id)).toEqual(['team-formed-only']);

    component.applyTeamCategoryFilter('random');
    expect(component.filteredTeams().map((team) => team.id)).toEqual(['team-random-only']);

    component.applyTeamCategoryFilter('all');
    expect(component.filteredTeams().length).toBe(2);
  });

  it('should read teams from nested payload wrappers', async () => {
    authMock.role.set('competidor');
    createComponent();

    const request = httpController.expectOne(`${environment.apiURLTimes}/me`);
    expect(request.request.method).toBe('GET');
    request.flush({
      data: {
        teams: [
          {
            id: 'team-nested-1',
            name: 'Nested Team',
            category: 'formed',
            membersCount: 4,
            createdAt: '2026-01-04T10:00:00.000Z',
          },
        ],
      },
    });

    await fixture.whenStable();

    expect(component.teams().map((team) => team.id)).toEqual(['team-nested-1']);
  });

  it('should normalize alternate team fields from legacy payload', async () => {
    authMock.role.set('competidor');
    authMock.userState.set({ sub: 'member-uid', displayName: 'Capitao Legacy' });
    createComponent();

    const request = httpController.expectOne(`${environment.apiURLTimes}/me`);
    expect(request.request.method).toBe('GET');
    request.flush({
      payload: {
        items: [
          {
            _id: 'team-legacy-1',
            teamName: 'Legacy Team',
            category: 'formed',
            members_count: '6',
            captain_uid: 'member-uid',
            captainName: 'Capitao Legacy',
            created_at: '2026-01-05T10:00:00.000Z',
          },
        ],
      },
    });

    await fixture.whenStable();

    expect(component.teams().length).toBe(1);
    expect(component.teams()[0].id).toBe('team-legacy-1');
    expect(component.teams()[0].membersCount).toBe(6);
    expect(component.teams()[0].roleInTeamLabel).toBe('Capitao Legacy');
  });

  it('should use current user display name when captain name is missing and user is captain', async () => {
    authMock.role.set('competidor');
    authMock.userState.set({ id: 'member-uid', displayName: 'Capitao Atual' });
    createComponent();

    const request = httpController.expectOne(`${environment.apiURLTimes}/me`);
    expect(request.request.method).toBe('GET');
    request.flush([
      {
        id: 'team-current-captain',
        name: 'Team Current Captain',
        category: 'formed',
        captainUid: 'member-uid',
        membersCount: 5,
        createdAt: '2026-01-06T10:00:00.000Z',
      },
    ]);

    await fixture.whenStable();

    expect(component.teams().length).toBe(1);
    expect(component.teams()[0].roleInTeamLabel).toBe('Capitao Atual');
  });
});
