import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent {

  
  onMouseMove(event: MouseEvent, element: EventTarget | null) {
    if (!(element instanceof HTMLElement)) return;
    const rect = element.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    element.style.setProperty('--x', `${x}px`);
    element.style.setProperty('--y', `${y}px`);
  }

  onMouseLeave(element: EventTarget | null) {
    if (!(element instanceof HTMLElement)) return;
    element.style.setProperty('--x', '50%');
    element.style.setProperty('--y', '50%');
  }
}
