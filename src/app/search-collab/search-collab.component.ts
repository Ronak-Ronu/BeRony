import { Component, OnInit } from '@angular/core';
import { WriteserviceService } from '../writeservice.service';
import { ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-search-collab',
  templateUrl: './search-collab.component.html',
  styleUrl: './search-collab.component.css'
})
export class SearchCollabComponent implements OnInit {

  postId: string;
  searchQuery: string = '';
  users: any[] = [];
  message: string = '';  constructor(
    private service:WriteserviceService,
    private route:ActivatedRoute,
    private toaster:ToastrService
  ){
    this.postId = this.route.snapshot.paramMap.get('postId') || '';

  }

  ngOnInit(): void {
    
  }
  searchUsers(): void {
    this.service.searchUsers(this.searchQuery).subscribe(
      (response) => {
        this.users = response;
      },
      (error) => {
        console.error('Error fetching users:', error);
      }
    );
  }
  addCollaborator(userId: string): void {
    this.service.addCollaborator(this.postId, userId).subscribe(
      (response) => {
        this.message = 'Collaborator added successfully!';
        this.toaster.success("Collaborator added !")

      },
      (error) => {
        this.message = 'Error adding collaborator: ' + error.error.message;
        this.toaster.warning(error.error.message)
      }
    );
  }


}
