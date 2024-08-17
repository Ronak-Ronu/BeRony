import { animate, style, transition, trigger } from '@angular/animations';
import { Component } from '@angular/core';



@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'BeRony-create & share stories';
  logoimage!:string;
  constructor()
  {
    this.logoimage="./assets/logo.png"
  }
}
