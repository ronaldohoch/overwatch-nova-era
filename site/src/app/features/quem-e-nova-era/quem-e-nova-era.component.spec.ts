import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuemENovaEraComponent } from './quem-e-nova-era.component';

describe('QuemENovaEraComponent', () => {
  let component: QuemENovaEraComponent;
  let fixture: ComponentFixture<QuemENovaEraComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuemENovaEraComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuemENovaEraComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
