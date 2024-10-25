import { Component, NgModule } from '@angular/core';
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


const routes  = [

  {path: '', component: HomeComponent},
  {path: 'read', component: ReadComponent},
  {path: 'write', component: WriteComponent,canActivate:[routeauthguardGuard]},
  {path: 'whosrony', component: WhosronyComponent},
  // {path: 'reading', component: ReadingComponent},
  { path: 'reading/:postid', component: ReadingComponent },
  { path: 'userlogin', component: UserloginComponent },
  { path: 'userdashboard', component: UserdashboardComponent,canActivate:[routeauthguardGuard] },
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
    UserdashboardComponent,
    OverviewComponent,
    MyBlogsComponent,
    AnalyticsComponent,
    SettingsComponent,

  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    BrowserAnimationsModule,
    InfiniteScrollModule,
    ToastrModule.forRoot(),
    RouterModule.forRoot(routes),
  
    
  ],
  providers: [WriteserviceService,  provideFirebaseApp(() => initializeApp(environment.firebaseConfig)), 
    provideAnalytics(() => getAnalytics()),
    provideFirestore(() => getFirestore()),ScreenTrackingService],
  bootstrap: [AppComponent]
})

export class AppModule { }
