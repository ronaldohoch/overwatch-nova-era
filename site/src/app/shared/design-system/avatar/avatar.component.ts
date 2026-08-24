import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type OwAvatarColor = 'orange' | 'blue' | 'green' | 'red' | 'gray';
export type OwRoleBadge = 'tank' | 'damage' | 'support' | 'flex';

const COLOR_MAP: Record<OwAvatarColor, string> = {
  orange: 'bg-(--ow-orange)',
  blue: 'bg-(--ow-blue)',
  green: 'bg-(--ow-green)',
  red: 'bg-(--ow-red)',
  gray: 'bg-(--ow-surface-sunken) text-(--ow-text-muted) text-[0.7rem]',
};

/* ─── Avatar Individual ─── */
@Component({
  selector: 'ow-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [class]="classes()">
      @if (src()) {
        <img [src]="src()" [alt]="initials()" class="w-full h-full object-cover rounded-full" />
      } @else {
        {{ initials() }}
      }
    </div>
  `,
  host: { class: 'contents' },
})
export class AvatarComponent {
  readonly initials = input('?');
  readonly src = input<string | undefined>(undefined);
  readonly color = input<OwAvatarColor>('orange');
  /** quando true, aplica margem negativa para avatar-group */
  readonly grouped = input(false);

  readonly classes = computed(() => {
    const colorCls = COLOR_MAP[this.color()] ?? COLOR_MAP.orange;
    const margin = this.grouped() ? '-ml-[10px] first:ml-0' : '';
    return [
      'w-11 h-11 rounded-full border-2 border-(--ow-surface)',
      'flex items-center justify-center',
      'font-extrabold text-[0.78rem] text-(--ow-on-accent) shrink-0',
      colorCls,
      margin,
    ]
      .filter(Boolean)
      .join(' ');
  });
}

/* ─── Avatar Group ─── */
@Component({
  selector: 'ow-avatar-group',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="flex"><ng-content /></div>`,
  host: { class: 'contents' },
})
export class AvatarGroupComponent {}

/* ─── Player Avatar (com borda laranja) ─── */
@Component({
  selector: 'ow-player-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="w-14 h-14 rounded-full border-2 border-(--ow-orange) bg-(--ow-surface-sunken) flex items-center justify-center font-extrabold text-(--ow-orange-text) text-[1.2rem]"
    >
      @if (src()) {
        <img [src]="src()" [alt]="initials()" class="w-full h-full object-cover rounded-full" />
      } @else {
        {{ initials() }}
      }
    </div>
  `,
  host: { class: 'contents' },
})
export class PlayerAvatarComponent {
  readonly initials = input('?');
  readonly src = input<string | undefined>(undefined);
}

/* ─── Role Badge ─── */
@Component({
  selector: 'ow-role-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span [class]="classes()"><ng-content /></span>`,
  host: { class: 'contents' },
})
export class RoleBadgeComponent {
  readonly role = input.required<OwRoleBadge>();

  private readonly ROLE_VARIANTS: Record<OwRoleBadge, string> = {
    tank: 'bg-(--ow-blue) text-(--ow-on-accent-dark)',
    damage: 'bg-(--ow-red) text-(--ow-on-accent)',
    support: 'bg-(--ow-green) text-(--ow-on-accent)',
    flex: 'bg-(--ow-yellow) text-(--ow-on-accent-dark)',
  };

  readonly classes = computed(
    () =>
      `inline-flex items-center py-[3px] px-[10px] text-[0.68rem] font-extrabold uppercase tracking-[0.1em] rounded-[2px] ${this.ROLE_VARIANTS[this.role()]}`,
  );
}
