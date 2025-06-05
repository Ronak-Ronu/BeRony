import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, ChangeDetectorRef, HostListener } from '@angular/core';
import { WriteModel } from '../Models/writemodel';
import { WriteserviceService } from '../writeservice.service';
import { account } from '../../lib/appwrite';
import { trigger, style, animate, transition } from '@angular/animations';
import { ToastrService } from 'ngx-toastr';
import * as fabric from 'fabric';

import { environment } from '../../environments/environment';
import axios from 'axios';
import { AiService } from '../services/ai.service';

@Component({
  selector: 'app-write',
  templateUrl: './write.component.html',
  styleUrls: ['./write.component.css'],
  animations: [
    trigger('tagAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('700ms ease-out', style({ opacity: 0, transform: 'translateY(20px)' }))
      ])
    ]),
    trigger('modalAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.95)' }),
        animate('150ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ]),
      transition(':leave', [
        animate('100ms ease-in', style({ opacity: 0, transform: 'scale(0.95)' }))
      ])
    ])
  ]
})
export class WriteComponent implements OnInit, AfterViewInit {
  @ViewChild('titleEditor') titleEditor!: ElementRef<HTMLDivElement>;
  @ViewChild('bodyEditor') bodyEditor!: ElementRef<HTMLDivElement>;
  @ViewChild('endnoteEditor') endnoteEditor!: ElementRef<HTMLDivElement>;
  @ViewChild('fabricCanvas1') fabricCanvas1!: ElementRef<HTMLCanvasElement>;

  draftblogs: WriteModel[] = [];
  edittitle: string = '';
  editbodycontent: string = '';
  editendnotecontent: string = '';
  editclicked: boolean = false;
  showImageUploadPopup: boolean = false;
  selectedimagefile: File | null = null;
  imageUrl: string | null = null;
  ispreview: boolean = false;
  previewTitle: string = '';
  previewBodyContent: string = '';
  previewEndNote: string = '';
  tagInput: string = '';
  tags: string[] = [];
  openimagegeneratepopup: boolean = false;
  loggedInUserAccount: any = null;
  username: string = '';
  userId: string = '';
  prompt: string = '';
  photos: string[] = [];
  showCodeEditor: boolean = false;
  editCodeContent: string = '';
  showCanvasModal: boolean = false;
  canvas!: fabric.Canvas;
  pickedcolor: string = '#000000';
  brushsize: number = 11;
  gifSearchQuery: string = '';
  gifs: any[] = [];
  showStickerModal: boolean = false;
  showGifModal: boolean = false;
  isdrawing: boolean = false;
  brushtype: string = 'pencil';
  cursorPosition: number = 0;
  postScheduleTime: Date | undefined;
  showFormatToolbar: boolean = false;
  toolbarPosition: { top: number; left: number } = { top: 0, left: 0 };
  showDraftsModal: boolean = false;
  isCanvasDirty: boolean = false;
  canvasImageUrl: string | null = null;
  lastCursorPosition: number = 0;
  showPollModal: boolean = false;
  availablePolls: any[] = [];

  newPollQuestion: string = ''; // Add property for poll question
  newPollOptions: string[] = ['', '']; // Add property for poll options
  isPollFormValid: boolean = false; // Add property to track form validity
  selectedPollId: string | null = null; // Add property to store the selected poll ID

  constructor(
    private writeservice: WriteserviceService,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService,
    private aiService: AiService
  ) {}

  ngOnInit(): void {
    this.readdraftblog();
    this.getloggedinuserdata();
  }

  ngAfterViewInit() {
   

    // Set up placeholders
    this.setupPlaceholder(this.titleEditor.nativeElement, 'Title Goes Here');
    this.setupPlaceholder(this.bodyEditor.nativeElement, 'Try @gif to add gifs');
    this.setupPlaceholder(this.endnoteEditor.nativeElement, 'Share your post script/ending note');

    // Set initial editor content
    this.titleEditor.nativeElement.innerHTML = this.edittitle;
    this.bodyEditor.nativeElement.innerHTML = this.editbodycontent;
    this.endnoteEditor.nativeElement.innerHTML = this.editendnotecontent;

    this.cdr.detectChanges();

  }

