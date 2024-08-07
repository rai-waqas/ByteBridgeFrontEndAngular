import { Component, OnInit, Inject } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { DialogService } from './details-dialog-services/dialog.service';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { SuccessDialogComponent } from './success-dialog/success-dialog.component';
import { DocumentData } from '../main-component.component';
import { FileService } from './details-dialog-services/file.service';
import { ElementRef, ViewChild } from '@angular/core';
import { emailDotValidator } from '../../validators/validators';
import { dateRangeValidator } from '../../validators/validators';
import { ToastrService } from 'ngx-toastr';
import cli from '@angular/cli';

export interface Files {
  id: number;
  filename: string;
  filedata: string;
  clientDetailsId: number;
}

interface ClientDetails {
  name: string;
  email: string;
  clientId: number;
  stateId: string;
  dob: string;
  expStart: string;
  expEnd: string;
  payValue: number;
  payType: string;
  gender: string;
  id?: number; // Optional property for calling update
  files?: File[];
}

@Component({
  selector: 'app-details-dialog',
  templateUrl: './details-dialog.component.html',
  styleUrls: ['./details-dialog.component.css'],
})
export class DetailsDialogComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef;
  states: any[] = [];
  isStateChanged = false;
  isPresentChanged = false;
  payType: string = 'hourly';
  detailsForm!: FormGroup;
  clients: any[] = [];
  isEditClicked: false;
  clientDetails: DocumentData | undefined;
  editDetailsId: any;
  files: any[] = [];
  errorMessages: string[] = [];
  errorMessage: string | null = null;
  today: Date;
  newlyAddedFiles?: File[] = [];

  constructor(
    private dialogService: DialogService,
    private dialog: MatDialog,
    private fileService: FileService,
    private toastr: ToastrService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.isEditClicked = data?.isEditClicked ?? false;
    this.clientDetails = data?.clientDetail ?? {};
    this.today = new Date();
    this.today.setDate(this.today.getDate() - 1);
    if (this.isEditClicked) {
      if (data.clientDetail?.files) {
        this.files = data.clientDetail.files.map((file: Files) => ({
          ...file,
          clientDetailsId: this.clientDetails?.id,
          blob: this.convertBase64ToBlob(
            file.filedata,
            this.getFileContentType(file.filename),
            file.filename
          ),
        }));
      }
    }
  }

  ngOnInit() {
    this.detailsForm = new FormGroup(
      {
        name: new FormControl('', Validators.required),
        email: new FormControl('', [
          Validators.required,
          Validators.email,
          emailDotValidator(),
        ]),
        client: new FormControl(this.clients[0]?.id, Validators.required),
        state: new FormControl([], Validators.required),
        dob: new FormControl(null, [
          Validators.required,
          this.dateValidator.bind(this),
        ]),
        expStart: new FormControl(null, [
          Validators.required,
          this.dateValidator.bind(this),
        ]),
        expEnd: new FormControl(null, [
          Validators.required,
          this.dateValidator.bind(this),
        ]),
        hourlyRate: new FormControl(
          { value: null, disabled: this.isStateChanged },
          [Validators.required, Validators.min(0)]
        ),
        percentage: new FormControl(
          { value: null, disabled: !this.isStateChanged },
          [Validators.required, Validators.min(0), Validators.max(100)]
        ),
        yearsOfExperience: new FormControl({ value: '', disabled: true }),
        gender: new FormControl('', Validators.required),
        file: new FormControl([]),
      },
      { validators: dateRangeValidator('dob', 'expStart') }
    );

    this.dialogService.getClients().subscribe((clients) => {
      this.clients = clients;
      if (this.isEditClicked) {
        this.detailsForm.get('client')?.setValue(this.clientDetails?.clientId);
      } else {
        this.detailsForm.get('client')?.setValue(this.clients[0]?.id);
      }
    });

    this.dialogService.getStates().subscribe((states) => {
      this.states = states;
      // console.log('States:', this.states);
      if (this.isEditClicked) {
        this.detailsForm.get('state')?.setValue(this.clientDetails?.stateId);
      } else {
        this.detailsForm.get('state')?.setValue([]);
      }
    });

    if (this.isEditClicked) {
      this.setEditFormValues();
    }

    this.detailsForm
      .get('expStart')
      ?.valueChanges.subscribe(() => this.validateExperienceDates());
    this.detailsForm
      .get('expEnd')
      ?.valueChanges.subscribe(() => this.validateExperienceDates());

    this.detailsForm
      .get('expStart')
      ?.valueChanges.subscribe(() => this.calculateExperience());
    this.detailsForm
      .get('expEnd')
      ?.valueChanges.subscribe(() => this.calculateExperience());
  }

  private setEditFormValues() {
    console.log('Client Details for edit:', this.clientDetails);
    if (this.clientDetails) {
      this.editDetailsId = this.clientDetails.id;

      this.detailsForm.patchValue({
        name: this.clientDetails.name,
        email: this.clientDetails.email,
        client: this.clientDetails.clientId,
        state: this.clientDetails.stateId,
        dob: new Date(this.clientDetails.dob),
        expStart: new Date(this.clientDetails.expStart),
        expEnd: new Date(this.clientDetails.expEnd),
        yearsOfExperience: this.clientDetails.yearsOfExperience,
        hourlyRate:
          this.clientDetails.payType === 'hourly'
            ? this.clientDetails.payValue
            : null,
        percentage:
          this.clientDetails.payType === 'percentage'
            ? this.clientDetails.payValue
            : null,
        gender: this.clientDetails.gender,
        // file: this.clientDetails.files
      });
      if (this.clientDetails.payType === 'hourly') {
        this.detailsForm.get('percentage')?.disable();
      } else {
        this.detailsForm.get('hourlyRate')?.disable();
      }
      // this.files = this.clientDetails.files;
      console.log('Files:', this.files);
      console.log(this.detailsForm.value);

      this.isStateChanged = this.clientDetails.payType === 'percentage';
      this.payType = this.clientDetails.payType;
      this.updatePayTypeControls(this.payType);
    }
  }

  onPresentChange(event: any) {
    this.isPresentChanged = event.checked;
    console.log('Present Changed:', this.isPresentChanged);
    if (this.isPresentChanged) {
      this.detailsForm.get('expEnd')?.setValue(this.today);
      this.detailsForm.get('expEnd')?.disable();
    } else {
      this.detailsForm.get('expEnd')?.setValue(null);
      this.detailsForm.get('expEnd')?.enable();
    }
    this.detailsForm.get('expEnd')?.updateValueAndValidity();
  }

  onStateChange(event: any) {
    this.isStateChanged = event.checked;
    console.log('State Changed:', this.isStateChanged);
    this.payType = this.isStateChanged ? 'percentage' : 'hourly';
    this.updatePayTypeControls(this.payType);
  }

  private updatePayTypeControls(payType: string) {
    console.log('Pay Type:', payType);
    if (payType === 'percentage') {
      this.detailsForm.get('hourlyRate')?.disable();
      this.detailsForm.get('percentage')?.enable();
    } else {
      this.detailsForm.get('hourlyRate')?.enable();
      this.detailsForm.get('percentage')?.disable();
    }
  }

  private dateValidator(
    control: FormControl
  ): { [key: string]: boolean } | null {
    const value = control.value;
    if (value && new Date(value) > this.today) {
      return { invalidDate: true };
    }
    return null;
  }

  private validateExperienceDates() {
    const expStart = new Date(this.detailsForm.get('expStart')?.value);
    const expEnd = new Date(this.detailsForm.get('expEnd')?.value);

    if (expStart && expEnd) {
      if (expStart > expEnd) {
        this.detailsForm
          .get('expEnd')
          ?.setErrors({ invalidExperienceDates: true });
      } else {
        this.detailsForm.get('expEnd')?.setErrors(null);
      }
    }
  }

  private calculateExperience() {
    const expStart = this.detailsForm.get('expStart')?.value;
    const expEnd = this.detailsForm.get('expEnd')?.value;

    if (expStart && expEnd) {
      const startDate = new Date(expStart);
      const endDate = new Date(expEnd);

      let years = endDate.getFullYear() - startDate.getFullYear();
      let months = endDate.getMonth() - startDate.getMonth();

      if (months < 0) {
        years--;
        months += 12;
      }

      let experienceString = '';

      if (years > 0) {
        experienceString += `${years} Year${years !== 1 ? 's' : ''} `;
      }

      if (months > 0) {
        experienceString += `${months} Month${months !== 1 ? 's' : ''}`;
      }

      experienceString = experienceString.trim();
      if (experienceString === '') {
        this.detailsForm.get('yearsOfExperience')?.setValue('No Experience');
      } else {
        this.detailsForm.get('yearsOfExperience')?.setValue(experienceString);
      }
    }
  }

  handleBrowseClick(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation(); // Prevents the click event from propagating to the parent div
    this.fileInput.nativeElement.click(); // Triggers the file input click
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.errorMessages = [];
    if (input.files) {
      const selectedFiles = Array.from(input.files);

      // Define allowed file formats and max size (5 MB)
      const allowedFormats = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'];
      const maxSize = 5 * 1024 * 1024; // 5 MB in bytes

      let errors: string[] = [];

      if (this.isEditClicked) {
        this.newlyAddedFiles?.push(...selectedFiles);

        // Retrieve current files from the form
        const currentFiles = this.detailsForm.get('file')?.value || [];

        // Create a map to keep track of existing file names
        const existingFileNames = new Set(
          currentFiles.map((file: any) => file.name)
        );

        // Handle new files
        selectedFiles.forEach((file) => {
          const fileExtension = file.name.split('.').pop()?.toLowerCase();
          const fileSize = file.size;

          if (!allowedFormats.includes(fileExtension as string)) {
            errors.push(`File ${file.name} is not in an allowed format.`);
            return;
          }

          if (fileSize > maxSize) {
            errors.push(`File ${file.name} exceeds the 5 MB size limit.`);
            return;
          }

          if (existingFileNames.has(file.name)) {
            errors.push(`File ${file.name} is a duplicate.`);
            return;
          }

          // If no errors, process the file
          const reader = new FileReader();
          reader.onloadend = () => {
            const fileData = reader.result as string;
            this.files.push({
              id: null, // New files won't have an ID
              filename: file.name,
              filedata: fileData,
              clientDetailsId: this.editDetailsId, // Placeholder
              blob: file, // Directly use the file object for preview
            });
            // Update form value with original file object
            this.detailsForm.get('file')?.setValue([
              ...this.detailsForm.get('file')?.value,
              file, // Push the original file object
            ]);
          };
          reader.readAsDataURL(file);
        });
      } else {
        // When adding new files (not in edit mode)
        const currentFiles = this.detailsForm.get('file')?.value || [];

        // Create a map to keep track of existing file names
        const fileNamesMap = new Set(
          currentFiles.map((file: any) => file.name)
        );

        selectedFiles.forEach((file) => {
          const fileExtension = file.name.split('.').pop()?.toLowerCase();
          const fileSize = file.size;

          if (!allowedFormats.includes(fileExtension as string)) {
            errors.push(`File ${file.name} is not in an allowed format.`);
            return;
          }

          if (fileSize > maxSize) {
            errors.push(`File ${file.name} exceeds the 5 MB size limit.`);
            return;
          }

          if (fileNamesMap.has(file.name)) {
            errors.push(`File ${file.name} is a duplicate.`);
            return;
          }

          // If no errors, process the file
          const reader = new FileReader();
          reader.onloadend = () => {
            const fileData = reader.result as string;
            const updatedFiles = [...currentFiles, file];
            this.detailsForm.get('file')?.setValue(updatedFiles);
            this.files = updatedFiles.map((file) => ({
              ...file,
              blob: file, // Keep original file for previewing
            }));
          };
          reader.readAsDataURL(file);
        });
      }

      // Display error messages if there are any
      if (errors.length > 0) {
        this.errorMessage = errors.join(' ');
        console.log('Errors:', errors);
      } else {
        this.errorMessage = ''; // Clear errors if there are none
      }
    }
  }

  convertBase64ToBlob(
    base64Data: string,
    contentType: string,
    fileName: string
  ): Blob {
    try {
      // Remove any data URL prefix
      const base64String = base64Data.startsWith('data:')
        ? base64Data.split(',')[1]
        : base64Data;

      // Check if base64String is valid
      if (!base64String || !base64String.trim()) {
        throw new Error('Base64 string is missing or invalid');
      }

      // Ensure the base64 string is a valid length
      if (base64String.length % 4 !== 0) {
        throw new Error('Base64 string length is incorrect');
      }

      // Decode base64 string to binary data
      const byteCharacters = atob(base64String);
      const byteNumbers = new Array(byteCharacters.length);

      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }

      // Convert binary data to Uint8Array
      const byteArray = new Uint8Array(byteNumbers);

      // Create and return a Blob
      return new Blob([byteArray], { type: contentType });
    } catch (error) {
      console.error('Error converting base64 to Blob:', error);
      return new Blob(); // or handle this error as needed
    }
  }

  private getFileContentType(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'application/pdf';
      case 'jpg':
        return 'image/jpeg';
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'doc':
        return 'application/msword';
      case 'docx':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      default:
        return 'application/octet-stream';
    }
  }

  previewFile(file: any): void {
    if (file.blob) {
      try {
        const url = URL.createObjectURL(file.blob);

        // Open the file in a new window/tab
        window.open(url, '_blank');

        // Optionally, you can revoke the Object URL after a short delay
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      } catch (error) {
        console.error('Error previewing file:', error);
      }
    } else {
      console.error('File blob is missing');
    }
  }

  deleteFile(fileObj: any): void {
    if (this.isEditClicked) {
      const fileToDelete = this.files.find((file) => file === fileObj);
      if (fileToDelete) {
        // Remove file from form and preview
        const updatedFiles = this.detailsForm
          .get('file')
          ?.value.filter((file: any) => file.name !== fileToDelete.blob.name);
        this.detailsForm.get('file')?.setValue(updatedFiles);
        this.files = this.files.filter((file) => file !== fileObj);
        const isNewFile = this.newlyAddedFiles?.find(
          (file) => file.name === fileToDelete.blob.name
        );
        if (!isNewFile) {
          this.fileService.deleteFile(fileObj.id).subscribe(
            (response) => {
              this.toastr.success('File deleted successfully');
            },
            (error) => {
              this.toastr.error('Error deleting file');
            }
          );
        } else {
          this.toastr.success('File deleted successfully');
        }
      } else {
        this.toastr.error('File not found');
      }
    } else {
      this.detailsForm.get('file')?.value;
      const fileToDelete = this.files.find((file) => file === fileObj);
      if (fileToDelete) {
        // Remove file from form and preview
        const updatedFiles = this.detailsForm
          .get('file')
          ?.value.filter((file: any) => file.name !== fileToDelete.blob.name);
        this.detailsForm.get('file')?.setValue(updatedFiles);
        this.files = this.files.filter((file) => file !== fileObj);
        this.toastr.success('File deleted successfully');
      }
    }
  }

  onSubmit() {
    if (this.detailsForm.valid) {
      const formValue = this.detailsForm.value;
      // Format dates
      formValue.dob = new Date(formValue.dob).toISOString();
      formValue.expStart = new Date(formValue.expStart).toISOString();
      formValue.expEnd = new Date(
        this.detailsForm.controls['expEnd'].value
      ).toISOString();
      const stateIds = formValue.state.join(',');

      let clientDetails: ClientDetails = {
        name: formValue.name,
        email: formValue.email,
        clientId: formValue.client,
        stateId: stateIds,
        dob: formValue.dob,
        expStart: formValue.expStart,
        expEnd: formValue.expEnd,
        payValue: this.isStateChanged
          ? formValue.percentage
          : formValue.hourlyRate,
        payType: this.payType,
        gender: formValue.gender,
        files: formValue.file,
      };

      const formData = new FormData();
      formData.append('name', clientDetails.name);
      formData.append('email', clientDetails.email);
      formData.append('clientId', clientDetails.clientId.toString());
      formData.append('stateId', clientDetails.stateId);
      formData.append('dob', clientDetails.dob);
      formData.append('expStart', clientDetails.expStart);
      formData.append('expEnd', clientDetails.expEnd);
      formData.append('payValue', clientDetails.payValue.toString());
      formData.append('payType', this.payType);
      formData.append('gender', clientDetails.gender);

      if (this.detailsForm.get('file')?.value.length > 0) {
        const files: File[] = this.detailsForm.get('file')?.value;
        files.forEach((file) => {
          formData.append('files', file, file.name);
        });
      }
      console.log('Client Details:', clientDetails);

      if (this.isEditClicked) {
        formData.append('id', this.editDetailsId.toString());
        console.log('Client Details:', formData);
        // Call update service here
        this.dialogService
          .updateClientDetails(formData, this.editDetailsId)
          .subscribe(
            (response) => {
              console.log('Client Details Updated:');
              let msg = 'Details updated successfully.';
              const successDialogRef = this.dialog.open(
                SuccessDialogComponent,
                {
                  data: { message: msg },
                  width: '400px',
                  height: '250px',
                }
              );
              successDialogRef.afterClosed().subscribe(() => {
                this.dialog.closeAll();
              });
              this.editDetailsId = undefined;
              this.newlyAddedFiles = [];
            },
            (error) => {
              this.toastr.error(error.error);
            }
          );
      } else {
        console.log('Form with Files: ', formData);
        this.dialogService.createClientDetails(formData).subscribe(
          (response) => {
            console.log('Client Details Created:', response);
            // Open success dialog
            const successDialogRef = this.dialog.open(SuccessDialogComponent, {
              data: { message: 'Details and files added successfully.' },
              width: '400px',
              height: '250px',
            });
            successDialogRef.afterClosed().subscribe(() => {
              this.dialog.closeAll();
            });
          },
          (error) => {
            this.toastr.error(error.error);
          }
        );
      }
    } else {
      console.error('Form is invalid');
    }
  }
}
