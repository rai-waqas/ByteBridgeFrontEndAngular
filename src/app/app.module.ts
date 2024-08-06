import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { MainComponentComponent } from './main-component/main-component.component';
import { DetailsDialogComponent } from './main-component/details-dialog/details-dialog.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialModule } from './material-module/material.module';
import { NavbarComponentComponent } from './navbar-component/navbar-component.component';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { SuccessDialogComponent } from './main-component/details-dialog/success-dialog/success-dialog.component';
import { ConfirmDialogComponent } from './main-component/confirm-dialog/confirm-dialog.component';
import { ToastNoAnimationModule, ToastrModule } from 'ngx-toastr';



@NgModule({
  declarations: [
    AppComponent,
    MainComponentComponent,
    DetailsDialogComponent,
    NavbarComponentComponent,
    SuccessDialogComponent,
    ConfirmDialogComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MaterialModule,
    ReactiveFormsModule,
    HttpClientModule,
    ToastrModule.forRoot({
      positionClass: 'toast-bottom-right',
    }),
    ToastNoAnimationModule.forRoot(),
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
