import {  NgModule, CUSTOM_ELEMENTS_SCHEMA, importProvidersFrom } from '@angular/core';
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
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAnalytics, provideAnalytics, ScreenTrackingService } from '@angular/fire/analytics';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { UserdashboardComponent } from './userdashboard/userdashboard.component';
import { environment } from '../environments/environment';
import { OverviewComponent } from './overview/overview.component';
import { MyBlogsComponent } from './my-blogs/my-blogs.component';
import { AnalyticsComponent } from './analytics/analytics.component';
import { SettingsComponent } from './settings/settings.component';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { BlogReelComponent } from './blog-reel/blog-reel.component'; 
import { HammerModule } from '@angular/platform-browser';
import { CollabComponent } from './collab/collab.component';
import { SearchCollabComponent } from './search-collab/search-collab.component';

const routes  = [

  {path: '', component: HomeComponent},
  {path: 'read', component: ReadComponent},
  {path: 'write', component: WriteComponent,canActivate:[routeauthguardGuard]},
  {path: 'whosrony', component: WhosronyComponent},
  // {path: 'reading', component: ReadingComponent},
  { path: 'reading/:postid', component: ReadingComponent },
  { path: 'userlogin', component: UserloginComponent },
  { path: 'blogreel', component: BlogReelComponent },
  { path: 'userdashboard', component: UserdashboardComponent,canActivate:[routeauthguardGuard] },
  { path: 'profile/:userId', component: UserdashboardComponent },
  { path: 'collab/:userId/:postId', component: CollabComponent,canActivate:[routeauthguardGuard] },
  { path: 'search-add-collab/:postId', component: SearchCollabComponent},
  {path: '**', component: WrongpageComponent}
];

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
    UserdashboardComponent,
    OverviewComponent,
    MyBlogsComponent,
    AnalyticsComponent,
    SettingsComponent,
    BlogReelComponent,
    CollabComponent,
    SearchCollabComponent,

  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    BrowserAnimationsModule,
    InfiniteScrollModule,
    NgxChartsModule,
    HammerModule,
    ToastrModule.forRoot(),
    RouterModule.forRoot(routes),
  ],
  providers: [WriteserviceService,  provideFirebaseApp(() => initializeApp(environment.firebaseConfig)), 
    provideAnalytics(() => getAnalytics()),
    provideFirestore(() => getFirestore()),ScreenTrackingService],
    
    bootstrap: [AppComponent],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class AppModule { }
