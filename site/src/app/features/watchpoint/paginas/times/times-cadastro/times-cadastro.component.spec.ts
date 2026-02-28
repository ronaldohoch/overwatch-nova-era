import { ComponentFixture, TestBed } from '@angular/core/testing';
import { computed, signal } from '@angular/core';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from '../../../../../core/auth/auth.service';
import type { UserRole } from '../../../../../core/auth/user-role';
import { environment } from '../../../../../../environments/environment';

import { TimesCadastroComponent } from './times-cadastro.component';

class AuthServiceMock {
  readonly role = signal<UserRole | null>('competidor');
  readonly authenticated = signal(true);

  readonly userRole = computed(() => this.role());
  readonly isAuthenticated = computed(() => this.authenticated());
}

describe('TimesCadastroComponent', () => {
  let component: TimesCadastroComponent;
  let fixture: ComponentFixture<TimesCadastroComponent>;
  let httpController: HttpTestingController;
  let authMock: AuthServiceMock;
  let routerMock: jasmine.SpyObj<Router>;

  function createComponent(): void {
    fixture = TestBed.createComponent(TimesCadastroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(async () => {
    authMock = new AuthServiceMock();
    routerMock = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
    routerMock.navigateByUrl.and.resolveTo(true);

    await TestBed.configureTestingModule({
      imports: [TimesCadastroComponent],
      providers: [
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authMock },
        { provide: Router, useValue: routerMock },
      ],
    }).compileComponents();

    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  it('should create', () => {
    createComponent();
    expect(component).toBeTruthy();
  });

  it('should create team normally and keep creator as captain by default', async () => {
    authMock.role.set('admin');
    createComponent();

    component.updateField('name', 'Time Principal');
    component.updateField('category', 'random');

    const submitPromise = component.onSubmit(new Event('submit'));

    const createRequest = httpController.expectOne(environment.apiURLTimes);
    expect(createRequest.request.method).toBe('POST');
    expect(createRequest.request.body).toEqual({
      name: 'Time Principal',
      category: 'random',
    });
    createRequest.flush({ id: 'team-default-1' });

    await submitPromise;

    expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/watchpoint/times');
    expect(component.status()).toBe('success');
  });

  it('should remove creator from team after creation when skip captain option is selected', async () => {
    authMock.role.set('streamer');
    createComponent();

    component.updateField('name', 'Time Sem Capitão');
    component.updateField('category', 'formed');
    component.updateSkipCreatorAsCaptain(true);

    const submitPromise = component.onSubmit(new Event('submit'));

    const createRequest = httpController.expectOne(environment.apiURLTimes);
    expect(createRequest.request.method).toBe('POST');
    createRequest.flush({ id: 'team-no-captain-1' });

    const leaveRequest = httpController.expectOne(`${environment.apiURLTimes}/team-no-captain-1/members/me`);
    expect(leaveRequest.request.method).toBe('DELETE');
    leaveRequest.flush({ status: 'ok' });

    await submitPromise;

    expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/watchpoint/times');
    expect(component.message()).toContain('sem capitão');
    expect(component.status()).toBe('success');
  });

  it('should send description and groupLink when informed', async () => {
    authMock.role.set('admin');
    createComponent();

    component.updateField('name', 'Time com Info');
    component.updateField('description', 'Time oficial da comunidade.');
    component.updateField('groupLink', 'https://chat.whatsapp.com/invite-example');
    component.updateField('category', 'formed');

    const submitPromise = component.onSubmit(new Event('submit'));

    const createRequest = httpController.expectOne(environment.apiURLTimes);
    expect(createRequest.request.method).toBe('POST');
    expect(createRequest.request.body).toEqual({
      name: 'Time com Info',
      description: 'Time oficial da comunidade.',
      groupLink: 'https://chat.whatsapp.com/invite-example',
      category: 'formed',
    });
    createRequest.flush({ id: 'team-info-1' });

    await submitPromise;

    expect(component.status()).toBe('success');
  });
});

