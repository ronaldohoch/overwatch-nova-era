import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-torneio-team',
  imports: [],
  templateUrl: './torneio-team.component.html',
  styleUrl: './torneio-team.component.css',
})
export class TorneioTeamComponent {
  teamName = input.required<string>();
  teamScore = input.required<number>();

  // se tu já tem isWinner() como signal no teu component, mantém.
  // se isso vier do parent, pode ser um input:
  isWinner = input(false);

  readonly rowClass = computed(() => {
    const base =
      'flex items-center justify-between border-b border-(--ow-gray-100) px-3 py-1.5' +
      'transition-colors duration-300 last:border-b-0';

    return this.isWinner()
      ? `${base} bg-[rgba(240,99,20,0.08)] border-l-4 border-l-(--ow-orange)`
      : `${base} hover:bg-[rgba(240,99,20,0.04)]`;
  });

  readonly scoreClass = computed(() =>
    this.isWinner()
      ? 'text-[1.3rem] font-black text-(--ow-green)'
      : 'text-[1.3rem] font-black text-(--ow-orange)',
  );
}
