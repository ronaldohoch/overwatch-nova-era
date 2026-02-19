import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { ListagemTorneiosComponent } from './listagem-torneios.component';

describe('ListagemTorneiosComponent', () => {
  let component: ListagemTorneiosComponent;
  let fixture: ComponentFixture<ListagemTorneiosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListagemTorneiosComponent],
      providers: [provideHttpClientTesting()],
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
