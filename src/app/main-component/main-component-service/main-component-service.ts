import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from 'src/app/environment/environment';
import { DocumentData } from '../main-component.component';
import { HttpParams } from '@angular/common/http';

@Injectable({
    providedIn: 'root'
  })


export class MainComponentService{
    private clientDetailsUrl = environment.clientDetailsUrl;
    private clientsUrl = environment.clientUrl;
    constructor(private http: HttpClient) {}

    getClientDetails(
      searchTerm: string,
      pageSize: number,
      pageNumber: number,
      sortColumn: string = '', 
      sortDirection: 'asc' | 'desc' = 'asc'
    ): Observable<{ data: DocumentData[], totalCount: number }> {
      let params = new HttpParams()
        .set('searchTerm', searchTerm)
        .set('pageSize', pageSize.toString())
        .set('pageNumber', pageNumber.toString());
    
      // Include sorting parameters if provided
      if (sortColumn) {
        params = params.set('sortColumn', sortColumn);
      }
      if (sortDirection) {
        params = params.set('sortDirection', sortDirection);
      }
    
      return this.http.get<{ data: DocumentData[], totalCount: number }>(`${this.clientDetailsUrl}`, { params });
    }
    

    getClients(): Observable<any[]> {
        return this.http.get<any[]>(this.clientsUrl);
    }

    deleteClientDetails(id: number): Observable<void> {
        return this.http.delete<void>(`${this.clientDetailsUrl}/${id}`);
    }

    
}