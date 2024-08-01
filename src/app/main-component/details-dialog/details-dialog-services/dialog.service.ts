
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from 'src/app/environment/environment';

@Injectable({
  providedIn: 'root'
})
export class DialogService {
  private clientUrl = environment.clientUrl;
  private stateUrl = environment.stateUrl;
  private clientDetailsUrl = environment.clientDetailsUrl;

  constructor(private http: HttpClient) {}

  getClients(): Observable<any[]> {
    return this.http.get<any[]>(this.clientUrl).pipe(
      catchError(error => {
        console.error('Error fetching clients:', error);
        return throwError(() => new Error('Error fetching clients'));
      })
    );
  }

  getStates(): Observable<any[]> {
    return this.http.get<any[]>(this.stateUrl).pipe(
      catchError(error => {
        console.error('Error fetching states:', error);
        return throwError(() => new Error('Error fetching states'));
      })
    );
  }

  createClientDetails(clientDetails: any): Observable<any> {
    return this.http.post<any>(this.clientDetailsUrl, clientDetails);
  }

  updateClientDetails(clientDetails: any, id: any): Observable<any> {
    return this.http.put<any>(`${this.clientDetailsUrl}/${id}`, clientDetails).pipe(
      catchError(error => {
        console.error('Error updating client details:', error);
        return throwError(() => new Error('Error updating client details'));
      })
    );
  }

}