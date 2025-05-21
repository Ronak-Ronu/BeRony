import { Component, OnInit, OnDestroy, ChangeDetectorRef, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { WriteserviceService } from '../writeservice.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { environment } from '../../environments/environment';
import axios from 'axios';
import * as fabric from 'fabric';

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
export class ChatRoomComponent implements OnInit, OnDestroy, AfterViewInit {
  roomId: string = '';
  roomtitle: string = '';
  userId: string = '';
  username: string = '';
  message: string = '';
  mediaFile: File | null = null;
  messages: ChatMessage[] = [];
  error: string = '';
  selectedMedia: { url: string, type: 'image' | 'video' | 'gif' } | null = null;
  private subscriptions: Subscription = new Subscription();
  showCanvas: boolean = false;
  showStickerWindow: boolean = false;
  canvas!: fabric.Canvas;
  pickedColor: string = '#000000';
  brushSize: number = 11;
  brushType: string = 'pencil';
  isDrawing: boolean = false;
  gifSearchQuery: string = '';
  gifs: any[] = [];

  @ViewChild('fabricCanvaschat') fabricCanvaschat!: ElementRef<HTMLCanvasElement>;

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
    private router: Router,
    private cdr: ChangeDetectorRef
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

  ngAfterViewInit(): void {
    this.canvas = new fabric.Canvas(this.fabricCanvaschat.nativeElement);
    this.canvas.freeDrawingBrush = new fabric.PencilBrush(this.canvas);
    this.canvas.freeDrawingBrush.color = this.pickedColor;
    this.canvas.freeDrawingBrush.width = this.brushSize;
    this.canvas.isDrawingMode = true; 
  }

  ngOnDestroy(): void {
    this.leaveRoom();
    this.subscriptions.unsubscribe();
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

  // Canvas-related methods
  openCanvas(): void {
    this.showCanvas = !this.showCanvas;
    if (this.showCanvas) {
      this.canvas.isDrawingMode = true; // Enable drawing mode
      this.isDrawing = true;
      this.selectBrush(this.brushType); // Ensure the brush is set
    } else {
      this.canvas.isDrawingMode = false; // Disable drawing mode when closing
      this.isDrawing = false;
    }
  }
  selectBrush(type: string): void {
    this.brushType = type;
    switch (type) {
      case 'pencil':
        this.canvas.freeDrawingBrush = new fabric.PencilBrush(this.canvas);
        break;
      case 'spray':
        this.canvas.freeDrawingBrush = new fabric.SprayBrush(this.canvas);
        break;
      case 'circle':
        this.canvas.freeDrawingBrush = new fabric.CircleBrush(this.canvas);
        break;
      default:
        this.canvas.freeDrawingBrush = new fabric.PencilBrush(this.canvas);
    }
    this.canvas.freeDrawingBrush.color = this.pickedColor;
    this.canvas.freeDrawingBrush.width = this.brushSize;
    this.canvas.isDrawingMode = true; // Ensure drawing mode is enabled
    this.isDrawing = true;
  }

  setBrushColor(): void {
    if (this.canvas && this.canvas.freeDrawingBrush) {
      this.canvas.freeDrawingBrush.color = this.pickedColor;
      this.canvas.renderAll();
      this.cdr.detectChanges();
    }
  }
  
  setBrushSize(): void {
    if (this.canvas && this.canvas.freeDrawingBrush) {
      this.canvas.freeDrawingBrush.width = this.brushSize;
      this.canvas.renderAll();
      this.cdr.detectChanges();
    }
  }
  clearCanvas(): void {
    const activeObject = this.canvas.getActiveObject();
    if (activeObject) {
      this.canvas.remove(activeObject);
      this.canvas.renderAll();
    } else {
      this.canvas.clear();
    }
  }

  saveCanvas(): void {
    const dataURL = this.canvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 1
    });
    const byteString = atob(dataURL.split(',')[1]);
    const mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0];
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const uintArray = new Uint8Array(arrayBuffer);
    for (let i = 0; i < byteString.length; i++) {
      uintArray[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([uintArray], { type: mimeString });
    this.mediaFile = new File([blob], 'canvas-image.png', { type: mimeString });
    this.showCanvas = false;
    this.sendMessage();
  }

  // Sticker-related methods
  addSticker(): void {
    this.showStickerWindow = !this.showStickerWindow;
    if (this.showStickerWindow) {
      this.searchGifs();
    }
  }

  async searchGifs(): Promise<void> {
    const apiKey = environment.giphyAPIKEY;
    try {
      const response = await axios.get(`https://api.giphy.com/v1/stickers/search`, {
        params: {
          api_key: apiKey,
          q: this.gifSearchQuery,
          limit: 16
        }
      });
      this.gifs = response.data.data;
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error fetching GIFs', error);
    }
  }

  selectGif(gif: any): void {
    const gifUrl = gif.images.fixed_height.url;
    fetch(gifUrl)
      .then(response => response.blob())
      .then(blob => {
        this.mediaFile = new File([blob], 'sticker.gif', { type: 'image/gif' });
        this.showStickerWindow = false;
        this.sendMessage();
      })
      .catch(error => {
        console.error('Error fetching GIF:', error);
      });
  }
}