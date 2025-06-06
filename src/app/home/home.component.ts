import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild, HostListener } from '@angular/core';
import { WriteserviceService } from '../writeservice.service';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';
import { ToastrService } from 'ngx-toastr';
import * as fabric from 'fabric';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  @ViewChild('memeGif') memeGif!: ElementRef<HTMLImageElement>;
  @ViewChild('myCanvas') canvasEl!: ElementRef<HTMLCanvasElement>;
  @ViewChild('bodyEditor') bodyEditor!: ElementRef<HTMLDivElement>;
  canvas!: fabric.Canvas;
  private socket!: Socket;
  text: string = '';
  postId: string = '6736eaca42540998b25ca0a2';
  userId: string = '67274249002493a5ec52';
  postdata: any = {};
  isHidden: boolean = true;
  username: string = '';
  memeGifSrc: string = '';
  cursors: { [userId: string]: { cursor: HTMLElement; label: HTMLElement; position: number } } = {};
  cursorColors: string[] = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'];
  usedColors: { [userId: string]: string } = {};
  showFormatToolbar: boolean = false;
  toolbarPosition: { top: number; left: number } = { top: 0, left: 0 };

  constructor(
    private service: WriteserviceService,
    private toaster: ToastrService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.username = this.userId ? 'UserFromAppwrite' : 'Guest';
    this.socket = io(environment.beronyAPI, {
      auth: {
        userId: this.userId,
        postId: this.postId,
        username: this.username
      }
    });

    this.socket.on('connect', () => {
      console.log('Connected to Socket.IO server');
      this.socket.emit('joinPostRoom', this.postId);
      this.fetchPostContent();
    });

    this.service.text$.subscribe((newText: string) => {
      this.text = newText;
      this.bodyEditor.nativeElement.innerHTML = newText;
      this.cdr.detectChanges();
    });


    this.socket.on('textChange', (payload: { text: string, senderId: string }) => {
      if (!payload || typeof payload !== 'object') return;
      if (payload.senderId === this.socket.id) return;

      this.text = payload.text;
      this.service.textSubject.next(payload.text);
      this.bodyEditor.nativeElement.innerHTML = payload.text;
      this.cdr.detectChanges();
    });
  }

  ngAfterViewInit() {
    this.canvas = new fabric.Canvas('myCanvas');
    this.resizeCanvas();
    this.canvas.freeDrawingBrush = new fabric.CircleBrush(this.canvas);
    this.canvas.freeDrawingBrush.color = '#8b8beb';
    this.canvas.freeDrawingBrush.width = 100;
    this.canvas.isDrawingMode = true;

    this.canvas.on('path:created', () => {
      this.sendCanvasUpdate();
    });

    this.socket.on('canvasUpdate', async (data) => {
      if (!data || !data.objects) return;

      try {
        const enlivenedObjects = await fabric.util.enlivenObjects(data.objects);
        enlivenedObjects.forEach((obj) => {
          if (obj instanceof fabric.Object) {
            this.canvas.add(obj);
          }
        });
        this.canvas.renderAll();
      } catch (error) {
        console.error('Error enlivening objects:', error);
      }
    });

  }

  setupPlaceholder(element: HTMLDivElement, placeholderText: string) {
    if (!element.textContent) {
      element.classList.add('placeholder');
      element.setAttribute('data-placeholder', placeholderText);
    }
    element.addEventListener('input', () => {
      if (element.textContent) {
        element.classList.remove('placeholder');
      } else {
        element.classList.add('placeholder');
      }
    });
  }

  sendCanvasUpdate() {
    this.socket.emit('canvasUpdate', this.canvas.toJSON());
  }

  emitCursorPosition() {
    const position = this.getCaretPosition(this.bodyEditor.nativeElement);
    this.socket.emit('cursorMove', { position });
  }

  getCaretPosition(element: HTMLElement): number {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(element);
      preCaretRange.setEnd(range.endContainer, range.endOffset);
      return preCaretRange.toString().length;
    }
    return 0;
  }

  resizeCanvas() {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const aspectRatio = 2100 / 1000;

    let width, height;
    if (windowWidth / windowHeight > aspectRatio) {
      height = windowHeight;
      width = height * aspectRatio;
    } else {
      width = windowWidth;
      height = width / aspectRatio;
    }
    this.canvas.setWidth(width);
    this.canvas.setHeight(height);
    this.canvas.setZoom(width / this.canvas.width);
    this.canvas.renderAll();
  }

  showMeme(event: MouseEvent, gif: string) {
    this.memeGifSrc = gif;
    this.isHidden = false;
    this.moveMeme(event);
  }

  moveMeme(event: MouseEvent) {
    if (this.memeGif) {
      this.memeGif.nativeElement.style.left = event.pageX + 10 + 'px';
      this.memeGif.nativeElement.style.top = event.pageY + 10 + 'px';
    }
  }

  hideMeme() {
    this.isHidden = true;
  }

  fetchPostContent() {
    this.service.getpublishpostdatabyid(this.postId).subscribe(
      (data) => {
        this.text = data.bodyofcontent;
        this.postdata = data;
        this.bodyEditor.nativeElement.innerHTML = this.text;
        this.cdr.detectChanges();
      },
      (error) => {
        console.error('Error fetching post content:', error);
      }
    );
  }

  onTextChange(): void {
    this.text = this.bodyEditor.nativeElement.innerHTML;
    this.socket.emit('textChange', { text: this.text, senderId: this.socket.id });
    this.cdr.detectChanges();
  }

  onSaveChanges(): void {
    this.socket.emit('saveChanges', this.text);
    this.clearCache();
  }

  clearCache(): void {
    this.service.clearPostsCache().subscribe(
      (response) => {
        this.toaster.success('Changes updated hurray!');
      },
      (error) => {
        console.error('Error clearing cache:', error);
        this.toaster.error('Something went wrong');
      }
    );
  }

  getCursorColor(userId: string): string {
    if (!this.usedColors[userId]) {
      const index = Object.keys(this.usedColors).length % this.cursorColors.length;
      this.usedColors[userId] = this.cursorColors[index];
    }
    return this.usedColors[userId];
  }

  @HostListener('document:selectionchange')
  onSelectionChange() {
    this.showToolbar();
  }

  showToolbar() {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && selection.toString().length > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const isInBodyEditor = this.bodyEditor.nativeElement.contains(range.commonAncestorContainer);
      if (isInBodyEditor) {
        const viewportWidth = window.innerWidth;
        const toolbarWidth = 200; 
        let left = rect.left + rect.width / 2 - toolbarWidth / 2;
        left = Math.max(10, Math.min(left, viewportWidth - toolbarWidth - 10));
        this.toolbarPosition = {
          top: rect.top + window.scrollY - 900,
          left: left + window.scrollX-1000
        };
        this.showFormatToolbar = true;
      } else {
        this.showFormatToolbar = false;
      }
    } else {
      this.showFormatToolbar = false;
    }
    this.cdr.markForCheck(); 
    this.cdr.detectChanges();
  }

  formatText(command: string, value?: string | Event) {
    const selection = window.getSelection();
    if (!selection || selection.toString().length === 0) return;

    let resolvedValue: string | undefined = typeof value === 'string' ? value : undefined;

    if (value instanceof Event) {
      const target = value.target as HTMLSelectElement;
      if (target && 'value' in target) {
        resolvedValue = target.value;
      } else {
        return;
      }
    }

    if (command === 'h1') {
      document.execCommand('formatBlock', false, 'h1');
    } else if (command === 'code') {
      document.execCommand('insertHTML', false, `<pre class="code-block">${selection.toString()}</pre>`);
    } else if (command === 'color' && resolvedValue) {
      document.execCommand('foreColor', false, resolvedValue);
    } else if (command === 'align-left') {
      document.execCommand('justifyLeft', false);
    } else if (command === 'align-center') {
      document.execCommand('justifyCenter', false);
    } else if (command === 'align-right') {
      document.execCommand('justifyRight', false);
    } else if (command === 'font-size' && resolvedValue) {
      document.execCommand('fontSize', false, resolvedValue);
    } else {
      document.execCommand(command, false);
    }
    this.showFormatToolbar = false;
    this.onTextChange(); 
    this.cdr.detectChanges();
  }

}