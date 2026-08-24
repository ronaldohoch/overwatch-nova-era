import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DsCodeBlockComponent } from './ds-code-block/ds-code-block.component';

@Component({
  selector: 'ds-code-avatares-grupo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DsCodeBlockComponent],
  template: `<ds-code-block [code]="code" />`,
})
export class AvataresGrupoCodeComponent {
  readonly code = `<!-- Grupo de avatares com sobreposição -->
<div class="flex items-center gap-6">

  <ow-avatar-group>
    <ow-avatar initials="TH" color="orange" [grouped]="true" />
    <ow-avatar initials="DS" color="blue"   [grouped]="true" />
    <ow-avatar initials="FG" color="green"  [grouped]="true" />
    <ow-avatar initials="BL" color="red"    [grouped]="true" />

    <!-- Contador de excedentes -->
    <div class="w-9 h-9 rounded-full bg-(--ow-surface-sunken) border-2 border-(--ow-surface)
      flex items-center justify-center text-[0.72rem] font-extrabold
      text-(--ow-text-muted) -ml-2 ring-2 ring-(--ow-bg)">
      +8
    </div>
  </ow-avatar-group>

  <span class="text-[0.875rem] text-(--ow-text-muted) font-semibold">12 times inscritos</span>

</div>

<!-- color: orange | blue | green | red | gray -->`;
}
