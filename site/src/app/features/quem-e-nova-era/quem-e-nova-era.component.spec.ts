import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';

import { QuemENovaEraComponent } from './quem-e-nova-era.component';

describe('QuemENovaEraComponent', () => {
  let component: QuemENovaEraComponent;
  let fixture: ComponentFixture<QuemENovaEraComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuemENovaEraComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { queryParamMap: of(convertToParamMap({})) },
        },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuemENovaEraComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('abre a aba Sobre por padrao', () => {
    expect(component.activeTabId()).toBe('sobre');
  });
});
