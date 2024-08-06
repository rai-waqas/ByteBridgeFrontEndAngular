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
  newFiles: any[] = [];
  filesToDisplay: Files[] = [];
  errorMessages: string[] = [];
  errorMessage: string | null = null;
  today: Date;

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
        console.log('Inside Files');
        this.files = data.clientDetail.files.map((file: Files) => ({
          ...file,
          blob: this.convertBase64ToBlob(
            file.filedata,
            this.getFileContentType(file.filename),
            file.filename
          ),
        }));
        console.log('Client Details Now:', this.files);
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
    if (input.files && input.files.length > 0) {
      const fileArray = Array.from(input.files);

      // Define acceptable formats and size limit
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/jpg',
        'image/png',
      ];
      const maxSizeMB = 5;
      const maxSizeBytes = maxSizeMB * 1024 * 1024; // Convert MB to bytes
      this.errorMessage = null;
      this.errorMessages = [];

      // Validate files
      fileArray.forEach((file) => {
        if (!allowedTypes.includes(file.type)) {
          this.errorMessages.push(
            `File "${file.name}" is invalid: Invalid file type.`
          );
        } else if (file.size > maxSizeBytes) {
          this.errorMessages.push(
            `File "${file.name}" is invalid: File size exceeds the maximum limit of 5 MB.`
          );
        }
      });

      // Check for duplicate file names
      const existingFileNames = new Set(this.files.map((f) => f.filename));
      console.log('Existing File Names:', existingFileNames);
      fileArray.forEach((file) => {
        if (existingFileNames.has(file.name)) {
          this.errorMessages.push(
            `File "${file.name}" is already present. Cannot upload again with the same name.`
          );
        }
      });

      if (this.isEditClicked) {
      }

      // Display error messages
      if (this.errorMessages.length > 0) {
        this.errorMessage = `The following files are not acceptable:\n${this.errorMessages.join(
          '\n'
        )}`;
        setTimeout(() => {
          this.errorMessage = '';
        }, 3000);
        // Optionally clear the file input
        input.value = '';
        return;
      }
      const preservedFiles = this.isEditClicked
        ? [...this.files]
        : this.detailsForm.controls['file'].value;
      const prevFiles = this.detailsForm.controls['file'].value;
      console.log('Preserved Files:', preservedFiles);
      var updatedFiles: any[] = [];
      var newFiles: any[] = [];
      if (preservedFiles.length > 0) {
        updatedFiles = [...preservedFiles, ...fileArray];
      } else {
        updatedFiles = fileArray;
      }
      newFiles = [...prevFiles, ...fileArray];
      console.log('New Files:', newFiles);
      console.log('Updated Files:', updatedFiles);

      this.detailsForm.get('file')?.setValue(newFiles);

      this.files = updatedFiles.map((file, index) => {
        return {
          id:
            this.isEditClicked && this.files[index]?.id !== undefined
              ? this.files[index]?.id
              : index, // Ensure unique IDs
          filename: file.name,
          blob: file, // Store Blob directly; it will be converted to File later if needed
        };
      });

      console.log('Files:', this.files);
    } else {
      this.detailsForm.get('file')?.setValue([]);
      this.files = [];
      console.log('No files selected or files removed.');
    }
  }

  private convertBase64ToBlob(
    base64Data: string,
    contentType: string,
    fileName: string
  ): Blob {
    const byteCharacters = atob(base64Data);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);

      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    var blob = new Blob(byteArrays, { type: contentType });
    return new File([blob], fileName, { type: contentType });
  }

  private getFileContentType(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'application/pdf';
      case 'jpg':
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

  deleteFile(fileId: number) {
    // Find the file with the given ID in the files array
    const fileToDelete = this.files.find((file) => file.id === fileId);
    
    // Remove the file from the local array regardless of its upload status
    this.files = this.files.filter((file) => file.id !== fileId);
    console.log('File removed locally');
    if (fileToDelete && this.isEditClicked) {
      this.fileService.deleteFile(fileId).subscribe(
        () => {
          this.files = this.files.filter((file) => file.id !== fileId);
          console.log('File deleted successfully');
          console.log('Files after deleting:', this.files);
          if (this.files.length === 0) {
            this.detailsForm.get('file')?.setValue([]);
          }
          this.errorMessage = null;
        },
        (error) => {
        }
      );
    } else {
      this.files = this.files.filter((file) => file.id !== fileId);
      console.log('File removed locally');
      this.errorMessage = null;
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
        name: this.detailsForm.get('name')?.value,
        email: this.detailsForm.get('email')?.value,
        clientId: this.detailsForm.get('client')?.value,
        stateId: stateIds,
        dob: formValue.dob,
        expStart: formValue.expStart,
        expEnd: formValue.expEnd,
        payValue: this.detailsForm.get(
          this.isStateChanged ? 'percentage' : 'hourlyRate'
        )?.value,
        payType: this.payType,
        gender: this.detailsForm.get('gender')?.value,
        files: this.detailsForm.get('file')?.value,
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