  // Add method to handle date formatting (from previous request)
  getFormattedDate(): string {
    const date = this.postScheduleTime || new Date();
    return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(date);
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

  updateTitle(event: Event) {
    this.edittitle = (event.target as HTMLDivElement).innerHTML;
    this.cdr.detectChanges();
  }

  updateBody(event: Event) {
    this.editbodycontent = (event.target as HTMLDivElement).innerHTML;
    this.cdr.detectChanges();
  }

  updateEndnote(event: Event) {
    this.editendnotecontent = (event.target as HTMLDivElement).innerHTML;
    this.cdr.detectChanges();
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
  
      // Check if selection is within one of the editors
      const isInTitleEditor = this.titleEditor.nativeElement.contains(range.commonAncestorContainer);
      const isInBodyEditor = this.bodyEditor.nativeElement.contains(range.commonAncestorContainer);
      const isInEndnoteEditor = this.endnoteEditor.nativeElement.contains(range.commonAncestorContainer);
  
      if (isInTitleEditor || isInBodyEditor || isInEndnoteEditor) {
        this.toolbarPosition = {
          top: rect.top - 50,
          left: Math.max(10, rect.left + rect.width / 2 - 150)
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
    this.cdr.detectChanges();
  }

  checkForGifKeyword() {
    const bodyEditor = this.bodyEditor.nativeElement;
    const text = bodyEditor.textContent || '';
    const cursorPos = this.getCaretPosition(bodyEditor);
    this.lastCursorPosition = cursorPos; // Store the position
    const textBeforeCursor = text.substring(0, cursorPos);
    const lastWord = textBeforeCursor.split(/\s+/).pop();
  
    if (lastWord === '@gif') {
      this.showGifModal = true;
      this.gifSearchQuery = '';
      this.searchGifs();
      
      // Remove '@gif' from editor
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.setStart(range.endContainer, range.endOffset - 4);
        range.deleteContents();
        this.editbodycontent = bodyEditor.innerHTML;
        this.lastCursorPosition -= 4;
        this.cdr.detectChanges();
      }
    }
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

  publishblog(publishdata: WriteModel) {
    const formData = new FormData();
    const scheduleDate = this.postScheduleTime || new Date();
    const bdy = this.formatCode(this.editCodeContent) + this.editbodycontent;
    let pollId: string | null = null;

    formData.append('title', this.edittitle);
    formData.append('bodyofcontent', bdy);
    formData.append('endnotecontent', this.editendnotecontent);
    formData.append('tags', JSON.stringify(this.tags));
    formData.append('userId', this.userId);
    formData.append('username', this.username);
    formData.append('postScheduleTime', new Date(scheduleDate).toISOString());
    if (this.selectedPollId) {
      formData.append('pollId', this.selectedPollId); // Add pollId to formData
    }


    if (this.selectedimagefile) {
      const maxSize = 20 * 1024 * 1024;
      if (this.selectedimagefile.size > maxSize) {
        this.toastr.error('File size exceeds 20MB');
        return;
      }
      formData.append('imageUrl', this.selectedimagefile);
    }

    if (this.username) {
      this.toastr.info('Publishing your blog ...');
      this.writeservice.publishblog(formData).then(
        res => {
          if (res) {
            this.toastr.success('Blog published 🥳');
            this.toastr.info('Informing your followers about your new blog ...');
            this.resetForm();
            this.selectedPollId = null; 
          } else {
            this.toastr.error('Failed to publish blog');
          }
        },
        error => {
          this.toastr.error('Failed to publish blog');
          console.error('Publish error:', error);
        }
      );
    } else {
      this.toastr.warning('Please log in to publish');
    }
  }

  resetForm() {
    this.edittitle = '';
    this.editbodycontent = '';
    this.editendnotecontent = '';
    this.tags = [];
    this.selectedimagefile = null;
    this.imageUrl = null;
    this.postScheduleTime = undefined;
    this.titleEditor.nativeElement.innerHTML = '';
    this.bodyEditor.nativeElement.innerHTML = '';
    this.endnoteEditor.nativeElement.innerHTML = '';
    this.setupPlaceholder(this.titleEditor.nativeElement, 'Title Goes Here');
    this.setupPlaceholder(this.bodyEditor.nativeElement, 'Try @gif to add gifs');
    this.setupPlaceholder(this.endnoteEditor.nativeElement, 'Share your post script/ending note');
    this.cdr.detectChanges();
  }

  saveasdraft(draftdata: WriteModel) {
    const draft: WriteModel = {
      title: this.edittitle,
      bodyofcontent: this.editbodycontent,
      endnotecontent: this.editendnotecontent,
      tags: this.tags,
      userId: this.userId,
      username: this.username,
      _id: '',
      imageUrl: this.imageUrl || '',
      videoUrl: '',
      funnycount: 0,
      sadcount: 0,
      loveitcount: 0,
      userBio: '',
      userEmotion: '',
      pageviews: 0,
      collaborators: [],
      createdAt: '',
      pollId: this.selectedPollId || undefined 
    
    };
    this.writeservice.draftblog(draft)
        this.toastr.success('Draft saved');
        this.readdraftblog();
  }

  async getloggedinuserdata() {
    try {
      this.loggedInUserAccount = await account.get();
      if (this.loggedInUserAccount) {
        this.username = this.loggedInUserAccount.name;
        this.userId = this.loggedInUserAccount.$id;
        const email = this.loggedInUserAccount.email;
        await this.writeservice.addUserToDB(this.userId, this.username, email).toPromise();
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      this.toastr.error('Failed to fetch user data');
    }
  }

  setBrushColor() {
    if (this.canvas && this.canvas.freeDrawingBrush) {
      this.canvas.freeDrawingBrush.color = this.pickedcolor;
      this.canvas.renderAll();
    }
  }

  setBrushSize() {
    if (this.canvas && this.canvas.freeDrawingBrush) {
      this.canvas.freeDrawingBrush.width = this.brushsize;
      this.canvas.renderAll();
    }
  }

  publishdraft(draftdata: WriteModel) {
    const formData = new FormData();
    formData.append('title', draftdata.title);
    formData.append('bodyofcontent', draftdata.bodyofcontent);
    formData.append('endnotecontent', draftdata.endnotecontent);
    formData.append('tags', JSON.stringify(draftdata.tags || []));
    formData.append('userId', this.userId);
    formData.append('username', this.username);
    formData.append('postScheduleTime', new Date().toISOString());
    if (draftdata.pollId) {
      formData.append('pollId', draftdata.pollId); // Include poll ID when publishing draft
    }
    if (this.selectedimagefile) {
      formData.append('imageUrl', this.selectedimagefile);
    }

    this.writeservice.publishblog(formData).then(
      res => {
        if (res) {
          this.toastr.success('Blog published');
          this.writeservice.deletedraft(draftdata._id)
        } else {
          this.toastr.error('Failed to publish blog');
        }
      },
      error => {
        this.toastr.error('Failed to publish blog');
        console.error('Publish draft error:', error);
      }
    );
  }

  toggleImageUploadPopup() {
    this.showImageUploadPopup = !this.showImageUploadPopup;
    this.cdr.detectChanges();
  }

  closePopup() {
    this.showImageUploadPopup = false;
    this.cdr.detectChanges();
  }

  handleImageUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedimagefile = input.files[0];
      this.imageUrl = URL.createObjectURL(this.selectedimagefile);
      this.cdr.detectChanges();
    } else {
      this.imageUrl = null;
    }
  }

  readdraftblog() {
    this.writeservice.getdraftblog().subscribe(
      (data: WriteModel[]) => {
        this.draftblogs = data;
        this.cdr.detectChanges();
      },
      error => {
        this.toastr.error('Failed to load drafts');
        console.error('Read drafts error:', error);
      }
    );
  }

  editdraft(draftdata: WriteModel) {
    this.edittitle = draftdata.title;
    this.editbodycontent = draftdata.bodyofcontent;
    this.editendnotecontent = draftdata.endnotecontent;
    this.tags = draftdata.tags || [];
    this.imageUrl = draftdata.imageUrl || null;
    this.selectedPollId = draftdata.pollId || null;  
    this.titleEditor.nativeElement.innerHTML = this.edittitle;
    this.bodyEditor.nativeElement.innerHTML = this.editbodycontent;
    this.endnoteEditor.nativeElement.innerHTML = this.editendnotecontent;
    this.editclicked = true;
    this.showDraftsModal = false;
    this.cdr.detectChanges();
  }

  refreshcomponent() {
    this.readdraftblog();
  }

  preview() {
    this.ispreview = true;
    const bdy = this.formatCode(this.editCodeContent) + this.editbodycontent;
    this.previewTitle = this.edittitle;
    this.previewBodyContent = bdy;
    this.previewEndNote = this.editendnotecontent;
    this.cdr.detectChanges();
  }

  closepreview() {
    this.ispreview = false;
    this.cdr.detectChanges();
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ',' || event.key === ';') {
      event.preventDefault();
      const trimmedTag = this.tagInput.trim();
      if (trimmedTag) {
        this.addTag(trimmedTag);
        this.tagInput = '';
        this.cdr.detectChanges();
      }
    }
  }

  addTag(tag: string) {
    if (!this.tags.includes(tag) && tag && tag !== ' ') {
      this.tags.push(tag);
      this.cdr.detectChanges();
    } else {
      this.toastr.error('Tag already exists or is empty');
    }
  }

  removeTag(tag: string) {
    this.tags = this.tags.filter(t => t !== tag);
    this.cdr.detectChanges();
  }

  generateImage() {
    if (!this.prompt.trim()) {
      this.toastr.warning('Please enter a search query');
      return;
    }

    this.writeservice.searchPhotos(this.prompt).subscribe(
      (res: any) => {
        this.photos = res.results.map((image: any) => image.urls.small);
        this.cdr.detectChanges();
      },
      error => {
        this.toastr.error('Failed to fetch images');
        console.error('Image search error:', error);
      }
    );
  }

  generateimagewindow() {
    this.openimagegeneratepopup = !this.openimagegeneratepopup;
    this.photos = [];
    this.prompt = '';
    this.cdr.detectChanges();
  }

  closeImagePopup() {
    this.openimagegeneratepopup = false;
    this.photos = [];
    this.prompt = '';
    this.cdr.detectChanges();
  }

  selectThisImage(selectedImageUrl: string) {
    fetch(selectedImageUrl)
      .then(response => response.blob())
      .then(blob => {
        const file = new File([blob], 'selected-image.jpg', { type: blob.type });
        this.selectedimagefile = file;
        this.imageUrl = URL.createObjectURL(file);
        this.closeImagePopup();
        this.cdr.detectChanges();
      })
      .catch(error => {
        this.toastr.error('Failed to fetch image');
        console.error('Image fetch error:', error);
      });
  }

  toggleCodeEditor() {
    this.showCodeEditor = !this.showCodeEditor;
    if (!this.showCodeEditor) {
      this.insertCode();
    }
    this.cdr.detectChanges();
  }

  insertCode() {
    if (this.editCodeContent) {
      const formattedCode = this.formatCode(this.editCodeContent);
      const bodyEditor = this.bodyEditor.nativeElement;
      const selection = window.getSelection();

      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        const div = document.createElement('div');
        div.innerHTML = formattedCode;
        range.insertNode(div);
        range.collapse(false);
        this.editbodycontent = bodyEditor.innerHTML;
        this.showCodeEditor = false;
        this.editCodeContent = '';
        this.cdr.detectChanges();
      }
    }
  }

