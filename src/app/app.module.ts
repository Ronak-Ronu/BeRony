import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { FormsModule } from '@angular/forms'
import { ToastrModule } from 'ngx-toastr';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NavbarComponent } from './navbar/navbar.component';
import { WriteComponent } from './write/write.component';
import { WhosronyComponent } from './whosrony/whosrony.component';
import { ReadComponent } from './read/read.component';
import { RouterModule} from '@angular/router';
import { HomeComponent } from './home/home.component';
import { WriteserviceService } from './writeservice.service';
import { HttpClientModule } from '@angular/common/http';
import { ReadingComponent } from './reading/reading.component';
import { WrongpageComponent } from './wrongpage/wrongpage.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { UserloginComponent } from './userlogin/userlogin.component';
import { routeauthguardGuard } from './routeauthguard.guard';

const routes  = [

  {path: '', component: HomeComponent},
  {path: 'read', component: ReadComponent},
  {path: 'write', component: WriteComponent,canActivate:[routeauthguardGuard]},
  {path: 'whosrony', component: WhosronyComponent},
  // {path: 'reading', component: ReadingComponent},
  { path: 'reading/:postid', component: ReadingComponent },
  { path: 'userlogin', component: UserloginComponent },
  {path: '**', component: WrongpageComponent}


];
``

@NgModule({

  declarations: [
    AppComponent,
    NavbarComponent,
    WriteComponent,
    WhosronyComponent,
    ReadComponent,
    HomeComponent,
    ReadingComponent,
    WrongpageComponent,
    UserloginComponent,

  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    BrowserAnimationsModule,
    ToastrModule.forRoot(),
    RouterModule.forRoot(routes)
  ],
  providers: [WriteserviceService],
  bootstrap: [AppComponent]
})

export class AppModule { }
