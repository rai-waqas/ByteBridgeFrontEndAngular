import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/app/environment/environment';
import { Files } from '../details-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class FileService {
  private uploadUrl = environment.filesUploadUrl;
  private fileGetUrl = environment.filesGetUrl;
  private fileDeleteUrl = environment.filesDeleteUrl;

  constructor(private http: HttpClient) { }

  uploadFiles(clientId: number, files: File[]): Observable<any> {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    formData.append('clientDetailsId', clientId.toString());

    return this.http.post(`${this.uploadUrl}`, formData);
  }

  // Method to get files for a specific client
  getFiles(clientDetailsId: number): Observable<Files[]> {
    return this.http.get<Files[]>(`${this.fileGetUrl}/${clientDetailsId}`);
  }

  // Method to delete a file by ID
  deleteFile(fileId: number): Observable<void> {
    return this.http.delete<void>(`${this.fileDeleteUrl}/${fileId}`);
  }

}
