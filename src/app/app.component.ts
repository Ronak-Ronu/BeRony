import { Component } from '@angular/core';
import {Meta, Title } from '@angular/platform-browser';

import { trigger, transition, query, style, animate, group } from '@angular/animations';

 const routeAnimation = trigger('routeAnimation', [
  transition('* <=> *', [
    query(':enter, :leave', style({ position: 'absolute', width: '100%' }), {
      optional: true,
    }),
    group([
      query(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('600ms ease-out', style({ transform: 'translateX(0)', opacity: 1 })),
      ]),
      query(':leave', [
        style({ transform: 'translateX(0)', opacity: 1 }),
        animate('600ms ease-in', style({ transform: 'translateX(-100%)', opacity: 0 })),
      ]),
    ]),
  ]),
]);

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  animations: [routeAnimation],


})
export class AppComponent  {
  logoimage!:string;
  constructor(private meta: Meta, private title: Title)
  {
    this.logoimage="./assets/logo.gif"
    this.title.setTitle("BeRony-create & share stories");

    this.meta.updateTag({ name: 'description', content: 'Search and explore stories on BeRony. Share your creativity and connect with yourself.' });
    this.meta.updateTag({ name: 'keywords', content: 'BeRony, Search Stories, Create Writing, Share Stories blogging platform write blogs online free blogging website publish articles create a blog best blog platform personal blogs online storytelling blogging community share your story grow your audience social media sharing blogging for beginners how to blog                                                                                                 ' });

  }
  


}
