import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { DetailsDialogComponent } from './details-dialog/details-dialog.component';
import { MainComponentService } from './main-component-service/main-component-service';
import { DialogService } from './details-dialog/details-dialog-services/dialog.service';
import { ConfirmDialogComponent } from './confirm-dialog/confirm-dialog.component';
import { MatSort } from '@angular/material/sort';
import { PageEvent } from '@angular/material/paginator';
import { debounceTime, switchMap } from 'rxjs/operators';
import { FormControl } from '@angular/forms';


export interface DocumentData {
  id: number;
  name: string;
  email: string;
  clientId: number;
  stateId: string;
  dob: Date;
  client_name?: string;
  expStart: string; 
  expEnd: string;
  yearsOfExperience?: string; 
  gender: string;
  payValue: number;
  payType: string;
  files: File[];
}
@Component({
  selector: 'app-main-component',
  templateUrl: './main-component.component.html',
  styleUrls: ['./main-component.component.css']
})
export class MainComponentComponent implements AfterViewInit {
  dataSource = new MatTableDataSource<DocumentData>();
  clientMap: Map<number, string> = new Map(); 
  searchControl = new FormControl(''); 
  displayedColumns: string[] = ['name', 'email', 'client', 'yearsOfExperience', 'gender', 'rate', 'actions'];
  searchTerm: string = '';
  currentPage: number = 1;
  pageSize: number = 3;
  totalCount = 0;
  sortColumn: string = 'name';
  sortDirection: 'asc' | 'desc' = 'asc'; 
  constructor(private mainComponentService: MainComponentService, public dialog: MatDialog, private dialogService: DialogService) {}

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.loadClientDetails(this.searchControl.value || '', this.pageSize, this.currentPage, this.sortColumn, this.sortDirection);

    // Debounce to search input
    this.searchControl.valueChanges.pipe(
      debounceTime(500), // Wait for 500ms of inactivity
      switchMap(searchTerm => this.mainComponentService.getClientDetails(searchTerm  || '', this.pageSize, this.currentPage, this.sortColumn, this.sortDirection))
    ).subscribe(response => {
      this.dataSource.data = response.data.map(detail => ({
        ...detail,
        yearsOfExperience: this.calculateExperience(detail.expStart, detail.expEnd),
      }));
      this.totalCount = response.totalCount;
      if (this.paginator) {
        this.paginator.length = this.totalCount;
      }
    });

    // Listen to sort changes
    this.sort.sortChange.subscribe(sort => {
      this.sortColumn = sort.active;
      if (sort.direction === 'asc' || sort.direction === 'desc') {
        this.sortDirection = sort.direction;
      } else {
        this.sortDirection = 'asc';
      }
    
      this.loadClientDetails(this.searchControl.value || '', this.pageSize, this.currentPage, this.sortColumn, this.sortDirection);
    });

    // Listen to paginator changes
    this.paginator.page.subscribe(() => {
      this.loadClientDetails(this.searchControl.value || '', this.pageSize, this.paginator.pageIndex + 1, this.sortColumn, this.sortDirection);
    });
  }
  openDialog(): void {
      const dialogRef = this.dialog.open(DetailsDialogComponent, {
        width: '900px',
        position: { right: '0' },
        panelClass: 'right-slide-dialog',
      });
  
      dialogRef.afterClosed().subscribe(result => {
        // console.log('The dialog was closed');
        this.loadClientDetails(this.searchControl.value || '', this.pageSize, this.currentPage, this.sortColumn, this.sortDirection);
      });
    }

    loadClients() {
      this.mainComponentService.getClients().subscribe(
        clients => {
          this.clientMap = new Map(clients.map(client => [client.id, client.name]));
        },
        error => {
          console.error('Error fetching clients', error);
        }
      );
    }
  
    loadClientDetails(searchTerm: string, pageSize: number, pageNumber: number, sortColumn: string, sortDirection: 'asc' | 'desc') {
      this.mainComponentService.getClientDetails(searchTerm, pageSize, pageNumber, sortColumn, sortDirection).subscribe(
        (response) => {
          this.dataSource.data = response.data.map(detail => ({
            ...detail,

            yearsOfExperience: this.calculateExperience(detail.expStart, detail.expEnd),
          }));
          this.totalCount = response.totalCount;
          console.log('Total count', this.totalCount); 
          if (this.paginator) {
            this.paginator.length = this.totalCount;
          }
          console.log('Client details fetched successfully', this.dataSource.data);
        },
        error => {
          console.error('Error fetching client details', error);
        }
      );
    }

    onPageChange(event: PageEvent) {
      this.currentPage = event.pageIndex + 1;
      this.pageSize = event.pageSize;
      this.loadClientDetails(this.searchControl.value || '', this.pageSize, this.currentPage, this.sortColumn, this.sortDirection);
    }

    confirmDelete(id: number): void {
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '400px',
        data: { id }
      });
  
      dialogRef.afterClosed().subscribe(result => {
        if (result === 'confirm') {
          this.deleteClientDetails(id);
        }
      });
    }

    deleteClientDetails(id: number): void {
      this.mainComponentService.deleteClientDetails(id).subscribe(
        () => {
          this.searchControl.setValue('');
        },
        error => {
          console.error('Error deleting client details', error);
        }
      );
    }

    openEditDialog(clientDetail: DocumentData): void {
      const dialogRef = this.dialog.open(DetailsDialogComponent, {
          width: '900px',
          position: { right: '0' },
          panelClass: 'right-slide-dialog',
          data: {
            clientDetail,
            isEditClicked: !!clientDetail
          }
      });
  
      dialogRef.afterClosed().subscribe(result => {
          this.loadClientDetails(this.searchControl.value || '', this.pageSize, this.currentPage, this.sortColumn, this.sortDirection);
      });
  }

    calculateExperience(expStart: string, expEnd: string): string {
      const startDate = new Date(expStart);
      const endDate = new Date(expEnd);
  
      let years = endDate.getFullYear() - startDate.getFullYear();
      let months = endDate.getMonth() - startDate.getMonth();
  
      if (months < 0) {
        years--;
        months += 12;
      }
  
      const yearsText = years > 0 ? `${years} Year${years !== 1 ? 's' : ''}` : '';
      const monthsText = months > 0 ? `${months} Month${months !== 1 ? 's' : ''}` : '';
      if (yearsText || monthsText) {
        return [yearsText, monthsText].filter(part => part).join(' ');
      }
      else{
        return 'No Experience';
      }
    }

  }
