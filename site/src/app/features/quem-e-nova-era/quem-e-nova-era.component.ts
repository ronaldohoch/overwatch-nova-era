import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { TabsComponent, TabsItemComponent } from '../../shared/tabs/tabs.component';
import { ComoFuncionaComponent } from '../como-funciona/como-funciona.component';
import { RegrasComponent } from '../regras/regras.component';
import { SobreComponent } from './components/sobre/sobre.component';

export const QUEM_E_NOVA_ERA_DEFAULT_TAB = 'sobre';

@Component({
  selector: 'app-quem-e-nova-era',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TabsComponent,
    TabsItemComponent,
    SobreComponent,
    ComoFuncionaComponent,
    RegrasComponent,
  ],
  templateUrl: './quem-e-nova-era.component.html',
})
export class QuemENovaEraComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly activeTabId = toSignal(
    this.route.queryParamMap.pipe(
      map((params) => params.get('tab')?.trim() || QUEM_E_NOVA_ERA_DEFAULT_TAB),
    ),
    { initialValue: QUEM_E_NOVA_ERA_DEFAULT_TAB },
  );

  onTabChange(tabId: string): void {
    if (tabId === this.activeTabId()) return;

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: tabId === QUEM_E_NOVA_ERA_DEFAULT_TAB ? null : tabId },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
