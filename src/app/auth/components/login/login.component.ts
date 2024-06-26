import { Component, OnInit, AfterViewChecked, EventEmitter, Output } from '@angular/core'
import { Router } from '@angular/router'
import { AuthenticationService } from 'src/app/shared/services/authentication.service'
import { CustomToastrService } from 'src/app/shared/services/custom-toastr.service'
import { NgZone } from '@angular/core'

declare var google: any

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, AfterViewChecked {
  @Output() toggleView = new EventEmitter<void>()
  googleButtonRendered = false

  email = ''
  password = ''

  constructor(
    private authService: AuthenticationService,
    private customToaster: CustomToastrService,
    private router: Router,
    private ngZone: NgZone
  ) {}

  onFormSubmit() {
    this.email = this.email.toLowerCase() // Lowercase the email
    this.authService.loginSCP(this.email, this.password).subscribe({
      next: (response) => {
        this.customToaster.success(
          `Greetings ${response.username}!`,
          'Authentication successful'
        )
        this.ngZone.run(() => this.router.navigate(['/']))
      },
      error: (error) => {
        this.customToaster.error('Invalid username / password')
      }
    })
  }

  ngOnInit(): void {
    // Initialize Google accounts
    google.accounts.id.initialize({
      client_id:
        '680135166777-br7v67f58p397dcjr0an153i64paabh4.apps.googleusercontent.com',
      callback: (resp: any) => this.handleGoogleLogin(resp)
    })
  }

  ngAfterViewChecked(): void {
    if (!this.googleButtonRendered && document.getElementById('google-btn')) {
      google.accounts.id.renderButton(document.getElementById('google-btn'), {
        theme: 'filled_white',
        size: 'large',
        shape: 'rectangle',
        width: '235'
      })
      this.googleButtonRendered = true
    }
  }

  private decodeToken(token: string) {
    return JSON.parse(atob(token.split('.')[1]))
  }

  handleGoogleLogin(response: any) {
    const registrationType = 'GOOGLE'
    if (response) {
      const payload = this.decodeToken(response.credential)
      this.authService
        .createUser({
          ...payload,
          registrationMethod: registrationType
        })
        .subscribe({
          error: (err) => console.error('Error creating user:', err)
        })
      this.customToaster.success(
        `Greetings ${payload.name}!`,
        'Authentication successful'
      )
      this.ngZone.run(() => {
        this.router.navigate(['/'])
      })
    }
  }
}
