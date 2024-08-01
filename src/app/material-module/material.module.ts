import { NgModule } from "@angular/core";
import { MatDialogModule } from '@angular/material/dialog';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule, MatLabel } from '@angular/material/form-field';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from "@angular/material/paginator";
import { MatSelectModule } from "@angular/material/select";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatRadioModule } from "@angular/material/radio";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatNativeDateModule } from "@angular/material/core";
import { MatSortModule } from "@angular/material/sort";



@NgModule({
    imports: [    
        MatDialogModule,
        MatToolbarModule,
        MatIconModule,
        MatMenuModule,
        MatFormFieldModule,
        MatTableModule,
        MatInputModule,
        MatPaginatorModule,
        MatSelectModule,
        MatCheckboxModule,
        MatRadioModule,
        MatNativeDateModule,
        MatDatepickerModule,
        MatSortModule,
    ],
    exports: [    
        MatDialogModule,
        MatToolbarModule,
        MatIconModule,
        MatMenuModule,
        MatFormFieldModule,
        MatTableModule,
        MatInputModule,
        MatPaginatorModule,
        MatSelectModule,
        MatCheckboxModule,
        MatRadioModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatSortModule,
    ]
})
export class MaterialModule { }