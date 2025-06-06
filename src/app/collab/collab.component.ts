import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, ChangeDetectorRef, HostListener } from '@angular/core';
import { WriteserviceService } from '../writeservice.service';
import { ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { account } from '../../lib/appwrite';

@Component({
  selector: 'app-collab',
  templateUrl: './collab.component.html',
  styleUrls: ['./collab.component.css']
})
export class CollabComponent implements OnInit, AfterViewInit {
  @ViewChild('bodyEditor') bodyEditor!: ElementRef<HTMLDivElement>;

  text: string = '';
  postId: string = '';
  userId: string = '';
  postdata: any;
  username: string = '';
  editingUser: string = '';
  loggedInUserAccount: any;
  showFormatToolbar: boolean = false;
  toolbarPosition: { top: number; left: number } = { top: 0, left: 0 };
  cursorMap: Map<string, { position: number, username: string, color: string }> = new Map();

  constructor(
    private service: WriteserviceService,
    private route: ActivatedRoute,
    private toaster: ToastrService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    this.userId = this.route.snapshot.paramMap.get('userId') || '';
    this.postId = this.route.snapshot.paramMap.get('postId') || '';
    try {
      await this.getloggedinusername();
      this.service.connect(this.userId, this.username, this.postId);
      this.service.joinPostRoom(this.postId);
      this.fetchPostContent();

      this.service.listenForRawTextChange().subscribe(({ text: incomingText, senderId }) => {
        // 1) If this is coming from *your own* socket.id, ignore:
        if (senderId === this.service.socket1.id) {
          return;
        }
    
        // 2) Otherwise, update the editor HTML:
        this.text = incomingText ?? ''; 
        this.bodyEditor.nativeElement.innerHTML = this.text;
        this.renderCursors();
        this.cdr.detectChanges();
      });
    
      

      this.service.listenForStartEditing().subscribe((username) => {
        this.editingUser = username;
        this.cdr.detectChanges();
      });

      this.service.listenForSocketError().subscribe((error) => {
        this.toaster.error(error);
      });

      this.service.listenForCursorUpdates().subscribe(({ socketId, username, position }) => {
        console.log('Cursor update received:', { socketId, username, position });
        const color = this.getColorForSocket(socketId);
        this.cursorMap.set(socketId, { position, username, color });
        this.renderCursors();
      });
      
      this.service.listenForCursorRemovals().subscribe((socketId) => {
        console.log('Cursor removal received:', socketId);
        this.cursorMap.delete(socketId);
        this.renderCursors();
      });
      

    } catch (error) {
      this.toaster.error('Something went wrong');
    }
  }

  ngAfterViewInit(): void {
    this.setupPlaceholder(this.bodyEditor.nativeElement, 'Start collaborating here...');
    this.bodyEditor.nativeElement.innerHTML = this.text;
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    this.service.leaveRoom(this.postId);
  }

  async getloggedinusername(): Promise<void> {
    try {
      this.loggedInUserAccount = await account.get();
      if (this.loggedInUserAccount) {
        this.userId = this.loggedInUserAccount.$id;
        const userData = await this.service.getUserData(this.userId).toPromise();
        this.username = userData.username || this.loggedInUserAccount.name || this.loggedInUserAccount.email;
        if (!this.username) {
          this.toaster.error('User not authenticated');
        }
      } else {
        this.toaster.error('User not authenticated');
      }
    } catch (error) {
      this.toaster.error('Something went wrong');
      throw error;
    }
  }

  fetchPostContent(): void {
    this.service.getpublishpostdatabyid(this.postId).subscribe(
      (data) => {
        this.text = data.bodyofcontent;
        this.postdata = data;
        if (this.bodyEditor) {
          this.bodyEditor.nativeElement.innerHTML = this.text;
          this.renderCursors();
        }
        this.cdr.detectChanges();
      },
      (error) => {
        this.toaster.error('Failed to fetch post content');
      }
    );
  }

  onTextChange(): void {
    this.text = this.bodyEditor.nativeElement.innerHTML;
    this.service.onTextChange(this.text);
  }

  startEditing(): void {
    this.service.startEditing(this.username);
  }

  onSaveChanges(): void {
    this.service.saveChanges(this.text);
    this.clearCache();
  }

  clearCache(): void {
    this.service.clearPostsCache().subscribe(
      (response) => {
        this.toaster.success('Changes updated.');
      },
      (error) => {
        this.toaster.error('Failed to clear cache');
      }
    );
  }

  setupPlaceholder(element: HTMLDivElement, placeholderText: string): void {
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

  @HostListener('document:selectionchange')
  showToolbar(): void {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && selection.toString().length > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const position = range.startOffset;
    
      this.service.socket1.emit('cursorMove', { position });
    
      if (this.bodyEditor?.nativeElement.contains(range.commonAncestorContainer)) {
        this.toolbarPosition = {
          top: rect.top + window.scrollY - 60, // Adjust for scroll
          left: Math.max(10, rect.left + window.scrollX + (rect.width / 2) - 150)
        };
        this.showFormatToolbar = true;
      } else {
        this.showFormatToolbar = false;
      }
    } else {
      this.showFormatToolbar = false;
    }

    this.cdr.detectChanges();
  }

  formatText(command: string, value?: string | Event): void {
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

    this.text = this.bodyEditor.nativeElement.innerHTML;
    this.service.onTextChange(this.text);
    this.showFormatToolbar = false;
    this.cdr.detectChanges();
  }
  private cursorColors = [
    '#FF5722', '#03A9F4', '#4CAF50', '#E91E63', '#9C27B0', '#009688', '#FFC107', '#607D8B', '#795548', '#CDDC39'
  ];

  private getColorForSocket(socketId: string): string {
    const index = Math.abs(this.hashString(socketId)) % this.cursorColors.length;
    return this.cursorColors[index];
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  }
  renderCursors(): void {
    const editor = this.bodyEditor.nativeElement;
    const container = editor.querySelector('.cursor-container');
    if (!container) return;
  
    container.innerHTML = ''; // Clear previous cursors
  
    this.cursorMap.forEach((cursor, socketId) => {
      const cursorEl = document.createElement('div');
      cursorEl.className = 'remote-cursor';
      cursorEl.style.backgroundColor = cursor.color;
      cursorEl.innerText = cursor.username;
      cursorEl.setAttribute('data-username', cursor.username); // Set data-username for tooltip
      cursorEl.style.top = this.calculateTopOffset(cursor.position) + 'px'; // customize
      cursorEl.style.left = this.calculateLeftOffset(cursor.position) + 'px';
      container.appendChild(cursorEl);
    });
  }
  
  calculateTopOffset(position: number): number {
    const lineHeight = 20; // px — adjust based on your textarea's font size
    const lines = this.text.slice(0, position).split('\n').length - 1;
    return lines * lineHeight;
  }
  
  calculateLeftOffset(position: number): number {
    const avgCharWidth = 8; // px — approximate, based on font
    const lastLine = this.text.slice(0, position).split('\n').pop() || '';
    return lastLine.length * avgCharWidth;
  }
  
  
}