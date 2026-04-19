import { Component, ChangeDetectorRef, ElementRef, NgZone, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

declare const google: any;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {

  email = '';
  password = '';
  name = '';

  user: any = null;
  isLoggedIn = false;
  isSignup = false;

  isLoginLoading = false;
  isSignupLoading = false;

  loginMessage = '';
  signupMessage = '';
  step1Error = '';

  step = 1;
  isSubmitting = false;

  @ViewChild('mapContainer') mapContainer!: ElementRef;
  form: FormGroup;
  pharmacyGroup: FormGroup;

  searchPredictions: any[] = [];
  searchQuery = '';
  placesService: any;
  existingRequest: any = null;
  showChangeConfirm = false;
  pendingPrediction: any = null;
  map: any;
  marker: any;
  defaultCenter = { lat: 43.6532, lng: -79.3832 };

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private cd: ChangeDetectorRef,
    private zone: NgZone
  ) {
    this.form = this.fb.group({
      serviceType: [''],
      pharmacy: this.fb.group({
        name: [''],
        address: [''],
        lat: [''],
        lng: ['']
      })
    });

    this.pharmacyGroup = this.form.get('pharmacy') as FormGroup;
  }

  toggleMode() {
    this.isSignup = !this.isSignup;
    this.loginMessage = '';
    this.signupMessage = '';
  }

  // =====================
  // SIGNUP
  // =====================
  private isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private isValidPassword(password: string) {
    return typeof password === 'string' && password.trim().length >= 6;
  }

  signup() {
    if (this.isSignupLoading) return;

    const name = this.name?.trim();
    const email = this.email?.trim();
    const password = this.password || '';

    if (!name) {
      this.signupMessage = 'Name is required';
      return;
    }
    if (!email) {
      this.signupMessage = 'Email is required';
      return;
    }
    if (!this.isValidEmail(email)) {
      this.signupMessage = 'Please enter a valid email address';
      return;
    }
    if (!password) {
      this.signupMessage = 'Password is required';
      return;
    }
    if (!this.isValidPassword(password)) {
      this.signupMessage = 'Password must be at least 6 characters long';
      return;
    }

    this.isSignupLoading = true;
    this.signupMessage = '';

    this.http.post('http://localhost:5000/api/auth/signup', {
      name,
      email,
      password
    }).subscribe({
      next: () => {
        this.isSignupLoading = false;
        this.name = '';
        this.email = '';
        this.password = '';
        this.isSignup = false;
        this.loginMessage = 'Signup successful. Please login.';
        this.signupMessage = '';
        this.cd.detectChanges();
      },
      error: (err) => {
        this.isSignupLoading = false;
        const rawMessage = err.error?.message || err.error || err.statusText || err.message;
        const backendMessage = typeof rawMessage === 'string'
          ? rawMessage
          : JSON.stringify(rawMessage);
        this.signupMessage = backendMessage || 'Signup failed';
        this.name = '';
        this.email = '';
        this.password = '';
        this.cd.detectChanges();
      }
    });
  }

  // =====================
  // LOGIN
  // =====================
  login() {
    if (this.isLoginLoading) return;

    const email = this.email?.trim();
    const password = this.password || '';

    if (!email) {
      this.loginMessage = 'Email is required';
      return;
    }
    if (!this.isValidEmail(email)) {
      this.loginMessage = 'Please enter a valid email address';
      return;
    }
    if (!password) {
      this.loginMessage = 'Password is required';
      return;
    }
    if (!this.isValidPassword(password)) {
      this.loginMessage = 'Password must be at least 6 characters long';
      return;
    }

    this.isLoginLoading = true;
    this.loginMessage = '';

    this.http.post('http://localhost:5000/api/auth/login', {
      email,
      password
    }).subscribe({
      next: (res: any) => {

        this.user = res?.user ?? res;
        this.isLoggedIn = true;

        localStorage.setItem('user', JSON.stringify(this.user));

        this.isLoginLoading = false;
        this.loginMessage = '';

        // move to the first post-login screen
        this.step = 1;
        this.fetchExistingRequest(this.user.id);
        this.cd.detectChanges();
      },
      error: (err) => {
        this.isLoginLoading = false;
        const errorBody = err.error;
        let backendMessage = 'Login failed';
        if (typeof errorBody === 'string') {
          backendMessage = errorBody;
        } else if (errorBody?.message) {
          backendMessage = errorBody.message;
        } else if (err.statusText) {
          backendMessage = err.statusText;
        }
        this.loginMessage = backendMessage || 'User not found. Please sign up.';
        this.cd.detectChanges();
      }
    });
  }

  logout() {
    this.user = null;
    this.isLoggedIn = false;
    this.existingRequest = null;
    localStorage.removeItem('user');
    // 🔥 Reset map + Google services
    this.map = null;
    this.marker = null;
    this.placesService = null;
    this.searchPredictions = [];
    this.searchQuery = '';

    this.step = 1;
  }

  fetchExistingRequest(userId: number) {
    this.http.get(`http://localhost:5000/api/requests/user/${userId}`)
      .subscribe({
        next: (res: any) => {
          this.existingRequest = res;
          this.searchQuery = '';
          this.searchPredictions = [];

          this.form.patchValue({
            pharmacy: {
              name: res.pharmacy_name || res.name || '',
              address: '',
              lat: res.lat || res.latitude || '',
              lng: res.lng || res.longitude || ''
            }
          });
        },
        error: () => {
          this.existingRequest = null;
        }
      });
  }

  initAutocompleteServices() {
    if (this.placesService || !google?.maps?.places) {
      return;
    }

    const dummyDiv = document.createElement('div');
    this.placesService = new google.maps.places.PlacesService(dummyDiv);
  }

  initMap(retryCount = 0) {
    if (!google?.maps || !this.mapContainer?.nativeElement) {
      if (retryCount < 3) {
        setTimeout(() => this.initMap(retryCount + 1), 250);
        return;
      }
      console.warn('Google Maps API or map container not ready', {
        googleMapsLoaded: !!google?.maps,
        mapContainerReady: !!this.mapContainer?.nativeElement,
        retryCount
      });
      return;
    }

    if (!this.map) {
      this.map = new google.maps.Map(this.mapContainer.nativeElement, {
        center: this.defaultCenter,
        zoom: 12,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false
      });
    }

    if (!this.marker) {
      this.marker = new google.maps.Marker({
        map: this.map,
        position: this.defaultCenter,
        title: 'Location',
      });
    }

    this.map.setCenter(this.defaultCenter);
    this.marker.setPosition(this.defaultCenter);
  }

  loadCurrentLocation() {
    if (!navigator.geolocation || !this.map) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        this.updateMap(coords, 'Your location');
      },
      () => {
        // ignore errors and keep default center
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  }

  updateMap(position: { lat: number; lng: number }, title: string) {
    if (!this.map || !this.marker) {
      this.initMap();
    }

    this.map.setCenter(position);
    this.map.setZoom(15);
    this.marker.setPosition(position);
    this.marker.setTitle(title);
  }

  onAddressInput(value: string) {
    this.searchQuery = value;
    this.initAutocompleteServices();
    this.initMap();

    if (!this.placesService || !value) {
      this.searchPredictions = [];
      return;
    }

    const filterResults = (results: any[]) => {
      return results
        .filter(result =>
          (result.types || []).some((type: string) =>
            ['pharmacy', 'drug_store', 'hospital'].includes(type)
          )
        )
        .map(result => ({
          place_id: result.place_id,
          description: result.formatted_address || result.name,
          formatted_address: result.formatted_address,
          name: result.name,
          geometry: result.geometry,
          types: result.types
        }));
    };

    this.placesService.textSearch(
      {
        query: value,
        type: 'pharmacy'
      },
      (results: any[], status: any) => {
        this.zone.run(() => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results?.length) {
            this.searchPredictions = filterResults(results);
            if (this.searchPredictions.length) {
              return;
            }
          }

          this.placesService.textSearch(
            { query: value },
            (fallbackResults: any[], fallbackStatus: any) => {
              this.zone.run(() => {
                if (fallbackStatus !== google.maps.places.PlacesServiceStatus.OK || !fallbackResults) {
                  this.searchPredictions = [];
                  return;
                }
                this.searchPredictions = filterResults(fallbackResults);
              });
            }
          );
        });
      }
    );
  }

  selectPrediction(prediction: any) {
    if (!prediction || !this.placesService) {
      return;
    }

    const newAddress = (prediction.formatted_address || prediction.description || prediction.name || '').trim();
    const currentAddress = (this.existingRequest?.address || '').trim();
    const currentName = (this.existingRequest?.pharmacy_name || this.existingRequest?.name || '').trim();

    const isDifferentAddress = currentAddress && currentAddress !== newAddress;
    const isDifferentName = currentName && prediction.name && currentName !== prediction.name.trim();

    if (this.existingRequest && (isDifferentAddress || isDifferentName)) {
      this.pendingPrediction = prediction;
      this.showChangeConfirm = true;
      this.cd.detectChanges();
      return;
    }

    this.applyPredictionSelection(prediction);
  }

  confirmChangeSelection(confirmed: boolean) {
    if (!confirmed) {
      this.pendingPrediction = null;
      this.showChangeConfirm = false;
      this.cd.detectChanges();
      return;
    }

    if (this.pendingPrediction) {
      this.applyPredictionSelection(this.pendingPrediction);
    }
    this.pendingPrediction = null;
    this.showChangeConfirm = false;
    this.cd.detectChanges();
  }

  applyPredictionSelection(prediction: any) {
    const newAddress = prediction.formatted_address || prediction.description || prediction.name || '';
    this.searchPredictions = [];
    this.searchQuery = newAddress;

    this.placesService.getDetails(
      {
        placeId: prediction.place_id,
        fields: ['name', 'formatted_address', 'geometry']
      },
      (place: any, status: any) => {
        this.zone.run(() => {
          if (status !== google.maps.places.PlacesServiceStatus.OK || !place) {
            this.form.patchValue({
              pharmacy: {
                name: prediction.name || '',
                address: this.searchQuery,
                lat: prediction.geometry?.location?.lat?.() || '',
                lng: prediction.geometry?.location?.lng?.() || ''
              }
            });
            this.cd.detectChanges();
            return;
          }

          const position = place.geometry?.location
            ? { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() }
            : null;

          this.form.patchValue({
            pharmacy: {
              name: place.name || prediction.name || '',
              address: place.formatted_address || this.searchQuery,
              lat: position?.lat || '',
              lng: position?.lng || ''
            }
          });

          if (position) {
            this.updateMap(position, place.name || prediction.description || 'Selected Pharmacy');
          }

          this.cd.detectChanges();
        });
      }
    );
  }

  // =====================
  // FLOW
  // =====================
  next() {
    if (this.step === 1) {
      if (!this.form.value.serviceType) {
        this.step1Error = 'Please select a service before you continue.';
        return;
      }

      this.step1Error = '';
      this.step = 2;
      this.initAutocompleteServices();
      this.cd.detectChanges();
      setTimeout(() => {
        this.initMap();
        this.loadCurrentLocation();
      }, 0);
      return;
    }

    if (this.step === 2) {
      this.form.patchValue({
        pharmacy: {
          address: this.pharmacyGroup.get('address')?.value
        }
      });
    }

    this.step++;
  }

  back() {
    this.step--;
  }

  submit() {
    this.isSubmitting = true;

    const payload = {
      userId: this.user.id,
      serviceType: this.form.value.serviceType,
      pharmacy: this.form.value.pharmacy
    };

    this.http.post('http://localhost:5000/api/requests', payload)
      .subscribe({
        next: (res: any) => {
          this.isSubmitting = false;
          this.step = 4;
          this.cd.detectChanges();
        },
        error: (err) => {
          this.isSubmitting = false;
          alert(err.error?.message || 'Submission failed');
        }
      });
  }

  restart() {
    this.step = 1;
    this.step1Error = '';
    this.form.reset();
    this.pharmacyGroup.reset();
    this.searchQuery = '';
    this.searchPredictions = [];
    this.showChangeConfirm = false;
    this.pendingPrediction = null;
    this.map = null;
    this.marker = null;

    if (this.user?.id) {
      this.fetchExistingRequest(this.user.id);
    }
  }
}