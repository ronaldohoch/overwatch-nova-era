import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { AUTH_API_BASE_URL } from '../../../../core/auth/auth.tokens';

import { TorneiosComponent } from './torneios.component';

describe('TorneiosComponent', () => {
  let component: TorneiosComponent;
  let fixture: ComponentFixture<TorneiosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TorneiosComponent],
      providers: [
        provideHttpClientTesting(),
        { provide: AUTH_API_BASE_URL, useValue: 'http://localhost:5001/auth' },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({}),
            },
          },
        },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(TorneiosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
