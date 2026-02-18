import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { AuthService } from '../../../../core/auth/auth.service';

import { MeusDadosComponent } from './meus-dados.component';

describe('MeusDadosComponent', () => {
  let component: MeusDadosComponent;
  let fixture: ComponentFixture<MeusDadosComponent>;

  const authServiceMock = {
    user: signal({
      id: 'user-1',
      displayName: 'Jogador',
      email: 'jogador@email.com',
      battletag: 'Jogador#1234',
      whatsapp: '51999999999',
      role: 'competidor',
    }),
    isAuthenticated: signal(true),
    updateCurrentUser: jasmine.createSpy('updateCurrentUser').and.resolveTo(),
    changeCurrentUserPassword: jasmine.createSpy('changeCurrentUserPassword').and.resolveTo(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MeusDadosComponent],
      providers: [
        {
          provide: AuthService,
          useValue: authServiceMock,
        },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(MeusDadosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
