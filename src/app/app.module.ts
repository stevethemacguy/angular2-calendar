/**
 * `AppModule` is the main entry point into Angular2's bootstrapping process
 */

import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {HttpModule} from '@angular/http';
import {CalendarModule} from 'primeng/components/calendar/calendar';
import {AppComponent} from './app.component';
import {CalendarInputComponent} from "./calendar/sd-calendar/sd-calendar.component";
import {Utils} from "./calendar/utils/utils.service";
import {RouterModule} from '@angular/router';
import {HomeComponent} from "./home/home.component";
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {appRoutes} from "./app.routes";

@NgModule({
  declarations: [
    AppComponent,
    CalendarInputComponent,
    HomeComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    CalendarModule,
    FormsModule,
    HttpModule,
    RouterModule.forRoot(appRoutes)
  ],
  providers: [
    Utils,
    CalendarInputComponent
  ],
  bootstrap: [AppComponent]
})

export class AppModule {
}
