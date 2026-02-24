import { ComponentFixture, TestBed } from '@angular/core/testing';
import { computed, signal } from '@angular/core';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from '../../../../core/auth/auth.service';
import type { UserRole } from '../../../../core/auth/user-role';

import { ListagemTorneiosComponent } from './listagem-torneios.component';

class AuthServiceMock {
  readonly role = signal<UserRole | null>('admin');
  readonly userRole = computed(() => this.role());
}

describe('ListagemTorneiosComponent', () => {
  let component: ListagemTorneiosComponent;
  let fixture: ComponentFixture<ListagemTorneiosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListagemTorneiosComponent],
      providers: [
        provideHttpClientTesting(),
        { provide: AuthService, useValue: new AuthServiceMock() },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListagemTorneiosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
