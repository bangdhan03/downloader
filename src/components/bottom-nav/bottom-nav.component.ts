import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-bottom-nav',
  templateUrl: './bottom-nav.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class BottomNavComponent {
  activeTab = input.required<string>();
  tabSelected = output<string>();

  selectTab(tabName: string): void {
    this.tabSelected.emit(tabName);
  }
}