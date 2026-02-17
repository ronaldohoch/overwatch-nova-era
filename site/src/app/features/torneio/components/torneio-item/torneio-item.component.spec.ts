import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TorneioItemComponent } from './torneio-item.component';

describe('TorneioItemComponent', () => {
  let component: TorneioItemComponent;
  let fixture: ComponentFixture<TorneioItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TorneioItemComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TorneioItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
