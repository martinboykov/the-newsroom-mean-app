import { ServerErrorInterceptor } from './error-handling/server-error.interceptor';
import { NgModule, ErrorHandler } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { LazyLoadImageModule, intersectionObserverPreset } from 'ng-lazyload-image';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ToastrModule } from 'ngx-toastr';

import { AppRoutingModule } from './app-routing.module';

import { AppComponent } from './app.component';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { AsideRightTrippleComponent } from './aside/aside-right-tripple/aside-right-tripple.component';
import { PostDetailsComponent } from './posts/post-details/post-details.component';
import { PostListComponent } from './posts/post-list/post-list.component';
import { PostItemComponent } from './posts/post-item/post-item.component';
import { MainNavComponent } from './header/main-nav/main-nav.component';
import { SmallNavComponent } from './header/small-nav/small-nav.component';
import { NotFoundComponent } from './error-handling/not-found.component';

import { ToggleNavigationDirective } from './header/toggleNavigation.directive';
import { ToggleSubNavigationDirective } from './header/toggleSubNavigation.directive';
import { MainNavigationDirective } from './header/mainNavigation.directive';
import { SearchActivationDirective } from './header/searchActivation.directive';
import { InsideAsideDirective } from './aside/aside-right-tripple/insideAside.directive';
import { OutsideAsideDirective } from './aside/aside-right-tripple/outsideAside.directive';
import { SelectorsAsideDirective } from './aside/aside-right-tripple/selectorsAside.directive';


import { TimeAgoPipe } from './shared/time-ago.pipe';
import { GlobalErrorHandler } from './error-handling/global-error-handler';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    FooterComponent,
    AsideRightTrippleComponent,
    PostDetailsComponent,
    PostListComponent,
    MainNavComponent,
    SmallNavComponent,
    PostItemComponent,
    ToggleNavigationDirective,
    ToggleSubNavigationDirective,
    MainNavigationDirective,
    SearchActivationDirective,
    InsideAsideDirective,
    OutsideAsideDirective,
    SelectorsAsideDirective,
    TimeAgoPipe,
    NotFoundComponent

  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    ReactiveFormsModule,
    AppRoutingModule,
    NgxPaginationModule,
    InfiniteScrollModule,
    // LazyLoadImageModule
    LazyLoadImageModule.forRoot({
      preset: intersectionObserverPreset
    }),
    BrowserAnimationsModule,
    ToastrModule.forRoot({
    timeOut: 10000,
    positionClass: 'toast-top-right',
    preventDuplicates: true,
  }),
  ],
  providers: [
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    { provide: HTTP_INTERCEPTORS, useClass: ServerErrorInterceptor, multi: true },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
