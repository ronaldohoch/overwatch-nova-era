import { ChangeDetectionStrategy, Component } from '@angular/core';

import { DividerComponent } from '../../shared/design-system/divider/divider.component';

import { FoundationsSectionComponent } from './components/sections/foundations-section.component';
import { UiFeedbackSectionComponent } from './components/sections/ui-feedback-section.component';
import { DataDisplaySectionComponent } from './components/sections/data-display-section.component';
import { FlowOverlaySectionComponent } from './components/sections/flow-overlay-section.component';
import { FormsControlsSectionComponent } from './components/sections/forms-controls-section.component';
import { MatchTeamsSectionComponent } from './components/sections/match-teams-section.component';

@Component({
  selector: 'app-design-system',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DividerComponent,
    FoundationsSectionComponent,
    UiFeedbackSectionComponent,
    DataDisplaySectionComponent,
    FlowOverlaySectionComponent,
    FormsControlsSectionComponent,
    MatchTeamsSectionComponent,
  ],
  templateUrl: './design-system.component.html',
})
export class DesignSystemComponent {}
