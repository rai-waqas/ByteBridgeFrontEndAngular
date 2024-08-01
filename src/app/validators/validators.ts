import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

// Custom validator function
export function emailDotValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const email = control.value;
    if (email && email.includes('@')) {
      const localPart = email.split('@')[1];
      if (localPart.includes('.')) {
        return null; // Valid email with dot in the local part
      } else {
        return { emailDot: 'Email is invalid.' };
      }
    }
    return null; 
  };
}

export function dateRangeValidator(dobControlName: string, expStartControlName: string): ValidatorFn {
  return (formGroup: AbstractControl): {[key: string]: any} | null => {
    const dobControl = formGroup.get(dobControlName);
    const expStartControl = formGroup.get(expStartControlName);

    if (dobControl && expStartControl) {
      const dob = dobControl.value;
      const expStart = expStartControl.value;

      // Check if dates are valid and compare
      if (dob && expStart && expStart < dob) {
        dobControl.setErrors({ invalidDateRange: true });
        return { invalidDateRange: true };
      } else {
        dobControl.setErrors(null);
      }
    }

    return null;
  };
}