  formatCode(code: string): string {
    const lines = code.split('\n');
    const styledLines = lines.map(line => {
      return `<div class="code-line">${this.escapeHtml(line)}</div>`;
    });
    return `<pre class="code-block">${styledLines.join('')}</pre>`;
  }

  escapeHtml(unsafe: string): string {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  openCanvasModal() {
    this.showCanvasModal = true;
    
    // Destroy previous canvas instance if exists
    if (this.canvas) {
      this.canvas.dispose();
    }
  
    // Initialize new canvas
    setTimeout(() => {
      this.canvas = new fabric.Canvas(this.fabricCanvas1.nativeElement, {
        isDrawingMode: this.isdrawing,
        width: 800,
        height: 450,
        backgroundColor: '#ffffff'
      });
  
      // Setup brushes and events
      this.setupCanvas();
      this.cdr.detectChanges();
    });
  }
  
  private setupCanvas() {
    this.canvas.freeDrawingBrush = new fabric.PencilBrush(this.canvas);
    this.canvas.freeDrawingBrush.color = this.pickedcolor;
    this.canvas.freeDrawingBrush.width = this.brushsize;
    
    this.canvas.on('path:created', () => {
      this.isCanvasDirty = true;
    });
    
    this.canvas.renderAll();
  }

  closeCanvasModal() {
    if (this.isCanvasDirty && !confirm('You have unsaved work. Are you sure you want to close?')) {
      return;
    }
    this.showCanvasModal = false;
    this.cdr.detectChanges();
  }

  clearcanvas() {
    if (confirm('Are you sure you want to clear the canvas?')) {
      this.canvas.clear();
      this.canvas.backgroundColor = '#ffffff';
      this.canvas.isDrawingMode = this.isdrawing;
      this.canvas.freeDrawingBrush = new fabric.PencilBrush(this.canvas);
      this.canvas.freeDrawingBrush.color = this.pickedcolor;
      this.canvas.freeDrawingBrush.width = this.brushsize;
      this.canvas.renderAll();
      this.isCanvasDirty = false;
      this.canvasImageUrl = null;
      this.cdr.detectChanges();
    }
  }

  toggleDrawing() {
    if (this.canvas) {
      this.canvas.isDrawingMode = !this.canvas.isDrawingMode;
      this.isdrawing = this.canvas.isDrawingMode;
      if (this.canvas.isDrawingMode) {
        this.selectBrush(this.brushtype); // Ensure brush is set when drawing starts
      }
      this.canvas.renderAll();
      this.cdr.detectChanges();
    }
  }

  saveCanvas() {
    if (this.canvas) {
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
      this.selectedimagefile = new File([blob], 'canvas-image.png', { type: mimeString });
      this.imageUrl = dataURL;
      this.canvasImageUrl = dataURL;
      this.isCanvasDirty = false;
      this.toastr.success('Canvas saved as thumbnail');
      this.cdr.detectChanges();
    }
  }

  addText() {
    if (this.canvas) {
      const text = new fabric.Textbox('Add Your Text Here', {
        left: 100,
        top: 100,
        width: 200,
        fill: this.pickedcolor,
        fontSize: 24,
        fontFamily: 'Arial'
      });
      this.canvas.add(text);
      this.canvas.setActiveObject(text);
      this.canvas.renderAll();
      this.isCanvasDirty = true;
      this.cdr.detectChanges();
    }
  }

  addImageToCanvas(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const imgUrl = e.target?.result;
        if (typeof imgUrl === 'string') {
          const imageElement = document.createElement('img');
          imageElement.src = imgUrl;
          imageElement.onload = () => {
            const image = new fabric.Image(imageElement);
            this.canvas.add(image);
            this.canvas.setActiveObject(image);
            image.scale(0.4);
            this.canvas.renderAll();
          };
        }
      };
    }
  }

  openStickerModal() {
    this.showStickerModal = true;
    this.gifSearchQuery = '';
    this.searchGifs();
    this.cdr.detectChanges();
  }

  async searchGifs() {
    if (!this.gifSearchQuery.trim()) {
      this.gifs = [];
      this.cdr.detectChanges();
      return;
    }

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
      this.toastr.error('Failed to fetch GIFs');
    }
  }
  selectGif(gif: any) {
    const gifUrl = gif.images.fixed_height.url;
    
    if (this.showGifModal) {
      this.insertGifAtPosition(gifUrl);
    }
  
    this.showGifModal = false;
    this.cdr.detectChanges();
  }

  insertGifAtPosition(gifUrl: string) {
    const bodyEditor = this.bodyEditor.nativeElement;
    
    const markerId = `cursor-marker-${Date.now()}`;
    const marker = `<span id="${markerId}"></span>`;
    
    bodyEditor.innerHTML = 
      bodyEditor.innerHTML.substring(0, this.lastCursorPosition) + 
      marker + 
      bodyEditor.innerHTML.substring(this.lastCursorPosition);
    
    const markerElement = document.getElementById(markerId);
    
    if (markerElement) {
      const gifElement = document.createElement('img');
      gifElement.src = gifUrl;
      gifElement.alt = 'GIF';
      gifElement.className = 'inserted-gif';
      gifElement.style.display = 'block';
      gifElement.style.margin = '10px 0';
      
      markerElement.parentNode?.insertBefore(gifElement, markerElement);
      
      markerElement.remove();
      
      this.editbodycontent = bodyEditor.innerHTML;
      this.cdr.detectChanges();
    }
  }
  
  addGifToCanvas(gifUrl: string) {
    if (this.canvas) {
      const imageElement = document.createElement('img');
    imageElement.crossOrigin = 'anonymous';
    imageElement.src = gifUrl;

    imageElement.onload = () => {
      const image = new fabric.Image(imageElement, {
        left: this.canvas.getWidth() / 2,
        top: this.canvas.getHeight() / 2,
        originX: 'center',
        originY: 'center',
      });
      this.canvas.add(image);
      this.canvas.setActiveObject(image);
      image.scale(0.7);
      this.canvas.renderAll();
      this.gifSearchQuery = '';
      this.gifs = [];
    };

    imageElement.onerror = () => {
      this.toastr.error('Failed to load GIF');
    };
    }
  }  

  selectBrush(type: string) {
    if (this.canvas) {
      this.brushtype = type;
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
      this.canvas.freeDrawingBrush.color = this.pickedcolor;
      this.canvas.freeDrawingBrush.width = this.brushsize;
      if (!this.canvas.isDrawingMode) {
        this.canvas.isDrawingMode = true;
        this.isdrawing = true;
      }
      this.canvas.renderAll();
      this.cdr.detectChanges();
    }
  }
 
  togglePollModal(): void {
    this.showPollModal = !this.showPollModal;
    if (this.showPollModal) {
      this.fetchAvailablePolls();
    }
    this.cdr.detectChanges();
  }

  // Fetch polls for the current user
  fetchAvailablePolls(): void {
    if (!this.userId) {
      this.toastr.warning('Please log in to access polls');
      this.showPollModal = false;
      return;
    }

    this.writeservice.getPolls(this.userId).subscribe({
      next: (response) => {
        this.availablePolls = response.polls || [];
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.toastr.error('Failed to load polls');
        console.error('Error fetching polls:', error);
        this.showPollModal = false;
        this.cdr.detectChanges();
      }
    });
  }
  addPollOption(): void {
    this.newPollOptions.push('');
    this.validatePollForm();
    this.cdr.detectChanges();
  }

  // Remove a poll option
  removePollOption(index: number): void {
    if (this.newPollOptions.length > 2) {
      this.newPollOptions.splice(index, 1);
      this.validatePollForm();
      this.cdr.detectChanges();
    } else {
      this.toastr.warning('A poll must have at least two options');
    }
  }

  // Validate the poll form
  validatePollForm(): void {
    const question = this.newPollQuestion.trim();
    const options = this.newPollOptions.map(opt => opt.trim()).filter(opt => opt);
    this.isPollFormValid = question.length > 0 && options.length >= 2;
  }

  // Create a poll and insert it into the post
  createPollAndInsert(): void {
    const question = this.newPollQuestion.trim();
    const options = this.newPollOptions.map(opt => opt.trim()).filter(opt => opt);

    if (!question || options.length < 2) {
      this.toastr.error('Please provide a question and at least two valid options');
      return;
    }

    this.writeservice.createPoll(question, options).subscribe({
      next: (response) => {
        const poll = response.poll;
        const pollId = poll._id;
        this.selectedPollId = pollId; // Store the poll ID
        const pollPlaceholder = `<div class="poll-placeholder" data-poll-id="${pollId}">[Poll: ${poll.question}]</div>`;
        this.insertPollAtPosition(pollPlaceholder);
        this.toastr.success('Poll created and added to your post!');
        this.showPollModal = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.toastr.error(error.error?.error || 'Failed to create poll');
        console.error('Error creating poll:', error);
      }
    });
  }

  insertPollAtPosition(pollPlaceholder: string): void {
    const bodyEditor = this.bodyEditor.nativeElement;

    const markerId = `cursor-marker-${Date.now()}`;
    const marker = `<span id="${markerId}"></span>`;

    bodyEditor.innerHTML =
      bodyEditor.innerHTML.substring(0, this.lastCursorPosition) +
      marker +
      bodyEditor.innerHTML.substring(this.lastCursorPosition);

    const markerElement = document.getElementById(markerId);

    if (markerElement) {
      const pollElement = document.createElement('div');
      pollElement.innerHTML = pollPlaceholder;
      markerElement.parentNode?.insertBefore(pollElement, markerElement);
      markerElement.remove();
      this.editbodycontent = bodyEditor.innerHTML;
      this.cdr.detectChanges();
    }
  }

  // Add trackBy function for ngFor
  trackByIndex(index: number, item: any): number {
    return index;
  }


  selectPoll(poll: any): void {
    const pollPlaceholder = `<div class="poll-placeholder" data-poll-id="${poll._id}">[Poll: ${poll.question}]</div>`;
    this.insertPollAtPosition(pollPlaceholder);
    this.showPollModal = false;
    this.cdr.detectChanges();
  }

  generateFullBlog() {
    if (!this.edittitle) {
      this.toastr.warning('Please provide a title');
      return;
    }
    this.toastr.info('Generating your blog post...');
    this.aiService.generateBlogContent(this.edittitle, this.username).subscribe({
      next: (blogContent) => {
        this.editbodycontent = blogContent;
        this.editendnotecontent = `Post by: <span style="color: #4a90e2; font-weight: bold">${this.username}</span>`;
        this.bodyEditor.nativeElement.innerHTML = this.editbodycontent;
        this.endnoteEditor.nativeElement.innerHTML = this.editendnotecontent;
        this.toastr.success('Blog post generated! Feel free to edit and publish.');
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error generating blog:', error);
        this.toastr.error('Failed to generate blog post');
      }
    });
  }
}