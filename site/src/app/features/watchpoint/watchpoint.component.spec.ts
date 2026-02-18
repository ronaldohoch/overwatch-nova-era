import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WatchpointComponent } from './watchpoint.component';

describe('WatchpointComponent', () => {
  let component: WatchpointComponent;
  let fixture: ComponentFixture<WatchpointComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WatchpointComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WatchpointComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
