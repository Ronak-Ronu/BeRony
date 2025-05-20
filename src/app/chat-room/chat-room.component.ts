import { Component, OnInit, OnDestroy } from '@angular/core';
import { WriteserviceService } from '../writeservice.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { environment } from '../../environments/environment';
import axios from 'axios';

interface ChatMessage {
  roomId: string;
  userId: string;
  username: string;
  message?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'gif';
  createdAt: string;
  color?: string;
  backgroundColor?: string;
}

@Component({
  selector: 'app-chat-room',
  templateUrl: './chat-room.component.html',
  styleUrls: ['./chat-room.component.css'],
  animations: [
    trigger('mediaOverlayAnimation', [
      state('void', style({
        opacity: 0,
        transform: 'scale(0.8)'
      })),
      state('*', style({
        opacity: 1,
        transform: 'scale(1)'
      })),
      transition('void => *', [
        animate('300ms ease-out')
      ]),
      transition('* => void', [
        animate('200ms ease-in')
      ])
    ])
  ]
})
export class ChatRoomComponent implements OnInit, OnDestroy {
  roomId: string = '';
  roomtitle: string ='';
  userId: string = '';
  username: string = '';
  message: string = '';
  mediaFile: File | null = null;
  messages: ChatMessage[] = [];
  error: string = '';
  selectedMedia: { url: string, type: 'image' | 'video' | 'gif' } | null = null;
  private subscriptions: Subscription = new Subscription();


  private textColorPalette: string[] = [
    '#5C6BC0', '#7E57C2', '#00897B', '#D81B60', '#0288D1',
    '#388E3C', '#F57C00', '#6A1B9A', '#455A64', '#C2185B'
  ];

  private backgroundColorPalette: string[] = [
    '#E8EAF6', '#EDE7F6', '#B2EBF2', '#FFCDD2', '#BBDEFB',
    '#C8E6C9', '#FFE0B2', '#D7CCC8', '#F3E5F5', '#B3E5FC'
  ];

  constructor(
    private readsevice: WriteserviceService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.roomId = this.route.snapshot.paramMap.get('roomId') || 'default-room';
    this.roomtitle = this.route.snapshot.paramMap.get('roomtitle') || 'default-room';

    this.userId = sessionStorage.getItem('userId') || 'user_' + Math.random().toString(36).substr(2, 9);
    this.username = sessionStorage.getItem('username') || 'Guest_' + Math.random().toString(36).substr(2, 5);
    sessionStorage.setItem('userId', this.userId);
    sessionStorage.setItem('username', this.username);
    this.joinRoom();
    this.subscriptions.add(
      this.readsevice.getMessages().subscribe((message: ChatMessage) => {
        message.color = this.getUserTextColor(message.userId);
        message.backgroundColor = this.getUserBackgroundColor(message.userId);
        this.messages.push(message);
        this.scrollToBottom();
      })
    );

    this.subscriptions.add(
      this.readsevice.getChatHistory().subscribe((history: ChatMessage[]) => {
        this.messages = history.map(msg => ({
          ...msg,
          color: this.getUserTextColor(msg.userId),
          backgroundColor: this.getUserBackgroundColor(msg.userId)
        }));
        this.scrollToBottom();
      })
    );
    this.subscriptions.add(
      this.readsevice.getErrors().subscribe((error: string) => {
        this.error = error;
        setTimeout(() => (this.error = ''), 5000);
      })
    );
  }

  private getUserTextColor(userId: string): string {
    const index = Math.abs(this.hashString(userId) % this.textColorPalette.length);
    return this.textColorPalette[index];
  }

  private getUserBackgroundColor(userId: string): string {
    const index = Math.abs(this.hashString(userId) % this.backgroundColorPalette.length);
    return this.backgroundColorPalette[index];
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  }
  joinRoom(): void {
    this.readsevice.joinRoom(this.roomId, this.userId, this.username);
  }

  leaveRoom(): void {
    this.router.navigate([`/read`]);    
    this.readsevice.leaveRoom(this.roomId);
  }

  sendMessage(): void {
    if (this.message.trim() || this.mediaFile) {
      this.readsevice.sendMessage(this.roomId, this.message, this.mediaFile);
      this.message = '';
      this.mediaFile = null;
      (document.getElementById('mediaInput') as HTMLInputElement).value = '';
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.mediaFile = input.files[0];
    }
  }

  openMedia(message: ChatMessage): void {
    if (message.mediaUrl && message.mediaType) {
      this.selectedMedia = {
        url: message.mediaUrl,
        type: message.mediaType
      };
    }
  }

  closeMedia(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.classList.contains('media-overlay')) {
      this.selectedMedia = null;
    }
  }

  scrollToBottom(): void {
    setTimeout(() => {
      const chatContainer = document.querySelector('.chat-messages');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }, 100);
  }
  
  ngOnDestroy(): void {
    this.leaveRoom();
    this.subscriptions.unsubscribe();
  }
}